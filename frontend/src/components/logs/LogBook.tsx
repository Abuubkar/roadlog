import { ChevronLeft, ChevronRight, FileText, Printer } from 'lucide-react'
import { useState } from 'react'
import { formatHours, formatLongDate, formatMiles, formatShortDate } from '../../lib/format'
import { DUTY_STATUSES } from '../../lib/status'
import type { DailyLog, LogDetails } from '../../types/trip'
import { DailyLogSheet } from './DailyLogSheet'

export function LogBook({ logs, details }: { logs: DailyLog[]; details: LogDetails }) {
  const [active, setActive] = useState(0)
  const log = logs[active]

  return (
    <section className="card overflow-hidden">
      <header className="no-print flex flex-wrap items-center gap-3 border-b border-ink-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-brand-500" />
          <h2 className="section-title">Daily log sheets</h2>
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">{logs.length}</span>
        </div>
        <button
          onClick={() => window.print()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </header>

      <nav className="no-print flex gap-2 overflow-x-auto border-b border-ink-100 px-5 py-3" aria-label="Log days">
        {logs.map((l, i) => (
          <button
            key={l.date}
            onClick={() => setActive(i)}
            className={`flex shrink-0 flex-col rounded-xl border px-3.5 py-2 text-left transition ${
              i === active ? 'border-ink-900 bg-ink-900 text-white shadow-md' : 'border-ink-200 text-ink-700 hover:border-ink-300'
            }`}
          >
            <span className="text-xs font-semibold">Day {l.day}</span>
            <span className={`text-[11px] ${i === active ? 'text-ink-300' : 'text-ink-500'}`}>
              {formatShortDate(l.date)} · {formatMiles(l.total_miles)}
            </span>
          </button>
        ))}
      </nav>

      <div className="no-print flex flex-wrap items-center gap-x-6 gap-y-2 px-5 pt-4 text-sm">
        <span className="font-semibold text-ink-900">{formatLongDate(log.date)}</span>
        {DUTY_STATUSES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-ink-600">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}: <b className="font-semibold text-ink-900">{formatHours(log.totals[s.key])}</b>
          </span>
        ))}
        <div className="ml-auto flex gap-1">
          <IconButton label="Previous day" disabled={active === 0} onClick={() => setActive(active - 1)}>
            <ChevronLeft size={16} />
          </IconButton>
          <IconButton label="Next day" disabled={active === logs.length - 1} onClick={() => setActive(active + 1)}>
            <ChevronRight size={16} />
          </IconButton>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {logs.map((l, i) => (
          <div key={l.date} className={`print-sheet overflow-x-auto rounded-xl border border-ink-200 ${i === active ? '' : 'hidden print:block'}`}>
            <div className="min-w-[760px]">
              <DailyLogSheet log={l} details={details} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-600 transition hover:bg-ink-50 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
