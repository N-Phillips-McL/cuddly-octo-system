import { Check } from 'lucide-react'
import type { PublicQuestion, QuizPhase } from '../api/quiz-contract'

interface QuestionStageProps {
  question: PublicQuestion | null
  phase: QuizPhase
  joinCode?: string | null
  joinUrl?: string
  compact?: boolean
}

export function QuestionStage({ question, phase, joinCode = null, joinUrl, compact = false }: QuestionStageProps) {
  const base = compact ? 'question-stage question-stage--compact' : 'question-stage'

  if (phase === 'finished') {
    return (
      <section className={`${base} is-finished`}>
        <p className="stage-kicker">
          {question?.count ?? 0} QUESTIONS <span>/</span> COMPLETE
        </p>
        <h2>
          THAT'S A<br />
          <span>WRAP.</span>
        </h2>
        <p className="stage-subtitle">Scores are in.</p>
      </section>
    )
  }

  if (phase === 'ready' || !question) {
    return (
      <section className={`${base} is-ready`}>
        <p className="stage-kicker">GET YOUR PHONES OUT</p>
        <h2>
          THE ROOM
          <br />
          IS READY.
        </h2>
        {joinCode ? (
          <div className="join-code" aria-label="Join code">
            <span className="join-code__label">JOIN AT {joinUrl ?? 'THE PLAYER LINK'}</span>
            <strong className="join-code__value">{joinCode}</strong>
          </div>
        ) : (
          <p className="stage-subtitle">Joining is closed.</p>
        )}
      </section>
    )
  }

  const correct = question.options.find((option) => option.id === question.correctAnswerId)

  return (
    <section className={base}>
      <div className="stage-kicker">
        ROUND {String(question.number).padStart(2, '0')} <span>/</span> {question.count} · WHOSE TOP 3{' '}
        {question.category.toUpperCase()}?
      </div>
      <h2>
        WHOSE TOP 3<br />
        <span>IS THIS?</span>
      </h2>
      <ol className="clue-list">
        {question.clues.map((clue) => (
          <li key={`${clue.rank}-${clue.label}`}>
            <span className="clue-rank">{clue.rank}</span>
            <span className="clue-title">{clue.label}</span>
            {clue.credit && <span className="clue-credit">{clue.credit}</span>}
          </li>
        ))}
      </ol>
      <div className="audience-options" aria-label="Participant options">
        {question.options.map((option, index) => {
          const isCorrect = option.id === question.correctAnswerId
          return (
            <div className={isCorrect ? 'audience-option is-correct' : 'audience-option'} key={option.id}>
              <span className="audience-option__index">0{index + 1}</span>
              <span>{option.displayName}</span>
              {isCorrect && <Check aria-hidden="true" size={20} />}
            </div>
          )
        })}
      </div>
      {correct && (
        <div className="answer-reveal" aria-live="polite">
          <span>THE ANSWER</span>
          <strong>{correct.displayName}</strong>
        </div>
      )}
    </section>
  )
}
