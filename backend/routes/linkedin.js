const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { groqJSON } = require('../services/groq/client');

router.post('/import', authenticate, async (req, res) => {
  const { profile_text } = req.body;

  if (!profile_text || profile_text.trim().length < 20) {
    return res.status(400).json({ error: 'Please paste a meaningful profile or professional summary (at least 20 characters).' });
  }

  try {
    const parsed = await groqJSON(
      `You are a profile parser. Extract structured professional profile data from the unstructured text provided by the user. Return a JSON object with these fields:
- name (string)
- headline (string)
- summary (string)
- skills (array of objects with "name" field)
- experience (array of objects with "role", "company", "duration", "achievements" fields)
- education (array of objects with "degree", "institution", "year" fields)
- projects (array of objects with "name", "description", "tech_stack" fields)
If a field cannot be determined, use null or an empty array as appropriate.`,
      profile_text.trim()
    );

    const checks = [
      parsed.name, parsed.headline, parsed.summary,
      parsed.skills?.length > 0, parsed.experience?.length > 0,
      parsed.education?.length > 0
    ];
    const completeness = Math.round(checks.filter(Boolean).length / checks.length * 100);
    parsed.completeness_score = completeness;

    await supabase.from('candidate_profiles').upsert({
      user_id: req.user.id,
      parsed_data: parsed,
      completeness_score: completeness,
      updated_at: new Date()
    }, { onConflict: 'user_id' });

    res.json({ parsed, completeness });

  } catch (err) {
    console.error('Profile import error:', err);
    if (err.code === 'GROQ_INVALID_KEY') return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
