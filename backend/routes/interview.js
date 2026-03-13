const router = require('express').Router();
const multer = require('multer');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { generateQuestions, evaluateAnswer, generateReport } = require('../services/groq/interviewEngine');
const { transcribeAudio } = require('../services/groq/client');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25_000_000 } });

// Start interview — generate questions
router.post('/start', authenticate, async (req, res) => {
  const { job_id, interview_type = 'mixed', difficulty = 'mid', language = 'en' } = req.body;

  const [{ data: profile }, jobResult] = await Promise.all([
    supabase.from('candidate_profiles').select('parsed_data').eq('user_id', req.user.id).single(),
    job_id
      ? supabase.from('job_postings').select('*').eq('id', job_id).single()
      : Promise.resolve({ data: null })
  ]);

  if (!profile?.parsed_data) {
    return res.status(400).json({ error: 'Please upload your resume or import LinkedIn profile first.' });
  }

  const questions = await generateQuestions({
    candidateProfile: profile.parsed_data,
    jobData: jobResult?.data?.parsed_data || {},
    type: interview_type, difficulty, language
  });

  const { data: session } = await supabase.from('interview_sessions').insert({
    candidate_id: req.user.id, job_id,
    interview_type, difficulty, language,
    questions, status: 'active',
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
  const evaluation = await evaluateAnswer({
    question, transcript, questionType: question.type, language: session.language
  });

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
  const evaluation = await evaluateAnswer({
    question, transcript, questionType: question.type, language: session.language
  });

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

  const report = await generateReport({
    questions: session.questions,
    answers: session.answers || [],
    candidateName: req.user.full_name,
    jobTitle: session.job_postings?.title || session.interview_type,
    integrityEvents: session.integrity_events,
    language: session.language
  });

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
    .select('id, interview_type, overall_score, integrity_score, status, started_at, ended_at, language, job_postings(title)')
    .eq('candidate_id', req.user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  res.json(data);
});

module.exports = router;
