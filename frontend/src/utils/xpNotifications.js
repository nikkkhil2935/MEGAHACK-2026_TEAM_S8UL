import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function showXPToast(amount, reason) {
  toast.success((t) => (
    <div className="flex items-center gap-2">
      <span className="text-lg">⭐</span>
      <div>
        <p className="font-semibold text-sm">+{amount} XP</p>
        <p className="text-xs text-gray-400">{reason}</p>
      </div>
    </div>
  ), {
    style: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    }
  });
}

export function useLevelUpNotification(gamState) {
  useEffect(() => {
    // Listen for level ups
    const checkLevelUp = () => {
      // This would be called when XP changes
      // The gamification store will handle this
    };
  }, [gamState]);
}
