// Mirrors supabase/functions/_shared/quiz-core.ts. tsconfig.contract.json fails if they drift.
export type QuizPhase = 'ready' | 'question' | 'revealed' | 'finished'
export type QuizCategory = 'artists' | 'songs'

export interface ClueEntry {
  rank: number
  label: string
  credit: string | null
}

export interface AnswerOption {
  id: string
  displayName: string
}

export interface PublicQuestion {
  number: number
  count: number
  category: QuizCategory
  clues: ClueEntry[]
  options: AnswerOption[]
  correctAnswerId: string | null
}

export interface LeaderboardEntry {
  rank: number
  displayName: string
  points: number
}

export interface PlayerResult {
  answerId: string | null
  correct: boolean
  points: number
}

export interface PlayerView {
  role: 'player'
  phase: QuizPhase
  displayName: string
  question: PublicQuestion | null
  lockedAnswerId: string | null
  lastResult: PlayerResult | null
  totalPoints: number
  leaderboard: LeaderboardEntry[] | null
}

export interface HostPlayer {
  id: string
  displayName: string
  answered: boolean
  points: number
}

export interface HostGame {
  phase: QuizPhase
  joinCode: string
  joinOpen: boolean
  question: PublicQuestion | null
  players: HostPlayer[]
  leaderboard: LeaderboardEntry[]
}

export interface HostSummary {
  eventYear: number
  profileCount: number
  artistCount: number
  questionCount: number
}

export interface HostView {
  role: 'host'
  game: HostGame | null
  summary: HostSummary
}

const PHASES: readonly string[] = ['ready', 'question', 'revealed', 'finished']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard)
}

function isAnswerOption(value: unknown): value is AnswerOption {
  return isRecord(value) && typeof value.id === 'string' && typeof value.displayName === 'string'
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  return (
    isRecord(value) &&
    typeof value.rank === 'number' &&
    typeof value.displayName === 'string' &&
    typeof value.points === 'number'
  )
}

function isPlayerResult(value: unknown): value is PlayerResult {
  return (
    isRecord(value) &&
    isStringOrNull(value.answerId) &&
    typeof value.correct === 'boolean' &&
    typeof value.points === 'number'
  )
}

function isHostPlayer(value: unknown): value is HostPlayer {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.answered === 'boolean' &&
    typeof value.points === 'number'
  )
}

function isPublicQuestion(value: unknown): value is PublicQuestion {
  return (
    isRecord(value) &&
    typeof value.number === 'number' &&
    typeof value.count === 'number' &&
    Array.isArray(value.clues) &&
    isArrayOf(value.options, isAnswerOption) &&
    (value.correctAnswerId === null || typeof value.correctAnswerId === 'string')
  )
}

function isPhase(value: unknown): value is QuizPhase {
  return typeof value === 'string' && PHASES.includes(value)
}

export function isPlayerView(value: unknown): value is PlayerView {
  return (
    isRecord(value) &&
    value.role === 'player' &&
    isPhase(value.phase) &&
    typeof value.displayName === 'string' &&
    typeof value.totalPoints === 'number' &&
    (value.question === null || isPublicQuestion(value.question)) &&
    isStringOrNull(value.lockedAnswerId) &&
    (value.lastResult === null || isPlayerResult(value.lastResult)) &&
    (value.leaderboard === null || isArrayOf(value.leaderboard, isLeaderboardEntry))
  )
}

function isHostGame(value: unknown): value is HostGame {
  return (
    isRecord(value) &&
    isPhase(value.phase) &&
    typeof value.joinCode === 'string' &&
    typeof value.joinOpen === 'boolean' &&
    (value.question === null || isPublicQuestion(value.question)) &&
    isArrayOf(value.players, isHostPlayer) &&
    isArrayOf(value.leaderboard, isLeaderboardEntry)
  )
}

export function isHostView(value: unknown): value is HostView {
  return (
    isRecord(value) &&
    value.role === 'host' &&
    isRecord(value.summary) &&
    (value.game === null || isHostGame(value.game))
  )
}

export function readError(body: unknown, status: number): string {
  return isRecord(body) && typeof body.error === 'string' ? body.error : `Request failed (${status}).`
}

export function readPlayerView(body: unknown): PlayerView | null {
  return isRecord(body) && isPlayerView(body.view) ? body.view : null
}

export function readHostView(body: unknown): HostView | null {
  return isRecord(body) && isHostView(body.view) ? body.view : null
}

export function readJoinResponse(body: unknown): { playerToken: string; view: PlayerView } | null {
  if (isRecord(body) && typeof body.playerToken === 'string' && isPlayerView(body.view)) {
    return { playerToken: body.playerToken, view: body.view }
  }
  return null
}

