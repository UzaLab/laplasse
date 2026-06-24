'use client'

interface AdminMiniChartProps {
  data: Array<{ day: string; count: number }>
  color?: string
  heightClass?: string
}

export function AdminMiniChart({
  data,
  color = '#7c3aed',
  heightClass = 'h-14',
}: AdminMiniChartProps) {
  if (data.length < 2) {
    return (
      <div className={`${heightClass} flex items-center justify-center text-xs text-slate-300`}>
        Pas assez de données
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.count), 1)
  const w = 280
  const h = 56
  const pad = 4

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - (d.count / max) * (h - pad * 2)
    return `${x},${y}`
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full ${heightClass}`}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const [x, y] = points[i].split(',').map(Number)
        return <circle key={d.day + i} cx={x} cy={y} r="2.5" fill={color} />
      })}
    </svg>
  )
}

/** Bar chart simplifié pour le dashboard admin */
export function AdminBarChart({
  data,
  color = '#7c3aed',
}: {
  data: Array<{ label: string; count: number }>
  color?: string
}) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-slate-300">
        Pas de données sur cette période
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="flex items-end gap-1.5 h-32 border-b border-slate-100 pb-0.5">
      {data.map((d, i) => {
        const pct = Math.max(4, (d.count / max) * 100)
        const highlight = i === data.length - 1
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className={`w-full rounded-t-sm transition-colors ${highlight ? '' : 'opacity-80'}`}
              style={{ height: `${pct}%`, backgroundColor: highlight ? color : `${color}33` }}
              title={`${d.count}`}
            />
          </div>
        )
      })}
    </div>
  )
}

export function formatChartDayLabels(data: Array<{ day: string; count: number }>) {
  return data.map(d => ({
    label: new Date(d.day).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
    count: d.count,
  }))
}
