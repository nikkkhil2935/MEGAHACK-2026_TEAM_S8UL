const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate, requireRole } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');
const { matchCandidateToJob } = require('../services/groq/matchingEngine');

// Job feed with live match scores
router.get('/', authenticate, async (req, res) => {
  const { category, remote, search, page = 1, limit = 20 } = req.query;

  let query = supabase.from('job_postings').select('*').eq('is_active', true);
  if (category) query = query.eq('job_category', category);
  if (remote) query = query.eq('remote_policy', remote);
  if (search) query = query.ilike('title', `%${search}%`);
  query = query.range((+page - 1) * +limit, +page * +limit - 1).order('created_at', { ascending: false });

  const { data: jobs } = await query;

  if (req.user.role === 'candidate') {
    const { data: profile } = await supabase.from('candidate_profiles')
      .select('parsed_data').eq('user_id', req.user.id).single();

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
});

// Single job
router.get('/:id', authenticate, async (req, res) => {
  const { data } = await supabase.from('job_postings')
    .select('*').eq('id', req.params.id).single();
  res.json(data);
});

// Create job posting (recruiter)
router.post('/', authenticate, requireRole('recruiter'), async (req, res) => {
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
});

// Apply
router.post('/:id/apply', authenticate, requireRole('candidate'), async (req, res) => {
  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from('job_postings').select('*').eq('id', req.params.id).single(),
    supabase.from('candidate_profiles').select('parsed_data').eq('user_id', req.user.id).single(),
  ]);

  const match = await matchCandidateToJob(profile?.parsed_data || {}, job.parsed_data || {});

  const { data } = await supabase.from('applications').insert({
    candidate_id: req.user.id, job_id: req.params.id,
    match_score: match.match_score, match_data: match,
    cover_letter: req.body.cover_letter,
  }).select().single();

  res.json(data);
});

// Match score for specific job
router.get('/match/:id', authenticate, async (req, res) => {
  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from('job_postings').select('*').eq('id', req.params.id).single(),
    supabase.from('candidate_profiles').select('parsed_data').eq('user_id', req.user.id).single(),
  ]);

  const match = await matchCandidateToJob(profile?.parsed_data || {}, job?.parsed_data || {});
  res.json(match);
});

// Recruiter: my jobs with applicant counts
router.get('/recruiter/my-jobs', authenticate, requireRole('recruiter'), async (req, res) => {
  const { data: jobs } = await supabase.from('job_postings')
    .select('*').eq('recruiter_id', req.user.id).order('created_at', { ascending: false });

  // Get applicant counts
  const enriched = await Promise.all((jobs || []).map(async (job) => {
    const { count } = await supabase.from('applications')
      .select('*', { count: 'exact', head: true }).eq('job_id', job.id);
    return { ...job, applicant_count: count || 0 };
  }));

  res.json(enriched);
});

// Recruiter: get applicants for a job
router.get('/:id/applicants', authenticate, requireRole('recruiter'), async (req, res) => {
  const { data: apps } = await supabase.from('applications')
    .select('*, profiles:candidate_id(full_name, email)')
    .eq('job_id', req.params.id).order('match_score', { ascending: false });

  const enriched = (apps || []).map(a => ({
    id: a.id,
    name: a.profiles?.full_name,
    email: a.profiles?.email,
    match_score: a.match_score,
    skills: a.match_data?.matching_skills || [],
    experience: a.match_data?.experience_match,
    interview_score: a.match_data?.interview_score,
    applied_at: a.created_at,
  }));

  res.json(enriched);
});

// Almost qualified (55-74%)
router.get('/almost/qualified', authenticate, async (req, res) => {
  const { data: profile } = await supabase.from('candidate_profiles')
    .select('parsed_data').eq('user_id', req.user.id).single();
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
});

module.exports = router;
