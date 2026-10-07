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
  color: string
}

export function LocationInput({ label, placeholder, value, onChange, icon: Icon, color }: Props) {
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
    <div className="relative min-w-0">
      <label htmlFor={id} className="eyebrow mb-[5px] block">
        {label}
      </label>
      <div className="field">
        <Icon size={16} style={{ color }} className="shrink-0" />
        <input
          id={id}
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
        {loading && <Loader2 size={14} className="shrink-0 animate-spin text-ink-3" />}
      </div>
      {showList && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-[1200] mt-1 w-full min-w-64 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-[0_12px_32px_-12px_rgba(15,26,46,.35)]"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          {results.map((place, i) => (
            <li key={`${place.label}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full items-start gap-2 px-3 py-2 text-left ${i === active ? 'bg-canvas' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(place)}
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-ink-3" />
                <span className="text-ink-2">{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
