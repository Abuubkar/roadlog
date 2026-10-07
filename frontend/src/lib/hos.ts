import type { TimelineEntry, TripPlan } from '../types/trip'
import { parseLocal } from './format'

export interface HosSnapshot {
  entry: TimelineEntry
  mile: number
  untilBreak: number
  drive: number
  shift: number
  cycle: number
}

interface Span extends TimelineEntry {
  a: number
  b: number
}

/** Hours since trip start for an API timestamp. */
export const hoursFrom = (plan: TripPlan, iso: string) =>
  (parseLocal(iso).getTime() - parseLocal(plan.summary.start).getTime()) / 36e5

export const spans = (plan: TripPlan): Span[] =>
  plan.timeline.map((e) => ({ ...e, a: hoursFrom(plan, e.start), b: hoursFrom(plan, e.end) }))

/** Replay the plan up to `hour` and report the driver's remaining HOS clocks at that moment. */
export function hosAt(plan: TripPlan, hour: number): HosSnapshot {
  const all = spans(plan)
  let cycle = plan.summary.cycle_used_start
  let shiftStart: number | null = null
  let driving = 0
  let sinceBreak = 0
  let streak = 0
  let entry: Span = all[0]
  let mile = 0

  for (const e of all) {
    if (e.a >= hour) break
    const dur = Math.min(e.b, hour) - e.a
    entry = e
    if ((e.type === 'rest' && dur >= 10 - 1e-6) || (e.type === 'restart' && dur >= 34 - 1e-6)) {
      shiftStart = null
      driving = 0
      sinceBreak = 0
      if (e.type === 'restart') cycle = 0
    }
    if (e.status === 'driving') {
      shiftStart ??= e.a
      driving += dur
      sinceBreak += dur
      streak = 0
      mile = e.start_mile + (e.end_mile - e.start_mile) * (dur / (e.b - e.a))
    } else {
      streak += dur
      if (streak >= 0.5) sinceBreak = 0
      if (e.status === 'on_duty') shiftStart ??= e.a
      mile = e.start_mile
    }
    if (e.status === 'driving' || e.status === 'on_duty') cycle += dur
  }

  return {
    entry,
    mile,
    untilBreak: 8 - sinceBreak,
    drive: 11 - driving,
    shift: shiftStart === null ? 14 : 14 - (hour - shiftStart),
    cycle: 70 - cycle,
  }
}

/** A point on the route polyline at a given trip mile (planar approximation is fine at map scale). */
export function routeLocator(geometry: [number, number][], totalMiles: number) {
  const cum = [0]
  for (let i = 1; i < geometry.length; i++) {
    const [a, b] = geometry[i - 1]
    const [c, d] = geometry[i]
    cum.push(cum[i - 1] + Math.hypot(c - a, (d - b) * Math.cos((a * Math.PI) / 180)))
  }
  return (mile: number): [number, number] => {
    const target = (mile / totalMiles) * cum[cum.length - 1]
    const i = cum.findIndex((x) => x >= target)
    if (i <= 0) return geometry[0]
    const f = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
    const [a, b] = geometry[i - 1]
    const [c, d] = geometry[i]
    return [a + (c - a) * f, b + (d - b) * f]
  }
}
