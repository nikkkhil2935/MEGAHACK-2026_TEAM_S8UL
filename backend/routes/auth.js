const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { createOrGetUserProfile, extractDisplayName, generateAuthToken, getUserProfile } = require('../services/authService');
const { ROLES } = require('../constants');

router.post('/register', async (req, res) => {
  const { email, password, full_name, role = ROLES.CANDIDATE, company_name } = req.body;

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });

  const userId = data.user.id;
  const profile = await createOrGetUserProfile(userId, email, full_name, role, company_name);
  const token = generateAuthToken(userId);
  res.json({ token, user: profile });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error.message);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const profile = await getUserProfile(data.user.id);
  const token = generateAuthToken(data.user.id);
  res.json({ token, user: profile });
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

module.exports = router;
