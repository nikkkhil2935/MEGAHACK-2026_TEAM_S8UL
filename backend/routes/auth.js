const router = require('express').Router();
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { email, password, full_name, role = 'candidate', company_name } = req.body;

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });

  const userId = data.user.id;
  await supabase.from('profiles').insert({ id: userId, email, full_name, role });

  if (role === 'candidate') {
    await supabase.from('candidate_profiles').insert({ user_id: userId });
  }
  if (role === 'recruiter') {
    await supabase.from('recruiter_profiles').insert({ user_id: userId, company_name });
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: userId, email, full_name, role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid credentials' });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', data.user.id).single();
  const token = jwt.sign({ userId: data.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: profile });
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
