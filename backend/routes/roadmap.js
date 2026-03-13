const router   = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { generateSkillRoadmap } = require('../services/groq/roadmapGenerator');

// Generate roadmap for a skill
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { skill, candidate_level = 'beginner', target_level = 'intermediate', weekly_hours = 10 } = req.body;

    // Check if roadmap already exists
    const { data: existing } = await supabase.from('learning_roadmaps')
      .select('*').eq('candidate_id', req.user.id).eq('skill_name', skill).single();

    if (existing) return res.json({ roadmap: existing, cached: true });

    const roadmap = await generateSkillRoadmap({
      skill, candidateLevel: candidate_level, targetLevel: target_level, weeklyHours: weekly_hours
    });

    const { data } = await supabase.from('learning_roadmaps').insert({
      candidate_id:      req.user.id,
      skill_name:        skill,
      path_data:         roadmap,
      youtube_resources: roadmap.all_youtube_resources,
      current_week:      1,
      progress_percent:  0,
    }).select().single();

    res.json({ roadmap: data, cached: false });
  } catch (err) {
    console.error('Roadmap generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

// Get all roadmaps for a candidate
router.get('/', authenticate, async (req, res) => {
  const { data } = await supabase.from('learning_roadmaps')
    .select('id, skill_name, current_week, progress_percent, started_at, updated_at')
    .eq('candidate_id', req.user.id)
    .order('updated_at', { ascending: false });
  res.json(data || []);
});

// Get specific roadmap
router.get('/:id', authenticate, async (req, res) => {
  const { data } = await supabase.from('learning_roadmaps')
    .select('*').eq('id', req.params.id).eq('candidate_id', req.user.id).single();
  if (!data) return res.status(404).json({ error: 'Roadmap not found' });
  res.json(data);
});

// Mark resource as complete
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { resource_url, week } = req.body;
    const { data: roadmap } = await supabase.from('learning_roadmaps')
      .select('completed_resources, path_data').eq('id', req.params.id).single();

    const completed = [...(roadmap.completed_resources || []), { url: resource_url, week, completed_at: new Date() }];
    const totalResources = roadmap.path_data?.weeks?.reduce(
      (sum, w) => sum + (w.resources?.length || 0), 0
    ) || 1;
    const progress = Math.round((completed.length / totalResources) * 100);

    await supabase.from('learning_roadmaps').update({
      completed_resources: completed, progress_percent: progress, updated_at: new Date()
    }).eq('id', req.params.id);

    res.json({ progress, completed_count: completed.length });
  } catch (err) {
    console.error('Complete resource error:', err.message);
    res.status(500).json({ error: 'Failed to mark resource complete' });
  }
});

// Advance to next week
router.post('/:id/next-week', authenticate, async (req, res) => {
  const { data } = await supabase.from('learning_roadmaps')
    .select('current_week').eq('id', req.params.id).single();

  const next = Math.min((data.current_week || 1) + 1, 4);
  await supabase.from('learning_roadmaps')
    .update({ current_week: next }).eq('id', req.params.id);

  res.json({ current_week: next });
});

module.exports = router;
