import { useEffect, useState } from 'react'
import { compatibilityTierLabel, type PublicRoundItem, type QuizPhase } from '../../api/quiz-contract'

interface RoundStageProps {
  item: PublicRoundItem | null
  phase: QuizPhase
  joinCode?: string | null
  joinUrl?: string
  compact?: boolean
}

function Countdown({ deadline }: { deadline: string | null }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => {
      window.clearTimeout(firstTick)
      window.clearInterval(timer)
    }
  }, [])

  const remaining = deadline && now !== null ? Math.max(0, (Date.parse(deadline) - now) / 1000) : 5
  return <strong className="round-countdown" aria-label={`${Math.ceil(remaining)} seconds remaining`}>{Math.ceil(remaining)}</strong>
}

function Waiting({ joinCode, joinUrl }: { joinCode: string | null; joinUrl?: string }) {
  return (
    <section className="round-stage round-stage--waiting">
      <p className="stage-kicker">THE ROOM IS READY</p>
      <h2>TAKE YOUR<br /><span>POSITIONS.</span></h2>
      {joinCode ? (
        <div className="join-code" aria-label="Join code">
          <span className="join-code__label">JOIN AT {joinUrl ?? 'THE PLAYER LINK'}</span>
          <strong className="join-code__value">{joinCode}</strong>
        </div>
      ) : <p className="stage-subtitle">Joining is closed.</p>}
    </section>
  )
}

export function RoundStage({ item, phase, joinCode = null, joinUrl, compact = false }: RoundStageProps) {
  if (phase === 'ready' || !item) {
    return <Waiting joinCode={joinCode} joinUrl={joinUrl} />
  }

  const base = compact ? 'round-stage round-stage--compact' : 'round-stage'
  const reveal = phase === 'revealed' || phase === 'finished'

  if (item.type === 'who-am-i') {
    return (
      <section className={base}>
        <p className="stage-kicker">ROUND 01 <span>/</span> WHO AM I? <span>/</span> CLUE {item.clueNumber} OF 4</p>
        <h2>WHO<br /><span>AM I?</span></h2>
        <ol className="round-clues">
          {item.clues.map((clue, index) => (
            <li key={clue.id} className={index + 1 === item.clueNumber && phase === 'question' ? 'is-current' : ''}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{clue.text}</strong>
            </li>
          ))}
        </ol>
        {reveal && item.answerParticipantId && (
          <div className="round-reveal"><span>THE ANSWER</span>
            <strong>{item.participants.find((person) => person.id === item.answerParticipantId)?.displayName}</strong>
          </div>
        )}
      </section>
    )
  }

  if (item.type === 'connections') {
    const groupByTile = new Map(item.groups?.flatMap((group, index) =>
      group.tileIds.map((tileId) => [tileId, index + 1] as const),
    ) ?? [])
    return (
      <section className={`${base} round-stage--connections`}>
        <p className="stage-kicker">ROUND 02 <span>/</span> CONNECTIONS <span>/</span> BOARD {item.boardNumber} OF {item.boardCount}</p>
        <div className="round-stage__heading-row">
          <h2>FIND THE<br /><span>CONNECTIONS.</span></h2>
          <div className="round-room-progress"><strong>{item.roomSolvedGroupCount}</strong><span>ROOM<br />SOLVES</span></div>
        </div>
        <div className="connections-board" aria-label="Sixteen tile Connections board">
          {item.tiles.map((tile) => {
            const groupId = groupByTile.get(tile.id)
            return <div className={groupId ? `connections-stage-tile is-revealed is-revealed--${groupId}` : 'connections-stage-tile'} key={tile.id}>{tile.label}</div>
          })}
        </div>
        {reveal && item.groups && (
          <div className="connections-reveal" aria-label="Connections">
            {item.groups.map((group) => <strong key={group.id}>{group.label}</strong>)}
          </div>
        )}
      </section>
    )
  }

  if (item.type === 'musical-matches') {
    return (
      <section className={base}>
        <p className="stage-kicker">ROUND 03 <span>/</span> MUSICAL MATCHES</p>
        <h2>DO THEY<br /><span>HARMONISE?</span></h2>
        <div className="match-pair">
          <strong>{item.firstParticipant.displayName}</strong><span>+</span><strong>{item.secondParticipant.displayName}</strong>
        </div>
        {reveal && item.actualScore !== null && (
          <div className="match-reveal" aria-live="polite">
            <strong className="match-score">{item.actualScore}<small>%</small></strong>
            <span className="match-tier">{item.tier ? compatibilityTierLabel(item.tier) : ''}</span>
            <ul>{item.reasons?.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className={`${base} round-stage--finale`}>
      <p className="stage-kicker">ROUND 04 <span>/</span> THE FINALE</p>
      <h2>THIS<br /><span>OR THAT?</span></h2>
      <p className="finale-prompt">{item.prompt}</p>
      <div className="finale-choices finale-choices--stage">
        {item.choices.map((choice, index) => <div className={`finale-choice finale-choice--${index + 1}`} key={choice.id}>{choice.displayName}</div>)}
      </div>
      {phase === 'question' && <Countdown key={item.phaseEndsAt} deadline={item.phaseEndsAt} />}
      {reveal && item.correctChoiceId && (
        <p className="finale-answer">THE ROOM CHOSE <strong>{item.choices.find((choice) => choice.id === item.correctChoiceId)?.displayName}</strong></p>
      )}
    </section>
  )
}
