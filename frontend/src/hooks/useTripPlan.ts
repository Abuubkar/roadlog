import { useCallback, useRef, useState } from 'react'
import { planTrip } from '../api/client'
import type { TripPlan, TripRequest } from '../types/trip'

export function useTripPlan() {
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  const submit = useCallback(async (request: TripRequest) => {
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    setLoading(true)
    setError(null)
    try {
      setPlan(await planTrip(request, controller.signal))
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message)
    } finally {
      if (inFlight.current === controller) setLoading(false)
    }
  }, [])

  return { plan, loading, error, submit }
}
