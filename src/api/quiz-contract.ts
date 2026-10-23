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

export type CompatibilityTier =
  | 'awkward-road-trip'
  | 'playlist-negotiations'
  | 'aux-cable-debate'
  | 'shared-queue-energy'
  | 'musical-soulmates'

const COMPATIBILITY_TIER_LABELS: Record<CompatibilityTier, string> = {
  'awkward-road-trip': 'Awkward Road Trip',
  'playlist-negotiations': 'Playlist Negotiations',
  'aux-cable-debate': 'The Aux Cable Is Up for Debate',
  'shared-queue-energy': 'Shared Queue Energy',
  'musical-soulmates': 'Musical Soulmates',
}

export function compatibilityTierLabel(tier: CompatibilityTier): string {
  return COMPATIBILITY_TIER_LABELS[tier]
}

export interface PublicRoundBase {
  number: number
  count: number
}

export type PublicRoundItem =
  | (PublicRoundBase & {
      type: 'who-am-i'
      clueNumber: number
      clues: { id: string; text: string }[]
      participants: AnswerOption[]
      answerParticipantId: string | null
    })
  | (PublicRoundBase & {
      type: 'connections'
      boardNumber: number
      boardCount: number
      tiles: { id: string; label: string }[]
      roomSolvedGroupCount: number
      groups: { id: string; label: string; tileIds: string[] }[] | null
    })
  | (PublicRoundBase & {
      type: 'musical-matches'
      firstParticipant: AnswerOption
      secondParticipant: AnswerOption
      actualScore: number | null
      tier: CompatibilityTier | null
      sharedGenres: string[] | null
      sharedArtists: string[] | null
      sharedSongs: string[] | null
      reasons: string[] | null
    })
  | (PublicRoundBase & {
      type: 'finale'
      prompt: string
      choices: AnswerOption[]
      phaseEndsAt: string | null
      correctChoiceId: string | null
    })

export interface PublicRoundProgress {
  whoAmIGuesses: { clueNumber: number; participantId: string }[]
  whoAmISolved: boolean
  solvedGroupIds: string[]
  solvedTileGroups: { groupId: string; tileIds: string[] }[]
  mistakes: number
  musicalGuess: number | null
  finaleChoiceId: string | null
  streak: number
  multiplier: number
  pointsEarned: number | null
}

export type RoundSubmission =
  | { kind: 'who-am-i'; clueNumber: number; participantId: string }
  | { kind: 'connections'; tileIds: string[] }
  | { kind: 'musical-matches'; guess: number }
  | { kind: 'finale'; choiceId: string }

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
  roundItem?: PublicRoundItem | null
  roundProgress?: PublicRoundProgress | null
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
  roundItem?: PublicRoundItem | null
  roundStep?: number
  roomSolvedGroupCount?: number
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

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isPublicRoundItem(value: unknown): value is PublicRoundItem {
  if (!isRecord(value) || typeof value.number !== 'number' || typeof value.count !== 'number') {
    return false
  }
  if (value.type === 'who-am-i') {
    return (
      typeof value.clueNumber === 'number' &&
      Array.isArray(value.clues) &&
      value.clues.every((clue) => isRecord(clue) && typeof clue.id === 'string' && typeof clue.text === 'string') &&
      isArrayOf(value.participants, isAnswerOption) &&
      isStringOrNull(value.answerParticipantId)
    )
  }
  if (value.type === 'connections') {
    return (
      typeof value.boardNumber === 'number' &&
      typeof value.boardCount === 'number' &&
      typeof value.roomSolvedGroupCount === 'number' &&
      Array.isArray(value.tiles) &&
      value.tiles.every((tile) => isRecord(tile) && typeof tile.id === 'string' && typeof tile.label === 'string') &&
      (value.groups === null ||
        (Array.isArray(value.groups) &&
          value.groups.every(
            (group) =>
              isRecord(group) &&
              typeof group.id === 'string' &&
              typeof group.label === 'string' &&
              isStringList(group.tileIds),
          )))
    )
  }
  if (value.type === 'musical-matches') {
    const tiers: readonly string[] = [
      'awkward-road-trip',
      'playlist-negotiations',
      'aux-cable-debate',
      'shared-queue-energy',
      'musical-soulmates',
    ]
    return (
      isAnswerOption(value.firstParticipant) &&
      isAnswerOption(value.secondParticipant) &&
      (value.actualScore === null || (typeof value.actualScore === 'number' && value.actualScore >= 0 && value.actualScore <= 100)) &&
      (value.tier === null || (typeof value.tier === 'string' && tiers.includes(value.tier))) &&
      (value.sharedGenres === null || isStringList(value.sharedGenres)) &&
      (value.sharedArtists === null || isStringList(value.sharedArtists)) &&
      (value.sharedSongs === null || isStringList(value.sharedSongs)) &&
      (value.reasons === null || isStringList(value.reasons))
    )
  }
  if (value.type === 'finale') {
    return (
      typeof value.prompt === 'string' &&
      isArrayOf(value.choices, isAnswerOption) &&
      isStringOrNull(value.phaseEndsAt) &&
      isStringOrNull(value.correctChoiceId)
    )
  }
  return false
}

function isPublicRoundProgress(value: unknown): value is PublicRoundProgress {
  return (
    isRecord(value) &&
    Array.isArray(value.whoAmIGuesses) &&
    value.whoAmIGuesses.every(
      (guess) => isRecord(guess) && typeof guess.clueNumber === 'number' && typeof guess.participantId === 'string',
    ) &&
    typeof value.whoAmISolved === 'boolean' &&
    isStringList(value.solvedGroupIds) &&
    Array.isArray(value.solvedTileGroups) &&
    value.solvedTileGroups.every(
      (group) => isRecord(group) && typeof group.groupId === 'string' && isStringList(group.tileIds),
    ) &&
    typeof value.mistakes === 'number' &&
    (value.musicalGuess === null || typeof value.musicalGuess === 'number') &&
    isStringOrNull(value.finaleChoiceId) &&
    typeof value.streak === 'number' &&
    typeof value.multiplier === 'number' &&
    (value.pointsEarned === null || typeof value.pointsEarned === 'number')
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
    (value.roundItem === undefined || value.roundItem === null || isPublicRoundItem(value.roundItem)) &&
    (value.roundProgress === undefined || value.roundProgress === null || isPublicRoundProgress(value.roundProgress)) &&
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
    (value.roundItem === undefined || value.roundItem === null || isPublicRoundItem(value.roundItem)) &&
    (value.roundStep === undefined || typeof value.roundStep === 'number') &&
    (value.roomSolvedGroupCount === undefined || typeof value.roomSolvedGroupCount === 'number') &&
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

