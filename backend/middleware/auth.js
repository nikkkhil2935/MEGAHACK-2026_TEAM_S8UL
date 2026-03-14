const jwt = require('jsonwebtoken');
const { getUserProfile } = require('../services/authService');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserProfile(userId);
    if (!user) return res.status(401).json({ error: 'Profile not found' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ error: 'Authentication service error' });
  }
};

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ error: 'Insufficient permissions' });

// Convenience middleware for recruiter-only routes (used by new features)
const recruiterMiddleware = (req, res, next) =>
  requireRole('recruiter')(req, res, next);

module.exports = { authenticate, requireRole, recruiterMiddleware };
