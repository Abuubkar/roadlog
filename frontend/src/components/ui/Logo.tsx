/** RoadLog mark: a duty-status step line, the core shape of every ELD log. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#0c66e4" />
      <path d="M6 11h6v5h5v5h9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="21" r="2.2" fill="#fff" />
    </svg>
  )
}
