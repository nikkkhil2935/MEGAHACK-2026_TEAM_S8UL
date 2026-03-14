const router   = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { groqChat, groqJSON } = require('../services/groq/client');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_000_000 } });

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
      .select('parsed_data').eq('user_id', req.user.id).maybeSingle();

    const { data: userProfile } = await supabase.from('profiles')
      .select('preferred_language').eq('id', req.user.id).maybeSingle();

    const lang = language || userProfile?.preferred_language || 'en';

    let docContext = '';
    if (session_id) {
      const { data: sess } = await supabase.from('tutor_chats')
        .select('context_docs').eq('id', session_id).single();
      if (!sess) return res.status(404).json({ error: 'Session not found' });
      if (sess.context_docs?.length) {
        docContext = '\n\nDOCUMENT CONTEXT (reference these when answering):\n' +
          sess.context_docs.map(d => `--- ${d.name} ---\n${d.text}`).join('\n\n');
      }
    }

    const reply = await groqChat(messages, buildSystem(profile?.parsed_data, mode, lang) + docContext);

    // Save to session
    if (session_id) {
      const { data: s } = await supabase.from('tutor_chats')
        .select('messages').eq('id', session_id).single();
      if (!s) return res.status(404).json({ error: 'Session not found' });
      const updated = [...(s.messages || []), ...messages, {
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
  try {
    const { data } = await supabase.from('tutor_chats')
      .select('id, session_name, mode, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    console.error('List sessions error:', err.message);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

router.post('/sessions', authenticate, async (req, res) => {
  try {
    const { data } = await supabase.from('tutor_chats').insert({
      user_id:      req.user.id,
      session_name: req.body.name || 'New Chat',
      mode:         req.body.mode || 'general',
      language:     req.body.language || 'en',
    }).select().single();
    res.json(data);
  } catch (err) {
    console.error('Create session error:', err.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.delete('/sessions/:id', authenticate, async (req, res) => {
  try {
    await supabase.from('tutor_chats')
      .delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete session error:', err.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

router.post('/upload-doc', authenticate, upload.single('document'), async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id required' });

    let text = '';
    const mime = req.file.mimetype;

    if (mime === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const result = await pdfParse(req.file.buffer);
        text = result.text || '';
      } catch {
        text = req.file.buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
      }
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    if (!text.trim()) return res.status(400).json({ error: 'Could not extract text from document' });

    // Truncate to 8000 chars to fit in context
    const docText = text.slice(0, 8000);

    // Add to session's context_docs
    const { data: session } = await supabase.from('tutor_chats')
      .select('context_docs').eq('id', session_id).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const docs = [...(session.context_docs || []), {
      name: req.file.originalname,
      text: docText,
      uploaded_at: new Date()
    }];

    await supabase.from('tutor_chats').update({ context_docs: docs }).eq('id', session_id);

    res.json({ name: req.file.originalname, chars: docText.length, preview: docText.slice(0, 200) });
  } catch (err) {
    console.error('Doc upload error:', err.message);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

router.post('/suggest', authenticate, async (req, res) => {
  try {
    const { chat_id } = req.body;
    const { data: chat } = await supabase.from('tutor_chats')
      .select('document_text, context_docs').eq('id', chat_id).eq('user_id', req.user.id).single();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const docText = chat.document_text || chat.context_docs?.[0]?.text || '';
    if (!docText) return res.json({ questions: [] });

    const docPreview = docText.substring(0, 2000);
    const result = await groqJSON(
      'Generate 5 insightful questions a student might ask about this document.',
      `DOCUMENT EXCERPT:\n${docPreview}\n\nReturn JSON: { "questions": ["question1", "question2", "question3", "question4", "question5"] }`
    );
    res.json(result);
  } catch {
    res.json({ questions: [] });
  }
});

module.exports = router;
