import { DUTY_STATUSES } from '../../lib/status'
import { formatLogHours } from '../../lib/format'
import type { DailyLog, LogDetails, LogRemark } from '../../types/trip'

/* Geometry of the sheet (SVG user units). Mirrors the paper "Drivers Daily Log". */
const W = 1140
const H = 830
const X0 = 160 // grid left edge (midnight)
const HOUR = 38 // width of one hour
const X1 = X0 + 24 * HOUR
const GRID_TOP = 240
const BAND = 26 // hour-label band
const ROW = 36
const ROWS_TOP = GRID_TOP + BAND
const GRID_BOTTOM = ROWS_TOP + 4 * ROW
const PEN = '#1e40af'
const PAPER = '#fdfcf8'
const INK = '#111827'
const RULE = '#9aa5b8'

const xAt = (hour: number) => X0 + hour * HOUR
const rowY = (index: number) => ROWS_TOP + index * ROW + ROW / 2
const ROW_INDEX = Object.fromEntries(DUTY_STATUSES.map((s, i) => [s.key, i]))

interface Props {
  log: DailyLog
  details: LogDetails
}

export function DailyLogSheet({ log, details }: Props) {
  const [year, month, day] = log.date.split('-')
  const remarks = groupRemarks(log.remarks)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Driver's daily log for ${log.date}`} fontFamily="Inter, sans-serif">
      <rect width={W} height={H} fill={PAPER} />

      {/* ---------------------------------------------------------------- header */}
      <text x={30} y={50} fontSize={30} fontWeight={800} fill={INK}>
        Drivers Daily Log
      </text>
      <text x={78} y={70} fontSize={12} fill={INK}>
        (24 hours)
      </text>
      <DateField x={360} label="(month)" value={month} />
      <text x={438} y={46} fontSize={22} fill={INK}>/</text>
      <DateField x={460} label="(day)" value={day} />
      <text x={538} y={46} fontSize={22} fill={INK}>/</text>
      <DateField x={560} label="(year)" value={year} width={90} />
      <text x={720} y={34} fontSize={11.5} fill={INK}>
        <tspan fontWeight={600}>Original</tspan> – File at home terminal.
      </text>
      <text x={720} y={52} fontSize={11.5} fill={INK}>
        <tspan fontWeight={600}>Duplicate</tspan> – Driver retains in his/her possession for 8 days.
      </text>

      <LineField x={30} y={104} width={500} label="From:" value={log.from_location} inline />
      <LineField x={560} y={104} width={550} label="To:" value={log.to_location} inline />

      <BoxField x={30} y={128} label="Total Miles Driving Today" value={formatLogHours(log.total_miles)} />
      <BoxField x={215} y={128} label="Total Mileage Today" value={formatLogHours(log.total_miles)} />
      <LineField x={30} y={218} width={355} label="Truck/Tractor and Trailer Numbers or License Plate(s)/State" value={details.vehicles} />

      <LineField x={430} y={138} width={680} label="Name of Carrier or Carriers" value={details.carrier} />
      <LineField x={430} y={176} width={680} label="Main Office Address" value={details.mainOffice} />
      <LineField x={430} y={214} width={680} label="Home Terminal Address" value={details.homeTerminal} />

      {/* ----------------------------------------------------------------- grid */}
      <rect x={X0 - 22} y={GRID_TOP} width={X1 - X0 + 44} height={BAND} fill={INK} />
      {Array.from({ length: 25 }, (_, h) =>
        h % 24 === 0 ? (
          <text key={h} x={xAt(h)} y={GRID_TOP + 11} fontSize={9} fontWeight={700} fill="white" textAnchor="middle">
            Mid-
            <tspan x={xAt(h)} dy={10}>
              night
            </tspan>
          </text>
        ) : (
          <text key={h} x={xAt(h)} y={GRID_TOP + 17} fontSize={h === 12 ? 9.5 : 11} fontWeight={700} fill="white" textAnchor="middle">
            {h === 12 ? 'Noon' : h % 12}
          </text>
        ),
      )}
      <text x={X1 + 38} y={GRID_TOP + 11} fontSize={10} textAnchor="middle" fill={INK} fontWeight={600}>
        Total
      </text>
      <text x={X1 + 38} y={GRID_TOP + 23} fontSize={10} textAnchor="middle" fill={INK} fontWeight={600}>
        Hours
      </text>

      {DUTY_STATUSES.map((status, i) => {
        const top = ROWS_TOP + i * ROW
        return (
          <g key={status.key}>
            <rect x={X0} y={top} width={X1 - X0} height={ROW} fill="white" stroke={INK} strokeWidth={1} />
            <text x={30} y={top + (status.key === 'on_duty' ? 15 : 22)} fontSize={12} fontWeight={600} fill={INK}>
              {i + 1}. {status.key === 'on_duty' ? 'On Duty' : status.label}
            </text>
            {status.key === 'on_duty' && (
              <text x={44} y={top + 29} fontSize={11} fill={INK}>
                (not driving)
              </text>
            )}
            {Array.from({ length: 24 }, (_, h) => (
              <g key={h}>
                <line x1={xAt(h)} y1={top} x2={xAt(h)} y2={top + ROW} stroke={INK} strokeWidth={0.8} />
                {[1, 2, 3].map((q) => (
                  <line key={q} x1={xAt(h + q / 4)} y1={top} x2={xAt(h + q / 4)} y2={top + (q === 2 ? 14 : 8)} stroke={RULE} strokeWidth={0.8} />
                ))}
              </g>
            ))}
            <line x1={X1 + 14} y1={top + ROW - 6} x2={X1 + 62} y2={top + ROW - 6} stroke={INK} strokeWidth={0.8} />
            <text x={X1 + 38} y={top + ROW - 10} fontSize={14} fontWeight={600} textAnchor="middle" fill={PEN}>
              {formatLogHours(log.totals[status.key])}
            </text>
          </g>
        )
      })}
      <text x={X1 + 38} y={GRID_BOTTOM + 22} fontSize={13} fontWeight={700} textAnchor="middle" fill={PEN}>
        = {formatLogHours(Object.values(log.totals).reduce((a, b) => a + b, 0))}
      </text>

      {/* Duty-status shading + the continuous pen line */}
      {log.segments.map((s, i) => (
        <rect
          key={`fill-${i}`}
          x={xAt(s.start)}
          y={ROWS_TOP + ROW_INDEX[s.status] * ROW + 1}
          width={xAt(s.end) - xAt(s.start)}
          height={ROW - 2}
          fill={DUTY_STATUSES[ROW_INDEX[s.status]].color}
          opacity={0.13}
        />
      ))}
      <path d={statusPath(log)} fill="none" stroke={PEN} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

      {/* -------------------------------------------------------------- remarks */}
      <text x={30} y={GRID_BOTTOM + 32} fontSize={15} fontWeight={700} fill={INK}>
        Remarks
      </text>
      <line x1={30} y1={GRID_BOTTOM + 42} x2={30} y2={GRID_BOTTOM + 250} stroke={INK} strokeWidth={3} />
      {remarks.map((r) => (
        <RemarkMark key={r.start} remark={r} />
      ))}

      <text x={44} y={GRID_BOTTOM + 222} fontSize={12} fontWeight={700} fill={INK}>
        Shipping Documents:
      </text>
      <LineField x={44} y={GRID_BOTTOM + 268} width={300} label="DVL or Manifest No. or" value={details.shippingDoc} />
      <LineField x={44} y={GRID_BOTTOM + 310} width={300} label="Shipper & Commodity" value={details.shipperCommodity} />
      <line x1={30} y1={GRID_BOTTOM + 250} x2={W - 30} y2={GRID_BOTTOM + 250} stroke={INK} strokeWidth={3} />
      <text x={W / 2 + 120} y={GRID_BOTTOM + 282} fontSize={11.5} textAnchor="middle" fill={INK}>
        Enter name of place you reported and where released from work and when and where each change of duty occurred.
      </text>
      <text x={W / 2 + 120} y={GRID_BOTTOM + 298} fontSize={11.5} textAnchor="middle" fill={INK}>
        Use time standard of home terminal.
      </text>

      {/* ---------------------------------------------------------------- recap */}
      <Recap log={log} y={GRID_BOTTOM + 340} />
      {details.driverName && (
        <text x={W - 30} y={H - 14} fontSize={12} textAnchor="end" fill={INK}>
          Driver: <tspan fill={PEN} fontWeight={600}>{details.driverName}</tspan>
          {details.coDriver && (
            <>
              {'   '}Co-driver: <tspan fill={PEN} fontWeight={600}>{details.coDriver}</tspan>
            </>
          )}
        </text>
      )}
    </svg>
  )
}

function statusPath(log: DailyLog): string {
  return log.segments
    .map((s, i) => {
      const y = rowY(ROW_INDEX[s.status])
      return `${i === 0 ? 'M' : 'L'}${xAt(s.start)},${y} H${xAt(s.end)}`
    })
    .join(' ')
}

interface RemarkGroup {
  start: number
  end: number
  location: string
  notes: string[]
}

/** Merge back-to-back changes at the same place (e.g. "Fuel stop → Driving") so labels don't collide. */
function groupRemarks(remarks: LogRemark[]): RemarkGroup[] {
  const groups: RemarkGroup[] = []
  for (const r of remarks) {
    const last = groups.at(-1)
    if (last && last.location === r.location && r.hour - last.end <= 1.01) {
      last.end = r.hour
      last.notes.push(r.note)
    } else {
      groups.push({ start: r.hour, end: r.hour, location: r.location, notes: [r.note] })
    }
  }
  return groups
}

function RemarkMark({ remark }: { remark: RemarkGroup }) {
  const x1 = xAt(remark.start)
  const x2 = xAt(remark.end)
  const top = GRID_BOTTOM + 4
  const y = GRID_BOTTOM + 16
  const note = remark.notes.join(' → ')
  return (
    <g>
      <path d={`M${x1},${top} V${y} H${x2} V${top}`} fill="none" stroke={PEN} strokeWidth={1.4} />
      <g transform={`translate(${(x1 + x2) / 2 + 2}, ${y + 6}) rotate(58)`}>
        <text fontSize={11.5} fontWeight={600} fill={PEN}>
          {truncate(remark.location, 24)}
        </text>
        <text y={12} fontSize={9.5} fill="#475569">
          {truncate(note, 34)}
        </text>
      </g>
    </g>
  )
}

function Recap({ log, y }: { log: DailyLog; y: number }) {
  const { recap } = log
  const col = (x: number, title: string, lines: string[], value?: string) => (
    <g>
      <text x={x} y={y} fontSize={12} fontWeight={700} fill={INK}>
        {title}
      </text>
      {lines.map((line, i) => (
        <text key={line} x={x} y={y + 16 + i * 13} fontSize={10.5} fill={INK}>
          {line}
        </text>
      ))}
      {value !== undefined && (
        <>
          <line x1={x} y1={y + 16 + lines.length * 13 + 14} x2={x + 110} y2={y + 16 + lines.length * 13 + 14} stroke={INK} strokeWidth={0.8} />
          <text x={x + 4} y={y + 16 + lines.length * 13 + 10} fontSize={15} fontWeight={700} fill={PEN}>
            {value}
          </text>
        </>
      )}
    </g>
  )
  return (
    <g>
      {col(30, 'Recap:', ['Complete at', 'end of day'])}
      {col(150, 'On duty hours', ['today, Total', 'lines 3 & 4'], formatLogHours(recap.on_duty_today))}
      <text x={300} y={y - 18} fontSize={12} fontWeight={700} fill={INK}>
        70 Hour / 8 Day Drivers
      </text>
      {col(300, 'A.', ['Total hours on duty', 'last 8 days including', 'today'], formatLogHours(recap.cycle_used))}
      {col(470, 'B.', ['Total hours available', 'tomorrow 70 hr.', 'minus A*'], formatLogHours(recap.available_tomorrow))}
      {col(640, 'C.', ['Total hours on duty', 'last 7 days including', 'today'], '—')}
      <text x={850} y={y + 16} fontSize={10.5} fill={INK}>
        *If you took 34 consecutive hours
      </text>
      <text x={850} y={y + 29} fontSize={10.5} fill={INK}>
        off duty you have 70 hours available.
      </text>
    </g>
  )
}

function DateField({ x, label, value, width = 70 }: { x: number; label: string; value: string; width?: number }) {
  return (
    <g>
      <text x={x + width / 2} y={42} fontSize={18} fontWeight={600} fill={PEN} textAnchor="middle">
        {value}
      </text>
      <line x1={x} y1={48} x2={x + width} y2={48} stroke={INK} strokeWidth={1} />
      <text x={x + width / 2} y={62} fontSize={10.5} fill={INK} textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

function LineField({ x, y, width, label, value, inline = false }: { x: number; y: number; width: number; label: string; value: string; inline?: boolean }) {
  const offset = inline ? label.length * 9 + 8 : 0
  return (
    <g>
      {inline && (
        <text x={x} y={y - 4} fontSize={15} fontWeight={700} fill={INK}>
          {label}
        </text>
      )}
      <text x={x + offset + 4} y={y - 5} fontSize={14} fontWeight={600} fill={PEN}>
        {truncate(value, Math.floor((width - offset) / 8))}
      </text>
      <line x1={x + offset} y1={y} x2={x + width} y2={y} stroke={INK} strokeWidth={1} />
      {!inline && (
        <text x={x + width / 2} y={y + 14} fontSize={10.5} fill={INK} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  )
}

function BoxField({ x, y, label, value }: { x: number; y: number; label: string; value: string }) {
  return (
    <g>
      <rect x={x} y={y} width={170} height={40} fill="white" stroke={INK} strokeWidth={1.2} />
      <text x={x + 85} y={y + 27} fontSize={17} fontWeight={700} fill={PEN} textAnchor="middle">
        {value}
      </text>
      <text x={x + 85} y={y + 54} fontSize={10.5} fill={INK} textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)
