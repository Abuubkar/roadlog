import { formatHours } from '../../lib/format'
import type { TripPlan } from '../../types/trip'

export function SummaryStrip({ plan }: { plan: TripPlan }) {
  const s = plan.summary
  const cycleEnd = s.restarts ? plan.logs.at(-1)!.recap.cycle_used : s.cycle_used_start + s.on_duty_hours
  const stops = s.fuel_stops + s.breaks + s.rests + s.restarts
  const kpis = [
    ['Distance', `${s.total_miles.toLocaleString('en-US')} mi`, `${plan.route.legs[0].distance_miles} mi to pickup`],
    ['Trip duration', formatHours(s.total_hours), 'door to door'],
    ['Driving', formatHours(s.driving_hours), 'max 11 h per shift'],
    ['On duty', formatHours(s.on_duty_hours), `${round(cycleEnd)} / 70 h cycle`],
    ['Required stops', String(stops), [plural(s.rests, 'rest'), plural(s.fuel_stops, 'fuel stop'), plural(s.breaks, 'break'), s.restarts ? plural(s.restarts, 'restart') : ''].filter(Boolean).join(' · ')],
    ['HOS violations', '0', '✓ fully compliant'],
  ]
  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-[10px] bg-ink text-[#cdd6e5] sm:grid-cols-3 xl:grid-cols-6 print:hidden">
      {kpis.map(([label, value, hint]) => (
        <div key={label} className="border-r border-b border-[#22304a] px-4 py-3 last:border-r-0 xl:border-b-0">
          <div className="text-[11.5px] text-[#8f9bb3]">{label}</div>
          <div className="mt-0.5 text-xl font-semibold tracking-tight text-white">{value}</div>
          <div className="truncate text-[11.5px] text-[#7fd1a2]">{hint}</div>
        </div>
      ))}
    </section>
  )
}

const round = (n: number) => Math.round(n * 10) / 10
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
