const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    req.user = data;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ error: 'Insufficient permissions' });

module.exports = { authenticate, requireRole };
