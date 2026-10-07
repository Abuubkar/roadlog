import { FileText, LayoutDashboard, MapPinned, Signpost } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import driverPhoto from '../../assets/avatars/driver.jpg'
import type { LogDetails } from '../../types/trip'
import { Logo } from '../ui/Logo'
import type { Tab } from './PageHeader'

const NAV: { section: string; items: { icon: LucideIcon; label: string; tab: Tab }[] }[] = [
  {
    section: 'Trip',
    items: [
      { icon: LayoutDashboard, label: 'Overview', tab: 'overview' },
      { icon: MapPinned, label: 'Route & stops', tab: 'route' },
    ],
  },
  { section: 'Compliance', items: [{ icon: FileText, label: 'Daily logs', tab: 'logs' }] },
  { section: 'Navigation', items: [{ icon: Signpost, label: 'Directions', tab: 'directions' }] },
]

interface Props {
  details: LogDetails
  tab: Tab
  hasPlan: boolean
  onTab: (tab: Tab) => void
}

export function Sidebar({ details, tab, hasPlan, onTab }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen flex-col bg-nav text-nav-text lg:flex print:hidden">
      <div className="flex items-center gap-2.5 px-[18px] pt-[18px] pb-3.5">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight text-white">RoadLog</span>
      </div>

      <div className="mx-3 mb-1.5 flex items-center gap-2.5 rounded-lg border border-nav-line px-2.5 py-2 text-[#dfe5f0]">
        <span className="grid size-[22px] place-items-center rounded-[5px] bg-[#e9edf4] text-[10px] font-bold text-nav">
          {initials(details.carrier || 'Carrier')}
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[12.5px] font-semibold">{details.carrier || 'Your carrier'}</div>
          <div className="truncate text-[11px] text-nav-text">{details.mainOffice || 'Main office'}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className="px-[18px] pt-3.5 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-[#5d6a83] uppercase">{section}</div>
            {items.map(({ icon: Icon, label, tab: target }) => {
              const active = tab === target
              const disabled = !hasPlan && target !== 'overview'
              return (
                <button
                  key={label}
                  onClick={() => onTab(target)}
                  disabled={disabled}
                  aria-current={active ? 'page' : undefined}
                  className={`mx-2.5 my-px flex w-[calc(100%-1.25rem)] items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active ? 'bg-nav-active text-white' : 'hover:bg-nav-2 hover:text-[#dfe5f0]'
                  }`}
                >
                  <Icon size={17} className={active ? 'text-[#5ea2ff]' : ''} />
                  {label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-[#1b2538] px-[18px] py-3.5">
        <img src={driverPhoto} alt="" className="size-8 rounded-full object-cover shadow-[0_0_0_2px_#0b1220,0_0_0_3px_#2c3a55]" />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[12.5px] font-semibold text-[#e6ebf3]">{details.driverName || 'Driver'}</div>
          <div className="truncate text-[11px]">{details.vehicles ? `${details.vehicles.split('/')[0].trim()} · ELD connected` : 'ELD connected'}</div>
        </div>
        <span className="ml-auto size-[7px] shrink-0 rounded-full bg-ok shadow-[0_0_0_3px_rgba(31,157,85,.15)]" />
      </div>
    </aside>
  )
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
