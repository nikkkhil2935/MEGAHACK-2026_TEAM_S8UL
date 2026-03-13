const router = require('express').Router();
const multer = require('multer');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { createOrGetUserProfile, extractDisplayName, generateAuthToken, getUserProfile } = require('../services/authService');
const { ROLES } = require('../constants');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5_000_000 } });

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role = ROLES.CANDIDATE, company_name } = req.body;

    const { data, error } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user.id;
    const profile = await createOrGetUserProfile(userId, email, full_name, role, company_name);
    const token = generateAuthToken(userId);
    res.json({ token, user: profile });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const profile = await getUserProfile(data.user.id);
    const token = generateAuthToken(data.user.id);
    res.json({ token, user: profile });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

router.post('/oauth-callback', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Missing access_token' });

    const { data: { user: authUser }, error } = await supabase.auth.getUser(access_token);
    if (error || !authUser) {
      console.error('OAuth validation error:', error?.message);
      return res.status(401).json({ error: 'Invalid OAuth token' });
    }

    const full_name = extractDisplayName(authUser);
    const email = authUser.email;
    const role = ROLES.CANDIDATE;

    const profile = await createOrGetUserProfile(authUser.id, email, full_name, role);
    const token = generateAuthToken(authUser.id);
    res.json({ token, user: profile });
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).json({ error: 'Authentication failed', code: 'OAUTH_CALLBACK_ERROR' });
  }
});

// Update profile (full_name, preferred_language)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, preferred_language } = req.body;
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (preferred_language) updates.preferred_language = preferred_language;

    const { error } = await supabase.from('profiles')
      .update(updates).eq('id', req.user.id);
    if (error) return res.status(400).json({ error: error.message });

    const profile = await getUserProfile(req.user.id);
    res.json({ user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload avatar photo
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const fileName = `avatars/${req.user.id}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
    const avatar_url = urlData.publicUrl;

    // Update profile
    await supabase.from('profiles').update({ avatar_url }).eq('id', req.user.id);

    const profile = await getUserProfile(req.user.id);
    res.json({ user: profile, avatar_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
