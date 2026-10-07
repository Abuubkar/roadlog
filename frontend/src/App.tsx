import { AlertTriangle, Loader2 } from 'lucide-react'
import { Itinerary } from './components/itinerary/Itinerary'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { LogBook } from './components/logs/LogBook'
import { RouteMap } from './components/map/RouteMap'
import { TripSummary } from './components/summary/TripSummary'
import { TripForm } from './components/trip-form/TripForm'
import { EmptyState } from './components/ui/EmptyState'
import { useStoredState } from './hooks/useStoredState'
import { useTripPlan } from './hooks/useTripPlan'
import type { LogDetails } from './types/trip'

const EMPTY_DETAILS: LogDetails = {
  driverName: '',
  coDriver: '',
  carrier: '',
  mainOffice: '',
  homeTerminal: '',
  vehicles: '',
  shippingDoc: '',
  shipperCommodity: '',
}

export default function App() {
  const { plan, loading, error, submit } = useTripPlan()
  const [details, setDetails] = useStoredState('roadlog:log-details', EMPTY_DETAILS)

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="no-print grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="flex flex-col gap-4">
            <TripForm loading={loading} onSubmit={submit} details={details} onDetailsChange={setDetails} />
            {error && (
              <div role="alert" className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
          <div className="card relative min-h-[420px] overflow-hidden lg:min-h-0">
            <RouteMap plan={plan} />
            {loading && (
              <div className="absolute inset-0 z-[500] grid place-items-center bg-white/60 backdrop-blur-[2px]">
                <div className="flex items-center gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
                  <Loader2 size={18} className="animate-spin text-brand-400" />
                  Routing &amp; simulating hours of service…
                </div>
              </div>
            )}
          </div>
        </div>

        {plan ? (
          <>
            <div className="no-print">
              <TripSummary plan={plan} />
            </div>
            <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
              <div className="no-print">
                <Itinerary plan={plan} />
              </div>
              <LogBook key={`${plan.summary.start}|${plan.summary.end}|${plan.route.distance_miles}`} logs={plan.logs} details={details} />
            </div>
          </>
        ) : (
          <div className="no-print">
            <EmptyState />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
