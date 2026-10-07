import { formatHours, parseLocal } from '../../lib/format'
import { hoursFrom, type HosSnapshot } from '../../lib/hos'
import { ACTIVITY_META, STATUS_META } from '../../lib/status'
import type { TripPlan } from '../../types/trip'
import { StatusLane } from '../ui/StatusLane'

interface Props {
  plan: TripPlan
  hour: number
  snapshot: HosSnapshot
}

export function HosPanel({ plan, hour, snapshot: s }: Props) {
  const at = new Date(parseLocal(plan.summary.start).getTime() + hour * 36e5)
  const upcoming = plan.stops.filter((stop) => hoursFrom(plan, stop.arrival) > hour).slice(0, 3)
  const status = STATUS_META[s.entry.status]

  return (
    <div className="card flex flex-col">
      <div className="card-header">
        <h2 className="card-title">HOS clocks</h2>
        <span className="card-sub">at {at.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 px-3 pt-3.5 pb-1.5">
        <Ring value={s.untilBreak} max={8} label="Until break" warnBelow={1} />
        <Ring value={s.drive} max={11} label="Drive" warnBelow={2} />
        <Ring value={s.shift} max={14} label="Shift" warnBelow={2} />
        <Ring value={s.cycle} max={70} label="Cycle" warnBelow={10} />
      </div>
      <div className="mx-3.5 mt-1.5 mb-3.5 flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
        <StatusLane status={s.entry.status} size={1.5} />
        <div className="min-w-0">
          <div className="font-semibold">{s.entry.label}</div>
          <div className="truncate text-xs text-ink-3">
            {s.entry.status === 'driving' ? 'En route from ' : ''}
            {s.entry.location} · mile {Math.round(s.mile)}
          </div>
        </div>
        <span className="ml-auto shrink-0 rounded-[5px] px-2 py-0.5 text-[11px] font-semibold" style={{ color: status.color, background: `${status.color}1a` }}>
          {status.label}
        </span>
      </div>
      <div className="mt-auto border-t border-line-soft px-3.5 py-3">
        <h3 className="eyebrow mb-2">Upcoming stops</h3>
        {upcoming.length === 0 && <p className="text-xs text-ink-3">Trip complete.</p>}
        {upcoming.map((stop) => {
          const Icon = ACTIVITY_META[stop.type].icon
          const arrival = parseLocal(stop.arrival)
          return (
            <div key={stop.id} className="flex items-center gap-2.5 border-b border-dashed border-line-soft py-[7px] last:border-0">
              <div className="w-[62px] shrink-0 font-mono text-xs font-medium">
                {arrival.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                <div className="font-sans text-[11px] font-normal text-ink-3">{arrival.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              </div>
              <Icon size={16} className="shrink-0 text-ink-3" />
              <div className="min-w-0">
                <div className="truncate font-semibold">{stop.label}</div>
                <div className="truncate text-xs text-ink-3">{stop.location}</div>
              </div>
              <div className="ml-auto shrink-0 text-right text-xs text-ink-2">
                in {formatHours(hoursFrom(plan, stop.arrival) - hour)}
                <div className="text-[11px] text-ink-3">{formatHours(stop.duration_hours)} stop</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Ring({ value, max, label, warnBelow }: { value: number; max: number; label: string; warnBelow: number }) {
  const r = 34
  const length = 2 * Math.PI * r
  const share = Math.max(0, Math.min(1, value / max))
  const color = value <= 0 ? '#e5484d' : value < warnBelow ? '#cf7a00' : '#1f9d55'
  const minutes = Math.max(0, Math.round(value * 60))
  return (
    <div className="text-center">
      <svg width="92" height="92" viewBox="0 0 92 92" className="mx-auto block" role="img" aria-label={`${label}: ${formatHours(value)} left`}>
        <circle cx="46" cy="46" r={r} fill="none" stroke="#eef1f5" strokeWidth="8" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${length * share} ${length}`} transform="rotate(-90 46 46)" />
        <text x="46" y="51" textAnchor="middle" fontSize="17" fontWeight="700" fill="#0f1a2e">
          {Math.floor(minutes / 60)}:{String(minutes % 60).padStart(2, '0')}
        </text>
      </svg>
      <div className="mt-0.5 text-[11.5px] font-medium text-ink-2">{label}</div>
    </div>
  )
}
