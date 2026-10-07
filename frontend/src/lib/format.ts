const dateTime = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const longDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

/** API datetimes are naive home-terminal times ("2026-10-08T08:00"); parse them as local. */
export const parseLocal = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00` : iso)

export const formatDateTime = (iso: string) => dateTime.format(parseLocal(iso))
export const formatTime = (iso: string) => time.format(parseLocal(iso))
export const formatLongDate = (iso: string) => longDate.format(parseLocal(iso))
export const formatShortDate = (iso: string) => shortDate.format(parseLocal(iso))

export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export const formatMiles = (miles: number) => `${Math.round(miles).toLocaleString('en-US')} mi`

/** Decimal hours as written on a paper log: 10, 4.5, 1.75 */
export const formatLogHours = (hours: number) => String(Math.round(hours * 100) / 100)

/** Value for <input type="datetime-local">, e.g. tomorrow 08:00. */
export function defaultStartTime(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(8, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T08:00`
}
