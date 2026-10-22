import { SUPABASE_CONFIG, type SupabaseConfig } from '../config/supabase-config'
import { readError } from './quiz-contract'

export class QuizApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'QuizApiError'
    this.status = status
  }
}

export interface CallOptions {
  hostAccessToken?: string
  playerToken?: string
  signal?: AbortSignal
}

export type CallQuiz = (action: string, payload?: Record<string, unknown>, options?: CallOptions) => Promise<unknown>

export const REQUEST_TIMEOUT_MS = 10_000

export function createQuizClient(
  config: SupabaseConfig | null,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): CallQuiz {
  return async (action, payload = {}, options = {}) => {
    if (!config) {
      throw new QuizApiError(0, 'The quiz server is not configured.')
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: config.publishableKey,
    }
    if (options.hostAccessToken) {
      headers.Authorization = `Bearer ${options.hostAccessToken}`
    }
    if (options.playerToken) {
      headers['x-player-token'] = options.playerToken
    }

    // A hung request would otherwise leave buttons disabled until the page is reloaded. AbortSignal.any is
    // avoided because older phone browsers lack it.
    const controller = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    const forwardAbort = () => controller.abort(options.signal?.reason)
    if (options.signal?.aborted) {
      forwardAbort()
    } else {
      options.signal?.addEventListener('abort', forwardAbort, { once: true })
    }

    try {
      let response: Response
      try {
        response = await fetchImpl(`${config.url}/functions/v1/quiz`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...payload, action }),
          signal: controller.signal,
        })
      } catch (error) {
        if (timedOut) {
          throw new QuizApiError(0, 'The quiz server took too long to reply.')
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }
        throw new QuizApiError(0, 'Cannot reach the quiz server.')
      }

      const body: unknown = await response.json().catch(() => null)
      if (timedOut) {
        throw new QuizApiError(0, 'The quiz server took too long to reply.')
      }
      if (!response.ok) {
        throw new QuizApiError(response.status, readError(body, response.status))
      }
      return body
    } finally {
      clearTimeout(timer)
      options.signal?.removeEventListener('abort', forwardAbort)
    }
  }
}

export const callQuiz = createQuizClient(SUPABASE_CONFIG)
