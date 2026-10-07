import type { Place, TripPlan, TripRequest } from '../types/trip'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const PHOTON_URL = 'https://photon.komoot.io/api'

export class ApiError extends Error {}

export async function planTrip(request: TripRequest, signal?: AbortSignal): Promise<TripPlan> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/trips/plan/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError('Could not reach the planning service. Please try again in a moment.')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(describeError(body) ?? `Request failed (${response.status}).`)
  return body as TripPlan
}

function describeError(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  if ('detail' in body && typeof body.detail === 'string') return body.detail
  const first = Object.entries(body as Record<string, unknown>)[0]
  if (!first) return null
  const [field, messages] = first
  const message = Array.isArray(messages) ? messages[0] : String(messages)
  return `${field.replace(/_/g, ' ')}: ${message}`
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: Record<string, string | undefined>
}

/** Address autocomplete via Photon (OpenStreetMap), biased to North America. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, limit: '6', lang: 'en', lat: '39.5', lon: '-98.35' })
  const response = await fetch(`${PHOTON_URL}?${params}`, { signal })
  if (!response.ok) return []
  const data = (await response.json()) as { features: PhotonFeature[] }
  const seen = new Set<string>()
  return data.features
    .filter((f) => ['US', 'CA', 'MX'].includes(f.properties.countrycode ?? ''))
    .map((f) => ({ label: placeLabel(f.properties), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }))
    .filter((p) => p.label && !seen.has(p.label) && seen.add(p.label))
}

function placeLabel(p: PhotonFeature['properties']): string {
  const street = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street
  const city = p.city ?? p.town ?? p.village
  const parts = [p.name ?? street, city !== p.name ? city : undefined, p.state, p.countrycode !== 'US' ? p.country : undefined]
  return parts.filter(Boolean).join(', ')
}
