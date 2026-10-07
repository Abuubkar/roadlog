import { ChevronDown, Crosshair, Gauge, Loader2, Navigation, Package, PackageCheck, Route, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { defaultStartTime } from '../../lib/format'
import type { LocationValue, LogDetails, TripRequest } from '../../types/trip'
import { LocationInput } from './LocationInput'

interface Props {
  loading: boolean
  onSubmit: (request: TripRequest) => void
  details: LogDetails
  onDetailsChange: (details: LogDetails) => void
}

const empty: LocationValue = { text: '', place: null }

const SAMPLE = {
  current: { text: 'Chicago, Illinois', place: { label: 'Chicago, Illinois', lat: 41.8756, lon: -87.6244 } },
  pickup: { text: 'Indianapolis, Indiana', place: { label: 'Indianapolis, Indiana', lat: 39.7683, lon: -86.1584 } },
  dropoff: { text: 'Los Angeles, California', place: { label: 'Los Angeles, California', lat: 34.0537, lon: -118.2428 } },
}

const DETAIL_FIELDS: { key: keyof LogDetails; label: string; placeholder: string }[] = [
  { key: 'driverName', label: 'Driver name', placeholder: 'John E. Doe' },
  { key: 'coDriver', label: 'Co-driver', placeholder: 'Optional' },
  { key: 'carrier', label: 'Carrier', placeholder: "John Doe's Transportation" },
  { key: 'mainOffice', label: 'Main office address', placeholder: 'Washington, D.C.' },
  { key: 'homeTerminal', label: 'Home terminal address', placeholder: 'Richmond, VA' },
  { key: 'vehicles', label: 'Truck / trailer numbers', placeholder: '1016 / 5301' },
  { key: 'shippingDoc', label: 'DVL or manifest no.', placeholder: 'BOL-12345' },
  { key: 'shipperCommodity', label: 'Shipper & commodity', placeholder: 'Acme Co. — packaged goods' },
]

export function TripForm({ loading, onSubmit, details, onDetailsChange }: Props) {
  const [current, setCurrent] = useState<LocationValue>(empty)
  const [pickup, setPickup] = useState<LocationValue>(empty)
  const [dropoff, setDropoff] = useState<LocationValue>(empty)
  const [cycleUsed, setCycleUsed] = useState(0)
  const [startTime, setStartTime] = useState(defaultStartTime)
  const [inspections, setInspections] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const toPayload = (v: LocationValue) => v.place ?? v.text.trim()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      current_location: toPayload(current),
      pickup_location: toPayload(pickup),
      dropoff_location: toPayload(dropoff),
      current_cycle_used: cycleUsed,
      start_time: startTime,
      include_inspections: inspections,
    })
  }

  const loadSample = () => {
    setCurrent(SAMPLE.current)
    setPickup(SAMPLE.pickup)
    setDropoff(SAMPLE.dropoff)
    setCycleUsed(20)
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Plan a trip</h2>
          <p className="mt-0.5 text-sm text-ink-500">Property-carrying · 70 hr / 8 day cycle</p>
        </div>
        <button
          type="button"
          onClick={loadSample}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          <Sparkles size={13} /> Sample trip
        </button>
      </div>

      <div className="relative flex flex-col gap-4">
        <span className="absolute top-9 bottom-9 left-[1.15rem] w-px border-l-2 border-dotted border-ink-200" aria-hidden />
        <LocationInput label="Current location" placeholder="Where is the truck now?" value={current} onChange={setCurrent} icon={Crosshair} accent="var(--color-ink-500)" />
        <LocationInput label="Pickup location" placeholder="Shipper address or city" value={pickup} onChange={setPickup} icon={Package} accent="var(--color-pickup)" />
        <LocationInput label="Drop-off location" placeholder="Receiver address or city" value={dropoff} onChange={setDropoff} icon={PackageCheck} accent="var(--color-dropoff)" />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="cycle" className="field-label mb-0 flex items-center gap-1.5">
            <Gauge size={13} /> Current cycle used
          </label>
          <span className="font-mono text-sm font-semibold text-ink-900">
            {cycleUsed} <span className="text-ink-400">/ 70 hrs</span>
          </span>
        </div>
        <input
          id="cycle"
          type="range"
          min={0}
          max={70}
          step={0.25}
          value={cycleUsed}
          onChange={(e) => setCycleUsed(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(cycleUsed / 70) * 100}%`,
              background: cycleUsed > 60 ? 'var(--color-dropoff)' : cycleUsed > 45 ? 'var(--color-on-duty)' : 'var(--color-driving)',
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-500">{(70 - cycleUsed).toFixed(2).replace(/\.?0+$/, '')} on-duty hours available before a 34-hr restart.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor="start" className="field-label">
            Departure (home-terminal time)
          </label>
          <input id="start" type="datetime-local" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-700 select-none">
          <input type="checkbox" checked={inspections} onChange={(e) => setInspections(e.target.checked)} className="size-4 accent-brand-500" />
          15-min inspections
        </label>
      </div>

      <div className="rounded-xl border border-ink-200">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-medium text-ink-700"
          aria-expanded={showDetails}
        >
          Log sheet details <span className="text-xs font-normal text-ink-400">(optional)</span>
          <ChevronDown size={16} className={`ml-auto text-ink-400 transition ${showDetails ? 'rotate-180' : ''}`} />
        </button>
        {showDetails && (
          <div className="grid gap-3 border-t border-ink-100 p-3.5 sm:grid-cols-2">
            {DETAIL_FIELDS.map(({ key, label, placeholder }) => (
              <label key={key} className="text-xs font-medium text-ink-500">
                {label}
                <input
                  className="input mt-1 py-2"
                  placeholder={placeholder}
                  value={details[key]}
                  onChange={(e) => onDetailsChange({ ...details, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-ink-900/20 transition hover:bg-ink-800 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Route size={17} />}
        {loading ? 'Planning route & logs…' : 'Generate route & ELD logs'}
        {!loading && <Navigation size={14} className="text-brand-400" />}
      </button>
    </form>
  )
}
