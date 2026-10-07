import { useElementWidth } from '../../hooks/useElementWidth'
import { DUTY_STATUSES, STATUS_COLOR } from '../../lib/status'
import type { DailyLog, DutyStatus } from '../../types/trip'

const LABEL_W = 92
const TOTAL_W = 58
const LANE_H = 34
const TOP = 20
const LANE_INDEX = Object.fromEntries(DUTY_STATUSES.map((s, i) => [s.key, i])) as Record<DutyStatus, number>

const clock = (h: number) => {
  const m = Math.round(h * 60)
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

/** Modern ELD-style log graph for one day: 15-minute grid, coloured status lines, daily totals. */
export function LogGraph({ log }: { log: DailyLog }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const w = Math.max(0, width - LABEL_W - TOTAL_W)
  const X = (h: number) => LABEL_W + (h / 24) * w
  const y = (s: DutyStatus) => TOP + LANE_INDEX[s] * LANE_H + LANE_H / 2
  const path = log.segments.map((s, i) => `${i ? 'L' : 'M'}${X(s.start)},${y(s.status)} H${X(s.end)}`).join(' ')

  return (
    <div ref={ref} className="px-4 pt-3 pb-1">
      {width > 0 && (
        <svg width="100%" viewBox={`0 0 ${width} ${TOP + LANE_H * 4 + 4}`} className="block" role="img" aria-label={`Duty status graph for ${log.date}`}>
          {Array.from({ length: 25 }, (_, h) => (
            <g key={h}>
              <text x={X(h)} y={12} textAnchor="middle" fontSize="10.5" fill="#7a869c">
                {h % 24 === 0 ? 'M' : h === 12 ? 'N' : h % 12}
              </text>
              <line x1={X(h)} y1={TOP} x2={X(h)} y2={TOP + LANE_H * 4} stroke={h % 6 === 0 ? '#c9d1dd' : '#e8ecf2'} />
              {h < 24 &&
                [0.25, 0.5, 0.75].map((q) => <line key={q} x1={X(h + q)} y1={TOP} x2={X(h + q)} y2={TOP + (q === 0.5 ? 10 : 6)} stroke="#d5dbe5" />)}
            </g>
          ))}
          <text x={width - 6} y={12} textAnchor="end" fontSize="10.5" fill="#7a869c">
            Total
          </text>
          {DUTY_STATUSES.map((s, i) => (
            <g key={s.key}>
              <rect x={LABEL_W} y={TOP + i * LANE_H} width={w} height={LANE_H} fill={i % 2 ? '#fafbfc' : '#fff'} stroke="#e3e7ee" />
              <rect x={0} y={TOP + i * LANE_H + 9} width={16} height={16} rx={4} fill={s.color} />
              <text x={22} y={TOP + i * LANE_H + 21} fontSize="11.5" fontWeight="600" fill="#44526b">
                {s.label}
              </text>
              <text x={width - 6} y={TOP + i * LANE_H + 22} textAnchor="end" fontSize="13" fontWeight="600" fill="#0f1a2e" fontFamily="IBM Plex Mono, monospace">
                {clock(log.totals[s.key])}
              </text>
            </g>
          ))}
          <path d={path} fill="none" stroke="#0f1a2e" strokeWidth={1.5} />
          {log.segments.map((s, i) => (
            <line key={i} x1={X(s.start)} y1={y(s.status)} x2={X(s.end)} y2={y(s.status)} stroke={STATUS_COLOR[s.status]} strokeWidth={4} strokeLinecap="round" />
          ))}
        </svg>
      )}
    </div>
  )
}
