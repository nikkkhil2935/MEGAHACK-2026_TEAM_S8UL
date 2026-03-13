const router = require('express').Router();
const multer = require('multer');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { generateQuestions, evaluateAnswer, generateReport, generatePanelQuestions, evaluatePanelAnswer, generatePanelReport } = require('../services/groq/interviewEngine');
const { transcribeAudio } = require('../services/groq/client');
const { groqJSON } = require('../services/groq/client');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25_000_000 } });

// Start interview — generate questions (supports JD text/paste + panel mode)
router.post('/start', authenticate, async (req, res) => {
  const { job_id, interview_type = 'mixed', difficulty = 'mid', language = 'en', jd_text, panel_mode = false } = req.body;

  const [{ data: profile }, jobResult, githubResult] = await Promise.all([
    supabase.from('candidate_profiles').select('parsed_data').eq('user_id', req.user.id).single(),
    job_id
      ? supabase.from('job_postings').select('*').eq('id', job_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('github_analyses').select('analysis').eq('user_id', req.user.id).maybeSingle?.() || Promise.resolve({ data: null })
  ]);

  if (!profile?.parsed_data) {
    return res.status(400).json({ error: 'Please upload your resume or import LinkedIn profile first.' });
  }

  // If JD text provided, parse it into job data format
  let jobData = jobResult?.data?.parsed_data || {};
  if (jd_text && jd_text.trim()) {
    try {
      jobData = await groqJSON(
        'You are a JD parser. Extract structured info from this job description. Return ONLY valid JSON.',
        `Parse this job description:\n${jd_text}\n\nReturn JSON:\n{\n  "title": "job title",\n  "required_skills": [{"name": "skill"}],\n  "tech_stack": ["tech"],\n  "experience_years": {"min": 0, "max": 5},\n  "responsibilities": ["resp"]\n}`
      );
    } catch { /* use empty jobData if parse fails */ }
  }

  const githubContext = githubResult.data?.analysis?.repositories
    ?.slice(0, 3)
    .map((r) => `- ${r.name}: ${r.improvedDescription}`)
    .join('\n') || '';

  const questionArgs = {
    candidateProfile: profile.parsed_data,
    jobData,
    type: interview_type,
    difficulty,
    language,
    githubContext
  };

  const questions = panel_mode
    ? await generatePanelQuestions(questionArgs)
    : await generateQuestions(questionArgs);

  const { data: session } = await supabase.from('interview_sessions').insert({
    candidate_id: req.user.id, job_id,
    interview_type, difficulty, language,
    questions, status: 'active',
    panel_mode: !!panel_mode,
    started_at: new Date()
  }).select().single();

  res.json({ session_id: session.id, questions });
});

// Submit text answer
router.post('/answer', authenticate, async (req, res) => {
  const { session_id, question_index, transcript } = req.body;

  const { data: session } = await supabase.from('interview_sessions')
    .select('*').eq('id', session_id).eq('candidate_id', req.user.id).single();

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const question = session.questions[question_index];
  const evaluation = session.panel_mode && question.panelist
    ? await evaluatePanelAnswer({ question, transcript, questionType: question.type, language: session.language })
    : await evaluateAnswer({ question, transcript, questionType: question.type, language: session.language });

  const followup = evaluation.needs_followup && evaluation.overall_score < 7
    ? evaluation.followup_question
    : null;

  const updatedAnswers = [...(session.answers || []), {
    question_index, transcript, evaluation,
    followup_asked: followup,
    timestamp: new Date().toISOString()
  }];

  await supabase.from('interview_sessions')
    .update({ answers: updatedAnswers }).eq('id', session_id);

  res.json({ evaluation, followup_question: followup });
});

// Submit audio answer
router.post('/answer/audio', authenticate, upload.single('audio'), async (req, res) => {
  const { session_id, question_index, language = 'en' } = req.body;

  const transcript = await transcribeAudio(req.file.buffer, language);

  const { data: session } = await supabase.from('interview_sessions')
    .select('*').eq('id', session_id).single();

  const question = session.questions[Number(question_index)];
  const evaluation = session.panel_mode && question.panelist
    ? await evaluatePanelAnswer({ question, transcript, questionType: question.type, language: session.language })
    : await evaluateAnswer({ question, transcript, questionType: question.type, language: session.language });

  const followup = evaluation.needs_followup && evaluation.overall_score < 7
    ? evaluation.followup_question
    : null;

  const updatedAnswers = [...(session.answers || []), {
    question_index: Number(question_index), transcript, evaluation,
    followup_asked: followup, timestamp: new Date().toISOString()
  }];

  await supabase.from('interview_sessions')
    .update({ answers: updatedAnswers }).eq('id', session_id);

  res.json({ transcript, evaluation, followup_question: followup });
});

// Log integrity event
router.post('/integrity', authenticate, async (req, res) => {
  const { session_id, event_type, duration } = req.body;
  const { data: session } = await supabase.from('interview_sessions')
    .select('integrity_events').eq('id', session_id).single();

  const events = [...(session.integrity_events || []), {
    type: event_type, timestamp: new Date().toISOString(), duration: duration || null
  }];

  await supabase.from('interview_sessions')
    .update({ integrity_events: events }).eq('id', session_id);

  res.json({ logged: true });
});

// End interview + generate report
router.post('/end', authenticate, async (req, res) => {
  const { session_id } = req.body;

  const { data: session } = await supabase.from('interview_sessions')
    .select('*, job_postings(title)').eq('id', session_id).single();

  const reportArgs = {
    questions: session.questions,
    answers: session.answers || [],
    candidateName: req.user.full_name,
    jobTitle: session.job_postings?.title || session.interview_type,
    integrityEvents: session.integrity_events,
    language: session.language
  };

  const report = session.panel_mode
    ? await generatePanelReport(reportArgs)
    : await generateReport(reportArgs);

  const duration = Math.round((Date.now() - new Date(session.started_at)) / 1000);

  await supabase.from('interview_sessions').update({
    report,
    status: 'completed',
    overall_score: report.overall_score,
    integrity_score: report.integrity_score,
    ended_at: new Date(),
    duration_seconds: duration
  }).eq('id', session_id);

  res.json({ report, session_id });
});

// Get report
router.get('/report/:id', authenticate, async (req, res) => {
  const { data } = await supabase.from('interview_sessions')
    .select('*, job_postings(title, company)').eq('id', req.params.id).single();
  res.json(data);
});

// History
router.get('/history', authenticate, async (req, res) => {
  const { data } = await supabase.from('interview_sessions')
    .select('id, interview_type, overall_score, integrity_score, status, started_at, ended_at, language, panel_mode, job_postings(title)')
    .eq('candidate_id', req.user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  res.json(data);
});

// Analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const { data: sessions } = await supabase.from('interview_sessions')
      .select('id, overall_score, started_at, ended_at, interview_type, report, panel_mode')
      .eq('candidate_id', req.user.id)
      .eq('status', 'completed')
      .order('started_at', { ascending: true });

    // Build heatmap: { "2026-01-15": { count, avgScore } }
    const heatmap = {};
    const scoreTrend = [];
    const skillMatrix = { technical: [], behavioral: [], communication: [], problem_solving: [], culture_fit: [] };

    (sessions || []).forEach(s => {
      const day = s.started_at ? s.started_at.split('T')[0] : null;
      if (!day) return;

      if (!heatmap[day]) heatmap[day] = { count: 0, totalScore: 0 };
      heatmap[day].count++;
      heatmap[day].totalScore += s.overall_score || 0;

      scoreTrend.push({
        date: day,
        score: s.overall_score || 0,
        type: s.interview_type,
        id: s.id,
        panel_mode: s.panel_mode || false,
      });

      const breakdown = s.report?.score_breakdown;
      if (breakdown) {
        Object.keys(skillMatrix).forEach(key => {
          if (breakdown[key] !== undefined) {
            skillMatrix[key].push({ date: day, score: breakdown[key], sessionId: s.id });
          }
        });
      }
    });

    // Compute avgScore for heatmap
    Object.values(heatmap).forEach(entry => {
      entry.avgScore = Math.round(entry.totalScore / entry.count);
      delete entry.totalScore;
    });

    res.json({ heatmap, scoreTrend, skillMatrix });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

module.exports = router;
