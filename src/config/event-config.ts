export const EVENT_CONFIG = {
  year: 2025,
  scoring: {
    whoAmIPointsByClue: [1000, 750, 500, 250],
    connections: { boardPoints: 1000, mistakePenalty: 100 },
    musicalMatchPointsPerPercent: 10,
    finale: { basePoints: 100, maxMultiplier: 4, answerWindowMs: 5000, revealWindowMs: 1500 },
  },
} as const