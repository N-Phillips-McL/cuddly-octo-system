import { ArrowRight, Smartphone } from 'lucide-react'

interface OpeningScreenProps {
  year: number
  joinUrl: string
  onHost: () => void
}

export function OpeningScreen({ year, joinUrl, onHost }: OpeningScreenProps) {
  return (
    <main className="opening-screen">
      <section className="opening-copy">
        <p className="eyebrow">
          <span>FINANCE TEAM</span>
          <span>ANNUAL RECAP / {year}</span>
        </p>
        <h1 className="opening-title">
          <span>FINANCE</span>
          <strong>WRAPPED</strong>
        </h1>
        <p className="opening-deck">Whose Top 3 is it anyway?</p>
        <div className="opening-actions">
          <a className="button button--primary" href={joinUrl}>
            <Smartphone aria-hidden="true" size={18} /> Join the quiz
          </a>
          <button className="button button--outline" type="button" onClick={onHost}>
            Host <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      </section>
      <aside className="opening-art" aria-hidden="true">
        <div className="opening-art__topline">
          <span>FINANCE WRAPPED</span>
          <span>{year}</span>
        </div>
        <div className="rank-ribbon">
          <div className="rank-ribbon__row"><strong>03</strong><span>THE CLUE</span><i /></div>
          <div className="rank-ribbon__row"><strong>02</strong><span>THE ROOM</span><i /></div>
          <div className="rank-ribbon__row"><strong>01</strong><span>THE REVEAL</span><i /></div>
        </div>
        <div className="opening-art__bottomline">
          <span>WHOSE TOP 3?</span>
          <span>{year} / FINANCE WRAPPED</span>
        </div>
        <span className="opening-stamp">FW<br />{String(year).slice(-2)}</span>
      </aside>
    </main>
  )
}
