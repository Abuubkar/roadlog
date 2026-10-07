import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { formatDateTime, formatHours } from '../../lib/format'
import { ACTIVITY_META } from '../../lib/status'
import type { TripPlan } from '../../types/trip'
import { Segmented } from '../ui/Segmented'

const US_CENTER: [number, number] = [39.5, -98.35]
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services'
const ATTRIBUTION = 'Esri, HERE, Garmin, © OpenStreetMap contributors'

type Basemap = 'map' | 'satellite'

/** Render a small element once and return its HTML (Leaflet divIcons take markup strings). */
function toMarkup(element: React.ReactNode): string {
  const container = document.createElement('div')
  const root = createRoot(container)
  flushSync(() => root.render(element))
  const html = container.innerHTML
  root.unmount()
  return html
}

function pin(Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>, color: string, size = 28) {
  const html = toMarkup(
    <div
      style={{ width: size, height: size, borderRadius: 9999, background: color, border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(15,26,46,.35)', display: 'grid', placeItems: 'center' }}
    >
      <Icon size={size * 0.5} color="#fff" strokeWidth={2.4} />
    </div>,
  )
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] })
}

// Built once at module load: flushSync must not run inside a React render.
const ICONS: Record<string, L.DivIcon> = {
  origin: pin(LocateFixed, '#0f1a2e', 34),
  truck: L.divIcon({
    html: toMarkup(
      <div style={{ width: 34, height: 34, borderRadius: 9999, background: '#0f1a2e', border: '3px solid #fff', boxShadow: '0 0 0 6px rgba(12,102,228,.2)', display: 'grid', placeItems: 'center' }}>
        <Truck size={17} color="#fff" />
      </div>,
    ),
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  }),
  ...Object.fromEntries(
    Object.entries(ACTIVITY_META).map(([type, meta]) => [type, pin(meta.icon, meta.color, type === 'pickup' || type === 'dropoff' ? 34 : 28)]),
  ),
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [30, 30] })
  }, [map, points])
  return null
}

interface Props {
  plan: TripPlan | null
  truck?: [number, number] | null
  className?: string
}

export function RouteMap({ plan, truck, className = '' }: Props) {
  const [basemap, setBasemap] = useState<Basemap>('map')
  const legs = plan?.route.legs
  return (
    <div className={`card flex flex-col ${className}`}>
      <div className="card-header">
        <h2 className="card-title">Route</h2>
        {legs && (
          <span className="card-sub">
            {legs[0].distance_miles} mi to pickup · {legs[1].distance_miles} mi loaded
          </span>
        )}
        <div className="ml-auto">
          <Segmented value={basemap} onChange={setBasemap} options={[{ value: 'map', label: 'Map' }, { value: 'satellite', label: 'Satellite' }]} />
        </div>
      </div>
      <div className="relative min-h-[420px] flex-1 overflow-hidden rounded-b-[10px]">
        <MapContainer center={US_CENTER} zoom={4} scrollWheelZoom className="absolute inset-0" zoomControl={false}>
          {basemap === 'map' ? (
            <>
              <TileLayer key="base" url={`${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`} attribution={ATTRIBUTION} maxZoom={16} />
              <TileLayer key="ref" url={`${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`} maxZoom={16} />
            </>
          ) : (
            <TileLayer key="sat" url={`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`} attribution="Esri, Maxar, Earthstar Geographics" maxZoom={18} />
          )}
          {plan && (
            <>
              <FitBounds points={plan.route.geometry} />
              <Polyline positions={plan.route.geometry} pathOptions={{ color: '#0f1a2e', weight: 8, opacity: 0.15 }} />
              <Polyline positions={plan.route.geometry} pathOptions={{ color: '#0c66e4', weight: 4 }} />
              <Marker position={[plan.locations.current.lat, plan.locations.current.lon]} icon={ICONS.origin}>
                <Popup>
                  <b>Start</b>
                  <br />
                  {plan.locations.current.label}
                </Popup>
              </Marker>
              {plan.stops.map((s) => (
                <Marker key={s.id} position={[s.lat, s.lon]} icon={ICONS[s.type]}>
                  <Popup>
                    <b>{s.label}</b>
                    <br />
                    {s.location}
                    <br />
                    {formatDateTime(s.arrival)} · {formatHours(s.duration_hours)}
                  </Popup>
                </Marker>
              ))}
              {truck && <Marker position={truck} icon={ICONS.truck} zIndexOffset={1000} interactive={false} />}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
