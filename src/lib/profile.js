import { useCallback, useEffect, useMemo, useState } from 'react'

const KEY = 'glyph-profile-v1'
const GAME_IDS = ['wordle', 'hangman', 'minesweeper', 'memory']

const blankGame = () => ({ played: 0, wins: 0, best: null })

const defaultProfile = () => ({
  xp: 0,
  streak: 0,
  games: Object.fromEntries(GAME_IDS.map((id) => [id, blankGame()])),
  achievements: [],
})

function loadProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!parsed) return defaultProfile()
    const base = defaultProfile()
    return {
      ...base,
      ...parsed,
      games: Object.fromEntries(
        GAME_IDS.map((id) => [id, { ...blankGame(), ...(parsed.games?.[id] || {}) }]),
      ),
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    }
  } catch {
    return defaultProfile()
  }
}

function unlocked(profile) {
  const totalWins = GAME_IDS.reduce((sum, id) => sum + profile.games[id].wins, 0)
  const everyGamePlayed = GAME_IDS.every((id) => profile.games[id].played > 0)
  return [
    totalWins >= 1 && 'first-win',
    everyGamePlayed && 'tourist',
    profile.games.wordle.wins >= 5 && 'wordsmith',
    profile.games.hangman.wins >= 3 && 'escape-artist',
    profile.games.minesweeper.wins >= 3 && 'deminer',
    profile.games.memory.wins >= 3 && 'memory-master',
    profile.xp >= 1000 && 'four-digits',
  ].filter(Boolean)
}

export const ACHIEVEMENTS = {
  'first-win': { name: 'First Spark', description: 'Win any Glyph game.' },
  tourist: { name: 'Arcade Tourist', description: 'Play every V1 game.' },
  wordsmith: { name: 'Wordsmith', description: 'Win 5 Word Grid games.' },
  'escape-artist': { name: 'Escape Artist', description: 'Win 3 Hangman games.' },
  deminer: { name: 'Deminer', description: 'Win 3 Minesweeper games.' },
  'memory-master': { name: 'Perfect Recall', description: 'Win 3 Memory games.' },
  'four-digits': { name: 'Kilobyte Brain', description: 'Earn 1,000 XP.' },
}

export function useProfile() {
  const [profile, setProfile] = useState(loadProfile)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(profile))
  }, [profile])

  const recordResult = useCallback((gameId, result = {}) => {
    setProfile((current) => {
      const won = Boolean(result.won)
      const next = structuredClone(current)
      const game = next.games[gameId]
      if (!game) return current

      game.played += 1
      if (won) game.wins += 1

      if (typeof result.score === 'number' && Number.isFinite(result.score)) {
        const lowerIsBetter = result.lowerIsBetter !== false
        if (
          game.best == null ||
          (lowerIsBetter && result.score < game.best) ||
          (!lowerIsBetter && result.score > game.best)
        ) {
          game.best = result.score
        }
      }

      const baseXp = won ? 60 : 15
      const bonusXp = won ? Math.max(0, Math.min(40, Math.round(result.bonusXp || 0))) : 0
      next.xp += baseXp + bonusXp
      next.streak = won ? next.streak + 1 : 0

      const newAchievements = unlocked(next)
      next.achievements = [...new Set([...next.achievements, ...newAchievements])]
      return next
    })
  }, [])

  const resetProfile = useCallback(() => setProfile(defaultProfile()), [])

  const totals = useMemo(() => {
    const played = GAME_IDS.reduce((sum, id) => sum + profile.games[id].played, 0)
    const wins = GAME_IDS.reduce((sum, id) => sum + profile.games[id].wins, 0)
    return { played, wins }
  }, [profile])

  return { profile, recordResult, resetProfile, totals }
}
