'use client'

import { useMemo } from 'react'

interface DayData { date: string; count: number }

interface Props {
  data: DayData[]
  height?: number
  color?: string
}

export function AnalyticsChart({ data, height = 64, color = '#f59e0b' }: Props) {
  const { points, areaPath, maxVal, labels } = useMemo(() => {
    if (!data.length) return { points: [], areaPath: '', maxVal: 0, labels: [] }

    const w = 100
    const h = height
    const pad = 4
    const maxVal = Math.max(...data.map(d => d.count), 1)

    const pts = data.map((d, i) => ({
      x: pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2),
      y: h - pad - (d.count / maxVal) * (h - pad * 2),
      ...d,
    }))

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`

    // Labels: show first, middle, last dates
    const labelIndices = new Set([0, Math.floor(data.length / 2), data.length - 1])
    const labels = pts
      .filter((_, i) => labelIndices.has(i))
      .map(p => ({
        x: p.x,
        date: new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      }))

    return { points: pts, areaPath, maxVal, labels }
  }, [data, height])

  if (!data.length) return null

  return (
    <div className="w-full" style={{ height: height + 24 }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area */}
        <path d={areaPath} fill="url(#chartGrad)" />
        {/* Line */}
        <path
          d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Dots on hover zones — last point */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="2"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* X-axis labels */}
      <div className="relative" style={{ height: 20 }}>
        {labels.map(l => (
          <span
            key={l.date}
            className="absolute text-[9px] text-slate-400 font-medium -translate-x-1/2"
            style={{ left: `${l.x}%` }}
          >
            {l.date}
          </span>
        ))}
      </div>
    </div>
  )
}
