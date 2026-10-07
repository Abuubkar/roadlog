import { ChevronRight, FileText, FlaskConical, Plus, Printer, RefreshCw, Truck, User } from 'lucide-react'
import dispatcherPhoto from '../../assets/avatars/dispatcher.jpg'
import { Logo } from '../ui/Logo'
import type { LogDetails, TripPlan } from '../../types/trip'

export type Tab = 'overview' | 'route' | 'logs' | 'directions'

const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'route', label: 'Route & stops' },
  { value: 'logs', label: 'Daily logs' },
  { value: 'directions', label: 'Directions' },
]

interface Props {
  plan: TripPlan | null
  isSample: boolean
  plannedAt: Date | null
  details: LogDetails
  tab: Tab
  onTab: (tab: Tab) => void
  onNewTrip: () => void
}

export function PageHeader({ plan, isSample, plannedAt, details, tab, onTab, onNewTrip }: Props) {
  const from = plan?.logs[0]?.from_location
  const to = plan?.logs.at(-1)?.to_location
  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-white px-4 pt-3.5 sm:px-7 print:hidden">
      <div className="flex items-center gap-3">
        <span className="lg:hidden">
          <Logo size={26} />
        </span>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-ink-3">
          Planning <ChevronRight size={13} /> Trip planner
          {plan && (
            <>
              <ChevronRight size={13} /> <span className="truncate text-ink-2">{tripId(plan)}</span>
            </>
          )}
        </div>
        <img src={dispatcherPhoto} alt="Signed-in dispatcher" className="ml-auto size-[30px] rounded-full object-cover" />
      </div>

      <div className="mt-1.5 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{plan && from && to ? `${from} → ${to}` : 'Plan a new trip'}</h1>
        {plan && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-[3px] text-[11.5px] font-semibold text-ok-ink">
            <span className="size-1.5 rounded-full bg-ok" /> Compliant
          </span>
        )}
        {plan && isSample && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-[3px] text-[11.5px] font-semibold text-brand-ink">
            <FlaskConical size={12} /> Sample data
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {plan && (
            <button className="btn" onClick={() => window.print()}>
              <Printer size={16} /> Print logs
            </button>
          )}
          <button className="btn btn-primary" onClick={onNewTrip}>
            <Plus size={16} /> New trip
          </button>
        </div>
      </div>

      {plan && (
        <div className="-mt-1.5 mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
          {details.vehicles && (
            <span className="inline-flex items-center gap-1.5">
              <Truck size={14} /> {details.vehicles}
            </span>
          )}
          {details.shippingDoc && (
            <span className="inline-flex items-center gap-1.5">
              <FileText size={14} /> {details.shippingDoc}
            </span>
          )}
          {details.driverName && (
            <span className="inline-flex items-center gap-1.5">
              <User size={14} /> {details.driverName}
            </span>
          )}
          {plannedAt && (
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw size={14} /> Planned at {plannedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      <nav className="flex gap-6 overflow-x-auto lg:hidden">
        {TABS.map((t) => {
          const disabled = !plan && t.value !== 'overview'
          return (
            <button
              key={t.value}
              disabled={disabled}
              onClick={() => onTab(t.value)}
              className={`shrink-0 border-b-2 py-2.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                tab === t.value ? 'border-brand text-brand' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}

const tripId = (plan: TripPlan) => `TRP-${plan.summary.start.slice(0, 10).replace(/-/g, '')}-01`
