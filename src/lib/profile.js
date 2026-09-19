import { useCallback, useEffect, useMemo, useState } from 'react'

const KEY = 'glyph-profile-v1'
const GAME_IDS = ['wordle', 'hangman', 'minesweeper', 'memory', '2048', 'snake', 'connections', 'reaction', 'pokemon-connections']
const V1_IDS = ['wordle', 'hangman', 'minesweeper', 'memory']

const blankGame = () => ({ played: 0, wins: 0, best: null, history: [] })

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
        GAME_IDS.map((id) => [
          id,
          {
            ...blankGame(),
            ...(parsed.games?.[id] || {}),
            history: Array.isArray(parsed.games?.[id]?.history)
              ? parsed.games[id].history.slice(0, 20)
              : [],
          },
        ]),
      ),
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    }
  } catch {
    return defaultProfile()
  }
}

function unlocked(profile) {
  const totalWins = GAME_IDS.reduce((sum, id) => sum + profile.games[id].wins, 0)
  const v1Played = V1_IDS.every((id) => profile.games[id].played > 0)
  const everyGamePlayed = GAME_IDS.every((id) => profile.games[id].played > 0)

  return [
    totalWins >= 1 && 'first-win',
    v1Played && 'tourist',
    profile.games.wordle.wins >= 5 && 'wordsmith',
    profile.games.hangman.wins >= 3 && 'escape-artist',
    profile.games.minesweeper.wins >= 3 && 'deminer',
    profile.games.memory.wins >= 3 && 'memory-master',
    profile.games['2048'].wins >= 1 && 'power-two',
    profile.games.snake.wins >= 1 && 'serpent',
    profile.games.connections.wins >= 3 && 'connector',
    profile.games['pokemon-connections'].wins >= 3 && 'pokemon-professor',
    profile.games.reaction.best != null && profile.games.reaction.best < 300 && 'fast-hands',
    everyGamePlayed && 'full-circuit',
    profile.xp >= 1000 && 'four-digits',
  ].filter(Boolean)
}

export const ACHIEVEMENTS = {
  'first-win': { name: 'First Spark', description: 'Win any Glyph game.' },
  tourist: { name: 'Arcade Tourist', description: 'Play every original V1 game.' },
  wordsmith: { name: 'Wordsmith', description: 'Win 5 Word Grid games.' },
  'escape-artist': { name: 'Escape Artist', description: 'Win 3 Hangman games.' },
  deminer: { name: 'Deminer', description: 'Win 3 Minesweeper games.' },
  'memory-master': { name: 'Perfect Recall', description: 'Win 3 Memory games.' },
  'power-two': { name: 'Power of Two', description: 'Reach 2048.' },
  serpent: { name: 'Serpent', description: 'Clear a Snake run.' },
  connector: { name: 'Pattern Hunter', description: 'Win 3 Connections puzzles.' },
  'pokemon-professor': { name: 'Pokémon Professor', description: 'Win 3 Pokémon Connections puzzles.' },
  'fast-hands': { name: 'Fast Hands', description: 'Average under 300 ms in Reaction Test.' },
  'full-circuit': { name: 'Full Circuit', description: 'Play all 8 Glyph games.' },
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

      const hasScore = typeof result.score === 'number' && Number.isFinite(result.score)
      const lowerIsBetter = result.lowerIsBetter !== false

      if (hasScore) {
        if (
          game.best == null ||
          (lowerIsBetter && result.score < game.best) ||
          (!lowerIsBetter && result.score > game.best)
        ) {
          game.best = result.score
        }
      }

      const entry = {
        at: Date.now(),
        won,
        score: hasScore ? result.score : null,
        lowerIsBetter,
      }
      game.history = [entry, ...(Array.isArray(game.history) ? game.history : [])].slice(0, 20)

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
