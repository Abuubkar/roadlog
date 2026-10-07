import { BedDouble, Coffee, FileText, Fuel } from 'lucide-react'

const RULES = [
  { icon: FileText, title: '11 / 14-hour limits', text: 'Max 11 h driving inside a 14 h window, then 10 h off.' },
  { icon: Coffee, title: '30-minute break', text: 'Required after 8 cumulative hours behind the wheel.' },
  { icon: Fuel, title: 'Fuel every 1,000 mi', text: '30 min on-duty stop, planned along the route.' },
  { icon: BedDouble, title: '70 h / 8 days', text: 'Cycle tracked from your hours used; 34 h restart if needed.' },
]

export function EmptyState() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {RULES.map(({ icon: Icon, title, text }) => (
        <div key={title} className="card flex gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{text}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
