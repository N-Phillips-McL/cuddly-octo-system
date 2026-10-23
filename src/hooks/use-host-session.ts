import { useCallback, useEffect, useState } from 'react'
import { callQuiz } from '../api/quiz-client'
import { readHostView, type HostView } from '../api/quiz-contract'
import { supabaseAuth } from '../api/supabase-auth'
import { classifyError } from './session-error'
import { POLL_INTERVAL_MS } from './use-player-session'
import { usePolling } from './use-polling'

export type HostAction =
  | 'open'
  | 'start'
  | 'release-clue'
  | 'reveal'
  | 'next'
  | 'set-joining'
  | 'rotate-code'
  | 'remove-player'
  | 'end'

const FINALE_POLL_INTERVAL_MS = 250

export interface HostSession {
  configured: boolean
  checking: boolean
  signedIn: boolean
  view: HostView | null
  reconnecting: boolean
  error: string | null
  busy: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  act: (action: HostAction, payload?: Record<string, unknown>) => Promise<void>
}

export function useHostSession(): HostSession {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [checking, setChecking] = useState(supabaseAuth !== null)
  const [view, setView] = useState<HostView | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pollingIntervalMs = view?.game?.roundItem?.type === 'finale' ? FINALE_POLL_INTERVAL_MS : POLL_INTERVAL_MS

  useEffect(() => {
    if (!supabaseAuth) {
      return
    }
    // Fires INITIAL_SESSION immediately, then on every sign-in, sign-out and token refresh.
    const { data } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null)
      setChecking(false)
      if (!session) {
        setView(null)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const handle = useCallback((caught: unknown) => {
    const problem = classifyError(caught)
    if (problem.kind === 'rejoin') {
      setError('Your sign-in has expired. Sign in again.')
      void supabaseAuth?.auth.signOut()
    } else if (problem.kind === 'reconnecting') {
      setReconnecting(true)
    } else {
      setError(problem.message)
    }
  }, [])

  usePolling(
    async (signal) => {
      if (!accessToken) {
        return
      }
      try {
        const response = await callQuiz('host-state', {}, { hostAccessToken: accessToken, signal })
        if (signal.aborted) {
          return
        }
        const next = readHostView(response)
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
    pollingIntervalMs,
    accessToken !== null,
  )

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabaseAuth) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: signInError } = await supabaseAuth.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Sign-in failed. Check the email and password.')
      }
    } finally {
      setBusy(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabaseAuth?.auth.signOut()
  }, [])

  const act = useCallback(
    async (action: HostAction, payload: Record<string, unknown> = {}) => {
      if (!accessToken) {
        return
      }
      setBusy(true)
      setError(null)
      try {
        const next = readHostView(await callQuiz(action, payload, { hostAccessToken: accessToken }))
        if (next) {
          setView(next)
        }
      } catch (caught) {
        handle(caught)
      } finally {
        setBusy(false)
      }
    },
    [accessToken, handle],
  )

  return {
    configured: supabaseAuth !== null,
    checking,
    signedIn: accessToken !== null,
    view,
    reconnecting,
    error,
    busy,
    signIn,
    signOut,
    act,
  }
}