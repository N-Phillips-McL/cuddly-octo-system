import type { LeaderboardEntry } from '../api/quiz-contract'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  limit?: number
  highlightName?: string
}

export function Leaderboard({ entries, limit = 10, highlightName }: LeaderboardProps) {
  if (entries.length === 0) {
    return <p className="leaderboard__empty">No players yet.</p>
  }
  return (
    <ol className="leaderboard">
      {entries.slice(0, limit).map((entry, index) => (
        // Display names are not unique, so the index is part of the key.
        <li
          className={entry.displayName === highlightName ? 'leaderboard__row is-you' : 'leaderboard__row'}
          key={`${index}-${entry.displayName}`}
        >
          <span className="leaderboard__rank">{entry.rank}</span>
          <span className="leaderboard__name">{entry.displayName}</span>
          <strong className="leaderboard__points">{entry.points.toLocaleString()}</strong>
        </li>
      ))}
    </ol>
  )
}
