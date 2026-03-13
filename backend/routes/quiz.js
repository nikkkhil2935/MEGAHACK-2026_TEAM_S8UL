const router   = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { generateWeeklyQuiz, evaluateQuizAnswers } = require('../services/groq/quizGenerator');

// Get user's roadmaps (for quiz landing) and past attempts
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { data: roadmaps } = await supabase.from('learning_roadmaps')
      .select('id, skill_name, current_week, path_data, quiz_history')
      .eq('candidate_id', req.user.id)
      .order('updated_at', { ascending: false });

    const { data: attempts } = await supabase.from('quiz_attempts')
      .select('id, roadmap_id, week, skill, score, taken_at')
      .eq('candidate_id', req.user.id)
      .order('taken_at', { ascending: false })
      .limit(20);

    // Build roadmap summaries with available weeks
    const roadmapSummaries = (roadmaps || []).map(r => {
      const totalWeeks = r.path_data?.weeks?.length || 4;
      return {
        id: r.id,
        skill_name: r.skill_name,
        current_week: r.current_week,
        total_weeks: totalWeeks,
        quiz_history: r.quiz_history || [],
      };
    });

    res.json({ roadmaps: roadmapSummaries, recent_attempts: attempts || [] });
  } catch (err) {
    console.error('Quiz dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load quiz dashboard' });
  }
});

// Generate a quiz for a roadmap week
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { roadmap_id, week } = req.body;

    const { data: roadmap } = await supabase.from('learning_roadmaps')
      .select('skill_name, path_data').eq('id', roadmap_id).single();

    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });

    const weekData = roadmap.path_data?.weeks?.find(w => w.week === week);
    if (!weekData) return res.status(404).json({ error: 'Week not found in roadmap' });

    const questions = await generateWeeklyQuiz({
      skill:  roadmap.skill_name,
      week,
      topics: weekData.topics || [],
    });

    res.json({ questions, skill: roadmap.skill_name, week });
  } catch (err) {
    console.error('Quiz generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit quiz answers
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { roadmap_id, week, questions, candidate_answers } = req.body;

    const { data: roadmap } = await supabase.from('learning_roadmaps')
      .select('skill_name').eq('id', roadmap_id).single();

    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });

    const result = await evaluateQuizAnswers({
      skill:            roadmap.skill_name,
      week,
      questions,
      candidateAnswers: candidate_answers,
    });

    // Save attempt
    await supabase.from('quiz_attempts').insert({
      candidate_id: req.user.id,
      roadmap_id, week,
      skill:     roadmap.skill_name,
      questions, answers: candidate_answers,
      score:     result.score_percent,
      feedback:  result.feedback,
    });

    // Update roadmap quiz history
    const { data: rm } = await supabase.from('learning_roadmaps')
      .select('quiz_history').eq('id', roadmap_id).single();
    const history = [...(rm.quiz_history || []), { week, score: result.score_percent, taken_at: new Date() }];
    await supabase.from('learning_roadmaps').update({ quiz_history: history }).eq('id', roadmap_id);

    res.json(result);
  } catch (err) {
    console.error('Quiz submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

module.exports = router;
