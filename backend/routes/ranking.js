const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate, recruiterMiddleware } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');

// POST /api/ranking/job/:jobId — trigger AI ranking for a job
router.post('/job/:jobId', authenticate, recruiterMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify recruiter owns this job
    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobId)
      .eq('recruiter_id', req.user.id)
      .single();

    if (jobError || !job) {
      return res.status(403).json({ error: 'Job not found or access denied' });
    }

    // Fetch applications for this job
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id, candidate_id, match_score, applied_at')
      .eq('job_id', jobId);

    if (appsError) {
      return res.status(500).json({ error: appsError.message });
    }

    if (!applications || applications.length === 0) {
      return res.status(400).json({ error: 'No applicants found for this job' });
    }

    // Enrich each application with candidate profile + latest interview score
    const enriched = await Promise.all(
      applications.map(async (app, idx) => {
        const [profileRes, parsedRes, interviewRes] = await Promise.all([
          supabase.from('profiles')
            .select('full_name')
            .eq('id', app.candidate_id)
            .maybeSingle()
            .catch(() => ({ data: null })),
          supabase.from('candidate_profiles')
            .select('parsed_data')
            .eq('user_id', app.candidate_id)
            .maybeSingle()
            .catch(() => ({ data: null })),
          supabase.from('interview_sessions')
            .select('overall_score')
            .eq('candidate_id', app.candidate_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle?.()
            .catch(() => ({ data: null })),
        ]);

        const parsed = parsedRes.data?.parsed_data || {};

        return {
          index: idx + 1,
          applicationId: app.id,
          userId: app.candidate_id,
          name: profileRes.data?.full_name || 'Anonymous',
          skills: parsed.skills || [],
          experience: parsed.experience || [],
          education: parsed.education || [],
          projects: parsed.projects || [],
          existingMatchScore: app.match_score || 0,
          interviewScore: interviewRes.data?.overall_score || null,
        };
      })
    );

    const systemPrompt = 'You are a senior technical recruiter and hiring manager.';

    const userContent = `
JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${JSON.stringify(job.required_skills || [])}
Description: ${job.description}
Tech Stack: ${JSON.stringify(job.tech_stack || [])}
Experience Required: ${JSON.stringify(job.experience_years || job.experience_required || 'Not specified')}

APPLICANTS (${enriched.length} total):
${JSON.stringify(enriched, null, 2)}

Rank ALL ${enriched.length} candidates from best to worst fit for this job.

For each candidate, evaluate these 6 dimensions (0–100):
1. technicalSkillMatch — how well their skills match the job requirements
2. experienceRelevance — is their experience in relevant domains
3. projectPortfolioStrength — quality and relevance of their projects
4. educationFit — does education align with role expectations
5. roleCultureFit — seniority, communication, overall alignment
6. interviewPerformance — use interviewScore if available, else estimate from profile

Respond ONLY with a JSON array (no markdown, no backticks) like:
[
  {
    "applicationId": "uuid-here",
    "userId": "uuid-here",
    "name": "Candidate Name",
    "rank": 1,
    "compositeScore": 87,
    "dimensions": {
      "technicalSkillMatch": 90,
      "experienceRelevance": 85,
      "projectPortfolioStrength": 88,
      "educationFit": 80,
      "roleCultureFit": 82,
      "interviewPerformance": 78
    },
    "strengths": ["Strong Python background", "Relevant fintech project"],
    "redFlags": ["No cloud experience", "Short tenure at previous companies"],
    "hiringRecommendation": "Strong candidate for senior role. Recommend fast-track interview.",
    "shortlist": true
  }
]

Sort the array by rank (1 = best). Mark top 3 as shortlist: true. Be honest about red flags.
`;

    const ranking = await groqJSON(systemPrompt, userContent);

    await supabase
      .from('candidate_rankings')
      .upsert(
        {
          job_id: jobId,
          recruiter_id: req.user.id,
          ranking,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'job_id' }
      );

    res.json({ success: true, ranking, totalCandidates: ranking.length || enriched.length });
  } catch (err) {
    console.error('Ranking error:', err);
    if (err.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    if (err.code === 'RATE_LIMITED') return res.status(429).json({ error: `AI rate limit reached. Try again in ${err.retryAfterSec || 60} seconds.` });
    res.status(500).json({ error: 'Failed to rank candidates' });
  }
});

// GET /api/ranking/job/:jobId — fetch existing ranking
router.get('/job/:jobId', authenticate, recruiterMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('candidate_rankings')
      .select('*')
      .eq('job_id', req.params.jobId)
      .maybeSingle();

    if (error || !data) {
      return res.json({ ranking: null });
    }

    res.json({ ranking: data.ranking, generatedAt: data.generated_at });
  } catch {
    res.json({ ranking: null });
  }
});

module.exports = router;

