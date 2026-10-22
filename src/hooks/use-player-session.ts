import { useCallback, useState } from 'react'
import { callQuiz } from '../api/quiz-client'
import { readJoinResponse, readPlayerView, type PlayerView } from '../api/quiz-contract'
import { classifyError } from './session-error'
import { usePolling } from './use-polling'

const TOKEN_KEY = 'finance-wrapped.player-token'
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/
export const POLL_INTERVAL_MS = 1500

function readStoredToken(): string | null {
  try {
    const token = window.sessionStorage.getItem(TOKEN_KEY)
    return token && TOKEN_SHAPE.test(token) ? token : null
  } catch {
    return null
  }
}

export interface PlayerSession {
  view: PlayerView | null
  hasToken: boolean
  reconnecting: boolean
  error: string | null
  busy: boolean
  join: (code: string, displayName: string) => Promise<void>
  answer: (answerId: string) => Promise<void>
  leave: () => void
}

export function usePlayerSession(): PlayerSession {
  const [token, setToken] = useState<string | null>(readStoredToken)
  const [view, setView] = useState<PlayerView | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const forget = useCallback((message: string | null) => {
    window.sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setView(null)
    setReconnecting(false)
    setError(message)
  }, [])

  const handle = useCallback(
    (caught: unknown) => {
      const problem = classifyError(caught)
      if (problem.kind === 'rejoin') {
        forget(problem.message)
      } else if (problem.kind === 'reconnecting') {
        setReconnecting(true)
      } else {
        setError(problem.message)
      }
    },
    [forget],
  )

  usePolling(
    async (signal) => {
      if (!token) {
        return
      }
      try {
        const response = await callQuiz('player-state', {}, { playerToken: token, signal })
        if (signal.aborted) {
          return
        }
        const next = readPlayerView(response)
        if (next) {
          setView(next)
          setReconnecting(false)
        } else {
          setReconnecting(true)
        }
      } catch (caught) {
        if (!signal.aborted) {
          handle(caught)
        }
      }
    },
    POLL_INTERVAL_MS,
    token !== null,
  )

  const join = useCallback(async (code: string, displayName: string) => {
    setBusy(true)
    setError(null)
    try {
      const result = readJoinResponse(await callQuiz('join', { code, displayName }))
      if (!result) {
        setError('The quiz server sent an unexpected reply. Try again.')
        return
      }
      window.sessionStorage.setItem(TOKEN_KEY, result.playerToken)
      setToken(result.playerToken)
      setView(result.view)
    } catch (caught) {
      const problem = classifyError(caught)
      setError(problem.kind === 'reconnecting' ? 'Cannot reach the quiz server. Try again.' : problem.message)
    } finally {
      setBusy(false)
    }
  }, [])

  const answer = useCallback(
    async (answerId: string) => {
      if (!token) {
        return
      }
      setBusy(true)
      setError(null)
      try {
        const next = readPlayerView(await callQuiz('answer', { answerId }, { playerToken: token }))
        if (next) {
          setView(next)
        }
      } catch (caught) {
        handle(caught)
      } finally {
        setBusy(false)
      }
    },
    [token, handle],
  )

  const leave = useCallback(() => forget(null), [forget])

  return { view, hasToken: token !== null, reconnecting, error, busy, join, answer, leave }
}