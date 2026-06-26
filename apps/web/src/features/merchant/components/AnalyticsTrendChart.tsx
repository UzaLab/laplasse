'use client'

import { useId, useMemo, useState } from 'react'

export interface ChartDayPoint {
  date: string
  count: number
}

interface Props {
  data: ChartDayPoint[]
  height?: number
  color?: string
  valueLabel?: string
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

export function AnalyticsTrendChart({
  data,
  height = 128,
  color = '#f59e0b',
  valueLabel = 'Événements',
}: Props) {
  const gradId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const layout = useMemo(() => {
    if (!data.length) return null

    const w = 100
    const h = height
    const padX = 2
    const padY = 6
    const maxVal = Math.max(...data.map(d => d.count), 1)

    const points = data.map((d, i) => ({
      ...d,
      index: i,
      x: padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2),
      y: h - padY - (d.count / maxVal) * (h - padY * 2),
      barW: (w - padX * 2) / data.length,
    }))

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`

    const labelStep = data.length <= 7 ? 1 : data.length <= 14 ? 2 : Math.ceil(data.length / 6)
    const xLabels = points.filter((_, i) => i === 0 || i === points.length - 1 || i % labelStep === 0)

    return { points, linePath, areaPath, maxVal, xLabels, w, h, padY }
  }, [data, height])

  if (!layout) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-2xl"
        style={{ height: height + 48 }}
      >
        Aucune donnée sur cette période
      </div>
    )
  }

  const active = hoverIndex != null ? layout.points[hoverIndex] : layout.points[layout.points.length - 1]
  const hasActivity = layout.points.some(p => p.count > 0)

  return (
    <div className="w-full select-none">
      <div className="flex items-end justify-between gap-3 mb-3 min-h-[44px]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {hoverIndex != null ? formatLongDate(active.date) : 'Total période'}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums leading-tight">
            {hoverIndex != null ? active.count : layout.points.reduce((s, p) => s + p.count, 0)}
            <span className="text-xs font-bold text-slate-400 ml-1.5">{valueLabel.toLowerCase()}</span>
          </p>
        </div>
        {hasActivity && active.count > 0 && (
          <div
            className="px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums"
            style={{ backgroundColor: `${color}18`, color }}
          >
            pic {layout.maxVal}
          </div>
        )}
      </div>

      <div
        className="relative"
        style={{ height: height + 28 }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${layout.w} ${layout.h}`}
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map(ratio => {
            const y = layout.h - layout.padY - ratio * (layout.h - layout.padY * 2)
            return (
              <line
                key={ratio}
                x1={0}
                y1={y}
                x2={layout.w}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="0.35"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {layout.points.map(p => {
            const barH = (p.count / layout.maxVal) * (layout.h - layout.padY * 2)
            return (
              <rect
                key={`bar-${p.date}`}
                x={p.x - p.barW * 0.35}
                y={layout.h - layout.padY - barH}
                width={p.barW * 0.7}
                height={barH}
                fill={color}
                opacity={hoverIndex === p.index ? 0.22 : 0.08}
                rx="0.5"
              />
            )
          })}

          <path d={layout.areaPath} fill={`url(#${gradId})`} />
          <path
            d={layout.linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {layout.points.map(p => (
            <circle
              key={`dot-${p.date}`}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === p.index ? 2.8 : p.count > 0 ? 1.8 : 0}
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex" style={{ height }}>
          {layout.points.map((p, i) => (
            <button
              key={`hit-${p.date}`}
              type="button"
              aria-label={`${formatLongDate(p.date)} : ${p.count}`}
              className="flex-1 h-full cursor-crosshair bg-transparent border-0 p-0"
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
            />
          ))}
        </div>

        <div className="relative mt-1" style={{ height: 20 }}>
          {layout.xLabels.map(p => (
            <span
              key={p.date}
              className="absolute text-[9px] text-slate-400 font-medium -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${p.x}%` }}
            >
              {formatShortDate(p.date)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
