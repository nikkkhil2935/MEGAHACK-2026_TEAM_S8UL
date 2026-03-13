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

  // Interview streak calculation
  let streak = 0;
  if (interviews.data?.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sorted = interviews.data
      .map(i => { const d = new Date(i.started_at); d.setHours(0,0,0,0); return d.getTime(); })
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b - a);

    let checkDate = today.getTime();
    for (const d of sorted) {
      if (d === checkDate || d === checkDate - 86400000) {
        streak++;
        checkDate = d - 86400000;
      } else break;
    }
  }

  // Profile strength calculation
  const parsed = profile.data?.parsed_data || {};
  const totalInterviews = interviews.data?.length || 0;
  let strength = 0;
  const nudges = [];

  if (parsed.name) strength += 10; else nudges.push('Add your full name');
  if (parsed.headline) strength += 10; else nudges.push('Add a professional headline');
  if (parsed.skills?.length >= 5) strength += 20; else nudges.push(`Add ${Math.max(0, 5 - (parsed.skills?.length || 0))} more skills to reach 5+`);
  if (parsed.experience?.length >= 1) strength += 15; else nudges.push('Add work experience');
  if (parsed.education?.length >= 1) strength += 10; else nudges.push('Add education details');
  if (parsed.projects?.length >= 2) strength += 20; else nudges.push(`Add ${Math.max(0, 2 - (parsed.projects?.length || 0))} more projects to unlock deeper interview questions`);
  if (parsed.certifications?.length >= 1) strength += 5; else nudges.push('Add certifications to stand out');
  if (totalInterviews > 0) strength += 10; else nudges.push('Take your first mock interview to boost your profile');

  // Flatten interview data for frontend consumption
  const recentInterviews = (interviews.data || []).map(i => ({
    id: i.id,
    job_title: i.job_postings?.title || i.interview_type || 'Mock Interview',
    company: 'Practice Session',
    score: i.overall_score || 0,
    integrity_score: i.integrity_score,
    interview_type: i.interview_type,
    language: i.language,
    status: i.status,
    created_at: i.started_at || i.ended_at || new Date().toISOString(),
  }));

  res.json({
    total_applications: apps.data?.length || 0,
    total_interviews: totalInterviews,
    avg_match_score: avg_match,
    avg_interview_score: avg_interview,
    skills_count: profile.data?.parsed_data?.skills?.length || 0,
    completeness_score: profile.data?.completeness_score || 0,
    applications: apps.data || [],
    recent_interviews: recentInterviews,
    stats: {
      totalInterviews,
      totalApplications: apps.data?.length || 0,
    },
    profile_strength: Math.min(100, strength),
    profile_nudges: nudges.map(msg => ({ type: 'missing_field', message: msg })),
    interview_streak: streak,
  });
});

module.exports = router;
