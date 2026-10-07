import { formatDateTime, formatHours } from '../../lib/format'
import { ACTIVITY_META } from '../../lib/status'
import type { TripPlan } from '../../types/trip'

export function StopsTable({ plan }: { plan: TripPlan }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Stops</h2>
        <span className="card-sub">{plan.stops.length} planned stops, in order</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-[#fafbfc] text-left">
              {['Stop', 'Location', 'Arrive', 'Depart', 'Duration', 'Mile'].map((h) => (
                <th key={h} className="eyebrow border-b border-line-soft px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.stops.map((s) => {
              const { icon: Icon, color } = ACTIVITY_META[s.type]
              return (
                <tr key={s.id} className="text-ink-2 hover:bg-[#fafbfc]">
                  <td className="border-b border-line-soft px-4 py-2.5">
                    <span className="inline-flex items-center gap-2.5 font-medium text-ink">
                      <Icon size={16} style={{ color }} />
                      {s.label}
                    </span>
                  </td>
                  <td className="border-b border-line-soft px-4 py-2.5 font-semibold text-ink">{s.location}</td>
                  <td className="border-b border-line-soft px-4 py-2.5">{formatDateTime(s.arrival)}</td>
                  <td className="border-b border-line-soft px-4 py-2.5">{formatDateTime(s.departure)}</td>
                  <td className="border-b border-line-soft px-4 py-2.5">{formatHours(s.duration_hours)}</td>
                  <td className="border-b border-line-soft px-4 py-2.5 font-mono">{Math.round(s.mile).toLocaleString('en-US')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
