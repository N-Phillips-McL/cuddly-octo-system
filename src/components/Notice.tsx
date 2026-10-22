import type { ReactNode } from 'react'

interface NoticeProps {
  kicker: string
  title: string
  children?: ReactNode
}

export function Notice({ kicker, title, children }: NoticeProps) {
  return (
    <main className="data-issue-screen" role="status">
      <span className="eyebrow">{kicker}</span>
      <h1>{title}</h1>
      {children}
    </main>
  )
}
