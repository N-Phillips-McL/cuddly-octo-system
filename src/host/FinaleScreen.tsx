import { ArrowLeft } from 'lucide-react'
import type { HostView } from '../api/quiz-contract'
import { Leaderboard } from '../components/Leaderboard'

interface FinaleScreenProps {
  view: HostView
  onBack: () => void
}

export function FinaleScreen({ view, onBack }: FinaleScreenProps) {
  const { summary, game } = view
  return (
    <main className="finale-screen">
      <div className="finale-overline"><span>FINANCE</span><span>WRAPPED</span><span>{summary.eventYear}</span></div>
      <section className="finale-reveal" aria-label="Final results">
        <p className="eyebrow"><span>THE TEAM</span><span>{summary.profileCount} PROFILES</span></p>
        <strong className="finale-number">{summary.artistCount}</strong>
        <h1>distinct artists.</h1>
        <p>Across {summary.profileCount} profiles in this quiz.</p>
        <Leaderboard entries={game?.leaderboard ?? []} />
      </section>
      <button className="button button--outline finale-back" type="button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" size={18} /> Back to host
      </button>
    </main>
  )
}
