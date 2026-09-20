import { useCallback, useEffect, useMemo, useState } from 'react'

const KEY = 'glyph-profile-v1'
const GAME_IDS = ['wordle', 'hangman', 'minesweeper', 'memory', '2048', 'snake', 'connections', 'reaction', 'pokemon-connections', 'statle', 'connect4', 'pokeguess', 'guesswork', 'typing', 'chess', 'crossword', 'sudoku', 'silhouette', 'aim']
const V1_IDS = ['wordle', 'hangman', 'minesweeper', 'memory']

const blankGame = () => ({ played: 0, wins: 0, best: null, history: [] })

const defaultProfile = () => ({
  xp: 0,
  streak: 0,
  games: Object.fromEntries(GAME_IDS.map((id) => [id, blankGame()])),
  achievements: [],
})

function unlocked(profile) {
  const totalPlayed = GAME_IDS.reduce((sum, id) => sum + profile.games[id].played, 0)
  const totalWins = GAME_IDS.reduce((sum, id) => sum + profile.games[id].wins, 0)
  const v1Played = V1_IDS.every((id) => profile.games[id].played > 0)
  const everyGamePlayed = GAME_IDS.every((id) => profile.games[id].played > 0)

  const wordle = profile.games.wordle
  const hangman = profile.games.hangman
  const minesweeper = profile.games.minesweeper
  const memory = profile.games.memory
  const game2048 = profile.games['2048']
  const snake = profile.games.snake
  const connections = profile.games.connections
  const pokemonConnections = profile.games['pokemon-connections']
  const reaction = profile.games.reaction
  const statle = profile.games.statle
  const connect4 = profile.games.connect4
  const pokeguess = profile.games.pokeguess
  const guesswork = profile.games.guesswork
  const typing = profile.games.typing
  const chess = profile.games.chess
  const crossword = profile.games.crossword
  const sudoku = profile.games.sudoku
  const silhouette = profile.games.silhouette
  const aim = profile.games.aim

  return [
    totalWins >= 1 && 'first-win',
    totalWins >= 5 && 'five-wins',
    totalWins >= 10 && 'ten-wins',
    totalWins >= 25 && 'twenty-five-wins',
    totalWins >= 50 && 'fifty-wins',

    totalPlayed >= 10 && 'played-10',
    totalPlayed >= 25 && 'played-25',
    totalPlayed >= 50 && 'played-50',
    totalPlayed >= 100 && 'played-100',

    profile.streak >= 3 && 'streak-3',
    profile.streak >= 5 && 'streak-5',
    profile.streak >= 10 && 'streak-10',

    profile.xp >= 250 && 'xp-250',
    profile.xp >= 500 && 'xp-500',
    profile.xp >= 1000 && 'four-digits',
    profile.xp >= 2500 && 'xp-2500',
    profile.xp >= 5000 && 'xp-5000',

    v1Played && 'tourist',
    everyGamePlayed && 'full-circuit',

    wordle.wins >= 1 && 'wordle-first',
    wordle.wins >= 5 && 'wordsmith',
    wordle.wins >= 10 && 'wordle-veteran',
    wordle.best != null && wordle.best <= 1 && 'wordle-one',

    hangman.wins >= 1 && 'hangman-first',
    hangman.wins >= 3 && 'escape-artist',
    hangman.wins >= 10 && 'hangman-veteran',
    hangman.best != null && hangman.best === 0 && 'hangman-flawless',

    minesweeper.wins >= 1 && 'mine-first',
    minesweeper.wins >= 3 && 'deminer',
    minesweeper.wins >= 10 && 'mine-veteran',
    minesweeper.best != null && minesweeper.best <= 60 && 'mine-speed',

    memory.wins >= 1 && 'memory-first',
    memory.wins >= 3 && 'memory-master',
    memory.wins >= 10 && 'memory-veteran',
    memory.best != null && memory.best <= 12 && 'memory-efficient',

    game2048.wins >= 1 && 'power-two',
    game2048.wins >= 3 && 'power-two-three',
    game2048.wins >= 10 && 'power-two-ten',

    snake.wins >= 1 && 'serpent',
    snake.wins >= 5 && 'snake-charmer',
    snake.wins >= 10 && 'snake-master',

    connections.wins >= 1 && 'connections-first',
    connections.wins >= 3 && 'connector',
    connections.wins >= 10 && 'connections-master',
    connections.best != null && connections.best === 0 && 'connections-perfect',

    pokemonConnections.wins >= 1 && 'pokemon-first',
    pokemonConnections.wins >= 3 && 'pokemon-professor',
    pokemonConnections.wins >= 10 && 'pokemon-master',
    pokemonConnections.best != null && pokemonConnections.best === 0 && 'pokemon-perfect',

    reaction.played >= 1 && 'reaction-first',
    reaction.best != null && reaction.best < 400 && 'quick-hands',
    reaction.best != null && reaction.best < 300 && 'fast-hands',
    reaction.best != null && reaction.best < 250 && 'lightning-hands',
    reaction.played >= 10 && 'reaction-veteran',

    statle.played >= 1 && 'statle-first',
    statle.best != null && statle.best >= 500 && 'statle-silver',
    statle.best != null && statle.best >= 600 && 'statle-gold',
    statle.best != null && statle.best >= 650 && 'statle-elite',
    statle.played >= 10 && 'statle-veteran',

    connect4.wins >= 1 && 'connect-first',
    connect4.wins >= 5 && 'connect-five',
    connect4.wins >= 10 && 'connect-master',
    connect4.best != null && connect4.best <= 15 && 'connect-efficient',

    pokeguess.wins >= 1 && 'pokeguess-first',
    pokeguess.wins >= 5 && 'pokeguess-five',
    pokeguess.wins >= 10 && 'pokeguess-master',
    pokeguess.best != null && pokeguess.best === 1 && 'pokeguess-one',

    guesswork.wins >= 1 && 'guesswork-first',
    guesswork.wins >= 10 && 'guesswork-master',
    guesswork.best != null && guesswork.best >= 800 && 'guesswork-sharp',
    guesswork.best != null && guesswork.best >= 1000 && 'guesswork-perfect',

    typing.played >= 1 && 'typing-first',
    typing.best != null && typing.best >= 400 && 'typing-quick',
    typing.best != null && typing.best >= 600 && 'typing-fast',
    typing.played >= 10 && 'typing-veteran',

    chess.wins >= 1 && 'chess-first',
    chess.wins >= 5 && 'chess-five',
    chess.wins >= 10 && 'chess-master',
    chess.best != null && chess.best <= 15 && 'chess-clean',

    crossword.wins >= 1 && 'cross-first',
    crossword.wins >= 5 && 'cross-five',
    crossword.wins >= 10 && 'cross-master',
    crossword.best != null && crossword.best <= 90 && 'cross-speed',

    sudoku.wins >= 1 && 'sudoku-first',
    sudoku.wins >= 5 && 'sudoku-five',
    sudoku.wins >= 10 && 'sudoku-master',
    sudoku.best != null && sudoku.best <= 300 && 'sudoku-speed',

    silhouette.wins >= 1 && 'shadow-first',
    silhouette.wins >= 5 && 'shadow-five',
    silhouette.wins >= 10 && 'shadow-master',
    silhouette.best != null && silhouette.best === 1 && 'shadow-one',

    aim.played >= 1 && 'aim-first',
    aim.best != null && aim.best >= 1200 && 'aim-steady',
    aim.best != null && aim.best >= 2000 && 'aim-deadcenter',
    aim.played >= 10 && 'aim-veteran',
  ].filter(Boolean)
}

function loadProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!parsed) return defaultProfile()

    const base = defaultProfile()
    const next = {
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

    next.achievements = [...new Set([...next.achievements, ...unlocked(next)])]
    return next
  } catch {
    return defaultProfile()
  }
}

export const ACHIEVEMENTS = {
  'first-win': { name: 'First Spark', description: 'Win any Glyph game.' },
  'five-wins': { name: 'Getting Warm', description: 'Win 5 games across Glyph.' },
  'ten-wins': { name: 'Double Digits', description: 'Win 10 games across Glyph.' },
  'twenty-five-wins': { name: 'Arcade Regular', description: 'Win 25 games across Glyph.' },
  'fifty-wins': { name: 'Cabinet Legend', description: 'Win 50 games across Glyph.' },

  'played-10': { name: 'Ten Rounds In', description: 'Finish 10 games.' },
  'played-25': { name: 'Quarter Century', description: 'Finish 25 games.' },
  'played-50': { name: 'Persistent', description: 'Finish 50 games.' },
  'played-100': { name: 'Centurion', description: 'Finish 100 games.' },

  'streak-3': { name: 'Hat Trick', description: 'Reach a 3-win streak.' },
  'streak-5': { name: 'On Fire', description: 'Reach a 5-win streak.' },
  'streak-10': { name: 'Untouchable', description: 'Reach a 10-win streak.' },

  'xp-250': { name: 'Level Two', description: 'Earn 250 XP.' },
  'xp-500': { name: 'Momentum', description: 'Earn 500 XP.' },
  'four-digits': { name: 'Kilobyte Brain', description: 'Earn 1,000 XP.' },
  'xp-2500': { name: 'Deep Run', description: 'Earn 2,500 XP.' },
  'xp-5000': { name: 'Glyph Veteran', description: 'Earn 5,000 XP.' },

  tourist: { name: 'Arcade Tourist', description: 'Play every original V1 game.' },
  'full-circuit': { name: 'Full Circuit', description: 'Play all 19 Glyph games.' },

  'wordle-first': { name: 'Five Letters', description: 'Win a Word Grid game.' },
  wordsmith: { name: 'Wordsmith', description: 'Win 5 Word Grid games.' },
  'wordle-veteran': { name: 'Dictionary Damage', description: 'Win 10 Word Grid games.' },
  'wordle-one': { name: 'First Guess', description: 'Solve Word Grid on the first guess.' },

  'hangman-first': { name: 'Stay of Execution', description: 'Win a Hangman game.' },
  'escape-artist': { name: 'Escape Artist', description: 'Win 3 Hangman games.' },
  'hangman-veteran': { name: 'Noose Whisperer', description: 'Win 10 Hangman games.' },
  'hangman-flawless': { name: 'Untouched', description: 'Win Hangman with zero strikes.' },

  'mine-first': { name: 'Safe Step', description: 'Win a Minesweeper game.' },
  deminer: { name: 'Deminer', description: 'Win 3 Minesweeper games.' },
  'mine-veteran': { name: 'Bomb Squad', description: 'Win 10 Minesweeper games.' },
  'mine-speed': { name: 'Under a Minute', description: 'Clear Minesweeper in 60 seconds or less.' },

  'memory-first': { name: 'Matched', description: 'Win a Memory Match game.' },
  'memory-master': { name: 'Perfect Recall', description: 'Win 3 Memory Match games.' },
  'memory-veteran': { name: 'Photographic-ish', description: 'Win 10 Memory Match games.' },
  'memory-efficient': { name: 'Sharp Recall', description: 'Finish Memory Match in 12 moves or fewer.' },

  'power-two': { name: 'Power of Two', description: 'Reach 2048.' },
  'power-two-three': { name: 'Merge Habit', description: 'Win 3 games of 2048.' },
  'power-two-ten': { name: 'Exponent Problem', description: 'Win 10 games of 2048.' },

  serpent: { name: 'Serpent', description: 'Clear a Snake run.' },
  'snake-charmer': { name: 'Snake Charmer', description: 'Clear 5 Snake runs.' },
  'snake-master': { name: 'No Walls', description: 'Clear 10 Snake runs.' },

  'connections-first': { name: 'One of Four', description: 'Win a Connections puzzle.' },
  connector: { name: 'Pattern Hunter', description: 'Win 3 Connections puzzles.' },
  'connections-master': { name: 'Category Brain', description: 'Win 10 Connections puzzles.' },
  'connections-perfect': { name: 'Clean Groups', description: 'Solve Connections with zero mistakes.' },

  'pokemon-first': { name: 'Poké Pattern', description: 'Win a Pokémon Connections puzzle.' },
  'pokemon-professor': { name: 'Pokémon Professor', description: 'Win 3 Pokémon Connections puzzles.' },
  'pokemon-master': { name: 'National Dex Brain', description: 'Win 10 Pokémon Connections puzzles.' },
  'pokemon-perfect': { name: 'Professor Perfect', description: 'Solve Pokémon Connections with zero mistakes.' },

  'reaction-first': { name: 'Signal Acquired', description: 'Finish a Reaction Test.' },
  'quick-hands': { name: 'Quick Hands', description: 'Average under 400 ms in Reaction Test.' },
  'fast-hands': { name: 'Fast Hands', description: 'Average under 300 ms in Reaction Test.' },
  'lightning-hands': { name: 'Lightning Hands', description: 'Average under 250 ms in Reaction Test.' },
  'reaction-veteran': { name: 'Reflex Lab', description: 'Finish 10 Reaction Tests.' },

  'statle-first': { name: 'Stat Student', description: 'Finish a Statle run.' },
  'statle-silver': { name: 'Solid Spread', description: 'Score 500+ BST in Statle.' },
  'statle-gold': { name: 'Stat Master', description: 'Score 600+ BST in Statle.' },
  'statle-elite': { name: 'Base Stat Monster', description: 'Score 650+ BST in Statle.' },
  'statle-veteran': { name: 'Six Picks Later', description: 'Finish 10 Statle runs.' },

  'connect-first': { name: 'Four in a Row', description: 'Win a game of Connect ४.' },
  'connect-five': { name: 'Center Control', description: 'Win 5 games of Connect ४.' },
  'connect-master': { name: 'Grid General', description: 'Win 10 games of Connect ४.' },
  'connect-efficient': { name: 'Fast Connection', description: 'Win Connect ४ in 15 total moves or fewer.' },

  'pokeguess-first': { name: 'Dex Entry', description: 'Win a PokéGuess round.' },
  'pokeguess-five': { name: 'Field Research', description: 'Win 5 PokéGuess rounds.' },
  'pokeguess-master': { name: 'Living Pokédex', description: 'Win 10 PokéGuess rounds.' },
  'pokeguess-one': { name: 'Professor Instinct', description: 'Solve PokéGuess on the first guess.' },

  'guesswork-first': { name: 'Educated Guess', description: 'Solve a Guesswork mystery.' },
  'guesswork-master': { name: 'No Coincidences', description: 'Win 10 Guesswork rounds.' },
  'guesswork-sharp': { name: 'Thin Evidence', description: 'Score 800+ in Guesswork.' },
  'guesswork-perfect': { name: 'One Clue Wonder', description: 'Score the maximum 1,000 in Guesswork.' },

  'typing-first': { name: 'Home Row', description: 'Finish a Type Rush run.' },
  'typing-quick': { name: 'Clacking Along', description: 'Score 400+ in Type Rush.' },
  'typing-fast': { name: 'Key Hurricane', description: 'Score 600+ in Type Rush.' },
  'typing-veteran': { name: 'Mechanical Sympathy', description: 'Finish 10 Type Rush runs.' },

  'chess-first': { name: 'Tactic Found', description: 'Solve a Checkmate puzzle.' },
  'chess-five': { name: 'Pattern Vision', description: 'Solve 5 Checkmate puzzles.' },
  'chess-master': { name: 'Board Reader', description: 'Solve 10 Checkmate puzzles.' },
  'chess-clean': { name: 'Instant Calculation', description: 'Solve a Checkmate puzzle with an adjusted time of 15 seconds or less.' },

  'cross-first': { name: 'Crossed Wires', description: 'Solve a Crosswire mini.' },
  'cross-five': { name: 'Clue Collector', description: 'Solve 5 Crosswire minis.' },
  'cross-master': { name: 'Inkless Editor', description: 'Solve 10 Crosswire minis.' },
  'cross-speed': { name: 'Quick Fill', description: 'Solve Crosswire in 90 adjusted seconds or less.' },

  'sudoku-first': { name: 'Nine by Nine', description: 'Solve a Sudoku.' },
  'sudoku-five': { name: 'Candidate Elimination', description: 'Solve 5 Sudokus.' },
  'sudoku-master': { name: 'Grid Discipline', description: 'Solve 10 Sudokus.' },
  'sudoku-speed': { name: 'Five Minute Grid', description: 'Solve Sudoku in 300 adjusted seconds or less.' },

  'shadow-first': { name: 'Out of the Dark', description: 'Win a Silhouette round.' },
  'shadow-five': { name: 'Shadow Dex', description: 'Win 5 Silhouette rounds.' },
  'shadow-master': { name: 'Outline Expert', description: 'Win 10 Silhouette rounds.' },
  'shadow-one': { name: 'Instant Recognition', description: 'Name a silhouette on the first guess.' },

  'aim-first': { name: 'On Target', description: 'Finish a Deadcenter run.' },
  'aim-steady': { name: 'Steady Hand', description: 'Score 1,200+ in Deadcenter.' },
  'aim-deadcenter': { name: 'Dead Center', description: 'Score 2,000+ in Deadcenter.' },
  'aim-veteran': { name: 'Range Regular', description: 'Finish 10 Deadcenter runs.' },
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

      next.achievements = [...new Set([...next.achievements, ...unlocked(next)])]
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
