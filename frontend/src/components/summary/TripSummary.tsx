import { CalendarDays, Clock, Fuel, Gauge, Milestone, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatDateTime, formatHours, formatMiles } from '../../lib/format'
import type { TripPlan } from '../../types/trip'

export function TripSummary({ plan }: { plan: TripPlan }) {
  const { summary, logs } = plan
  const cycleEnd = logs.at(-1)?.recap.cycle_used ?? summary.cycle_used_start
  const stats: { icon: LucideIcon; label: string; value: string; hint: string }[] = [
    { icon: Milestone, label: 'Distance', value: formatMiles(summary.total_miles), hint: `${plan.route.legs[0].distance_miles} mi to pickup` },
    { icon: Clock, label: 'Trip duration', value: formatHours(summary.total_hours), hint: `Arrive ${formatDateTime(summary.end)}` },
    { icon: Timer, label: 'Driving time', value: formatHours(summary.driving_hours), hint: `${formatHours(summary.on_duty_hours)} on duty total` },
    { icon: CalendarDays, label: 'Log sheets', value: String(logs.length), hint: `${summary.rests} × 10-hr rest${summary.restarts ? ` · ${summary.restarts} × 34-hr restart` : ''}` },
    { icon: Fuel, label: 'Stops', value: String(summary.fuel_stops + summary.breaks + summary.rests + summary.restarts + 2), hint: `${summary.fuel_stops} fuel · ${summary.breaks} breaks · pickup & drop` },
    { icon: Gauge, label: 'Cycle at arrival', value: `${cycleEnd} h`, hint: `${Math.max(70 - cycleEnd, 0).toFixed(2).replace(/\.?0+$/, '')} h left of 70` },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {stats.map(({ icon: Icon, label, value, hint }) => (
        <div key={label} className="card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            <Icon size={14} className="text-brand-500" /> {label}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-ink-900">{value}</div>
          <div className="mt-0.5 truncate text-xs text-ink-500" title={hint}>
            {hint}
          </div>
        </div>
      ))}
    </section>
  )
}
