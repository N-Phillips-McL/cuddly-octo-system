import type { ReactNode } from 'react'

interface SiteHeaderProps {
  year: number
  status: string
  nav?: ReactNode
  minimal?: boolean
  onHome?: () => void
}

export function SiteHeader({ year, status, nav, minimal = false, onHome }: SiteHeaderProps) {
  const wordmark = (
    <>
      <span className="wordmark__symbol">FW</span>
      <span className="wordmark__year">{year}</span>
    </>
  )
  return (
    <header className={minimal ? 'site-header site-header--minimal' : 'site-header'}>
      {onHome ? (
        <button className="wordmark" type="button" onClick={onHome}>
          {wordmark}
        </button>
      ) : (
        <span className="wordmark">{wordmark}</span>
      )}
      {nav}
      <div className="header-status">
        <span className="status-dot" /> {status}
      </div>
    </header>
  )
}
