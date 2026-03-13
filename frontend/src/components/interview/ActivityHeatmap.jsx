import { useMemo, useState } from 'react'

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getColor(count, avgScore) {
  if (!count) return 'bg-surface-700'
  if (avgScore >= 75) return count >= 3 ? 'bg-green-400' : count >= 2 ? 'bg-green-500' : 'bg-green-600'
  if (avgScore >= 50) return count >= 3 ? 'bg-yellow-400' : count >= 2 ? 'bg-yellow-500' : 'bg-yellow-600'
  return count >= 3 ? 'bg-red-400' : count >= 2 ? 'bg-red-500' : 'bg-red-600'
}

export default function ActivityHeatmap({ heatmap = {} }) {
  const [tooltip, setTooltip] = useState(null)

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364) // 52 weeks back
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const weeks = []
    const monthLabels = []
    let currentDate = new Date(startDate)
    let lastMonth = -1

    for (let w = 0; w < 53; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const entry = heatmap[dateStr]
        week.push({
          date: dateStr,
          count: entry?.count || 0,
          avgScore: entry?.avgScore || 0,
          isToday: dateStr === today.toISOString().split('T')[0],
        })

        // Track month labels
        if (d === 0 && currentDate.getMonth() !== lastMonth) {
          monthLabels.push({ week: w, label: MONTH_NAMES[currentDate.getMonth()] })
          lastMonth = currentDate.getMonth()
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeks.push(week)
    }

    return { weeks, monthLabels }
  }, [heatmap])

  const totalInterviews = Object.values(heatmap).reduce((sum, v) => sum + v.count, 0)
  const activeDays = Object.keys(heatmap).length

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-semibold text-sm">Interview Activity</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{totalInterviews} interviews</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {monthLabels.map((m, i) => (
              <div key={i} className="text-[10px] text-gray-500" style={{ position: 'relative', left: `${m.week * 14}px` }}>
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1 justify-start">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="text-[9px] text-gray-500 h-[12px] flex items-center">{label}</div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`w-[12px] h-[12px] rounded-[2px] cursor-pointer transition-all hover:ring-1 hover:ring-foreground/30 ${
                        day.isToday ? 'ring-1 ring-brand-500' : ''
                      } ${getColor(day.count, day.avgScore)}`}
                      onMouseEnter={() => setTooltip(day)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 ml-8">
            <span className="text-[10px] text-gray-500">Less</span>
            <div className="w-[12px] h-[12px] rounded-[2px] bg-surface-700" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-green-600" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-green-500" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-green-400" />
            <span className="text-[10px] text-gray-500">More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.count > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          <strong className="text-foreground">{tooltip.date}</strong>: {tooltip.count} interview{tooltip.count > 1 ? 's' : ''}, avg score {tooltip.avgScore}
        </div>
      )}
    </div>
  )
}
