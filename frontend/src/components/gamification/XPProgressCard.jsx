import { motion } from 'framer-motion'

export default function XPProgressCard({ stats, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Your Level</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl">{stats.level.emoji}</span>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.level.name}</p>
              <p className="text-xs text-gray-500">{stats.totalXP.toLocaleString()} total XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-400">{stats.xp.toLocaleString()} XP</span>
          <span className="text-xs text-gray-400">
            {stats.nextLevel ? `${stats.xpToNextLevel.toLocaleString()} to next` : 'MAX'}
          </span>
        </div>
        <div className="h-3 bg-surface-600 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.levelProgress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full ${stats.level.color}`}
          />
        </div>
      </div>

      {/* Next level info */}
      {stats.nextLevel && (
        <p className="text-xs text-gray-500 text-center">
          {stats.levelProgress.toFixed(0)}% progress to <span className="text-brand-300">{stats.nextLevel.name}</span>
        </p>
      )}
    </motion.div>
  );
}
