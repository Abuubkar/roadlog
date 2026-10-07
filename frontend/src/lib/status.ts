import { BedDouble, Coffee, Flag, Fuel, Package, PackageCheck, RotateCcw, ScanSearch, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActivityType, DutyStatus } from '../types/trip'

/** Hex values (SVG presentation attributes can't resolve CSS variables). Mirrors index.css. */
export const COLORS = {
  'off-duty': '#64748b',
  sleeper: '#6366f1',
  driving: '#10b981',
  'on-duty': '#f59e0b',
  pickup: '#0ea5e9',
  dropoff: '#e11d48',
  fuel: '#8b5cf6',
  restart: '#0f766e',
} as const

export const DUTY_STATUSES: { key: DutyStatus; label: string; short: string; color: string }[] = [
  { key: 'off_duty', label: 'Off Duty', short: 'Off', color: COLORS['off-duty'] },
  { key: 'sleeper_berth', label: 'Sleeper Berth', short: 'SB', color: COLORS['sleeper'] },
  { key: 'driving', label: 'Driving', short: 'D', color: COLORS['driving'] },
  { key: 'on_duty', label: 'On Duty (not driving)', short: 'ON', color: COLORS['on-duty'] },
]

export const STATUS_META = Object.fromEntries(DUTY_STATUSES.map((s) => [s.key, s])) as Record<
  DutyStatus,
  (typeof DUTY_STATUSES)[number]
>

export const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; tone: string }> = {
  drive: { icon: Truck, tone: COLORS['driving'] },
  pre_trip: { icon: ScanSearch, tone: COLORS['on-duty'] },
  post_trip: { icon: Flag, tone: COLORS['on-duty'] },
  pickup: { icon: Package, tone: COLORS['pickup'] },
  dropoff: { icon: PackageCheck, tone: COLORS['dropoff'] },
  fuel: { icon: Fuel, tone: COLORS['fuel'] },
  break: { icon: Coffee, tone: COLORS['off-duty'] },
  rest: { icon: BedDouble, tone: COLORS['sleeper'] },
  restart: { icon: RotateCcw, tone: COLORS['restart'] },
}

