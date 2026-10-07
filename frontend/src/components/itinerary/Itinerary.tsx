import { CornerDownRight, ListOrdered, Signpost } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatHours, formatMiles, formatShortDate, formatTime } from '../../lib/format'
import { ACTIVITY_META, STATUS_META } from '../../lib/status'
import type { TimelineEntry, TripPlan } from '../../types/trip'

type Tab = 'itinerary' | 'directions'

export function Itinerary({ plan }: { plan: TripPlan }) {
  const [tab, setTab] = useState<Tab>('itinerary')
  return (
    <section className="card flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
        <h2 className="section-title">Route plan</h2>
        <div className="flex rounded-lg bg-ink-100 p-0.5 text-xs font-semibold">
          {(['itinerary', 'directions'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 capitalize transition ${tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {t === 'itinerary' ? <ListOrdered size={13} /> : <Signpost size={13} />} {t}
            </button>
          ))}
        </div>
      </header>
      <div className="max-h-[640px] overflow-y-auto px-5 py-4">
        {tab === 'itinerary' ? <Timeline entries={plan.timeline} /> : <Directions plan={plan} />}
      </div>
    </section>
  )
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const days = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>()
    for (const e of entries) {
      const key = e.start.slice(0, 10)
      groups.set(key, [...(groups.get(key) ?? []), e])
    }
    return [...groups.entries()]
  }, [entries])

  return (
    <ol className="flex flex-col gap-5">
      {days.map(([day, items], i) => (
        <li key={day}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            <span className="rounded-md bg-ink-900 px-1.5 py-0.5 text-[10px] text-white">Day {i + 1}</span>
            {formatShortDate(day)}
          </div>
          <ol className="relative ml-3 border-l-2 border-ink-100">
            {items.map((e) => (
              <TimelineItem key={`${e.start}-${e.type}`} entry={e} />
            ))}
          </ol>
        </li>
      ))}
    </ol>
  )
}

function TimelineItem({ entry: e }: { entry: TimelineEntry }) {
  const { icon: Icon, tone } = ACTIVITY_META[e.type]
  const isDrive = e.type === 'drive'
  return (
    <li className="relative pb-3 pl-6 last:pb-0">
      <span
        className="absolute top-0.5 -left-[13px] grid size-6 place-items-center rounded-full ring-4 ring-white"
        style={{ background: isDrive ? 'white' : tone, border: isDrive ? `2px solid ${tone}` : undefined }}
      >
        <Icon size={12} color={isDrive ? tone : 'white'} strokeWidth={2.5} />
      </span>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`text-sm ${isDrive ? 'text-ink-600' : 'font-semibold text-ink-900'}`}>
          {isDrive ? `Drive ${formatMiles(e.end_mile - e.start_mile)}` : e.label}
        </p>
        <span className="shrink-0 font-mono text-xs text-ink-500">
          {formatTime(e.start)} – {formatTime(e.end)}
        </span>
      </div>
      <p className="text-xs text-ink-500">
        {isDrive ? `from ${e.location}` : e.location} · {formatHours(e.duration_hours)}
        <span className="ml-1.5 rounded px-1 py-px text-[10px] font-semibold uppercase" style={{ color: STATUS_META[e.status].color, background: 'var(--color-ink-50)' }}>
          {STATUS_META[e.status].short}
        </span>
      </p>
    </li>
  )
}

function Directions({ plan }: { plan: TripPlan }) {
  const legs = [
    { title: `To pickup · ${plan.locations.pickup.label}`, leg: 0 },
    { title: `To drop-off · ${plan.locations.dropoff.label}`, leg: 1 },
  ]
  return (
    <div className="flex flex-col gap-5">
      {legs.map(({ title, leg }) => {
        const steps = plan.route.instructions.filter((s) => s.leg === leg)
        const info = plan.route.legs[leg]
        return (
          <div key={leg}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-ink-900">{title}</h3>
              <span className="shrink-0 text-xs text-ink-500">
                {formatMiles(info.distance_miles)} · {formatHours(info.duration_hours)}
              </span>
            </div>
            {steps.length === 0 ? (
              <p className="text-xs text-ink-500">Already at this location.</p>
            ) : (
              <ol className="divide-y divide-ink-100 rounded-xl border border-ink-100">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 px-3 py-2 text-sm">
                    <CornerDownRight size={14} className="mt-0.5 shrink-0 text-brand-500" />
                    <span className="flex-1 text-ink-700">{s.text}</span>
                    {s.distance_miles > 0 && <span className="shrink-0 font-mono text-xs text-ink-400">{s.distance_miles} mi</span>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )
      })}
    </div>
  )
}
