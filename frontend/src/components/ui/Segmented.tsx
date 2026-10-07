interface Props<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <div className="inline-flex overflow-hidden rounded-[7px] border border-line" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-[5px] text-xs font-medium transition ${o.value === value ? 'bg-brand-soft text-brand-ink' : 'bg-white text-ink-2 hover:bg-[#f6f8fb]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
