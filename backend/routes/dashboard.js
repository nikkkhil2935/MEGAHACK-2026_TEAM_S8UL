const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');

router.get('/candidate', authenticate, async (req, res) => {
  const uid = req.user.id;
  const [apps, interviews, profile] = await Promise.all([
    supabase.from('applications').select('status, match_score, job_id, applied_at').eq('candidate_id', uid),
    supabase.from('interview_sessions')
      .select('id, interview_type, overall_score, integrity_score, status, started_at, ended_at, language, job_postings(title)')
      .eq('candidate_id', uid).eq('status', 'completed').order('created_at', { ascending: false }).limit(10),
    supabase.from('candidate_profiles').select('parsed_data, completeness_score').eq('user_id', uid).single(),
  ]);

  const avg_match = apps.data?.length
    ? Math.round(apps.data.reduce((s, a) => s + (a.match_score || 0), 0) / apps.data.length)
    : 0;

  const avg_interview = interviews.data?.length
    ? Math.round(interviews.data.reduce((s, i) => s + (i.overall_score || 0), 0) / interviews.data.length)
    : 0;

  res.json({
    total_applications: apps.data?.length || 0,
    total_interviews: interviews.data?.length || 0,
    avg_match_score: avg_match,
    avg_interview_score: avg_interview,
    skills_count: profile.data?.parsed_data?.skills?.length || 0,
    completeness_score: profile.data?.completeness_score || 0,
    applications: apps.data || [],
    recent_interviews: interviews.data || [],
  });
});

module.exports = router;
