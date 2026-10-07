import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Directions } from './components/itinerary/Directions'
import { StopsTable } from './components/itinerary/StopsTable'
import { HosPanel } from './components/hos/HosPanel'
import { PageHeader, type Tab } from './components/layout/PageHeader'
import { Sidebar } from './components/layout/Sidebar'
import { DailyLogs } from './components/logs/DailyLogs'
import { DailyLogSheet } from './components/logs/DailyLogSheet'
import { RouteMap } from './components/map/RouteMap'
import { SummaryStrip } from './components/summary/SummaryStrip'
import { DutyTimeline } from './components/timeline/DutyTimeline'
import { TripBar } from './components/trip-form/TripBar'
import { EmptyPanel } from './components/ui/EmptyPanel'
import { useStoredState } from './hooks/useStoredState'
import { useTripPlan } from './hooks/useTripPlan'
import { hosAt, hoursFrom, routeLocator } from './lib/hos'
import type { LogDetails, TripPlan } from './types/trip'

const DEFAULT_DETAILS: LogDetails = {
  driverName: 'Daniel Brooks',
  coDriver: '',
  carrier: 'Northline Freight',
  mainOffice: 'Columbus, OH',
  homeTerminal: 'Columbus, OH',
  vehicles: 'Unit 1016 / Trailer 53-2207',
  shippingDoc: 'BOL 448210',
  shipperCommodity: 'Midwest Paper Co. · paper products',
}

/** Start the playhead an hour before the first fuel stop (or a third of the way in). */
const initialHour = (plan: TripPlan) => {
  const fuel = plan.stops.find((s) => s.type === 'fuel')
  return fuel ? Math.max(0, hoursFrom(plan, fuel.arrival) - 1.2) : plan.summary.total_hours / 3
}

export default function App() {
  const { plan, plannedAt, loading, error, submit, reset } = useTripPlan()
  const [details, setDetails] = useStoredState('roadlog:log-details', DEFAULT_DETAILS)
  const [tab, setTab] = useState<Tab>('overview')
  const [scrub, setScrub] = useState<{ plan: TripPlan; hour: number } | null>(null)

  const hour = plan ? (scrub?.plan === plan ? scrub.hour : initialHour(plan)) : 0
  const locate = useMemo(() => (plan ? routeLocator(plan.route.geometry, plan.summary.total_miles) : null), [plan])
  const snapshot = plan ? hosAt(plan, hour) : null
  const truck = snapshot && locate ? locate(snapshot.mile) : null
  const onScrub = (h: number) => plan && setScrub({ plan, hour: h })

  const newTrip = () => {
    reset()
    setTab('overview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <Sidebar details={details} violations={plan ? 0 : null} />
      <div className="min-w-0">
        <PageHeader plan={plan} plannedAt={plannedAt} details={details} tab={plan ? tab : 'overview'} onTab={setTab} onNewTrip={newTrip} />
        <main className="flex flex-col gap-4 px-4 pt-5 pb-10 sm:px-7 print:p-0">
          <TripBar loading={loading} onSubmit={(r) => submit(r).then(() => setTab('overview'))} details={details} onDetailsChange={setDetails} />
          {error && (
            <div role="alert" className="flex gap-2.5 rounded-[10px] border border-danger/30 bg-[#fff5f5] px-4 py-3 text-[#a3262b] print:hidden">
              <AlertTriangle size={17} className="mt-px shrink-0" /> {error}
            </div>
          )}

          {plan && <SummaryStrip plan={plan} />}

          {(!plan || tab === 'overview' || tab === 'route') && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] print:hidden">
              <div className="relative flex">
                <RouteMap plan={plan} truck={truck} className="flex-1" />
                {loading && (
                  <div className="absolute inset-0 z-[600] grid place-items-center rounded-[10px] bg-white/60">
                    <div className="flex items-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 font-medium text-white shadow-lg">
                      <Loader2 size={16} className="animate-spin" /> Routing and simulating hours of service…
                    </div>
                  </div>
                )}
              </div>
              {plan && snapshot ? <HosPanel plan={plan} hour={hour} snapshot={snapshot} /> : <EmptyPanel />}
            </div>
          )}

          {plan && (tab === 'overview' || tab === 'route') && <DutyTimeline plan={plan} hour={hour} onScrub={onScrub} />}
          {plan && tab === 'route' && <StopsTable plan={plan} />}
          {plan && (tab === 'overview' || tab === 'logs') && <DailyLogs key={plannedAt?.getTime()} plan={plan} details={details} />}
          {plan && tab === 'directions' && <Directions plan={plan} />}

          {plan && (
            <div className="hidden print:block">
              {plan.logs.map((log) => (
                <div key={log.date} className="print-sheet">
                  <DailyLogSheet log={log} details={details} />
                </div>
              ))}
            </div>
          )}
        </main>
        <footer className="px-4 pb-8 text-xs text-ink-3 sm:px-7 print:hidden">
          Planning aid only; follow your carrier’s policies and current FMCSA rules. Routing by OSRM · basemap by Esri · places by GeoNames · portraits
          from randomuser.me.
        </footer>
      </div>
    </div>
  )
}
