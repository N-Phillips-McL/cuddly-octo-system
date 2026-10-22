import { QuizApiError } from '../api/quiz-client'

export type SessionProblem =
  | { kind: 'rejoin'; message: string }
  | { kind: 'reconnecting' }
  | { kind: 'message'; message: string }

export function classifyError(error: unknown): SessionProblem {
  if (!(error instanceof QuizApiError)) {
    return { kind: 'reconnecting' }
  }
  if (error.status === 401) {
    return { kind: 'rejoin', message: error.message }
  }
  if (error.status === 0 || error.status >= 500) {
    return { kind: 'reconnecting' }
  }
  return { kind: 'message', message: error.message }
}