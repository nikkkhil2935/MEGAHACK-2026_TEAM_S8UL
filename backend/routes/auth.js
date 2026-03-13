const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { createOrGetUserProfile, extractDisplayName, generateAuthToken } = require('../services/authService');
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
  if (error) return res.status(401).json({ error: 'Invalid credentials' });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', data.user.id).single();
  const token = generateAuthToken(data.user.id);
  res.json({ token, user: profile });
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

router.post('/oauth-callback', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Missing access_token' });

    const { data: { user: authUser }, error } = await supabase.auth.getUser(access_token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid OAuth token' });

    const full_name = extractDisplayName(authUser);
    const email = authUser.email;
    const role = ROLES.CANDIDATE;

    const profile = await createOrGetUserProfile(authUser.id, email, full_name, role);
    const token = generateAuthToken(authUser.id);
    res.json({ token, user: profile });
  } catch (err) {
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

module.exports = router;
