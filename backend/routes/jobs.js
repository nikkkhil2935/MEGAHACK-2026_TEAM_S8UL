const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate, requireRole } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');
const { matchCandidateToJob } = require('../services/groq/matchingEngine');

// Public CareerFit Score — no auth required
router.post('/careerfit', async (req, res) => {
  try {
    const { job_description } = req.body;
    if (!job_description || job_description.length < 20) {
      return res.status(400).json({ error: 'Please provide a job description (at least 20 characters)' });
    }

    const result = await groqJSON(
      'You are a career advisor. Analyze this job description and extract what a candidate needs.',
      `JOB DESCRIPTION:\n${job_description}\n\nReturn JSON:\n{\n  "title": "inferred job title",\n  "skills_needed": ["skill1", "skill2", ...up to 10],\n  "experience_level": "Junior|Mid|Senior|Lead",\n  "key_responsibilities": ["resp1", "resp2", "resp3"],\n  "preparation_tips": ["tip1", "tip2", "tip3"],\n  "interview_topics": ["topic1", "topic2", "topic3"],\n  "career_fit_summary": "2-3 sentence summary of what kind of candidate would be ideal"\n}`
    );
    res.json(result);
  } catch (err) {
    if (err.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    if (err.code === 'RATE_LIMITED') {
      return res.status(429).json({ error: `AI service rate limited. Try again in ${err.retryAfterSec || 60} seconds.` });
    }
    console.error('CareerFit error:', err.message);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// Job feed with live match scores
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, remote, search, page = 1, limit = 20 } = req.query;

    let query = supabase.from('job_postings').select('*').eq('is_active', true);
    if (category) query = query.eq('job_category', category);
    if (remote) query = query.eq('remote_policy', remote);
    if (search) query = query.ilike('title', `%${search}%`);
    query = query.range((+page - 1) * +limit, +page * +limit - 1).order('created_at', { ascending: false });

    const { data: jobs } = await query;

    if (req.user.role === 'candidate') {
      const { data: profile } = await supabase.from('candidate_profiles')
        .select('parsed_data').eq('user_id', req.user.id).maybeSingle();

      if (profile?.parsed_data) {
        const matches = await Promise.allSettled(
          (jobs || []).map(j => matchCandidateToJob(profile.parsed_data, j.parsed_data || {})
            .then(m => ({ ...j, match_score: m.match_score, verdict: m.verdict })))
        );
        return res.json(
          matches.filter(r => r.status === 'fulfilled').map(r => r.value)
        );
      }
    }
    res.json(jobs || []);
  } catch (err) {
    console.error('Jobs feed error:', err.message);
    res.json([]);
  }
});

// --- SPECIFIC routes MUST come before /:id to avoid param capture ---

// AI Cover Letter Generator
router.post('/generate-cover-letter', authenticate, requireRole('candidate'), async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id is required' });

    const [{ data: job, error: jobErr }, { data: profile }] = await Promise.all([
      supabase.from('job_postings').select('title, company, description, required_skills, tech_stack').eq('id', job_id).single(),
      supabase.from('candidate_profiles').select('parsed_data').eq('user_id', req.user.id).maybeSingle(),
    ]);

    if (jobErr || !job) return res.status(404).json({ error: 'Job not found' });

    const candidateData = profile?.parsed_data || {};
    const skills = (candidateData.skills || []).map(s => s.name || s).slice(0, 15).join(', ');
    const projects = (candidateData.projects || []).slice(0, 3).map(p => p.name || p.title).join(', ');
    const experience = candidateData.total_experience_months ? `${Math.round(candidateData.total_experience_months / 12)} years` : 'not specified';

    const result = await groqJSON(
      'You are a professional career coach writing personalized cover letters. Be concise, confident, and specific. No generic fluff.',
      `Write a short cover letter (3-4 paragraphs, under 200 words) for this job application.

JOB:
- Title: ${job.title}
- Company: ${job.company}
- Required Skills: ${(job.required_skills || []).map(s => s.name || s).join(', ')}
- Tech Stack: ${(job.tech_stack || []).join(', ')}

CANDIDATE:
- Skills: ${skills || 'not provided'}
- Projects: ${projects || 'none listed'}
- Experience: ${experience}
- Seniority: ${candidateData.seniority_level || 'not specified'}

Return JSON:
{
  "cover_letter": "the full cover letter text (plain text, no markdown)"
}`
    );

    res.json({ cover_letter: result.cover_letter || '' });
  } catch (err) {
    if (err.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable.' });
    if (err.code === 'RATE_LIMITED') return res.status(429).json({ error: 'Rate limited. Try again shortly.' });
    console.error('Cover letter gen error:', err.message);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// Match score for specific job
router.get('/match/:id', authenticate, async (req, res) => {
  try {
    const [{ data: job, error: jobErr }, { data: profile }] = await Promise.all([
      supabase.from('job_postings').select('*').eq('id', req.params.id).single(),
      supabase.from('candidate_profiles').select('parsed_data').eq('user_id', req.user.id).maybeSingle(),
    ]);

    if (jobErr || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const match = await matchCandidateToJob(profile?.parsed_data || {}, job.parsed_data || {});
    res.json(match);
  } catch (err) {
    console.error('Match score error:', err.message);
    res.status(500).json({ error: 'Failed to calculate match' });
  }
});

// Almost qualified (55-74%)
router.get('/almost/qualified', authenticate, async (req, res) => {
  try {
    const { data: profile } = await supabase.from('candidate_profiles')
      .select('parsed_data').eq('user_id', req.user.id).maybeSingle();
    const { data: jobs } = await supabase.from('job_postings')
      .select('*').eq('is_active', true).limit(40);

    const results = await Promise.allSettled(
      (jobs || []).map(j => matchCandidateToJob(profile?.parsed_data || {}, j.parsed_data || {})
        .then(m => ({ ...j, match_score: m.match_score, missing_skills: m.missing_skills })))
    );

    const almostQualified = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(j => j.match_score >= 55 && j.match_score < 75);

    res.json(almostQualified);
  } catch (err) {
    console.error('Almost qualified error:', err.message);
    res.json([]);
  }
});

// Recruiter: my jobs with applicant counts
router.get('/recruiter/my-jobs', authenticate, requireRole('recruiter'), async (req, res) => {
  try {
    const { data: jobs } = await supabase.from('job_postings')
      .select('*').eq('recruiter_id', req.user.id).order('created_at', { ascending: false });

    // Get applicant counts
    const enriched = await Promise.all((jobs || []).map(async (job) => {
      const { count } = await supabase.from('applications')
        .select('*', { count: 'exact', head: true }).eq('job_id', job.id);
      return { ...job, applicant_count: count || 0 };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Recruiter my-jobs error:', err.message);
    res.json([]);
  }
});

// --- Now /:id param routes ---

// Single job
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('job_postings')
      .select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Job not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load job' });
  }
});

// Create job posting (recruiter)
router.post('/', authenticate, requireRole('recruiter'), async (req, res) => {
  try {
    const { title, company, description, location, remote_policy, salary_range } = req.body;

    const parsed = await groqJSON(
      'You are a JD parser. Extract structured info. Return ONLY valid JSON.',
      `Parse this job description:\n${description}
Return JSON:
{
  title, required_skills:[{name,importance:"must"|"nice"}],
  nice_to_have:[{name}], tech_stack:[], experience_years:{min,max},
  job_category, responsibilities:[], salary_insights:{}
}`
    );

    const { data } = await supabase.from('job_postings').insert({
      recruiter_id: req.user.id, title, company, description,
      parsed_data: parsed, required_skills: parsed.required_skills,
      nice_to_have: parsed.nice_to_have, tech_stack: parsed.tech_stack,
      experience_years: parsed.experience_years, job_category: parsed.job_category,
      location, remote_policy, salary_range
    }).select().single();

    res.json(data);
  } catch (err) {
    console.error('Create job error:', err);
    if (err.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    res.status(500).json({ error: 'Failed to create job posting' });
  }
});

// Apply
router.post('/:id/apply', authenticate, requireRole('candidate'), async (req, res) => {
  try {
    const [{ data: job, error: jobErr }, { data: profile }] = await Promise.all([
      supabase.from('job_postings').select('*').eq('id', req.params.id).single(),
      supabase.from('candidate_profiles').select('parsed_data').eq('user_id', req.user.id).maybeSingle(),
    ]);

    if (jobErr || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const match = await matchCandidateToJob(profile?.parsed_data || {}, job.parsed_data || {});

    const { data, error: insertErr } = await supabase.from('applications').insert({
      candidate_id: req.user.id, job_id: req.params.id,
      match_score: match.match_score, match_data: match,
      cover_letter: req.body?.cover_letter || null,
    }).select().single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'You have already applied to this job' });
      }
      throw insertErr;
    }

    // Get candidate name for notification
    const { data: userProfile } = await supabase.from('profiles')
      .select('full_name').eq('id', req.user.id).maybeSingle();

    const candidateName = userProfile?.full_name || 'Someone';

    // Store notification in DB for the recruiter
    await supabase.from('notifications').insert({
      user_id: job.recruiter_id,
      type: 'new_application',
      title: 'New Application',
      message: `${candidateName} applied to ${job.title} with ${match.match_score}% match`,
      data: {
        candidate_id: req.user.id,
        candidate_name: candidateName,
        job_id: job.id,
        job_title: job.title,
        match_score: match.match_score,
        application_id: data.id,
      },
    });

    // Emit real-time notification to the specific recruiter
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${job.recruiter_id}`).emit('new_notification', {
        type: 'new_application',
        title: 'New Application',
        message: `${candidateName} applied to ${job.title} with ${match.match_score}% match`,
        data: {
          candidate_name: candidateName,
          job_id: job.id,
          job_title: job.title,
          match_score: match.match_score,
        },
        time: new Date().toISOString(),
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Recruiter: get applicants for a job
router.get('/:id/applicants', authenticate, requireRole('recruiter'), async (req, res) => {
  try {
    const { data: apps } = await supabase.from('applications')
      .select('*, profiles:candidate_id(full_name, email)')
      .eq('job_id', req.params.id).order('match_score', { ascending: false });

    const enriched = await Promise.all((apps || []).map(async (a) => {
      // Fetch latest interview for this candidate
      const { data: interview } = await supabase.from('interview_sessions')
        .select('overall_score, integrity_events, report')
        .eq('candidate_id', a.candidate_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: a.id,
        candidate_id: a.candidate_id,
        name: a.profiles?.full_name,
        email: a.profiles?.email,
        match_score: a.match_score,
        skills: a.match_data?.matching_skills || a.match_data?.matched_skills || [],
        experience: a.match_data?.experience_match || a.match_data?.experience_fit,
        applied_at: a.applied_at || a.created_at,
        interview: interview ? {
          score: interview.overall_score,
          tab_switches: (interview.integrity_events || []).filter(e => e.type === 'tab_switch').length,
          eye_drifts: (interview.integrity_events || []).filter(e => e.type === 'eye_drift').length,
          hire_recommendation: interview.report?.hire_recommendation,
          top_strength: interview.report?.strengths?.[0],
          confidence: interview.report?.confidence_level,
        } : null,
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Get applicants error:', err);
    res.status(500).json({ error: 'Failed to load applicants' });
  }
});

// AI Shortlist: rank top candidates with reasons
router.post('/:id/shortlist', authenticate, requireRole('recruiter'), async (req, res) => {
  try {
    const [{ data: job, error: jobErr }, { data: apps }] = await Promise.all([
      supabase.from('job_postings').select('*').eq('id', req.params.id).single(),
      supabase.from('applications')
        .select('*, profiles:candidate_id(full_name, email), candidate_profiles:candidate_id(parsed_data)')
        .eq('job_id', req.params.id).order('match_score', { ascending: false })
    ]);

    if (jobErr || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!apps?.length) return res.json({ shortlist: [], message: 'No applicants yet' });

    const candidateSummaries = apps.slice(0, 10).map((a, i) => {
      const p = a.candidate_profiles?.parsed_data || {};
      return `${i+1}. ${a.profiles?.full_name || 'Unknown'} (Match: ${a.match_score || 0}%) — Skills: ${(p.skills || []).slice(0,8).map(s => s.name || s).join(', ')} | Projects: ${(p.projects || []).slice(0,3).map(pr => pr.name).join(', ')} | Experience: ${Math.round((p.total_experience_months || 0)/12)}yr`;
    }).join('\n');

    const result = await groqJSON(
      'You are a senior technical recruiter. Analyze candidates and provide a ranked shortlist with specific reasons.',
      `JOB: ${job.title} at ${job.company}
Required Skills: ${(job.required_skills || []).map(s => s.name || s).join(', ')}
Tech Stack: ${(job.tech_stack || []).join(', ')}

APPLICANTS:
${candidateSummaries}

Return JSON:
{
  "shortlist": [
    { "rank": 1, "name": "...", "reason": "one compelling sentence why they're the best fit", "strengths": ["str1", "str2"], "concerns": ["concern1"] },
    { "rank": 2, "name": "...", "reason": "...", "strengths": [...], "concerns": [...] },
    { "rank": 3, "name": "...", "reason": "...", "strengths": [...], "concerns": [...] }
  ],
  "summary": "one sentence overall assessment of the applicant pool"
}`
    );

    res.json(result);
  } catch (err) {
    if (err.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable.' });
    res.status(500).json({ error: 'Shortlist generation failed' });
  }
});

// AI Job Post Health Score
router.post('/health-score', authenticate, requireRole('recruiter'), async (req, res) => {
  try {
    const { title, description, tech_stack, requirements } = req.body;
    const result = await groqJSON(
      'You are a recruiting expert. Analyze this job posting for quality and attractiveness.',
      `JOB POSTING:
Title: ${title}
Description: ${description}
Tech Stack: ${tech_stack || 'Not specified'}
Requirements: ${requirements || 'Not specified'}

Score this job posting and provide actionable suggestions.
Return JSON:
{
  "score": 0-100,
  "grade": "A"|"B"|"C"|"D"|"F",
  "issues": ["specific issue 1", "specific issue 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "predicted_applicant_quality": "High"|"Medium"|"Low",
  "summary": "one sentence assessment"
}`
    );
    res.json(result);
  } catch (err) {
    if (err.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable.' });
    res.status(500).json({ error: 'Health score failed' });
  }
});

module.exports = router;
