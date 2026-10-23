import type { PlayerView, RoundSubmission } from '../api/quiz-contract'
import { Leaderboard } from '../components/Leaderboard'
import { RoundPlayer } from '../components/rounds/RoundPlayer'

interface PlayerScreenProps {
  view: PlayerView
  busy: boolean
  error: string | null
  reconnecting: boolean
  onAnswer: (submission: RoundSubmission) => Promise<void>
  onLeave: () => void
}

export function PlayerScreen({ view, busy, error, reconnecting, onAnswer, onLeave }: PlayerScreenProps) {
  const ownRank = view.leaderboard?.find((entry) => entry.displayName === view.displayName)?.rank

  return (
    <main className="player-screen">
      <section className="player-panel">
        <div className="player-topline">
          <span>{view.displayName.toUpperCase()} <i className="status-dot" /> {reconnecting ? 'RECONNECTING' : 'LIVE'}</span>
          <div className="player-points"><strong>{view.totalPoints.toLocaleString()}</strong><span>PTS</span></div>
        </div>

        {view.phase === 'ready' && (
          <div className="player-waiting">
            <span className="player-round">YOU'RE IN</span>
            <h1>You're up<br />when the room is.</h1>
            <p>Waiting for the host to start.</p>
          </div>
        )}

        {view.roundItem && view.phase !== 'finished' && (
          <RoundPlayer key={`${view.roundItem.type}-${view.roundItem.number}`} item={view.roundItem}
            progress={view.roundProgress ?? null} phase={view.phase} busy={busy} onAnswer={onAnswer} />
        )}

        {view.phase === 'finished' && (
          <div className="player-result" aria-live="polite">
            <span className="player-round">THAT'S A WRAP</span>
            <h1>{ownRank ? `You finished #${ownRank}.` : "That's a wrap."}</h1>
            <div className="points-earned is-correct">
              <strong>{view.totalPoints.toLocaleString()}</strong><span>POINTS</span>
            </div>
            <Leaderboard entries={view.leaderboard ?? []} limit={5} highlightName={view.displayName} />
          </div>
        )}

        {error && <p className="session-error" role="alert">{error}</p>}
        <div className="player-bottomline">
          <span>FINANCE WRAPPED</span>
          <button className="quiet-button" type="button"
            onClick={() => window.confirm('Leave the game on this device?') && onLeave()}>
            Leave
          </button>
        </div>
      </section>
    </main>
  )
}
