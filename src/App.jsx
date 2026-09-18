import { useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { ACHIEVEMENTS, useProfile } from './lib/profile'
import WordGrid from './games/WordGrid'
import Hangman from './games/Hangman'
import Minesweeper from './games/Minesweeper'
import MemoryMatch from './games/MemoryMatch'

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
]

const GAME_COMPONENTS = {
  wordle: WordGrid,
  hangman: Hangman,
  minesweeper: Minesweeper,
  memory: MemoryMatch,
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

  return (
    <div className="card-preview memory-preview" aria-hidden="true">
      {['◇', '?', '○', '?', '◇', '△', '?', '○'].map((value, index) => (
        <span className={value === '?' ? '' : 'open'} key={index}>{value}</span>
      ))}
    </div>
  )
}

function Dashboard({ profile, totals, onPlay, onReset }) {
  const level = levelFromXp(profile.xp)
  const daily = GAMES[todayIndex(GAMES.length)]
  const unlocked = profile.achievements.length

  return (
    <div className="dashboard-view">
      <section className="hero">
        <div className="hero-copy-block">
          <div className="kicker">GLYPH // ARCADE SYSTEM</div>
          <h1>Small games.<br /><span>Serious scores.</span></h1>
          <p className="hero-copy">
            Four polished brain-breakers in one tiny arcade. Your stats, XP and streak follow you everywhere.
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
            <div><strong>{unlocked}/7</strong><span>Badges</span></div>
          </div>
        </div>
      </section>

      <section className="section-head">
        <div>
          <span className="kicker">GAME LIBRARY</span>
          <h2>Choose your problem.</h2>
        </div>
        <span className="muted-label">V1 • {GAMES.length} games</span>
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
            <div className="game-stage">
              <ActiveGame
                key={activeGame}
                onComplete={(result) => recordResult(activeGame, result)}
              />
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>GLYPH V1</span>
        <span>Progress stays on this device.</span>
      </footer>
    </div>
  )
}
