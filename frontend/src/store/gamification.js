import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

// 7 XP Levels - from MessagingSchedulerGamified
const XP_LEVELS = [
  { min: 0, max: 199, name: 'Fresher', emoji: '🌱', color: 'bg-gray-500' },
  { min: 200, max: 499, name: 'Intern', emoji: '🎓', color: 'bg-blue-500' },
  { min: 500, max: 999, name: 'Junior Dev', emoji: '💻', color: 'bg-green-500' },
  { min: 1000, max: 1999, name: 'Mid-level', emoji: '⚡', color: 'bg-yellow-500' },
  { min: 2000, max: 3999, name: 'Senior Dev', emoji: '🚀', color: 'bg-orange-500' },
  { min: 4000, max: 7999, name: 'Tech Lead', emoji: '🏆', color: 'bg-purple-500' },
  { min: 8000, max: Infinity, name: 'CTO', emoji: '👑', color: 'bg-yellow-400' },
];

// 6 Achievement Badges
const BADGES = [
  { id: 'interview_master', name: 'Interview Master', icon: '🎤', description: 'Complete 5 interviews', unlocked: false },
  { id: 'quiz_wizard', name: 'Quiz Wizard', icon: '🧙', description: 'Score 90%+ on 3 quizzes', unlocked: false },
  { id: 'roadmap_climber', name: 'Roadmap Climber', icon: '🏔️', description: 'Complete 2 full roadmaps', unlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Interview in under 5 minutes', unlocked: false },
  { id: 'achievement_hunter', name: 'Achievement Hunter', icon: '🎯', description: 'Earn 5 badges', unlocked: false },
  { id: 'rising_star', name: 'Rising Star', icon: '⭐', description: 'Reach Senior Dev level', unlocked: false },
];

function getLevel(xp) {
  return XP_LEVELS.find(l => xp >= l.min && xp <= l.max) || XP_LEVELS[0];
}

function getNextLevel(xp) {
  const idx = XP_LEVELS.findIndex(l => xp >= l.min && xp <= l.max);
  return idx < XP_LEVELS.length - 1 ? XP_LEVELS[idx + 1] : null;
}

function getLevelProgress(xp) {
  const level = getLevel(xp);
  const range = level.max === Infinity ? 4000 : level.max - level.min + 1;
  return ((xp - level.min) / range) * 100;
}

function getXPToNextLevel(xp) {
  const level = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 0;
  return next.min - xp;
}

export const useGamificationStore = create(persist(
  (set, get) => ({
    xp: 340, // Demo starting XP
    totalXP: 340, // Lifetime total
    badges: BADGES,
    streakDays: 3,
    lastStreakDate: new Date().toISOString(),
    interviewsCompleted: 2,
    quizzesCompleted: 1,
    roadmapsStarted: 1,

    // Award XP for actions
    awardXP: (amount, reason) => {
      // Show gamified toast
      toast.success(`✨ +${amount} XP: ${reason}`, {
        duration: 3000, 
        position: 'bottom-right',
        style: {
          background: '#ffffff',
          color: '#16a34a',
          fontWeight: 'bold',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
      })

      set(state => {
        const newXP = state.xp + amount;
        const newTotal = state.totalXP + amount;
        const oldLevel = getLevel(state.xp);
        const newLevel = getLevel(newXP);
        const leveledUp = newLevel.min > oldLevel.min;

        return {
          xp: newXP,
          totalXP: newTotal,
          _lastXPGain: { amount, reason, leveledUp, newLevel }
        };
      });
    },

    // Unlock badge
    unlockBadge: (badgeId) => {
      set(state => ({
        badges: state.badges.map(b =>
          b.id === badgeId ? { ...b, unlocked: true } : b
        )
      }));
    },

    // Update streak
    updateStreak: () => {
      set(state => {
        const today = new Date().toDateString();
        const lastDate = new Date(state.lastStreakDate).toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (today === lastDate) {
          // Already updated today
          return { lastStreakDate: new Date().toISOString() };
        } else if (lastDate === yesterday) {
          // Streak continues
          return { streakDays: state.streakDays + 1, lastStreakDate: new Date().toISOString() };
        } else {
          // Streak broken, reset to 1
          return { streakDays: 1, lastStreakDate: new Date().toISOString() };
        }
      });
    },

    // Record interview completion
    recordInterview: () => {
      set(state => ({ interviewsCompleted: state.interviewsCompleted + 1 }));
      get().awardXP(150, 'Interview Completed');
      get().updateStreak();
    },

    // Record quiz completion
    recordQuiz: (score) => {
      set(state => ({ quizzesCompleted: state.quizzesCompleted + 1 }));
      const xpReward = Math.round(score * 1.5); // Award XP based on score
      get().awardXP(xpReward, `Quiz Completed (${score}%)`);
      get().updateStreak();

      // Check for Quiz Wizard badge (90%+ on 3 quizzes)
      if (score >= 90) {
        const highScoreQuizzes = (JSON.parse(localStorage.getItem('quiz-scores') || '[]')).filter(s => s >= 90).length;
        if (highScoreQuizzes >= 3) {
          get().unlockBadge('quiz_wizard');
        }
      }
    },

    // Record roadmap start
    startRoadmap: () => {
      set(state => ({ roadmapsStarted: state.roadmapsStarted + 1 }));
      get().awardXP(100, 'Roadmap Started');
    },

    // Complete roadmap
    completeRoadmap: () => {
      const newTotal = get().xp;
      const level = getLevel(newTotal);

      if (level.name === 'Senior Dev') {
        get().unlockBadge('rising_star');
      }

      get().awardXP(500, 'Roadmap Completed');

      if (get().roadmapsStarted >= 2) {
        get().unlockBadge('roadmap_climber');
      }
    },

    // Get current stats object
    getStats: () => {
      const state = get();
      return {
        xp: state.xp,
        totalXP: state.totalXP,
        level: getLevel(state.xp),
        nextLevel: getNextLevel(state.xp),
        levelProgress: getLevelProgress(state.xp),
        xpToNextLevel: getXPToNextLevel(state.xp),
        badges: state.badges,
        unlockedBadges: state.badges.filter(b => b.unlocked).length,
        streakDays: state.streakDays,
        interviewsCompleted: state.interviewsCompleted,
        quizzesCompleted: state.quizzesCompleted,
        roadmapsStarted: state.roadmapsStarted,
      };
    },

    // Reset (for testing)
    resetGamification: () => {
      set({
        xp: 0,
        totalXP: 0,
        badges: BADGES,
        streakDays: 0,
        interviewsCompleted: 0,
        quizzesCompleted: 0,
        roadmapsStarted: 0,
      });
    },
  }),
  { name: 'careerbridge-gamification' }
));
