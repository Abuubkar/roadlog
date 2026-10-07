import { Flag, Gauge, Loader2, LocateFixed, Package, Play, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
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

/** `?sample` in the URL pre-fills and plans the sample trip (handy for demos). */
const WANTS_SAMPLE = new URLSearchParams(window.location.search).has('sample')

const SAMPLE = {
  current: { text: 'Chicago, Illinois', place: { label: 'Chicago, Illinois', lat: 41.8756, lon: -87.6244 } },
  pickup: { text: 'Indianapolis, Indiana', place: { label: 'Indianapolis, Indiana', lat: 39.7683, lon: -86.1584 } },
  dropoff: { text: 'Los Angeles, California', place: { label: 'Los Angeles, California', lat: 34.0537, lon: -118.2428 } },
}

const DETAIL_FIELDS: { key: keyof LogDetails; label: string }[] = [
  { key: 'driverName', label: 'Driver' },
  { key: 'coDriver', label: 'Co-driver' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'mainOffice', label: 'Main office' },
  { key: 'homeTerminal', label: 'Home terminal' },
  { key: 'vehicles', label: 'Truck / trailer' },
  { key: 'shippingDoc', label: 'BOL / manifest no.' },
  { key: 'shipperCommodity', label: 'Shipper & commodity' },
]

export function TripBar({ loading, onSubmit, details, onDetailsChange }: Props) {
  const [current, setCurrent] = useState<LocationValue>(WANTS_SAMPLE ? SAMPLE.current : empty)
  const [pickup, setPickup] = useState<LocationValue>(WANTS_SAMPLE ? SAMPLE.pickup : empty)
  const [dropoff, setDropoff] = useState<LocationValue>(WANTS_SAMPLE ? SAMPLE.dropoff : empty)
  const [cycleUsed, setCycleUsed] = useState(WANTS_SAMPLE ? '20' : '0')
  const [startTime, setStartTime] = useState(defaultStartTime)
  const [inspections, setInspections] = useState(true)
  const [showOptions, setShowOptions] = useState(false)

  const cycle = Math.min(70, Math.max(0, Number(cycleUsed) || 0))
  const toPayload = (v: LocationValue) => v.place ?? v.text.trim()

  const request = (): TripRequest => ({
      current_location: toPayload(current),
      pickup_location: toPayload(pickup),
      dropoff_location: toPayload(dropoff),
      current_cycle_used: cycle,
      start_time: startTime,
      include_inspections: inspections,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(request())
  }

  useEffect(() => {
    if (WANTS_SAMPLE) onSubmit(request())
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSample = () => {
    setCurrent(SAMPLE.current)
    setPickup(SAMPLE.pickup)
    setDropoff(SAMPLE.dropoff)
    setCycleUsed('20')
  }

  return (
    <form onSubmit={submit} className="card print:hidden">
      <div className="grid gap-2.5 p-3.5 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_110px_215px_auto] xl:items-end">
        <LocationInput label="Current location" placeholder="Where is the truck?" value={current} onChange={setCurrent} icon={LocateFixed} color="#44526b" />
        <LocationInput label="Pickup" placeholder="Shipper city or address" value={pickup} onChange={setPickup} icon={Package} color="#0ea5e9" />
        <LocationInput label="Drop-off" placeholder="Receiver city or address" value={dropoff} onChange={setDropoff} icon={Flag} color="#e5484d" />
        <div>
          <label htmlFor="cycle" className="eyebrow mb-[5px] block">
            Cycle used
          </label>
          <div className="field">
            <Gauge size={16} className="shrink-0 text-ink-2" />
            <input id="cycle" type="number" min={0} max={70} step={0.25} value={cycleUsed} onChange={(e) => setCycleUsed(e.target.value)} className="font-mono" required />
            <span className="text-xs text-ink-3">h</span>
          </div>
        </div>
        <div>
          <label htmlFor="start" className="eyebrow mb-[5px] block">
            Departure
          </label>
          <div className="field">
            <input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
        </div>
        <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
          <button type="button" className="btn h-9" aria-expanded={showOptions} onClick={() => setShowOptions((v) => !v)} title="Trip options and log details">
            <SlidersHorizontal size={16} />
          </button>
          <button type="submit" className="btn btn-primary h-9 flex-1 justify-center xl:flex-none" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={15} />}
            {loading ? 'Planning…' : 'Plan trip'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft px-3.5 py-2 text-xs text-ink-3">
        <span>
          {(70 - cycle).toFixed(2).replace(/\.?0+$/, '')} h left in the 70 h / 8-day cycle
        </span>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-ink-2 select-none">
          <input type="checkbox" checked={inspections} onChange={(e) => setInspections(e.target.checked)} className="accent-brand" />
          Pre-trip (30 min) and post-trip (15 min) inspections
        </label>
        <button type="button" onClick={loadSample} className="ml-auto inline-flex items-center gap-1 font-medium text-brand hover:underline">
          <Sparkles size={13} /> Load sample trip
        </button>
      </div>

      {showOptions && (
        <div className="grid gap-3 border-t border-line-soft p-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <p className="text-xs text-ink-3 sm:col-span-2 xl:col-span-4">These details are printed on every log sheet and stay in this browser only.</p>
          {DETAIL_FIELDS.map(({ key, label }) => (
            <label key={key} className="min-w-0">
              <span className="eyebrow mb-[5px] block">{label}</span>
              <span className="field">
                <input value={details[key]} onChange={(e) => onDetailsChange({ ...details, [key]: e.target.value })} />
              </span>
            </label>
          ))}
        </div>
      )}
    </form>
  )
}
