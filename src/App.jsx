import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { ACHIEVEMENTS, useProfile } from './lib/profile'
import WordGrid from './games/WordGrid'
import Hangman from './games/Hangman'
import Minesweeper from './games/Minesweeper'
import MemoryMatch from './games/MemoryMatch'
import Game2048 from './games/Game2048'
import Snake from './games/Snake'
import Connections from './games/Connections'
import ReactionTest from './games/ReactionTest'
import PokemonConnections from './games/PokemonConnections'
import Statle from './games/Statle'
import ConnectFour from './games/ConnectFour'
import PokemonGuess from './games/PokemonGuess'
import Guesswork from './games/Guesswork'
import TypingRush from './games/TypingRush'
import ChessPuzzle from './games/ChessPuzzle'
import Crossword from './games/Crossword'
import Sudoku from './games/Sudoku'
import PokemonSilhouette from './games/PokemonSilhouette'
import AimTrainer from './games/AimTrainer'

const GAMES = [
  {
    id: 'wordle',
    title: 'Word Grid',
    eyebrow: 'WORDS',
    icon: 'Aa',
    description: 'Practice or daily five-letter grids, with optional clue-enforcing Hard Mode.',
    accent: 'lime',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}/6 guesses`),
  },
  {
    id: 'hangman',
    title: 'Hangman',
    eyebrow: 'WORDS',
    icon: '⌁',
    description: 'Solo or 2-player word rescue with life presets and multi-stage paid hints.',
    accent: 'violet',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} strikes`),
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    eyebrow: 'LOGIC',
    icon: '✦',
    description: 'Clear Easy, Medium or Expert minefields with flags, safe starts and chord reveals.',
    accent: 'orange',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}s`),
  },
  {
    id: 'memory',
    title: 'Memory Match',
    eyebrow: 'MEMORY',
    icon: '◇',
    description: 'Match 4×4, 5×4 or 6×6 boards, with an optional study preview.',
    accent: 'cyan',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} moves`),
  },
  {
    id: '2048',
    title: '2048',
    eyebrow: 'NUMBERS',
    icon: '2ⁿ',
    description: 'Chase 1024, 2048 or 4096 with limited Undo and endless continuation.',
    accent: 'amber',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best.toLocaleString()} pts`),
  },
  {
    id: 'snake',
    title: 'Snake',
    eyebrow: 'ARCADE',
    icon: '∿',
    description: 'Configure speed, goal, walls and obstacles for very different Snake runs.',
    accent: 'mint',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} food`),
  },
  {
    id: 'connections',
    title: 'Connections',
    eyebrow: 'PATTERNS',
    icon: '4×',
    description: 'Solve built-in groups or build a private local 2-player Connections puzzle.',
    accent: 'rose',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} mistakes`),
  },
  {
    id: 'reaction',
    title: 'Reaction Test',
    eyebrow: 'REFLEX',
    icon: '⚡',
    description: 'Run 3, 5 or 10 reaction trials with Classic or punishing Strict rules.',
    accent: 'blue',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}ms avg`),
  },
  {
    id: 'pokemon-connections',
    title: 'Pokémon Connections',
    eyebrow: 'POKÉMON',
    icon: 'PK',
    description: 'Sort sixteen Pokémon into four hidden groups.',
    accent: 'poke',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} mistakes`),
  },
  {
    id: 'statle',
    title: 'Statle',
    eyebrow: 'POKÉMON STATS',
    icon: 'Σ',
    description: 'Roll six Pokémon, claim each base stat once, and chase 600 BST.',
    accent: 'statle',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} BST`),
  },
  {
    id: 'connect4',
    title: 'Connect ४',
    eyebrow: 'STRATEGY',
    icon: '४',
    description: 'Connect four before the AI does, with three difficulty levels and local 2-player.',
    accent: 'connect',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best win: ${best} moves`),
  },
  {
    id: 'pokeguess',
    title: 'PokéGuess',
    eyebrow: 'POKÉMON',
    icon: '?',
    description: 'Guess a National Dex Pokémon using comparison feedback and progressive clues.',
    accent: 'poke2',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} guess${best === 1 ? '' : 'es'}`),
  },
  {
    id: 'guesswork',
    title: 'Guesswork',
    eyebrow: 'CLUES',
    icon: '¿',
    description: 'Solve built-in mysteries or create a private clue ladder for local 2-player.',
    accent: 'guess',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} pts`),
  },
  {
    id: 'typing',
    title: 'Type Rush',
    eyebrow: 'TYPING',
    icon: '⌨',
    description: 'Standard or Sudden Death typing with durations, difficulty and custom word banks.',
    accent: 'typing',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} pts`),
  },
  {
    id: 'chess',
    title: 'Checkmate',
    eyebrow: 'CHESS',
    icon: '♞',
    description: 'Solve compact tactical positions with difficulty filters and layered hints.',
    accent: 'chess',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}s adjusted`),
  },
  {
    id: 'crossword',
    title: 'Crosswire',
    eyebrow: 'CROSSWORD',
    icon: '✚',
    description: 'Mini crosswords with Across/Down clues, keyboard navigation and timed scoring.',
    accent: 'cross',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}s adjusted`),
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    eyebrow: 'LOGIC',
    icon: '9×',
    description: 'Full 9×9 Sudoku with notes, hints, mistakes, difficulty and a proper timer.',
    accent: 'sudoku',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}s adjusted`),
  },
  {
    id: 'silhouette',
    title: 'Silhouette',
    eyebrow: 'POKÉMON',
    icon: '◐',
    description: 'Name the Pokémon from its shadow while clues slowly betray the answer.',
    accent: 'shadow',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} guess${best === 1 ? '' : 'es'}`),
  },
  {
    id: 'aim',
    title: 'Deadcenter',
    eyebrow: 'AIM',
    icon: '⊕',
    description: 'Aim for 15, 30 or 60 seconds across Chill, Standard and Insane target profiles.',
    accent: 'aim',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} pts`),
  },
]

const GAME_COMPONENTS = {
  wordle: WordGrid,
  hangman: Hangman,
  minesweeper: Minesweeper,
  memory: MemoryMatch,
  '2048': Game2048,
  snake: Snake,
  connections: Connections,
  reaction: ReactionTest,
  'pokemon-connections': PokemonConnections,
  statle: Statle,
  connect4: ConnectFour,
  pokeguess: PokemonGuess,
  guesswork: Guesswork,
  typing: TypingRush,
  chess: ChessPuzzle,
  crossword: Crossword,
  sudoku: Sudoku,
  silhouette: PokemonSilhouette,
  aim: AimTrainer,
}

function levelFromXp(xp) {
  const level = Math.floor(xp / 250) + 1
  const current = xp % 250
  return { level, current, needed: 250 }
}

function todayIndex(length) {
  const d = new Date()
  const stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.floor(stamp / 86400000) % length
}


const SCOREBOARD_META = {
  wordle: {
    label: 'GUESSES',
    format: (score) => `${score}/6`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  hangman: {
    label: 'MISSES',
    format: (score) => `${score}`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  minesweeper: {
    label: 'TIME',
    format: (score) => `${score}s`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  memory: {
    label: 'MOVES',
    format: (score) => `${score}`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  '2048': {
    label: 'SCORE',
    format: (score) => score.toLocaleString(),
    lowerIsBetter: false,
    rankLosses: true,
  },
  snake: {
    label: 'FOOD',
    format: (score) => `${score}`,
    lowerIsBetter: false,
    rankLosses: true,
  },
  connections: {
    label: 'MISTAKES',
    format: (score) => `${score}/4`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  reaction: {
    label: 'AVG TIME',
    format: (score) => `${score} ms`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  'pokemon-connections': {
    label: 'MISTAKES',
    format: (score) => `${score}/4`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  statle: {
    label: 'BST SCORE',
    format: (score) => `${score} BST`,
    lowerIsBetter: false,
    rankLosses: true,
  },
  connect4: {
    label: 'MOVES',
    format: (score) => `${score}`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  pokeguess: {
    label: 'GUESSES',
    format: (score) => `${score} guess${score === 1 ? '' : 'es'}`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  guesswork: {
    label: 'SCORE',
    format: (score) => score.toLocaleString(),
    lowerIsBetter: false,
    rankLosses: false,
  },
  typing: {
    label: 'SCORE',
    format: (score) => score.toLocaleString(),
    lowerIsBetter: false,
    rankLosses: true,
  },
  chess: {
    label: 'ADJUSTED TIME',
    format: (score) => `${score}s`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  crossword: {
    label: 'ADJUSTED TIME',
    format: (score) => `${score}s`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  sudoku: {
    label: 'ADJUSTED TIME',
    format: (score) => `${score}s`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  silhouette: {
    label: 'GUESSES',
    format: (score) => `${score}/5`,
    lowerIsBetter: true,
    rankLosses: false,
  },
  aim: {
    label: 'SCORE',
    format: (score) => score.toLocaleString(),
    lowerIsBetter: false,
    rankLosses: true,
  },
}

function formatAttemptTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function LocalScoreboard({ gameId, stats }) {
  const meta = SCOREBOARD_META[gameId]
  if (!meta || !stats) return null

  const history = Array.isArray(stats.history) ? stats.history : []
  const ranked = history
    .filter((entry) =>
      typeof entry.score === 'number' &&
      Number.isFinite(entry.score) &&
      (meta.rankLosses || entry.won),
    )
    .sort((a, b) => meta.lowerIsBetter ? a.score - b.score : b.score - a.score)
    .slice(0, 5)

  const recent = history.slice(0, 6)

  return (
    <aside className="scoreboard-panel" aria-label="Local score history">
      <div className="scoreboard-head">
        <div>
          <span className="micro">LOCAL SCOREBOARD</span>
          <strong>Run history</strong>
        </div>
        <span className="scoreboard-count">{stats.played} PLAYED</span>
      </div>

      <div className="scoreboard-best">
        <span>ALL-TIME BEST</span>
        <strong>{stats.best == null ? '—' : meta.format(stats.best)}</strong>
        <small>{meta.label}</small>
      </div>

      <section className="score-section">
        <div className="score-section-title">
          <span>BEST RUNS</span>
          <span>{ranked.length}/5</span>
        </div>

        {ranked.length ? (
          <div className="score-list">
            {ranked.map((entry, index) => (
              <div className="score-row" key={`best-${entry.at}-${index}`}>
                <span className={`score-rank rank-${index + 1}`}>#{index + 1}</span>
                <strong>{meta.format(entry.score)}</strong>
                <small>{formatAttemptTime(entry.at)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="score-empty">Finish a scored run to populate this board.</div>
        )}
      </section>

      <section className="score-section recent-section">
        <div className="score-section-title">
          <span>RECENT</span>
          <span>{recent.length}/20</span>
        </div>

        {recent.length ? (
          <div className="score-list">
            {recent.map((entry, index) => (
              <div className="score-row recent-row" key={`recent-${entry.at}-${index}`}>
                <span className={`result-dot ${entry.won ? 'win' : 'loss'}`} />
                <strong>
                  {typeof entry.score === 'number' ? meta.format(entry.score) : entry.won ? 'WIN' : 'DNF'}
                </strong>
                <small>{formatAttemptTime(entry.at)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="score-empty">
            Detailed history starts with your next attempt. Existing best scores are preserved above.
          </div>
        )}
      </section>
    </aside>
  )
}

function GamePreview({ id }) {
  if (id === 'wordle') {
    const cells = [
      ['G', 'correct'], ['L', 'present'], ['Y', 'absent'], ['P', 'absent'], ['H', 'correct'],
      ['P', 'absent'], ['L', 'correct'], ['A', 'correct'], ['N', 'correct'], ['T', 'correct'],
    ]
    return (
      <div className="card-preview word-preview" aria-hidden="true">
        {cells.map(([letter, state], index) => (
          <span className={state} key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>
    )
  }

  if (id === 'hangman') {
    return (
      <div className="card-preview hang-preview" aria-hidden="true">
        <i className="hp-post" />
        <i className="hp-top" />
        <i className="hp-rope" />
        <i className="hp-head" />
        <i className="hp-body" />
        <i className="hp-arm a" />
        <i className="hp-arm b" />
        <div className="hp-word"><span>G</span><span>?</span><span>Y</span><span>?</span><span>H</span></div>
      </div>
    )
  }

  if (id === 'minesweeper') {
    const mineCells = ['1', '', '1', '', '', '', '2', '✦', '2', '', '', '', '1', '1', '1', '']
    return (
      <div className="card-preview mine-preview" aria-hidden="true">
        {mineCells.map((value, index) => (
          <span className={value === '✦' ? 'boom' : value ? 'open' : ''} key={index}>{value}</span>
        ))}
      </div>
    )
  }

  if (id === 'memory') {
    return (
      <div className="card-preview memory-preview" aria-hidden="true">
        {['◇', '?', '○', '?', '◇', '△', '?', '○'].map((value, index) => (
          <span className={value === '?' ? '' : 'open'} key={index}>{value}</span>
        ))}
      </div>
    )
  }

  if (id === '2048') {
    return (
      <div className="card-preview preview2048" aria-hidden="true">
        {[2, 4, 8, 16, 0, 32, 64, 0, 128, 256, 0, 0].map((value, index) => (
          <span className={value ? 'filled' : ''} key={index}>{value || ''}</span>
        ))}
      </div>
    )
  }

  if (id === 'snake') {
    return (
      <div className="card-preview snake-preview" aria-hidden="true">
        {Array.from({ length: 40 }, (_, index) => {
          const snake = [18, 19, 20, 21, 29, 30].includes(index)
          const head = index === 30
          const food = index === 12
          return <span className={head ? 'head' : snake ? 'body' : food ? 'food' : ''} key={index} />
        })}
      </div>
    )
  }

  if (id === 'connections') {
    return (
      <div className="card-preview connections-preview" aria-hidden="true">
        <span>CHROME</span><span>EDGE</span><span>SAFARI</span><span>FIREFOX</span>
        <span className="soft">HEART</span><span className="soft">SPADE</span><span className="soft">CLUB</span><span className="soft">DIAMOND</span>
      </div>
    )
  }

  if (id === 'pokemon-connections') {
    return (
      <div className="card-preview pokemon-preview" aria-hidden="true">
        <span>PIKACHU</span><span>EEVEE</span><span>GENGAR</span><span>LUCARIO</span>
        <span className="soft">MEWTWO</span><span className="soft">SNORLAX</span><span className="soft">GARDEVOIR</span><span className="soft">ABSOL</span>
        <i className="pokemon-preview-ball" />
      </div>
    )
  }

  if (id === 'statle') {
    return (
      <div className="card-preview statle-preview" aria-hidden="true">
        <div className="statle-preview-mon">PK</div>
        <div className="statle-preview-stats">
          <span><b>HP</b>91</span>
          <span><b>ATK</b>134</span>
          <span><b>DEF</b>95</span>
          <span><b>SpA</b>100</span>
          <span><b>SpD</b>100</span>
          <span><b>SPE</b>80</span>
        </div>
      </div>
    )
  }

  if (id === 'connect4') {
    return (
      <div className="card-preview connect-preview" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => (
          <span className={[18,20,25].includes(index) ? 'p1' : [19,24,26].includes(index) ? 'p2' : ''} key={index} />
        ))}
      </div>
    )
  }

  if (id === 'pokeguess') {
    return (
      <div className="card-preview pokeguess-preview" aria-hidden="true">
        <strong>?</strong>
        <div><span>GEN ↑</span><span>TYPE ✓</span><span>1.2m ↓</span></div>
      </div>
    )
  }

  if (id === 'guesswork') {
    return (
      <div className="card-preview guess-preview" aria-hidden="true">
        <span>01</span><p>I orbit something larger.</p><i>?</i>
      </div>
    )
  }

  if (id === 'typing') {
    return (
      <div className="card-preview typing-preview" aria-hidden="true">
        <span>binary</span><strong>vector</strong><span>galaxy</span><i>57 WPM</i>
      </div>
    )
  }

  if (id === 'chess') {
    return (
      <div className="card-preview chess-preview" aria-hidden="true">
        {['♜','','','♚','','','','','', '','♘','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','♔',''].map((piece,index) => <span key={index}>{piece}</span>)}
      </div>
    )
  }

  if (id === 'crossword') {
    return (
      <div className="card-preview cross-preview" aria-hidden="true">
        {'BALLAREALEADLADY'.split('').map((letter,index)=><span key={index}>{letter}</span>)}
      </div>
    )
  }

  if (id === 'sudoku') {
    return (
      <div className="card-preview sudoku-preview" aria-hidden="true">
        {'530070000600195000098000060'.split('').map((n,index)=><span key={index}>{n==='0'?'':n}</span>)}
      </div>
    )
  }

  if (id === 'silhouette') {
    return (
      <div className="card-preview shadow-preview" aria-hidden="true">
        <div className="shadow-blob">?</div><span>GEN ?</span><span>TYPE ?</span>
      </div>
    )
  }

  if (id === 'aim') {
    return (
      <div className="card-preview aim-preview" aria-hidden="true">
        <span className="aim-preview-ring"><i /></span><b>⊕</b><small>96%</small>
      </div>
    )
  }

  return (
    <div className="card-preview reaction-preview" aria-hidden="true">
      <div className="reaction-mini-dot" />
      <strong>243</strong>
      <span>ms</span>
      <i />
    </div>
  )
}

function Dashboard({ profile, totals, onPlay, onReset }) {
  const [expandedGame, setExpandedGame] = useState(null)
  const level = levelFromXp(profile.xp)
  const daily = GAMES[todayIndex(GAMES.length)]
  const unlocked = profile.achievements.length
  const badgeCount = Object.keys(ACHIEVEMENTS).length

  return (
    <div className="dashboard-view">
      <section className="hero">
        <div className="hero-copy-block">
          <div className="kicker">GLYPH // ARCADE SYSTEM</div>
          <h1>Small games.<br /><span>Serious scores.</span></h1>
          <p className="hero-copy">
            Nineteen polished brain-breakers in one tiny arcade. Your stats, XP and streak follow you everywhere.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => onPlay(daily.id)}>
              <span>Play daily challenge</span>
              <span aria-hidden="true">↗</span>
            </button>
            <span className="muted-label">{daily.title} is today’s featured game.</span>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-top">
            <div>
              <span className="micro">PLAYER LEVEL</span>
              <strong>{level.level}</strong>
            </div>
            <div className="xp-pill">{profile.xp} XP</div>
          </div>
          <div className="xp-track" aria-label={`${level.current} of ${level.needed} XP to next level`}>
            <i style={{ width: `${(level.current / level.needed) * 100}%` }} />
          </div>
          <div className="next-level-copy">{level.needed - level.current} XP to level {level.level + 1}</div>
          <div className="profile-grid">
            <div><strong>{totals.played}</strong><span>Played</span></div>
            <div><strong>{totals.wins}</strong><span>Wins</span></div>
            <div><strong>{profile.streak}</strong><span>Streak</span></div>
            <div><strong>{unlocked}/{badgeCount}</strong><span>Badges</span></div>
          </div>
        </div>
      </section>

      <section className="section-head">
        <div>
          <span className="kicker">GAME LIBRARY</span>
          <h2>Choose your problem.</h2>
        </div>
        <span className="muted-label">V3 • {GAMES.length} games</span>
      </section>

      <section className="game-grid">
        {GAMES.map((game) => {
          const stats = profile.games[game.id]
          const isExpanded = expandedGame === game.id

          return (
            <article
              className={`game-card accent-${game.accent} ${isExpanded ? 'mobile-expanded' : ''}`}
              key={game.id}
            >
              <button
                className="mobile-game-tile"
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedGame((current) => current === game.id ? null : game.id)}
              >
                <span className="mobile-tile-icon">{game.icon}</span>
                <span className="mobile-tile-copy">
                  <strong>{game.title}</strong>
                  <small>{game.eyebrow}</small>
                </span>
                <span className="mobile-tile-expand" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
              </button>

              <div className="game-card-details">
                <div className="game-card-top">
                  <div className="game-icon">{game.icon}</div>
                  <span className="game-type">{game.eyebrow}</span>
                </div>

                <GamePreview id={game.id} />

                <div className="game-card-copy">
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                </div>

                <div className="card-stats">
                  <span><b>{stats.wins}</b> / {stats.played} wins</span>
                  <span>{game.bestLabel(stats.best)}</span>
                </div>

                <button className="card-play" onClick={() => onPlay(game.id)}>
                  <span>Play</span>
                  <span className="play-arrow" aria-hidden="true">↗</span>
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <details className="achievements-panel">
        <summary className="achievement-toggle">
          <div>
            <span className="kicker">ACHIEVEMENTS</span>
            <h2>Proof of unnecessary competence.</h2>
            <span className="achievement-count">{unlocked} / {badgeCount} unlocked</span>
          </div>
          <span className="achievement-chevron" aria-hidden="true">⌄</span>
        </summary>

        <div className="achievement-body">
          <div className="achievement-tools">
            <span>{badgeCount - unlocked} still locked. Humanity survives another checklist.</span>
            <button className="text-btn reset-progress" onClick={onReset}>Reset local progress</button>
          </div>

          <div className="badge-grid">
            {Object.entries(ACHIEVEMENTS).map(([id, item]) => {
              const isUnlocked = profile.achievements.includes(id)
              return (
                <div className={`badge ${isUnlocked ? 'unlocked' : ''}`} key={id}>
                  <span className="badge-mark" aria-hidden="true">{isUnlocked ? '◆' : '◇'}</span>
                  <div>
                    <div className="badge-title-row">
                      <strong>{item.name}</strong>
                      {isUnlocked && <span className="badge-state">UNLOCKED</span>}
                    </div>
                    <span>{item.description}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </details>
    </div>
  )
}

export default function App() {
  const [activeGame, setActiveGame] = useState(null)
  const { profile, recordResult, resetProfile, totals } = useProfile()

  const gameMeta = useMemo(
    () => GAMES.find((game) => game.id === activeGame),
    [activeGame],
  )

  const ActiveGame = activeGame ? GAME_COMPONENTS[activeGame] : null

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined

    let listener
    let disposed = false

    CapacitorApp.addListener('backButton', () => {
      if (activeGame) {
        navigate(null)
      } else {
        CapacitorApp.exitApp()
      }
    }).then((handle) => {
      if (disposed) handle.remove()
      else listener = handle
    })

    return () => {
      disposed = true
      listener?.remove()
    }
  }, [activeGame])

  function navigate(nextGame) {
    const apply = () => {
      flushSync(() => setActiveGame(nextGame))
      window.scrollTo(0, 0)
    }

    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate(null)} aria-label="Go to Glyph home">
          <span className="brand-mark">G</span>
          <span>GLYPH</span>
        </button>
        <div className="topbar-right" aria-label="Player summary">
          <span className="status-dot" />
          <span>{profile.xp} XP</span>
          <span className="divider">/</span>
          <span>STREAK {profile.streak}</span>
        </div>
      </header>

      <main>
        {!ActiveGame ? (
          <Dashboard
            profile={profile}
            totals={totals}
            onPlay={navigate}
            onReset={() => {
              if (window.confirm('Reset all local Glyph stats and achievements?')) resetProfile()
            }}
          />
        ) : (
          <section className={`game-screen accent-${gameMeta.accent}`}>
            <button className="back-btn" onClick={() => navigate(null)}>← Back to arcade</button>
            <div className="game-title-row">
              <div>
                <span className="kicker">{gameMeta.eyebrow} // GLYPH</span>
                <h1>{gameMeta.title}</h1>
                <p>{gameMeta.description}</p>
              </div>
              <div className="game-icon large">{gameMeta.icon}</div>
            </div>
            <div className="game-play-layout">
              <div className="game-stage">
                <ActiveGame
                  key={activeGame}
                  onComplete={(result) => recordResult(activeGame, result)}
                />
              </div>
              <LocalScoreboard gameId={activeGame} stats={profile.games[activeGame]} />
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>GLYPH V3</span>
        <span>Progress stays on this device.</span>
      </footer>
    </div>
  )
}
