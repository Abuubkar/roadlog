import { Loader2, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { searchPlaces } from '../../api/client'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { LocationValue, Place } from '../../types/trip'

interface Props {
  label: string
  placeholder: string
  value: LocationValue
  onChange: (value: LocationValue) => void
  icon: LucideIcon
  accent: string
}

export function LocationInput({ label, placeholder, value, onChange, icon: Icon, accent }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [found, setFound] = useState<{ query: string; places: Place[] }>({ query: '', places: [] })
  const [active, setActive] = useState(0)
  const query = useDebouncedValue(value.text.trim(), 300)
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const shouldSearch = !value.place && query.length >= 3
  const loading = shouldSearch && found.query !== query
  const results = shouldSearch && found.query === query ? found.places : []

  useEffect(() => {
    if (!shouldSearch) return
    const controller = new AbortController()
    searchPlaces(query, controller.signal)
      .then((places) => setFound({ query, places }))
      .catch(() => !controller.signal.aborted && setFound({ query, places: [] }))
    return () => controller.abort()
  }, [query, shouldSearch])

  const choose = (place: Place) => {
    onChange({ text: place.label, place })
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') setActive((i) => (i + 1) % results.length)
    else if (e.key === 'ArrowUp') setActive((i) => (i - 1 + results.length) % results.length)
    else if (e.key === 'Enter') choose(results[active])
    else if (e.key === 'Escape') setOpen(false)
    else return
    e.preventDefault()
  }

  const showList = open && results.length > 0

  return (
    <div className="relative">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" style={{ color: accent }}>
          <Icon size={17} strokeWidth={2.25} />
        </span>
        <input
          id={id}
          className="input pr-9 pl-10"
          placeholder={placeholder}
          value={value.text}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          onChange={(e) => {
            onChange({ text: e.target.value, place: null })
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => (blurTimer.current = setTimeout(() => setOpen(false), 150))}
          onKeyDown={onKeyDown}
          required
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-ink-400">
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : value.place ? (
            <span className="size-2 rounded-full bg-emerald-500" title="Location confirmed" />
          ) : null}
        </span>
      </div>
      {showList && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-[1000] mt-1.5 w-full overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-xl shadow-ink-900/10"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          {results.map((place, i) => (
            <li key={`${place.label}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm ${i === active ? 'bg-ink-50' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(place)}
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-ink-400" />
                <span className="text-ink-700">{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
