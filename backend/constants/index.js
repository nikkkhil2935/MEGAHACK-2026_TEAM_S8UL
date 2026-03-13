// Centralized constants for roles - single source of truth
const ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter'
};

// Centralized constants for integrity event types
const INTEGRITY_EVENT_TYPES = {
  TAB_SWITCH: 'tab_switch',
  EYE_DRIFT: 'eye_drift'
};

module.exports = { ROLES, INTEGRITY_EVENT_TYPES };
