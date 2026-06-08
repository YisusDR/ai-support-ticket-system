'use client'

interface DataPoint {
  label: string
  created: number
  resolved: number
}

interface ActivityChartProps {
  data: DataPoint[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const W = 700
  const H = 180
  const PAD = { top: 16, right: 24, bottom: 36, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.flatMap((d) => [d.created, d.resolved]), 1)
  // Snap to clean grid ceiling
  const gridMax = Math.ceil(maxVal / 2) * 2 || 4
  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW
  const toX = (i: number) => PAD.left + (data.length > 1 ? i * xStep : chartW / 2)
  const toY = (v: number) => PAD.top + chartH - (v / gridMax) * chartH

  const polyline = (key: 'created' | 'resolved') =>
    data.map((d, i) => `${toX(i)},${toY(d[key])}`).join(' ')

  const area = (key: 'created' | 'resolved') => {
    const pts = data.map((d, i) => `${toX(i)},${toY(d[key])}`).join(' ')
    const last = `${toX(data.length - 1)},${PAD.top + chartH}`
    const first = `${toX(0)},${PAD.top + chartH}`
    return `${pts} ${last} ${first}`
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        aria-label="Ticket activity chart"
      >
        <defs>
          <linearGradient id="grad-created" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-resolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((ratio) => {
          const y = PAD.top + chartH - ratio * chartH
          const val = Math.round(ratio * gridMax)
          return (
            <g key={ratio}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
                fontFamily="Inter, sans-serif"
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Area fills */}
        {data.length > 1 && (
          <>
            <polygon points={area('created')} fill="url(#grad-created)" />
            <polygon points={area('resolved')} fill="url(#grad-resolved)" />
          </>
        )}

        {/* Lines */}
        {data.length > 1 && (
          <>
            <polyline
              points={polyline('created')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline
              points={polyline('resolved')}
              fill="none"
              stroke="#059669"
              strokeWidth="2"
              strokeDasharray="5 3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.created)} r="3.5" fill="#10b981" />
            <circle cx={toX(i)} cy={toY(d.resolved)} r="3.5" fill="#059669" stroke="white" strokeWidth="1.5" />
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={toX(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill="#94a3b8"
            fontFamily="Inter, sans-serif"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
