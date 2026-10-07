export type DutyStatus = 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty'

export type ActivityType =
  | 'drive'
  | 'pre_trip'
  | 'post_trip'
  | 'pickup'
  | 'dropoff'
  | 'fuel'
  | 'break'
  | 'rest'
  | 'restart'

export interface Place {
  label: string
  lat: number
  lon: number
}

/** A location field as typed by the user, optionally pinned to a geocoded place. */
export interface LocationValue {
  text: string
  place: Place | null
}

export interface TripRequest {
  current_location: Place | string
  pickup_location: Place | string
  dropoff_location: Place | string
  current_cycle_used: number
  start_time: string
  include_inspections: boolean
}

export interface RouteLeg {
  from: string
  to: string
  distance_miles: number
  duration_hours: number
}

export interface Instruction {
  leg: number
  text: string
  distance_miles: number
  type: string
  modifier: string
}

export interface Stop {
  id: number
  type: ActivityType
  label: string
  status: DutyStatus
  location: string
  lat: number
  lon: number
  mile: number
  arrival: string
  departure: string
  duration_hours: number
}

export interface TimelineEntry {
  type: ActivityType
  label: string
  status: DutyStatus
  start: string
  end: string
  duration_hours: number
  start_mile: number
  end_mile: number
  location: string
}

export interface LogSegment {
  status: DutyStatus
  start: number
  end: number
}

export interface LogRemark {
  hour: number
  time: string
  status: DutyStatus
  location: string
  note: string
}

export interface DailyLog {
  day: number
  date: string
  total_miles: number
  segments: LogSegment[]
  totals: Record<DutyStatus, number>
  remarks: LogRemark[]
  recap: { on_duty_today: number; cycle_used: number; available_tomorrow: number }
  from_location: string
  to_location: string
}

export interface TripSummary {
  start: string
  end: string
  total_hours: number
  total_miles: number
  driving_hours: number
  on_duty_hours: number
  off_duty_hours: number
  fuel_stops: number
  breaks: number
  rests: number
  restarts: number
  cycle_used_start: number
}

export interface TripPlan {
  locations: { current: Place; pickup: Place; dropoff: Place }
  route: {
    distance_miles: number
    driving_hours: number
    geometry: [number, number][]
    legs: RouteLeg[]
    instructions: Instruction[]
  }
  stops: Stop[]
  timeline: TimelineEntry[]
  logs: DailyLog[]
  summary: TripSummary
}

/** Optional header details printed on every log sheet (kept in the browser only). */
export interface LogDetails {
  driverName: string
  coDriver: string
  carrier: string
  mainOffice: string
  homeTerminal: string
  vehicles: string
  shippingDoc: string
  shipperCommodity: string
}
