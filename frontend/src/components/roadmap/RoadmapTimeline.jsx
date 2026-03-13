import { motion } from 'framer-motion'
import { CheckCircle, Circle, Lock } from 'lucide-react'

export default function RoadmapTimeline({ weeks = 4, currentWeek = 1, completedWeeks = [], onWeekSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-8"
    >
      <h2 className="text-sm font-semibold text-foreground mb-6">Learning Timeline</h2>

      {/* Horizontal Timeline */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-3 min-w-min pb-4">
          {[...Array(weeks)].map((_, i) => {
            const weekNum = i + 1;
            const isCompleted = completedWeeks.includes(weekNum);
            const isCurrent = weekNum === currentWeek;
            const isLocked = weekNum > currentWeek && !isCompleted;

            return (
              <motion.button
                key={weekNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onWeekSelect && onWeekSelect(weekNum)}
                disabled={isLocked}
                className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center font-medium group cursor-pointer ${
                  isCompleted
                    ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : isCurrent
                    ? 'border-brand-500 bg-brand-500/10 text-foreground hover:bg-brand-500/20'
                    : isLocked
                    ? 'border-gray-600/30 bg-surface-700/50 text-gray-500 opacity-50 cursor-not-allowed'
                    : 'border-gray-600/30 bg-surface-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={20} className="mb-1" />
                ) : (
                  <Circle size={20} className="mb-1" />
                )}
                <span className="text-xs">Week {weekNum}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Progress</p>
          <p className="text-sm font-semibold text-foreground">
            {completedWeeks.length}/{weeks} weeks completed
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Current</p>
          <p className="text-sm font-semibold text-brand-300">Week {currentWeek}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Completion</p>
          <p className="text-sm font-semibold text-green-400">
            {Math.round((completedWeeks.length / weeks) * 100)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}
