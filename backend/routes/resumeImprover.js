const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');
const { callMLService } = require('../services/mlService');

// POST /api/resume-improver/analyze
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { jobDescription } = req.body || {};
    const userId = req.user.id;

    const { data: candidateProfile, error } = await supabase
      .from('candidate_profiles')
      .select('parsed_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !candidateProfile?.parsed_data) {
      return res.status(400).json({ error: 'No profile found. Upload your resume first.' });
    }

    const p = candidateProfile.parsed_data;

    const systemPrompt = 'You are an expert resume writer and ATS optimization specialist with 15 years of experience at top tech companies.';

    const userContent = `
CANDIDATE RESUME (parsed JSON):
${JSON.stringify(p, null, 2)}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}` : '(No specific job description provided — give general improvements)'}

Perform a deep resume audit. Respond ONLY with a JSON object (no markdown, no backticks) like:
{
  "overallScore": 68,
  "sectionScores": {
    "summary": 55,
    "skills": 72,
    "experience": 65,
    "projects": 70,
    "education": 80
  },
  "issues": [
    {
      "severity": "critical",
      "section": "experience",
      "issue": "No quantifiable achievements",
      "fix": "Add metrics such as 'Reduced API latency by 40%'"
    }
  ],
  "improvedSummary": "Improved summary text...",
  "experienceImprovements": [
    {
      "company": "Company Name",
      "original": "Original bullet",
      "improved": "Improved, quantified bullet"
    }
  ],
  "missingKeywords": ["Docker", "CI/CD"],
  "skillsToAdd": ["Docker", "Terraform"],
  "atsScore": 61,
  "atsIssues": [
    "Missing 4 keywords from job description"
  ],
  "quickWins": [
    "Add your GitHub URL to the contact section"
  ]
}
`;

    // Extract features for ML model
    const skillsCount = (p.skills || []).length;
    const projectsCount = (p.projects || []).length;
    const keywordsCount = skillsCount + (p.certifications || []).length;
    const educationLevel = (() => {
      const edu = (p.education || []).map(e => ((e.degree || e.level || '') + ' ' + (e.field || '')).toLowerCase());
      for (const d of edu) {
        if (d.includes('phd') || d.includes('doctorate')) return 3;
        if (d.includes('master') || d.includes('ms ') || d.includes('mba') || d.includes('m.tech') || d.includes('m.s')) return 2;
        if (d.includes('bachelor') || d.includes('bs ') || d.includes('b.tech') || d.includes('b.e') || d.includes('b.s')) return 1;
      }
      return 0;
    })();

    // Run ML model and Groq AI in parallel
    const [mlResult, aiResult] = await Promise.allSettled([
      callMLService('/predict/resume', {
        skills_count: skillsCount,
        projects_count: projectsCount,
        education_level: educationLevel,
        keywords_count: keywordsCount,
      }),
      groqJSON(systemPrompt, userContent),
    ]);

    const modelPrediction = mlResult.status === 'fulfilled' ? mlResult.value : null;
    const analysis = aiResult.status === 'fulfilled' ? aiResult.value : null;

    if (mlResult.status === 'rejected') console.error('[Resume] ML model failed:', mlResult.reason?.message);
    if (aiResult.status === 'rejected') console.error('[Resume] Groq AI failed:', aiResult.reason?.message);

    if (!analysis && !modelPrediction) {
      const aiErr = aiResult.status === 'rejected' ? aiResult.reason : null;
      if (aiErr?.code === 'RATE_LIMITED') {
        return res.status(429).json({
          error: `Rate limit reached. Please try again in ${aiErr.retryAfterSec || 60} seconds.`,
          retryAfterSec: aiErr.retryAfterSec || 60,
        });
      }
      throw new Error('Both AI and ML model failed');
    }

    // Pass rate limit warning if AI failed but ML succeeded
    let rateLimitWarning = null;
    if (!analysis && aiResult.status === 'rejected' && aiResult.reason?.code === 'RATE_LIMITED') {
      rateLimitWarning = `Groq AI rate limited. Try again in ${aiResult.reason.retryAfterSec || 60}s.`;
    }

    await supabase
      .from('resume_improvements')
      .upsert(
        {
          user_id: userId,
          analysis,
          job_description: jobDescription || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    res.json({ success: true, analysis, modelPrediction, rateLimitWarning });
  } catch (err) {
    console.error('Resume improver error:', err);
    if (err?.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    if (err?.code === 'RATE_LIMITED') {
      return res.status(429).json({
        error: `Rate limit reached. Please try again in ${err.retryAfterSec || 60} seconds.`,
        retryAfterSec: err.retryAfterSec || 60,
      });
    }
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

// GET /api/resume-improver/latest
router.get('/latest', authenticate, async (req, res) => {
  try {
    const { data } = await supabase
      .from('resume_improvements')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({
      analysis: data?.analysis || null,
      createdAt: data?.created_at || null,
    });
  } catch {
    res.json({ analysis: null, createdAt: null });
  }
});

module.exports = router;

