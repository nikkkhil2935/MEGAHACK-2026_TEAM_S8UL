const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');

// POST /api/resume-improver/analyze
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { jobDescription } = req.body || {};
    const userId = req.user.id;

    const { data: candidateProfile, error } = await supabase
      .from('candidate_profiles')
      .select('parsed_data')
      .eq('user_id', userId)
      .single();

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

    const analysis = await groqJSON(systemPrompt, userContent);

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

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('Resume improver error:', err);
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
      .single();

    res.json({
      analysis: data?.analysis || null,
      createdAt: data?.created_at || null,
    });
  } catch {
    res.json({ analysis: null, createdAt: null });
  }
});

module.exports = router;

