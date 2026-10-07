import { BedDouble, ClipboardCheck, Coffee, Flag, Fuel, Package, RotateCcw, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActivityType, DutyStatus } from '../types/trip'

/** Hex values: SVG presentation attributes can't resolve CSS variables. Mirrors index.css. */
export const STATUS_COLOR: Record<DutyStatus, string> = {
  off_duty: '#8590a2',
  sleeper_berth: '#44546f',
  driving: '#1f9d55',
  on_duty: '#1d7afc',
}

export const DUTY_STATUSES: { key: DutyStatus; label: string; short: string; color: string }[] = [
  { key: 'off_duty', label: 'Off duty', short: 'Off', color: STATUS_COLOR.off_duty },
  { key: 'sleeper_berth', label: 'Sleeper berth', short: 'Sleeper', color: STATUS_COLOR.sleeper_berth },
  { key: 'driving', label: 'Driving', short: 'Driving', color: STATUS_COLOR.driving },
  { key: 'on_duty', label: 'On duty', short: 'On duty', color: STATUS_COLOR.on_duty },
]

export const STATUS_META = Object.fromEntries(DUTY_STATUSES.map((s) => [s.key, s])) as Record<
  DutyStatus,
  (typeof DUTY_STATUSES)[number]
>

export const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; color: string }> = {
  drive: { icon: Truck, color: STATUS_COLOR.driving },
  pre_trip: { icon: ClipboardCheck, color: STATUS_COLOR.on_duty },
  post_trip: { icon: ClipboardCheck, color: STATUS_COLOR.on_duty },
  pickup: { icon: Package, color: '#0ea5e9' },
  dropoff: { icon: Flag, color: '#e5484d' },
  fuel: { icon: Fuel, color: '#8b5cf6' },
  break: { icon: Coffee, color: STATUS_COLOR.off_duty },
  rest: { icon: BedDouble, color: STATUS_COLOR.sleeper_berth },
  restart: { icon: RotateCcw, color: '#0f766e' },
}
