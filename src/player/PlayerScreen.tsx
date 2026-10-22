import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import type { PlayerView } from '../api/quiz-contract'
import { Leaderboard } from '../components/Leaderboard'

interface PlayerScreenProps {
  view: PlayerView
  busy: boolean
  error: string | null
  reconnecting: boolean
  onAnswer: (answerId: string) => Promise<void>
  onLeave: () => void
}

export function PlayerScreen({ view, busy, error, reconnecting, onAnswer, onLeave }: PlayerScreenProps) {
  const [selection, setSelection] = useState<{ number: number; id: string } | null>(null)
  const question = view.question
  const selectedId = question && selection?.number === question.number ? selection.id : null
  const locked = view.lockedAnswerId !== null
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

        {view.phase === 'question' && question && (
          <div className="player-question">
            <span className="player-round">
              ROUND {String(question.number).padStart(2, '0')} / {question.count} · WHOSE TOP 3?
            </span>
            <h1>Who does<br />this sound like?</h1>
            <ol className="player-clues" aria-label={`Ranked Top 3 ${question.category}`}>
              {question.clues.map((clue) => (
                <li key={`${clue.rank}-${clue.label}`}>
                  <span className="player-clue-rank">{clue.rank}</span>
                  <div className="player-clue-detail">
                    <strong>{clue.label}</strong>
                    {clue.credit && <small>{clue.credit}</small>}
                  </div>
                </li>
              ))}
            </ol>
            {!locked ? (
              <div className="player-options" role="group" aria-label="Choose a participant">
                {question.options.map((option, index) => (
                  <button className={selectedId === option.id ? 'player-option is-selected' : 'player-option'}
                    type="button" aria-pressed={selectedId === option.id} key={option.id}
                    onClick={() => setSelection({ number: question.number, id: option.id })}>
                    <span>{`0${index + 1}`}</span>{option.displayName}
                    <ArrowRight aria-hidden="true" size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="submitted-state" role="status">
                <Check aria-hidden="true" size={22} /> Answer locked. Waiting for the reveal.
              </div>
            )}
            <button className="button button--primary button--wide player-submit" type="button"
              disabled={selectedId === null || locked || busy}
              onClick={() => selectedId && void onAnswer(selectedId)}>
              Lock in answer <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        )}

        {view.phase === 'revealed' && view.lastResult && (
          <div className="player-result" aria-live="polite">
            <span className="player-round">THE REVEAL</span>
            <h1>
              {view.lastResult.answerId === null
                ? 'No answer this time.'
                : view.lastResult.correct ? 'On the money.' : 'Not your round.'}
            </h1>
            <p>
              It was {question?.options.find((option) => option.id === question.correctAnswerId)?.displayName ?? '…'}.
            </p>
            <div className={view.lastResult.correct ? 'points-earned is-correct' : 'points-earned'}>
              <strong>{view.lastResult.points.toLocaleString()}</strong><span>POINTS EARNED</span>
            </div>
          </div>
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
