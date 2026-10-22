import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'

interface JoinScreenProps {
  busy: boolean
  error: string | null
  onJoin: (code: string, displayName: string) => Promise<void>
}

export function JoinScreen({ busy, error, onJoin }: JoinScreenProps) {
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    void onJoin(code, displayName)
  }

  return (
    <main className="join-screen">
      <form className="join-form" onSubmit={submit}>
        <span className="eyebrow">FINANCE WRAPPED</span>
        <h1>Join the quiz.</h1>
        <label className="field">
          <span className="field__label">Code on the big screen</span>
          <input className="field__input field__input--code" inputMode="text" autoCapitalize="characters"
            autoComplete="off" spellCheck={false} maxLength={7} required value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())} />
        </label>
        <label className="field">
          <span className="field__label">Your name</span>
          <input className="field__input" autoComplete="nickname" maxLength={24} required value={displayName}
            onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        {error && <p className="session-error" role="alert">{error}</p>}
        <button className="button button--primary button--wide" type="submit" disabled={busy}>
          Join <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>
    </main>
  )
}
