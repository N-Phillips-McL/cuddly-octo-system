import { ArrowRight, Check, Copy, MonitorPlay, Play, X } from 'lucide-react'
import type { HostView } from '../api/quiz-contract'
import { QuestionStage } from '../components/QuestionStage'
import type { HostAction } from '../hooks/use-host-session'

interface HostScreenProps {
  view: HostView
  joinUrl: string
  busy: boolean
  error: string | null
  onAct: (action: HostAction, payload?: Record<string, unknown>) => Promise<void>
  onAudience: () => void
  onFinale: () => void
}

const HEADINGS = {
  ready: 'Waiting for players.',
  question: 'Question is live.',
  revealed: 'Answer revealed.',
  finished: 'Game complete.',
} as const

export function HostScreen({ view, joinUrl, busy, error, onAct, onAudience, onFinale }: HostScreenProps) {
  const { game, summary } = view

  if (!game) {
    return (
      <main className="host-screen">
        <div className="screen-heading">
          <p className="eyebrow"><span>HOST MODE</span><span>{summary.questionCount} QUESTIONS LOADED</span></p>
          <h1>Set the room.</h1>
        </div>
        <div className="host-console host-console--solo">
          <p className="console-footnote">
            {summary.questionCount === 0
              ? 'No questions are loaded. Apply the seed SQL first.'
              : 'Opening a game creates a fresh join code.'}
          </p>
          <button className="button button--primary button--wide" type="button" disabled={busy || summary.questionCount === 0}
            onClick={() => void onAct('open')}>
            <Play aria-hidden="true" size={17} fill="currentColor" /> Open a game
          </button>
          {error && <p className="session-error" role="alert">{error}</p>}
        </div>
      </main>
    )
  }

  const answered = game.players.filter((player) => player.answered).length
  const question = game.question
  const isLast = question !== null && question.number === question.count

  function confirmThen(message: string, action: HostAction, payload?: Record<string, unknown>) {
    if (window.confirm(message)) {
      void onAct(action, payload)
    }
  }

  return (
    <main className="host-screen">
      <div className="screen-heading">
        <p className="eyebrow"><span>HOST MODE</span><span>{game.players.length} PLAYERS</span></p>
        <h1>Run the room.</h1>
      </div>
      <div className="host-layout">
        <section className="stage-preview" aria-label="Big screen preview">
          <div className="stage-preview__bar">
            <span>BIG SCREEN PREVIEW</span>
            <span><i className="status-dot" /> {question ? `${question.number} / ${question.count}` : 'LOBBY'}</span>
          </div>
          <QuestionStage question={question} phase={game.phase} joinCode={game.joinOpen ? game.joinCode : null}
            joinUrl={joinUrl} compact />
        </section>
        <aside className="host-console">
          <div className="console-heading">
            <div>
              <span className="console-label">CONTROL DECK</span>
              <h2>{HEADINGS[game.phase]}</h2>
            </div>
            <span className="round-marker">{String(question?.number ?? 0).padStart(2, '0')}</span>
          </div>

          {game.phase === 'question' && (
            <div className="console-step">
              <span className="step-mark is-current">{answered === game.players.length ? <Check size={14} /> : answered}</span>
              <div><strong>{answered} of {game.players.length} answered</strong><small>Reveal when the room is ready</small></div>
            </div>
          )}

          <div className="console-actions">
            {game.phase === 'ready' && (
              <button className="button button--primary button--wide" type="button" disabled={busy}
                onClick={() => void onAct('start')}>
                <Play aria-hidden="true" size={17} fill="currentColor" /> Start the quiz
              </button>
            )}
            {game.phase === 'question' && (
              <button className="button button--primary button--wide" type="button" disabled={busy}
                onClick={() => void onAct('reveal')}>
                Reveal answer <ArrowRight aria-hidden="true" size={17} />
              </button>
            )}
            {game.phase === 'revealed' && (
              <button className="button button--primary button--wide" type="button" disabled={busy}
                onClick={() => void onAct('next')}>
                {isLast ? 'Finish the quiz' : 'Next question'} <ArrowRight aria-hidden="true" size={17} />
              </button>
            )}
            {game.phase === 'finished' && (
              <button className="button button--primary button--wide" type="button" onClick={onFinale}>
                Show the finale <ArrowRight aria-hidden="true" size={17} />
              </button>
            )}
            <button className="quiet-button" type="button" onClick={onAudience}>
              Big screen <MonitorPlay aria-hidden="true" size={17} />
            </button>

            <div className="phone-join">
              <span className="console-label">JOIN CODE {game.joinOpen ? '' : '(LOCKED)'}</span>
              <strong className="join-code__value join-code__value--small">{game.joinCode}</strong>
              <button className="icon-button" type="button" title="Copy player link" aria-label="Copy player link"
                onClick={() => void navigator.clipboard.writeText(joinUrl)}>
                <Copy aria-hidden="true" size={16} />
              </button>
            </div>
            <div className="console-links">
              <button className="quiet-button" type="button" disabled={busy}
                onClick={() => void onAct('set-joining', { open: !game.joinOpen })}>
                {game.joinOpen ? 'Lock joining' : 'Reopen joining'}
              </button>
              <button className="quiet-button" type="button" disabled={busy}
                onClick={() => confirmThen('Replace the join code? Players already in stay in.', 'rotate-code')}>
                New code
              </button>
            </div>

            <ul className="host-players" aria-label="Players">
              {game.players.map((player) => (
                <li className="host-players__item" key={player.id}>
                  <span className={player.answered ? 'host-players__state is-answered' : 'host-players__state'} />
                  <span className="host-players__name">{player.displayName}</span>
                  <span className="host-players__points">{player.points.toLocaleString()}</span>
                  <button className="icon-button" type="button" aria-label={`Remove ${player.displayName}`} disabled={busy}
                    onClick={() => confirmThen(`Remove ${player.displayName}?`, 'remove-player', { playerId: player.id })}>
                    <X aria-hidden="true" size={14} />
                  </button>
                </li>
              ))}
            </ul>

            {error && <p className="session-error" role="alert">{error}</p>}
            <button className="finale-link" type="button" disabled={busy}
              onClick={() => confirmThen('End this game for everyone?', 'end')}>
              End game <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
