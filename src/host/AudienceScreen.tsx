import { ArrowLeft } from 'lucide-react'
import type { HostView } from '../api/quiz-contract'
import { QuestionStage } from '../components/QuestionStage'

interface AudienceScreenProps {
  view: HostView
  joinUrl: string
  onBack: () => void
}

export function AudienceScreen({ view, joinUrl, onBack }: AudienceScreenProps) {
  const game = view.game
  const question = game?.question ?? null
  return (
    <main className="audience-screen">
      <div className="audience-topline">
        <span>FINANCE WRAPPED / {view.summary.eventYear}</span>
        <span>{question ? `ROUND ${String(question.number).padStart(2, '0')} / ${question.count}` : 'LOBBY'}</span>
      </div>
      <QuestionStage question={question} phase={game?.phase ?? 'ready'}
        joinCode={game?.joinOpen ? game.joinCode : null} joinUrl={joinUrl} />
      <footer className="audience-footer">
        <span>
          {game?.joinOpen ? `JOIN CODE ${game.joinCode}` : 'JOINING CLOSED'} · {game?.players.length ?? 0} PLAYERS
        </span>
        <button className="quiet-button" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={17} /> Host controls
        </button>
      </footer>
    </main>
  )
}
