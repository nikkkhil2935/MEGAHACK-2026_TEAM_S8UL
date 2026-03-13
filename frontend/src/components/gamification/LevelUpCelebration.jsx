import { motion, AnimatePresence } from 'framer-motion'

export default function LevelUpCelebration({ show, level, xpGained, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div className="text-center pointer-events-auto">
            {/* Burst animation background */}
            <motion.div
              animate={{ scale: [1, 1.5, 2] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -inset-20 bg-gradient-to-r from-brand-500/20 to-orange-500/20 rounded-full blur-3xl"
            />

            {/* Level up card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.8, repeat: 2 }}
              className="relative bg-surface-700 border-2 border-brand-500 rounded-2xl p-8 max-w-sm"
            >
              <p className="text-sm text-gray-400 mb-2">LEVEL UP!</p>
              <p className="text-5xl font-bold mb-4">{level.emoji}</p>
              <h2 className="text-3xl font-display font-bold text-brand-300 mb-2">
                {level.name}
              </h2>
              <p className="text-gray-400 mb-4">+{xpGained} XP</p>

              {/* Confetti effect */}
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -40],
                      opacity: [1, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.1,
                      ease: 'easeOut',
                    }}
                    className="text-xl"
                  >
                    {'🎉🎊🌟✨💫'[i]}
                  </motion.div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="btn-primary text-sm"
              >
                Continue
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
