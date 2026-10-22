import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'

interface HostSignInProps {
  busy: boolean
  error: string | null
  onSignIn: (email: string, password: string) => Promise<void>
}

export function HostSignIn({ busy, error, onSignIn }: HostSignInProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    void onSignIn(email.trim(), password)
  }

  return (
    <main className="join-screen">
      <form className="join-form" onSubmit={submit}>
        <span className="eyebrow">HOST</span>
        <h1>Sign in to run the room.</h1>
        <label className="field">
          <span className="field__label">Email</span>
          <input className="field__input" type="email" autoComplete="username" required value={email}
            onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input className="field__input" type="password" autoComplete="current-password" required value={password}
            onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <p className="session-error" role="alert">{error}</p>}
        <button className="button button--primary button--wide" type="submit" disabled={busy}>
          Sign in <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>
    </main>
  )
}
