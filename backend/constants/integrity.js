// Integrity scoring constants - transparent weights with documentation
const INTEGRITY_SCORING = {
  BASE_SCORE: 100,
  TAB_SWITCH_PENALTY: 15,     // -15 points per tab switch (shows distraction)
  EYE_DRIFT_PENALTY: 5,       // -5 points per eye drift (currently unused but kept for future)
  MIN_SCORE: 0
};

module.exports = { INTEGRITY_SCORING };
