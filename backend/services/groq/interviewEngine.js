const { groqJSON } = require('./client');

function getLanguageName(code) {
  const map = {
    en: 'English', hi: 'Hindi', es: 'Spanish',
    fr: 'French', de: 'German', ar: 'Arabic',
    zh: 'Mandarin Chinese', pt: 'Portuguese'
  };
  return map[code] || 'English';
}

async function generateQuestions({ candidateProfile, jobData, type, difficulty, language = 'en' }) {
  const langInstruction = language !== 'en'
    ? `Generate ALL questions in ${getLanguageName(language)}. The questions should feel natural in that language.`
    : '';

  return groqJSON(
    `You are an expert technical interviewer at a top tech company.
Generate exactly 10 interview questions tailored to this specific candidate's background.
IMPORTANT: Reference their actual projects and technologies by name in your questions.
Mix: 4 technical (test depth), 3 behavioral (STAR framework), 2 situational (hypothetical scenarios), 1 motivation.
Difficulty level: ${difficulty}.
${langInstruction}
Questions must feel personal, not generic.`,

    `CANDIDATE PROFILE:
- Name: ${candidateProfile.name || 'Candidate'}
- Skills: ${candidateProfile.skills?.map(s => s.name).join(', ') || 'Not specified'}
- Top Projects: ${candidateProfile.projects?.slice(0, 3).map(p => `${p.name} (${p.tech?.join(', ')})`).join('; ') || 'Not specified'}
- Experience: ${candidateProfile.experience?.slice(0, 2).map(e => `${e.role} at ${e.company}`).join('; ') || 'Not specified'}
- Total Experience: ${Math.round((candidateProfile.total_experience_months || 0) / 12)} years

JOB:
- Title: ${jobData?.title || 'Software Engineer'}
- Required Skills: ${jobData?.required_skills?.map(s => s.name || s).join(', ') || 'General'}

Return JSON array:
[{
  id: "q1",
  question: "full question text",
  type: "technical"|"behavioral"|"situational"|"motivation",
  difficulty: "easy"|"medium"|"hard",
  expected_points: ["point1", "point2", "point3"],
  hints: ["evaluator hint"],
  follow_up_triggers: ["if candidate says X, ask Y"]
}]`
  );
}

async function evaluateAnswer({ question, transcript, questionType, language = 'en' }) {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually'];
  const fillerCount = fillerWords.reduce((count, w) => {
    const regex = new RegExp(`\\b${w}\\b`, 'gi');
    return count + (transcript.match(regex) || []).length;
  }, 0);
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;

  const langNote = language !== 'en'
    ? `The candidate answered in ${getLanguageName(language)}. Evaluate in that context.`
    : '';

  return groqJSON(
    `You are a strict but constructive senior interviewer.
Score the answer carefully. Be specific — reference what the candidate actually said.
For behavioral questions, verify STAR framework (Situation, Task, Action, Result).
${langNote}`,

    `QUESTION: ${question.question}
QUESTION TYPE: ${questionType}
EXPECTED POINTS: ${JSON.stringify(question.expected_points)}
FOLLOW-UP TRIGGERS: ${JSON.stringify(question.follow_up_triggers || [])}
CANDIDATE ANSWER (${wordCount} words, ${fillerCount} filler words): "${transcript}"

Return JSON:
{
  scores: {
    clarity: 1-10,
    technical_depth: 1-10,
    relevance: 1-10,
    structure: 1-10,
    confidence: 1-10
  },
  overall_score: 1-10,
  star_framework_used: true|false,
  expected_points_covered: ["which points from expected_points they hit"],
  missed_points: ["which expected points they missed"],
  feedback: "specific 2-3 sentence feedback referencing their exact words",
  strengths: ["at least 1"],
  improvements: ["at least 1 specific improvement"],
  needs_followup: true|false,
  followup_question: "cross-examination question if score < 7",
  model_answer_summary: "what an ideal answer would have covered in 2-3 sentences"
}`
  );
}

async function generateReport({ questions, answers, candidateName, jobTitle, integrityEvents, language = 'en' }) {
  const avgScore = answers.length
    ? Math.round(answers.reduce((sum, a) => sum + (a.evaluation?.overall_score || 0), 0) / answers.length * 10)
    : 0;

  const tabSwitches = integrityEvents?.filter(e => e.type === 'tab_switch').length || 0;
  const eyeDrifts = integrityEvents?.filter(e => e.type === 'eye_drift').length || 0;
  const integrityScore = Math.max(0, 100 - (tabSwitches * 15) - (eyeDrifts * 5));

  const answerSummary = answers.map((a, i) => ({
    question: questions[i]?.question,
    type: questions[i]?.type,
    score: a.evaluation?.overall_score,
    feedback: a.evaluation?.feedback,
    had_followup: !!a.followup_asked,
    key_strengths: a.evaluation?.strengths,
    key_gaps: a.evaluation?.improvements,
  }));

  const report = await groqJSON(
    `You are a senior hiring manager writing a comprehensive, honest, and constructive interview evaluation.
Reference specific answers. Be detailed. This report helps the candidate understand exactly where to improve.
Write in ${getLanguageName(language)}.`,

    `CANDIDATE: ${candidateName}
ROLE: ${jobTitle}
AVERAGE SCORE: ${avgScore}/100
INTEGRITY EVENTS: ${tabSwitches} tab switches, ${eyeDrifts} eye drift events
ANSWER SUMMARY:\n${JSON.stringify(answerSummary)}

Return JSON:
{
  overall_score: 0-100,
  overall_feedback: "4-5 sentence executive summary",
  technical_assessment: "detailed paragraph",
  behavioral_assessment: "detailed paragraph",
  communication_assessment: "paragraph covering clarity, filler words, structure",
  confidence_level: "High"|"Medium"|"Low",
  strengths: ["at least 3 specific strengths"],
  areas_to_improve: ["at least 3 with specific advice"],
  recommended_resources: ["specific book, course, or practice suggestion for each gap"],
  hire_recommendation: "Strong Yes"|"Yes"|"Maybe"|"No"|"Strong No",
  hire_reasoning: "2-3 honest sentences",
  score_breakdown: {
    technical: 0-100,
    behavioral: 0-100,
    communication: 0-100,
    problem_solving: 0-100,
    culture_fit: 0-100
  },
  next_steps: ["3-5 actionable items"],
  estimated_readiness: "Ready now"|"2-4 weeks"|"1-3 months"|"3-6 months"
}`
  );

  return { ...report, integrity_score: integrityScore };
}

module.exports = { generateQuestions, evaluateAnswer, generateReport };
