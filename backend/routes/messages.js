const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');

// Get all conversations (unique users the current user has messaged with)
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const uid = req.user.id;

    // Get all messages involving this user
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, read, created_at')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Conversations fetch error:', error.message);
      return res.json([]);
    }

    // Build conversation list: group by the other person
    const convMap = {};
    for (const msg of (messages || [])) {
      const otherId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
      if (!convMap[otherId]) {
        convMap[otherId] = {
          user_id: otherId,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread: 0,
        };
      }
      if (!msg.read && msg.receiver_id === uid) {
        convMap[otherId].unread++;
      }
    }

    // Fetch profile info for each conversation partner
    const partnerIds = Object.keys(convMap);
    let profiles = [];
    if (partnerIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url')
        .in('id', partnerIds);
      profiles = profileData || [];
    }

    const conversations = profiles.map(p => ({
      ...convMap[p.id],
      full_name: p.full_name,
      email: p.email,
      role: p.role,
      avatar_url: p.avatar_url,
    }));

    // Sort by last message time
    conversations.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

    res.json(conversations);
  } catch (err) {
    console.error('Conversations error:', err.message);
    res.json([]);
  }
});

// Search users to start a conversation with (MUST be before /:userId)
router.get('/users/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .neq('id', req.user.id)
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/send', authenticate, async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content?.trim()) {
      return res.status(400).json({ error: 'receiver_id and content are required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.id,
        receiver_id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiver_id}`).emit('new_message', data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages with a specific user (MUST be after specific routes like /users/search)
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const uid = req.user.id;
    const otherId = req.params.userId;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${uid},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${uid})`
      )
      .order('created_at', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    // Mark unread messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherId)
      .eq('receiver_id', uid)
      .eq('read', false);

    res.json(messages || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
