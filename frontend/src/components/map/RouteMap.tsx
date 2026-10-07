import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { formatDateTime, formatHours, formatMiles } from '../../lib/format'
import { ACTIVITY_META } from '../../lib/status'
import type { Stop, TripPlan } from '../../types/trip'

const US_CENTER: [number, number] = [39.5, -98.35]

function markerIcon(Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>, color: string, large = false) {
  const size = large ? 38 : 30
  const html = toMarkup(
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        background: color,
        border: '3px solid white',
        boxShadow: '0 6px 16px -4px rgba(15,23,42,.45)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Icon size={large ? 18 : 14} color="white" strokeWidth={2.5} />
    </div>,
  )
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] })
}

/** Render a small element once and return its HTML (Leaflet divIcons take markup strings). */
function toMarkup(element: React.ReactNode): string {
  const container = document.createElement('div')
  const root = createRoot(container)
  flushSync(() => root.render(element))
  const html = container.innerHTML
  root.unmount()
  return html
}

// Built once at module load: flushSync must not run inside a React render.
const ICONS: Record<string, L.DivIcon> = {
  origin: markerIcon(Crosshair, '#1c2638', true),
  ...Object.fromEntries(
    Object.entries(ACTIVITY_META).map(([type, meta]) => [type, markerIcon(meta.icon, meta.tone, type === 'pickup' || type === 'dropoff')]),
  ),
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
  }, [map, points])
  return null
}

export function RouteMap({ plan }: { plan: TripPlan | null }) {

  // Draw rest stops beneath pickup/drop-off markers.
  const stops = useMemo(
    () => [...(plan?.stops ?? [])].sort((a, b) => Number(isAnchor(a)) - Number(isAnchor(b))),
    [plan],
  )

  return (
    <MapContainer center={US_CENTER} zoom={4} scrollWheelZoom className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {plan && (
        <>
          <FitBounds points={plan.route.geometry} />
          <Polyline positions={plan.route.geometry} pathOptions={{ color: '#0f172a', weight: 8, opacity: 0.18 }} />
          <Polyline positions={plan.route.geometry} pathOptions={{ color: '#f59200', weight: 4.5, opacity: 0.95 }} />
          <Marker position={[plan.locations.current.lat, plan.locations.current.lon]} icon={ICONS.origin}>
            <Popup>
              <PopupBody title="Start" subtitle={plan.locations.current.label} lines={[formatDateTime(plan.summary.start)]} />
            </Popup>
          </Marker>
          {stops.map((stop) => (
            <Marker key={stop.id} position={[stop.lat, stop.lon]} icon={ICONS[stop.type]}>
              <Popup>
                <PopupBody
                  title={stop.label}
                  subtitle={stop.location}
                  lines={[
                    `${formatDateTime(stop.arrival)} · ${formatHours(stop.duration_hours)}`,
                    `Mile ${formatMiles(stop.mile).replace(' mi', '')}`,
                  ]}
                />
              </Popup>
            </Marker>
          ))}
        </>
      )}
    </MapContainer>
  )
}

const isAnchor = (s: Stop) => s.type === 'pickup' || s.type === 'dropoff'

function PopupBody({ title, subtitle, lines }: { title: string; subtitle: string; lines: string[] }) {
  return (
    <div className="min-w-44 font-sans">
      <div className="text-sm font-semibold text-ink-900">{title}</div>
      <div className="text-xs text-ink-500">{subtitle}</div>
      {lines.map((line) => (
        <div key={line} className="mt-1 text-xs text-ink-700">
          {line}
        </div>
      ))}
    </div>
  )
}
