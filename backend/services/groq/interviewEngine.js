const { groqJSON } = require('./client');
const { INTEGRITY_SCORING } = require('../../constants/integrity');

function getLanguageName(code) {
  const map = {
    en: 'English', hi: 'Hindi', es: 'Spanish',
    fr: 'French', de: 'German', ar: 'Arabic',
    zh: 'Mandarin Chinese', pt: 'Portuguese'
  };
  return map[code] || 'English';
}

async function generateQuestions({ candidateProfile, jobData, type, difficulty, language = 'en', githubContext = '' }) {
  const langInstruction = language !== 'en'
    ? `Generate ALL questions in ${getLanguageName(language)}. The questions should feel natural in that language.`
    : '';

  const githubSection = githubContext
    ? `\nGITHUB PROJECTS (ask about these specifically):\n${githubContext}\n`
    : '';

  return groqJSON(
    `You are an elite technical interviewer at Google/Meta level.
You NEVER ask generic questions like "tell me about yourself" or "what are your strengths".
Every single question MUST reference specific information from the candidate's profile.
You create questions that test DEPTH of knowledge, not surface-level awareness.
Generate exactly 10 interview questions.
Mix: ${type === 'technical' ? '7 technical, 2 behavioral, 1 system design' : type === 'behavioral' ? '2 technical, 6 behavioral, 2 situational' : type === 'hr' ? '1 technical, 3 behavioral, 4 HR/culture, 2 motivation' : '4 technical, 3 behavioral, 2 situational, 1 motivation'}.
Difficulty: ${difficulty} level.
${langInstruction}
The candidate should feel like you actually READ their profile and know their work.${githubSection}`,

    `CANDIDATE PROFILE:
- Name: ${candidateProfile.name || 'Candidate'}
- Headline: ${candidateProfile.headline || 'Software Developer'}
- Total Experience: ${Math.round((candidateProfile.total_experience_months || 0) / 12)} years
- Skills (${candidateProfile.skills?.length || 0}): ${candidateProfile.skills?.map(s => s.name || s).join(', ') || 'Not specified'}
- Education: ${candidateProfile.education?.map(e => `${e.degree} from ${e.institution} (${e.year || 'N/A'})`).join('; ') || 'Not specified'}

EXPERIENCE DETAILS:
${candidateProfile.experience?.slice(0, 3).map(e => `• ${e.role} at ${e.company} (${e.duration || 'N/A'})${e.achievements?.length ? ': ' + e.achievements.join(', ') : ''}`).join('\n') || 'Not specified'}

PROJECT DETAILS:
${candidateProfile.projects?.slice(0, 4).map(p => `• ${p.name}: ${p.description || 'No description'} [Tech: ${(p.tech || p.tech_stack || []).join(', ')}]`).join('\n') || 'Not specified'}

JOB TARGET:
- Title: ${jobData?.title || 'Software Engineer'}
- Required Skills: ${jobData?.required_skills?.map(s => s.name || s).join(', ') || 'General'}
- Tech Stack: ${jobData?.tech_stack?.join(', ') || 'Not specified'}
- Responsibilities: ${jobData?.responsibilities?.slice(0, 3).join('; ') || 'General engineering'}

INSTRUCTIONS:
1. Ask about SPECIFIC projects by name (e.g., "In your project ${candidateProfile.projects?.[0]?.name || 'X'}, how did you...")
2. Probe the GAP between candidate's skills and job requirements
3. Ask about real scenarios from their experience (e.g., "At ${candidateProfile.experience?.[0]?.company || 'your company'}, tell me about...")
4. Include at least 2 questions about technologies they claim to know — test DEPTH not just awareness
5. Ask about challenges, failures, and lessons learned — not just achievements
6. Each question MUST be unique and NOT be a generic template question

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
  const integrityScore = Math.max(INTEGRITY_SCORING.MIN_SCORE, INTEGRITY_SCORING.BASE_SCORE - (tabSwitches * INTEGRITY_SCORING.TAB_SWITCH_PENALTY));

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
INTEGRITY EVENTS: ${tabSwitches} tab switches detected
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
