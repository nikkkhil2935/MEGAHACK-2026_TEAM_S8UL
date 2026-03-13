const { groqJSON } = require('./client');

async function generateWeeklyQuiz({ skill, week, topics, difficulty = 'intermediate' }) {
  return groqJSON(
    `You are a technical quiz designer. Generate challenging but fair questions.
    For MCQ: only one correct answer. Distractors should be plausible.
    For coding: short, specific, testable.
    Vary question types.`,

    `Generate a 10-question quiz for:
Skill: ${skill}
Week ${week} Topics: ${topics.join(', ')}
Difficulty: ${difficulty}

Return JSON array:
[{
  id: "q1",
  question: "question text",
  type: "mcq"|"true_false"|"fill_blank"|"short_answer",
  options: ["A) ...", "B) ...", "C) ...", "D) ..."],
  correct_answer: "A"|"B"|"C"|"D" or true/false or answer text,
  explanation: "why this is the correct answer",
  topic: "which topic this tests",
  points: 1-3
}]`
  );
}

async function evaluateQuizAnswers({ skill, week, questions, candidateAnswers }) {
  const results = questions.map((q, i) => ({
    question_id:      q.id,
    question:         q.question,
    correct_answer:   q.correct_answer,
    candidate_answer: candidateAnswers[i],
    is_correct:       String(candidateAnswers[i]).toLowerCase() ===
                      String(q.correct_answer).toLowerCase(),
    explanation:      q.explanation,
    points_earned:    String(candidateAnswers[i]).toLowerCase() ===
                      String(q.correct_answer).toLowerCase() ? q.points : 0,
    points_possible:  q.points
  }));

  const total_earned   = results.reduce((s, r) => s + r.points_earned, 0);
  const total_possible = results.reduce((s, r) => s + r.points_possible, 0);
  const score_percent  = Math.round((total_earned / total_possible) * 100);

  const feedback = await groqJSON(
    `You are a mentor reviewing a quiz submission. Be encouraging but honest.`,
    `Skill: ${skill}, Week ${week} Quiz
Score: ${score_percent}%
Incorrect answers: ${results.filter(r => !r.is_correct).map(r => r.question).join('; ')}

Return JSON:
{
  overall_message: "2-3 encouraging sentences",
  weak_areas: ["topic areas needing review"],
  ready_for_next_week: true|false,
  recommended_review: ["specific resources to revisit"],
  score_interpretation: "what this score means for their learning"
}`
  );

  return { results, score_percent, total_earned, total_possible, feedback };
}

module.exports = { generateWeeklyQuiz, evaluateQuizAnswers };
