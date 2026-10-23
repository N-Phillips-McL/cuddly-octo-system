import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Check } from 'lucide-react'
import {
  compatibilityTierLabel,
  type PublicRoundItem,
  type PublicRoundProgress,
  type QuizPhase,
  type RoundSubmission,
} from '../../api/quiz-contract'

interface RoundPlayerProps {
  item: PublicRoundItem | null
  progress: PublicRoundProgress | null
  phase: QuizPhase
  busy: boolean
  onAnswer: (submission: RoundSubmission) => Promise<void>
}

function Timer({ deadline, onExpired }: { deadline: string | null; onExpired: Dispatch<SetStateAction<boolean>> }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (deadline && current >= Date.parse(deadline)) onExpired(true)
    }
    const firstTick = window.setTimeout(tick, 0)
    const timer = window.setInterval(tick, 100)
    return () => {
      window.clearTimeout(firstTick)
      window.clearInterval(timer)
    }
  }, [deadline, onExpired])
  const seconds = deadline && now !== null ? Math.max(0, (Date.parse(deadline) - now) / 1000) : 5
  return <div className="player-countdown"><strong>{Math.ceil(seconds)}</strong><span>SECONDS</span></div>
}

function AnswerPoints({ points }: { points: number | null }) {
  return points === null ? null : (
    <div className="round-points-earned"><strong>{points.toLocaleString()}</strong><span>POINTS EARNED</span></div>
  )
}

export function RoundPlayer({ item, progress, phase, busy, onAnswer }: RoundPlayerProps) {
  const [search, setSearch] = useState('')
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [selectedClueNumber, setSelectedClueNumber] = useState<number | null>(null)
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([])
  const [guess, setGuess] = useState(50)
  const [timerExpired, setTimerExpired] = useState(false)

  if (!item || phase === 'ready') {
    return <div className="player-waiting"><span className="player-round">YOU'RE IN</span><h1>You're up<br />when the room is.</h1><p>Waiting for the host to start.</p></div>
  }

  const revealed = phase === 'revealed' || phase === 'finished'

  if (item.type === 'who-am-i') {
    const guessed = progress?.whoAmISolved || (progress?.whoAmIGuesses.some((entry) => entry.clueNumber === item.clueNumber) ?? false)
    const options = item.participants.filter((person) => person.displayName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    const currentSelection = selectedClueNumber === item.clueNumber ? selectedParticipantId : null
    return (
      <div className="round-player-content">
        <span className="player-round">ROUND 01 <span>/</span> WHO AM I? <span>/</span> CLUE {item.clueNumber}</span>
        <h1>Who<br />am I?</h1>
        <ol className="player-clues">
          {item.clues.map((clue, index) => <li key={clue.id}><span className="player-clue-rank">{String(index + 1).padStart(2, '0')}</span><div className="player-clue-detail"><strong>{clue.text}</strong></div></li>)}
        </ol>
        {!revealed && !guessed ? (
          <>
            <label className="round-search-label" htmlFor="who-am-i-search">Search names</label>
            <input id="who-am-i-search" className="round-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type a name" />
            <div className="player-options player-options--names" role="group" aria-label="Choose a name">
              {options.map((person) => (
                <button className={currentSelection === person.id ? 'player-option is-selected' : 'player-option'} type="button" aria-pressed={currentSelection === person.id} key={person.id}
                  onClick={() => { setSelectedClueNumber(item.clueNumber); setSelectedParticipantId(person.id) }}>
                  <span>{person.displayName.slice(0, 1).toUpperCase()}</span>{person.displayName}
                </button>
              ))}
            </div>
            <button className="button button--primary button--wide player-submit" type="button" disabled={!currentSelection || busy}
              onClick={() => currentSelection && void onAnswer({ kind: 'who-am-i', clueNumber: item.clueNumber, participantId: currentSelection })}>
              Lock in guess
            </button>
          </>
        ) : !revealed ? (
          <div className="submitted-state" role="status"><Check aria-hidden="true" size={21} />
            {progress?.whoAmISolved ? 'Answer locked. Waiting for the reveal.' : 'Guess locked. Waiting for the next clue.'}
          </div>
        ) : (
          <div className="round-reveal"><span>THE ANSWER</span><strong>{item.participants.find((person) => person.id === item.answerParticipantId)?.displayName ?? 'Reveal'}</strong><AnswerPoints points={progress?.pointsEarned ?? null} /></div>
        )}
      </div>
    )
  }

  if (item.type === 'connections') {
    const foundGroupByTile = new Map(progress?.solvedTileGroups.flatMap((group, index) =>
      group.tileIds.map((tileId) => [tileId, index + 1] as const),
    ) ?? [])
    const solvedGroupIds = new Set(progress?.solvedGroupIds ?? [])
    return (
      <div className="round-player-content">
        <span className="player-round">ROUND 02 <span>/</span> CONNECTIONS <span>/</span> BOARD {item.boardNumber} OF {item.boardCount}</span>
        <h1>Find four<br />connections.</h1>
        <div className="connection-progress">
          <span>{progress?.solvedGroupIds.length ?? 0} / 4 GROUPS</span><span>{progress?.mistakes ?? 0} MISTAKES</span>
        </div>
        <div className="connections-board connections-board--player" aria-label="Select four tiles">
          {item.tiles.map((tile) => {
            const foundGroup = foundGroupByTile.get(tile.id)
            const found = foundGroup !== undefined
            const selected = selectedTileIds.includes(tile.id)
            return (
              <button type="button" key={tile.id}
                className={`connections-player-tile${found ? ` is-found is-found--${foundGroup}` : ''}${selected ? ' is-selected' : ''}`}
                aria-pressed={selected || found} disabled={found || revealed || busy}
                onClick={() => setSelectedTileIds((current) => selected ? current.filter((id) => id !== tile.id) : current.length < 4 ? [...current, tile.id] : current)}>
                {tile.label}
              </button>
            )
          })}
        </div>
        {!revealed ? (
          <>
            <p className="round-feedback" role="status">Select four tiles, then submit.</p>
            <button className="button button--primary button--wide player-submit" type="button" disabled={selectedTileIds.length !== 4 || busy}
              onClick={() => {
                const submitted = selectedTileIds
                setSelectedTileIds([])
                void onAnswer({ kind: 'connections', tileIds: submitted })
              }}>
              Submit group
            </button>
          </>
        ) : (
          <div className="connections-reveal">
            {item.groups?.map((group) => <strong className={solvedGroupIds.has(group.id) ? 'is-found' : ''} key={group.id}>{group.label}</strong>)}
            <AnswerPoints points={progress?.pointsEarned ?? null} />
          </div>
        )}
      </div>
    )
  }

  if (item.type === 'musical-matches') {
    const locked = progress?.musicalGuess !== null && progress?.musicalGuess !== undefined
    return (
      <div className="round-player-content">
        <span className="player-round">ROUND 03 <span>/</span> MUSICAL MATCHES</span>
        <h1>How well do<br />they match?</h1>
        <div className="match-pair match-pair--player"><strong>{item.firstParticipant.displayName}</strong><span>+</span><strong>{item.secondParticipant.displayName}</strong></div>
        {!revealed && !locked ? (
          <>
            <div className="match-slider-value"><strong>{guess}</strong><span>%</span></div>
            <label className="visually-hidden" htmlFor="match-score">Estimated compatibility from zero to one hundred</label>
            <input id="match-score" className="match-slider" type="range" min="0" max="100" step="1" value={guess} onChange={(event) => setGuess(Number(event.target.value))} />
            <div className="match-slider-scale"><span>NO MATCH</span><span>PERFECT MATCH</span></div>
            <button className="button button--primary button--wide player-submit" type="button" disabled={busy}
              onClick={() => void onAnswer({ kind: 'musical-matches', guess })}>Lock in score</button>
          </>
        ) : !revealed ? (
          <div className="submitted-state" role="status"><Check aria-hidden="true" size={21} /> Estimate locked at {progress?.musicalGuess}%. Waiting for reveal.</div>
        ) : (
          <div className="match-player-reveal">
            <strong>{item.actualScore}<small>%</small></strong>
            <span>{item.tier ? compatibilityTierLabel(item.tier) : ''}</span>
            <ul>{item.reasons?.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            <AnswerPoints points={progress?.pointsEarned ?? null} />
          </div>
        )}
      </div>
    )
  }

  const locked = progress?.finaleChoiceId !== null && progress?.finaleChoiceId !== undefined
  return (
    <div className="round-player-content round-player-content--finale">
      <span className="player-round">ROUND 04 <span>/</span> THE FINALE</span>
      <div className="finale-player-streak"><span>STREAK</span><strong>{progress?.streak ?? 0} <small>×{progress?.multiplier ?? 1}</small></strong></div>
      <h1>{item.prompt}</h1>
      {phase === 'question' && <Timer key={item.phaseEndsAt} deadline={item.phaseEndsAt} onExpired={setTimerExpired} />}
      {!revealed && !locked ? (
        <div className="finale-choices finale-choices--player">
          {item.choices.map((choice, index) => (
            <button className={`finale-choice finale-choice--${index + 1}`} type="button" key={choice.id} disabled={busy || timerExpired}
              onClick={() => void onAnswer({ kind: 'finale', choiceId: choice.id })}>{choice.displayName}</button>
          ))}
        </div>
      ) : !revealed ? (
        <div className="submitted-state" role="status"><Check aria-hidden="true" size={21} /> Locked. Eyes up for the reveal.</div>
      ) : (
        <div className="finale-player-reveal">
          <span>{progress?.finaleChoiceId === item.correctChoiceId ? 'CORRECT' : 'THE ANSWER'}</span>
          <strong>{item.choices.find((choice) => choice.id === item.correctChoiceId)?.displayName}</strong>
          <AnswerPoints points={progress?.pointsEarned ?? null} />
        </div>
      )}
    </div>
  )
}
