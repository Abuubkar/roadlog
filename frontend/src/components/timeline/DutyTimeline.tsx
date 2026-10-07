import { useRef } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { parseLocal } from '../../lib/format'
import { spans } from '../../lib/hos'
import { DUTY_STATUSES, STATUS_COLOR } from '../../lib/status'
import type { DutyStatus, TripPlan } from '../../types/trip'

const LANE_H = 26
const TOP = 22
const LABEL_W = 70
const LANE_INDEX = Object.fromEntries(DUTY_STATUSES.map((s, i) => [s.key, i])) as Record<DutyStatus, number>

interface Props {
  plan: TripPlan
  hour: number
  onScrub: (hour: number) => void
}

/** Whole-trip duty status graph; click or drag to move the playhead. */
export function DutyTimeline({ plan, hour, onScrub }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const dragging = useRef(false)
  const t0 = parseLocal(plan.summary.start)
  const total = plan.summary.total_hours
  const start = -(t0.getHours() + t0.getMinutes() / 60)
  const days = Math.ceil((total - start) / 24)
  const span = days * 24
  const w = Math.max(0, width - LABEL_W - 8)
  const X = (h: number) => LABEL_W + ((h - start) / span) * w
  const segments = [{ status: 'off_duty' as DutyStatus, a: start, b: 0 }, ...spans(plan), { status: 'off_duty' as DutyStatus, a: total, b: start + span }]
  const height = TOP + LANE_H * 4 + 28

  const scrub = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    onScrub(Math.max(0, Math.min(total, start + ((clientX - rect.left - LABEL_W) / w) * span)))
  }

  const path = segments.map((s, i) => `${i ? 'L' : 'M'}${X(s.a)},${TOP + LANE_INDEX[s.status] * LANE_H + LANE_H / 2} H${X(s.b)}`).join(' ')
  const px = X(hour)
  const clock = new Date(t0.getTime() + hour * 36e5).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <section className="card print:hidden">
      <div className="card-header">
        <h2 className="card-title">Duty status timeline</h2>
        <span className="card-sub">Click or drag to scrub through the trip</span>
        <div className="ml-auto flex flex-wrap gap-3.5 text-xs text-ink-2">
          {DUTY_STATUSES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <i className="size-2.5 rounded-[2px]" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={ref}
        className="cursor-crosshair touch-none px-4 pt-2.5 pb-3 select-none"
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          scrub(e.clientX, e.currentTarget)
        }}
        onPointerMove={(e) => dragging.current && scrub(e.clientX, e.currentTarget)}
        onPointerUp={() => (dragging.current = false)}
        role="slider"
        aria-label="Trip time"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.round(hour * 10) / 10}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onScrub(Math.min(total, hour + 0.25))
          if (e.key === 'ArrowLeft') onScrub(Math.max(0, hour - 0.25))
        }}
      >
        {width > 0 && (
          <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block overflow-visible">
            {Array.from({ length: days + 1 }, (_, d) => {
              const x = X(start + d * 24)
              const date = new Date(t0.getTime() + (start + d * 24) * 36e5)
              return (
                <g key={d}>
                  <line x1={x} y1={10} x2={x} y2={TOP + LANE_H * 4} stroke="#d5dbe5" />
                  {d < days && (
                    <text x={x + 6} y={12} fontSize="11" fontWeight="600" fill="#44526b">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </text>
                  )}
                  {d < days &&
                    [6, 12, 18].map((q) => <line key={q} x1={X(start + d * 24 + q)} y1={TOP} x2={X(start + d * 24 + q)} y2={TOP + LANE_H * 4} stroke="#eef1f5" />)}
                </g>
              )
            })}
            {DUTY_STATUSES.map((s, i) => (
              <g key={s.key}>
                <rect x={LABEL_W} y={TOP + i * LANE_H} width={w} height={LANE_H} fill="none" stroke="#eef1f5" />
                <text x={0} y={TOP + i * LANE_H + 17} fontSize="11" fontWeight="600" fill="#7a869c">
                  {s.short}
                </text>
              </g>
            ))}
            {segments.map((s, i) => (
              <rect
                key={i}
                x={X(s.a)}
                y={TOP + LANE_INDEX[s.status] * LANE_H + 5}
                width={Math.max(1, X(s.b) - X(s.a))}
                height={LANE_H - 10}
                rx={3}
                fill={STATUS_COLOR[s.status]}
                opacity={0.9}
              />
            ))}
            <path d={path} fill="none" stroke="#0f1a2e" strokeWidth={1.2} opacity={0.5} />
            <line x1={px} y1={TOP - 6} x2={px} y2={TOP + LANE_H * 4 + 4} stroke="#0c66e4" strokeWidth={2} />
            <circle cx={px} cy={TOP - 6} r={5} fill="#0c66e4" />
            <rect x={px - 34} y={TOP + LANE_H * 4 + 6} width={68} height={18} rx={4} fill="#0c66e4" />
            <text x={px} y={TOP + LANE_H * 4 + 19} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
              {clock}
            </text>
          </svg>
        )}
      </div>
    </section>
  )
}
