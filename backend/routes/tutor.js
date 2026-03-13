const router   = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { groqChat } = require('../services/groq/client');

const TUTOR_MODES = {
  general:   'You are a friendly, expert AI career coach for software engineers.',
  resume:    'You are an expert resume reviewer. Be specific, reference exact wording. Give actionable improvements.',
  interview: 'You are a tough but fair interview coach. Ask practice questions and give detailed scored feedback.',
  salary:    'You are a salary negotiation expert. Give scripts, market data ranges, and proven tactics.',
  career:    'You are a senior engineering mentor. Give honest, strategic, long-term career advice.',
  dsa:       'You are a Data Structures & Algorithms tutor. Explain concepts clearly, give examples, trace through code.',
  system:    'You are a system design expert. Draw ASCII diagrams when useful. Explain trade-offs clearly.',
};

function buildSystem(profile, mode, language = 'en') {
  const base = TUTOR_MODES[mode] || TUTOR_MODES.general;
  const langNote = language !== 'en'
    ? `\nRespond in ${language} (the user's preferred language).`
    : '';
  const profileCtx = profile ? `
\nCANDIDATE CONTEXT:
- Name: ${profile.name}
- Skills: ${profile.skills?.map(s => s.name).join(', ')}
- Experience: ${profile.experience?.map(e => `${e.role} at ${e.company}`).join('; ')}
- Projects: ${profile.projects?.map(p => p.name).join(', ')}
` : '';
  return `${base}${profileCtx}${langNote}
Be concise (under 300 words unless asked for detail). Use bullet points for lists. Be encouraging.`;
}

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages, mode = 'general', session_id, language } = req.body;

    const { data: profile } = await supabase.from('candidate_profiles')
      .select('parsed_data').eq('user_id', req.user.id).single();

    const { data: userProfile } = await supabase.from('profiles')
      .select('preferred_language').eq('id', req.user.id).single();

    const lang = language || userProfile?.preferred_language || 'en';
    const reply = await groqChat(messages, buildSystem(profile?.parsed_data, mode, lang));

    // Save to session
    if (session_id) {
      const { data: s } = await supabase.from('tutor_chats')
        .select('messages').eq('id', session_id).single();
      const updated = [...(s?.messages || []), ...messages, {
        role: 'assistant', content: reply, timestamp: new Date()
      }];
      await supabase.from('tutor_chats').update({
        messages: updated, updated_at: new Date()
      }).eq('id', session_id);
    }

    res.json({ reply });
  } catch (err) {
    console.error('Tutor chat error:', err.message);
    res.status(500).json({ error: 'Failed to get tutor response' });
  }
});

router.get('/sessions', authenticate, async (req, res) => {
  const { data } = await supabase.from('tutor_chats')
    .select('id, session_name, mode, updated_at')
    .eq('user_id', req.user.id)
    .order('updated_at', { ascending: false });
  res.json(data || []);
});

router.post('/sessions', authenticate, async (req, res) => {
  const { data } = await supabase.from('tutor_chats').insert({
    user_id:      req.user.id,
    session_name: req.body.name || 'New Chat',
    mode:         req.body.mode || 'general',
    language:     req.body.language || 'en',
  }).select().single();
  res.json(data);
});

router.delete('/sessions/:id', authenticate, async (req, res) => {
  await supabase.from('tutor_chats')
    .delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ deleted: true });
});

module.exports = router;
