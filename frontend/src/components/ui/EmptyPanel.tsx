import { BedDouble, Coffee, Fuel, Timer } from 'lucide-react'

const RULES = [
  { icon: Timer, title: '11 h driving · 14 h window', text: 'A 10-hour rest is scheduled before either limit is hit.' },
  { icon: Coffee, title: '30-minute break', text: 'Taken after 8 cumulative hours of driving.' },
  { icon: Fuel, title: 'Fuel every 1,000 miles', text: '30 minutes on duty, placed along the route.' },
  { icon: BedDouble, title: '70 h / 8-day cycle', text: 'A 34-hour restart is added when the cycle runs out.' },
]

export function EmptyPanel() {
  return (
    <div className="card flex flex-col">
      <div className="card-header">
        <h2 className="card-title">How trips are planned</h2>
      </div>
      <ul className="flex-1">
        {RULES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 border-b border-line-soft px-4 py-3.5 last:border-0">
            <Icon size={18} className="mt-0.5 shrink-0 text-ink-3" />
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-ink-3">{text}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="border-t border-line-soft px-4 py-3 text-xs text-ink-3">
        Property-carrying driver · FMCSA 49 CFR Part 395 · 1 hour each for pickup and drop-off.
      </p>
    </div>
  )
}
