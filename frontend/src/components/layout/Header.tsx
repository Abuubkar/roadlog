function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-[17px]" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="no-print sticky top-0 z-[1100] border-b border-white/10 bg-ink-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-9" />
        <div className="leading-tight">
          <div className="text-[17px] font-bold tracking-tight text-white">RoadLog</div>
          <div className="text-[11px] text-ink-400">HOS trip planner &amp; ELD daily logs</div>
        </div>
        <span className="ml-3 hidden rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-300 md:inline">
          FMCSA §395 · 70 hr / 8 day
        </span>
        <a
          href="https://github.com/Abuubkar/roadlog"
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink-300 transition hover:bg-white/5 hover:text-white"
        >
          <GithubMark /> <span className="hidden sm:inline">Source</span>
        </a>
      </div>
    </header>
  )
}
