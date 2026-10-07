import { useCallback, useEffect, useRef, useState } from 'react'
import { planTrip } from '../api/client'
import type { TripPlan, TripRequest } from '../types/trip'

/** A real API result for Chicago → Indianapolis → Los Angeles, bundled so the app opens with data. */
const loadSample = () => import('../data/sample-plan.json').then((m) => m.default as unknown as TripPlan)

export function useTripPlan() {
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [isSample, setIsSample] = useState(true)
  const [plannedAt, setPlannedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  const showSample = useCallback(() => {
    inFlight.current?.abort()
    setError(null)
    setLoading(false)
    loadSample().then((sample) => {
      setPlan(sample)
      setIsSample(true)
      setPlannedAt(null)
    })
  }, [])

  // Open with the bundled sample unless the user has already planned something.
  useEffect(() => {
    let cancelled = false
    loadSample().then((sample) => !cancelled && setPlan((current) => current ?? sample))
    return () => {
      cancelled = true
    }
  }, [])

  const submit = useCallback(async (request: TripRequest) => {
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    setLoading(true)
    setError(null)
    try {
      setPlan(await planTrip(request, controller.signal))
      setIsSample(false)
      setPlannedAt(new Date())
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message)
    } finally {
      if (inFlight.current === controller) setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    inFlight.current?.abort()
    setPlan(null)
    setIsSample(false)
    setPlannedAt(null)
    setError(null)
    setLoading(false)
  }, [])

  return { plan, isSample, plannedAt, loading, error, submit, reset, showSample }
}
