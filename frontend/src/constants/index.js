// Role constants - keep in sync with backend/constants/index.js
export const ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter'
};

// Routes based on role
export const ROLE_ROUTES = {
  [ROLES.RECRUITER]: '/recruiter',
  [ROLES.CANDIDATE]: '/dashboard'
};

// Get the appropriate home route for a user
export const getHomeRoute = (userRole) => ROLE_ROUTES[userRole] || '/dashboard';
