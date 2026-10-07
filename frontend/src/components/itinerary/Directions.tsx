import { CornerDownRight } from 'lucide-react'
import { formatHours, formatMiles } from '../../lib/format'
import type { TripPlan } from '../../types/trip'

export function Directions({ plan }: { plan: TripPlan }) {
  const legs = [
    { title: 'To pickup', place: plan.locations.pickup.label },
    { title: 'To drop-off', place: plan.locations.dropoff.label },
  ]
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {legs.map(({ title, place }, leg) => {
        const steps = plan.route.instructions.filter((s) => s.leg === leg)
        const info = plan.route.legs[leg]
        return (
          <section key={leg} className="card">
            <div className="card-header">
              <h2 className="card-title">{title}</h2>
              <span className="card-sub truncate">{place}</span>
              <span className="ml-auto text-xs text-ink-2">
                {formatMiles(info.distance_miles)} · {formatHours(info.duration_hours)}
              </span>
            </div>
            {steps.length === 0 ? (
              <p className="px-4 py-3 text-ink-3">Already at this location.</p>
            ) : (
              <ol>
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 border-b border-line-soft px-4 py-2.5 last:border-0">
                    <CornerDownRight size={14} className="mt-0.5 shrink-0 text-brand" />
                    <span className="flex-1 text-ink-2">{s.text}</span>
                    {s.distance_miles > 0 && <span className="shrink-0 font-mono text-xs text-ink-3">{s.distance_miles} mi</span>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )
      })}
    </div>
  )
}
