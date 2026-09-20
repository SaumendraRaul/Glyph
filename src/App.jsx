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

const GAMES = [
  {
    id: 'wordle',
    title: 'Word Grid',
    eyebrow: 'WORDS',
    icon: 'Aa',
    description: 'Crack a five-letter word in six guesses.',
    accent: 'lime',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}/6 guesses`),
  },
  {
    id: 'hangman',
    title: 'Hangman',
    eyebrow: 'WORDS',
    icon: '⌁',
    description: 'Reveal the word before the drawing is complete.',
    accent: 'violet',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} misses`),
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    eyebrow: 'LOGIC',
    icon: '✦',
    description: 'Clear the field without touching a mine.',
    accent: 'orange',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best}s`),
  },
  {
    id: 'memory',
    title: 'Memory Match',
    eyebrow: 'MEMORY',
    icon: '◇',
    description: 'Find every pair with as few moves as possible.',
    accent: 'cyan',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} moves`),
  },
  {
    id: '2048',
    title: '2048',
    eyebrow: 'NUMBERS',
    icon: '2ⁿ',
    description: 'Merge equal tiles until the board gives you 2048.',
    accent: 'amber',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best.toLocaleString()} pts`),
  },
  {
    id: 'snake',
    title: 'Snake',
    eyebrow: 'ARCADE',
    icon: '∿',
    description: 'Eat twelve targets without meeting yourself or a wall.',
    accent: 'mint',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} food`),
  },
  {
    id: 'connections',
    title: 'Connections',
    eyebrow: 'PATTERNS',
    icon: '4×',
    description: 'Sort sixteen words into four hidden groups.',
    accent: 'rose',
    bestLabel: (best) => (best == null ? 'No best yet' : `Best: ${best} mistakes`),
  },
  {
    id: 'reaction',
    title: 'Reaction Test',
    eyebrow: 'REFLEX',
    icon: '⚡',
    description: 'Five rounds. One signal. No premature heroics.',
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
            Ten polished brain-breakers in one tiny arcade. Your stats, XP and streak follow you everywhere.
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
        <span className="muted-label">V2 • {GAMES.length} games</span>
      </section>

      <section className="game-grid">
        {GAMES.map((game) => {
          const stats = profile.games[game.id]
          return (
            <article className={`game-card accent-${game.accent}`} key={game.id}>
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
            </article>
          )
        })}
      </section>

      <section className="achievements-panel">
        <div className="section-head compact">
          <div>
            <span className="kicker">ACHIEVEMENTS</span>
            <h2>Proof of unnecessary competence.</h2>
          </div>
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
      </section>
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
        <span>GLYPH V2</span>
        <span>Progress stays on this device.</span>
      </footer>
    </div>
  )
}
