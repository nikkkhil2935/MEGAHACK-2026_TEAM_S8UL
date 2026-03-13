import { motion } from 'framer-motion'

export default function BadgesDisplay({ badges, compact = false }) {
  const unlockedBadges = badges.filter(b => b.unlocked);

  if (compact) {
    return (
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Recent Achievements</p>
        <div className="flex gap-2 flex-wrap">
          {unlockedBadges.slice(-3).map((badge) => (
            <motion.div
              key={badge.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="group relative"
              title={badge.description}
            >
              <div className="text-2xl cursor-help hover:scale-110 transition-transform">
                {badge.icon}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-600 rounded text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                {badge.name}
              </div>
            </motion.div>
          ))}
        </div>
        {unlockedBadges.length === 0 && (
          <p className="text-xs text-gray-500">Complete tasks to earn badges</p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">Achievements</p>
        <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-1 rounded">
          {unlockedBadges.length}/{badges.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {badges.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-center p-3 rounded-xl border transition-all ${
              badge.unlocked
                ? 'border-brand-500/50 bg-brand-500/10 cursor-pointer hover:scale-105'
                : 'border-gray-600/30 bg-surface-700/50 opacity-50'
            }`}
            title={badge.description}
          >
            <p className="text-2xl mb-2">{badge.icon}</p>
            <p className="text-xs font-medium text-foreground">{badge.name}</p>
            <p className="text-[10px] text-gray-500 mt-1">{badge.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
