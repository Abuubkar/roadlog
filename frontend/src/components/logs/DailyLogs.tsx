import { CircleCheck, CircleDashed, Download } from 'lucide-react'
import { useState } from 'react'
import { formatHours, formatShortDate } from '../../lib/format'
import { DUTY_STATUSES, STATUS_META } from '../../lib/status'
import type { DailyLog, LogDetails, TripPlan } from '../../types/trip'
import { Segmented } from '../ui/Segmented'
import { StatusLane } from '../ui/StatusLane'
import { DailyLogSheet } from './DailyLogSheet'
import { LogGraph } from './LogGraph'

type View = 'graph' | 'paper'

const clock = (h: number) => {
  const m = Math.round(h * 60)
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

export function DailyLogs({ plan, details }: { plan: TripPlan; details: LogDetails }) {
  const [day, setDay] = useState(0)
  const [view, setView] = useState<View>('graph')
  const log = plan.logs[day]

  return (
    <section className="card print:hidden">
      <div className="card-header">
        <h2 className="card-title">Daily logs</h2>
        <span className="card-sub">Record of duty status · home-terminal time</span>
        <div className="ml-auto flex items-center gap-2">
          <Segmented value={view} onChange={setView} options={[{ value: 'graph', label: 'Graph' }, { value: 'paper', label: 'Paper form' }]} />
          <button className="btn" onClick={() => window.print()}>
            <Download size={15} /> PDF
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-line-soft px-4 py-3" role="tablist" aria-label="Log days">
        {plan.logs.map((l, i) => (
          <button
            key={l.date}
            role="tab"
            aria-selected={i === day}
            onClick={() => setDay(i)}
            className={`min-w-[140px] shrink-0 rounded-lg border px-3 py-[7px] text-left transition ${i === day ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-ink-3/40'}`}
          >
            <span className={`block text-[12.5px] font-semibold ${i === day ? 'text-brand-ink' : ''}`}>
              Day {l.day} · {formatShortDate(l.date)}
            </span>
            <span className="text-xs text-ink-3">
              {Math.round(l.total_miles)} mi · {formatHours(l.totals.driving)} driving
            </span>
          </button>
        ))}
      </div>

      {view === 'paper' ? (
        <div className="overflow-x-auto p-4">
          <div className="min-w-[760px] overflow-hidden rounded-lg border border-line">
            <DailyLogSheet log={log} details={details} />
          </div>
        </div>
      ) : (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <LogGraph log={log} />
            <EventsTable plan={plan} log={log} />
          </div>
          <LogAside log={log} details={details} />
        </div>
      )}
    </section>
  )
}

function EventsTable({ plan, log }: { plan: TripPlan; log: DailyLog }) {
  const events = plan.timeline.filter((e) => e.start.slice(0, 10) === log.date)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr className="bg-[#fafbfc] text-left">
            {['Status', 'Start', 'Duration', 'Location', 'Notes'].map((h) => (
              <th key={h} className="eyebrow border-b border-line-soft px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const status = STATUS_META[e.status]
            return (
              <tr key={e.start + e.type} className="text-ink-2 hover:bg-[#fafbfc]" style={{ boxShadow: `inset 3px 0 0 ${status.color}` }}>
                <td className="border-b border-line-soft px-4 py-2.5 align-middle">
                  <span className="flex items-center gap-2.5 font-medium text-ink">
                    <StatusLane status={e.status} />
                    {status.label}
                  </span>
                </td>
                <td className="border-b border-line-soft px-4 py-2.5 font-mono">{e.start.slice(11)}</td>
                <td className="border-b border-line-soft px-4 py-2.5">{formatHours(e.duration_hours)}</td>
                <td className="border-b border-line-soft px-4 py-2.5 font-semibold text-ink">{e.location}</td>
                <td className="border-b border-line-soft px-4 py-2.5">{e.type === 'drive' ? `${Math.round(e.end_mile - e.start_mile)} mi` : e.label}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LogAside({ log, details }: { log: DailyLog; details: LogDetails }) {
  const { recap } = log
  const checks: [string, boolean][] = [
    ['Date and 24-hour period', true],
    [`Total miles driving · ${Math.round(log.total_miles)}`, true],
    ['Remarks at every status change', log.remarks.length > 0],
    ['Totals equal 24 hours', Math.abs(Object.values(log.totals).reduce((a, b) => a + b, 0) - 24) < 0.02],
    ['Carrier and vehicle numbers', Boolean(details.carrier && details.vehicles)],
    ['Driver signature', Boolean(details.driverName)],
  ]
  return (
    <aside className="flex flex-col gap-4 border-t border-line-soft p-4 xl:border-t-0 xl:border-l">
      <div>
        <h3 className="eyebrow mb-1">Day totals</h3>
        {DUTY_STATUSES.map((s) => (
          <Row key={s.key} label={s.label} value={clock(log.totals[s.key])} mono />
        ))}
        <div className="mt-1 border-t border-line-soft pt-1">
          <Row label="Total" value="24:00" mono />
        </div>
      </div>
      <div>
        <h3 className="eyebrow mb-1">70-hour recap</h3>
        <Row label="On duty today" value={`${recap.on_duty_today} h`} />
        <Row label="Cycle used (A)" value={`${recap.cycle_used} h`} />
        <Row label="Available tomorrow (B)" value={`${recap.available_tomorrow} h`} />
        <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-line-soft">
          <div className="h-full bg-brand" style={{ width: `${Math.min(100, (recap.cycle_used / 70) * 100)}%` }} />
        </div>
      </div>
      <div>
        <h3 className="eyebrow mb-1">Form and manner</h3>
        {checks.map(([label, ok]) => (
          <div key={label} className="flex items-center gap-2 py-1 text-ink-2">
            {ok ? <CircleCheck size={16} className="text-ok" /> : <CircleDashed size={16} className="text-warn" />}
            {label}
          </div>
        ))}
      </div>
    </aside>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-[5px] text-ink-2">
      <span>{label}</span>
      <b className={`font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</b>
    </div>
  )
}
