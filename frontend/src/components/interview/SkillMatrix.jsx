const SKILL_LABELS = {
  technical: 'Technical',
  behavioral: 'Behavioral',
  communication: 'Communication',
  problem_solving: 'Problem Solving',
  culture_fit: 'Culture Fit',
}

function scoreColor(s) {
  if (s >= 75) return 'bg-green-500/20 text-green-300'
  if (s >= 50) return 'bg-yellow-500/20 text-yellow-300'
  return 'bg-red-500/20 text-red-300'
}

export default function SkillMatrix({ skillMatrix = {} }) {
  // Get the last 10 sessions worth of data
  const skills = Object.keys(SKILL_LABELS)
  const maxCols = 10

  // Find the max length across all skills to determine column count
  const colCount = Math.min(maxCols, Math.max(...skills.map(k => (skillMatrix[k] || []).length), 1))

  if (colCount === 0 || skills.every(k => (skillMatrix[k] || []).length === 0)) {
    return (
      <div className="glass-card p-5 text-center">
        <p className="text-gray-400 text-sm">Complete more interviews to see your skill progression matrix.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-foreground font-semibold text-sm mb-4">Skill Performance Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-gray-500 font-medium pb-2 pr-4 min-w-[120px]">Skill</th>
              {Array.from({ length: colCount }).map((_, i) => (
                <th key={i} className="text-center text-gray-500 font-medium pb-2 px-1 min-w-[40px]">
                  #{i + 1}
                </th>
              ))}
              <th className="text-center text-gray-500 font-medium pb-2 px-2 min-w-[50px]">Avg</th>
            </tr>
          </thead>
          <tbody>
            {skills.map(skill => {
              const entries = (skillMatrix[skill] || []).slice(-maxCols)
              const avg = entries.length
                ? Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length)
                : 0
              return (
                <tr key={skill} className="border-t border-white/5">
                  <td className="py-2 pr-4 text-gray-300 font-medium">{SKILL_LABELS[skill]}</td>
                  {Array.from({ length: colCount }).map((_, i) => {
                    const entry = entries[i]
                    return (
                      <td key={i} className="py-2 px-1 text-center">
                        {entry ? (
                          <span className={`inline-block w-8 py-0.5 rounded text-[10px] font-bold ${scoreColor(entry.score)}`}>
                            {entry.score}
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block w-8 py-0.5 rounded text-[10px] font-bold ${avg ? scoreColor(avg) : 'text-gray-700'}`}>
                      {avg || '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
