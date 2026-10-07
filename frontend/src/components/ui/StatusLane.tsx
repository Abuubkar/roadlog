import { DUTY_STATUSES, STATUS_META } from '../../lib/status'
import type { DutyStatus } from '../../types/trip'

/** Four stacked bars mirroring the log grid rows, with the active duty status lit. */
export function StatusLane({ status, size = 1 }: { status: DutyStatus; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0"
      style={{ width: 18 * size, gridTemplateRows: `repeat(4, ${3 * size}px)`, rowGap: 2 * size }}
      title={STATUS_META[status].label}
      aria-label={STATUS_META[status].label}
    >
      {DUTY_STATUSES.map((s) => (
        <i key={s.key} className="block rounded-[1.5px]" style={{ background: s.key === status ? s.color : '#e3e7ee' }} />
      ))}
    </span>
  )
}
