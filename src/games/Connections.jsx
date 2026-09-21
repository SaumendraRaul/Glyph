import { useMemo, useState } from 'react'

const PUZZLES = [
  {
    id: 'general-easy',
    theme: 'GENERAL',
    difficulty: 'EASY',
    groups: [
      { title: 'WEATHER', words: ['RAIN', 'HAIL', 'SNOW', 'SLEET'] },
      { title: 'SHAPES', words: ['CIRCLE', 'SQUARE', 'OVAL', 'TRIANGLE'] },
      { title: 'CARD SUITS', words: ['HEART', 'SPADE', 'CLUB', 'DIAMOND'] },
      { title: 'MUSIC TERMS', words: ['BEAT', 'NOTE', 'CHORD', 'TEMPO'] },
    ],
  },
  {
    id: 'general-hard',
    theme: 'GENERAL',
    difficulty: 'HARD',
    groups: [
      { title: 'BOARD GAME PIECES', words: ['PAWN', 'TOKEN', 'DIE', 'MEEPLE'] },
      { title: 'THINGS WITH KEYS', words: ['PIANO', 'LOCK', 'KEYBOARD', 'MAP'] },
      { title: 'WAYS TO MOVE FAST', words: ['SPRINT', 'DASH', 'RUSH', 'BOLT'] },
      { title: 'CAN FOLLOW “STAR”', words: ['FISH', 'LIGHT', 'DUST', 'SHIP'] },
    ],
  },
  {
    id: 'tech-easy',
    theme: 'TECH',
    difficulty: 'EASY',
    groups: [
      { title: 'WEB BROWSERS', words: ['CHROME', 'SAFARI', 'EDGE', 'FIREFOX'] },
      { title: 'PROGRAMMING LANGUAGES', words: ['PYTHON', 'RUST', 'SWIFT', 'RUBY'] },
      { title: 'PHONE ACTIONS', words: ['CALL', 'TEXT', 'SWIPE', 'SCROLL'] },
      { title: 'COMPUTER STORAGE', words: ['SSD', 'HDD', 'CACHE', 'RAM'] },
    ],
  },
  {
    id: 'tech-hard',
    theme: 'TECH',
    difficulty: 'HARD',
    groups: [
      { title: 'DATABASES', words: ['POSTGRES', 'MYSQL', 'MONGODB', 'SQLITE'] },
      { title: 'WEB PROTOCOLS', words: ['HTTP', 'HTTPS', 'FTP', 'SSH'] },
      { title: 'VERSION CONTROL WORDS', words: ['COMMIT', 'BRANCH', 'MERGE', 'CLONE'] },
      { title: 'CAN FOLLOW “CLOUD”', words: ['NINE', 'BURST', 'BASE', 'FRONT'] },
    ],
  },
  {
    id: 'everyday-easy',
    theme: 'EVERYDAY',
    difficulty: 'EASY',
    groups: [
      { title: 'COFFEE ORDERS', words: ['LATTE', 'MOCHA', 'ESPRESSO', 'CAPPUCCINO'] },
      { title: 'KITCHEN ITEMS', words: ['WHISK', 'PAN', 'PLATE', 'KETTLE'] },
      { title: 'CLOTHING', words: ['SHIRT', 'SOCK', 'JACKET', 'SCARF'] },
      { title: 'ROOMS IN A HOME', words: ['KITCHEN', 'BEDROOM', 'GARAGE', 'ATTIC'] },
    ],
  },
  {
    id: 'everyday-hard',
    theme: 'EVERYDAY',
    difficulty: 'HARD',
    groups: [
      { title: 'CAN FOLLOW “BLACK”', words: ['JACK', 'OUT', 'BIRD', 'BOARD'] },
      { title: 'CAN FOLLOW “BLUE”', words: ['BERRY', 'TOOTH', 'PRINT', 'MOON'] },
      { title: 'THINGS YOU CAN BREAK', words: ['PROMISE', 'RECORD', 'GLASS', 'SILENCE'] },
      { title: 'THINGS WITH A RING', words: ['PHONE', 'TREE', 'BOXING', 'SATURN'] },
    ],
  },
  {
    id: 'wordplay-easy',
    theme: 'WORDPLAY',
    difficulty: 'EASY',
    groups: [
      { title: 'CAN FOLLOW “SPACE”', words: ['BAR', 'SHIP', 'SUIT', 'WALK'] },
      { title: 'CAN FOLLOW “SUN”', words: ['FLOWER', 'LIGHT', 'RISE', 'SCREEN'] },
      { title: 'CAN FOLLOW “BOOK”', words: ['MARK', 'CASE', 'WORM', 'SHELF'] },
      { title: 'CAN FOLLOW “RAIN”', words: ['BOW', 'DROP', 'FALL', 'COAT'] },
    ],
  },
  {
    id: 'wordplay-hard',
    theme: 'WORDPLAY',
    difficulty: 'HARD',
    groups: [
      { title: 'CAN FOLLOW “HEAD”', words: ['LINE', 'LIGHT', 'PHONE', 'SPACE'] },
      { title: 'CAN FOLLOW “BACK”', words: ['PACK', 'SPACE', 'BONE', 'DROP'] },
      { title: 'CAN FOLLOW “HAND”', words: ['SHAKE', 'BOOK', 'BAG', 'MADE'] },
      { title: 'CAN FOLLOW “SIDE”', words: ['WALK', 'KICK', 'BAR', 'BURN'] },
    ],
  },
]

const THEMES = ['ALL', 'GENERAL', 'TECH', 'EVERYDAY', 'WORDPLAY']

function blankCustomGroups() {
  return Array.from({ length: 4 }, () => ({ title: '', words: '' }))
}

function shuffle(values) {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function matchesFilters(puzzle, theme, difficulty) {
  return (
    (theme === 'ALL' || puzzle.theme === theme) &&
    (difficulty === 'ALL' || puzzle.difficulty === difficulty)
  )
}

function randomPuzzle(theme = 'ALL', difficulty = 'ALL', previousId = null) {
  let candidates = PUZZLES.filter((puzzle) =>
    matchesFilters(puzzle, theme, difficulty),
  )

  if (!candidates.length) candidates = PUZZLES

  const alternatives = candidates.filter(
    (puzzle) => puzzle.id !== previousId,
  )
  const pool = alternatives.length ? alternatives : candidates
  const picked = pool[Math.floor(Math.random() * pool.length)]

  return {
    ...picked,
    words: shuffle(picked.groups.flatMap((group) => group.words)),
  }
}

function prepareCustomGroups(fields) {
  const groups = fields.map((field) => ({
    title: field.title.trim().toUpperCase(),
    words: field.words
      .split(',')
      .map((word) => word.trim().toUpperCase())
      .filter(Boolean),
  }))

  if (groups.some((group) => !group.title)) {
    return { error: 'Every group needs a category title.' }
  }

  if (new Set(groups.map((group) => group.title)).size !== 4) {
    return { error: 'Use four different category titles.' }
  }

  if (groups.some((group) => group.words.length !== 4)) {
    return { error: 'Each category needs exactly four comma-separated words.' }
  }

  if (groups.some((group) => group.words.some((word) => word.length > 18))) {
    return { error: 'Keep each word or phrase to 18 characters or fewer.' }
  }

  const allWords = groups.flatMap((group) => group.words)
  if (new Set(allWords).size !== 16) {
    return { error: 'All 16 entries must be unique.' }
  }

  return { groups }
}

export default function Connections({ onComplete }) {
  const [playMode, setPlayMode] = useState('BUILTIN')
  const [phase, setPhase] = useState('PLAY')
  const [theme, setTheme] = useState('ALL')
  const [difficulty, setDifficulty] = useState('ALL')
  const [puzzle, setPuzzle] = useState(() => randomPuzzle())
  const [selected, setSelected] = useState([])
  const [solved, setSolved] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState(
    'Select four words that belong together.',
  )

  const [customGroups, setCustomGroups] = useState(blankCustomGroups)
  const [customError, setCustomError] = useState('')

  const availableDifficulties = useMemo(() => {
    const values = new Set(
      PUZZLES
        .filter((item) => theme === 'ALL' || item.theme === theme)
        .map((item) => item.difficulty),
    )

    return [
      'ALL',
      ...['EASY', 'MEDIUM', 'HARD'].filter((item) => values.has(item)),
    ]
  }, [theme])

  const matchCount = useMemo(
    () =>
      PUZZLES.filter((item) =>
        matchesFilters(item, theme, difficulty),
      ).length,
    [theme, difficulty],
  )

  const remaining = useMemo(
    () =>
      puzzle.words.filter(
        (word) =>
          !solved.some((group) => group.words.includes(word)),
      ),
    [puzzle, solved],
  )

  function clearPlayState() {
    setSelected([])
    setSolved([])
    setMistakes(0)
    setStatus('playing')
    setMessage('Select four words that belong together.')
  }

  function chooseTheme(nextTheme) {
    setTheme(nextTheme)

    if (
      difficulty !== 'ALL' &&
      !PUZZLES.some((item) =>
        matchesFilters(item, nextTheme, difficulty),
      )
    ) {
      setDifficulty('ALL')
    }
  }

  function switchMode(nextMode) {
    setPlayMode(nextMode)
    setCustomError('')

    if (nextMode === 'BUILTIN') {
      setPhase('PLAY')
      setPuzzle(randomPuzzle(theme, difficulty))
      clearPlayState()
    } else {
      setPhase('SETUP')
      clearPlayState()
    }
  }

  function reset() {
    if (playMode === 'CUSTOM') {
      setPhase('SETUP')
      clearPlayState()
      return
    }

    setPuzzle((current) =>
      randomPuzzle(theme, difficulty, current.id),
    )
    clearPlayState()
  }

  function updateCustomGroup(index, field, value) {
    setCustomGroups((current) =>
      current.map((group, groupIndex) =>
        groupIndex === index
          ? { ...group, [field]: value }
          : group,
      ),
    )
  }

  function lockCustomPuzzle(event) {
    event.preventDefault()
    const prepared = prepareCustomGroups(customGroups)

    if (prepared.error) {
      setCustomError(prepared.error)
      return
    }

    setPuzzle({
      id: `custom-${Date.now()}`,
      theme: 'CUSTOM',
      difficulty: '2 PLAYER',
      groups: prepared.groups,
      words: shuffle(prepared.groups.flatMap((group) => group.words)),
    })

    setCustomError('')
    clearPlayState()
    setPhase('PASS')
  }

  function startCustomPuzzle() {
    clearPlayState()
    setPhase('PLAY')
  }

  function toggle(word) {
    if (status !== 'playing') return

    setSelected((current) => {
      if (current.includes(word)) {
        return current.filter((item) => item !== word)
      }

      if (current.length >= 4) return current
      return [...current, word]
    })
  }

  function submit() {
    if (status !== 'playing' || selected.length !== 4) return

    const exact = puzzle.groups.find(
      (group) =>
        group.words.every((word) => selected.includes(word)) &&
        !solved.some((done) => done.title === group.title),
    )

    if (exact) {
      const nextSolved = [...solved, exact]
      setSolved(nextSolved)
      setSelected([])

      if (nextSolved.length === puzzle.groups.length) {
        setStatus('won')
        setMessage(
          `Solved with ${mistakes} mistake${mistakes === 1 ? '' : 's'}.`,
        )

        onComplete({
          won: true,
          score: mistakes,
          lowerIsBetter: true,
          bonusXp: Math.max(
            0,
            36 - mistakes * 9 + (playMode === 'CUSTOM' ? 4 : 0),
          ),
        })
      } else {
        setMessage(exact.title)
      }

      return
    }

    const near = puzzle.groups.some((group) => {
      const count = selected.filter((word) =>
        group.words.includes(word),
      ).length
      return count === 3
    })

    const nextMistakes = mistakes + 1
    setMistakes(nextMistakes)
    setSelected([])
    setMessage(
      near
        ? 'One away… painfully close.'
        : 'Not a group. Try another combination.',
    )

    if (nextMistakes >= 4) {
      setStatus('lost')
      setMessage('Four mistakes. The remaining groups have been revealed.')
      setSolved(puzzle.groups)
      onComplete({ won: false })
    }
  }

  function shuffleRemaining() {
    setPuzzle((current) => ({
      ...current,
      words: [
        ...shuffle(
          current.words.filter(
            (word) =>
              !solved.some((group) => group.words.includes(word)),
          ),
        ),
        ...current.words.filter((word) =>
          solved.some((group) => group.words.includes(word)),
        ),
      ],
    }))
    setSelected([])
  }

  if (playMode === 'CUSTOM' && phase === 'SETUP') {
    return (
      <div className="game-panel connections-panel">
        <div className="connection-mode-switch">
          <button onClick={() => switchMode('BUILTIN')}>BUILT-IN</button>
          <button className="active" onClick={() => switchMode('CUSTOM')}>
            2 PLAYER
          </button>
        </div>

        <form className="connection-builder" onSubmit={lockCustomPuzzle}>
          <div className="connection-builder-head">
            <span className="micro">PLAYER 1 · PUZZLE BUILDER</span>
            <h3>Hide four connections in sixteen words.</h3>
            <p>
              Use four unique words or short phrases per category. Player 2
              sees only the shuffled grid after hand-off.
            </p>
          </div>

          <div className="connection-builder-groups">
            {customGroups.map((group, index) => (
              <div className="connection-builder-group" key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>

                <input
                  value={group.title}
                  onChange={(event) =>
                    updateCustomGroup(index, 'title', event.target.value.slice(0, 32))
                  }
                  placeholder="Category title"
                  maxLength={32}
                />

                <input
                  value={group.words}
                  onChange={(event) =>
                    updateCustomGroup(index, 'words', event.target.value.slice(0, 100))
                  }
                  placeholder="word 1, word 2, word 3, word 4"
                  maxLength={100}
                />
              </div>
            ))}
          </div>

          {customError && (
            <div className="connection-builder-error">{customError}</div>
          )}

          <button className="primary-btn connection-lock" type="submit">
            Lock puzzle & pass device
            <span>→</span>
          </button>
        </form>
      </div>
    )
  }

  if (playMode === 'CUSTOM' && phase === 'PASS') {
    return (
      <div className="game-panel connections-panel connection-pass">
        <div className="connection-pass-mark">4×4</div>
        <span className="micro">CUSTOM PUZZLE LOCKED</span>
        <h3>Pass the device to Player 2.</h3>
        <p>
          Sixteen entries are shuffled. Category names and grouping are now
          hidden.
        </p>

        <div className="connection-pass-grid" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <span key={index}>?</span>
          ))}
        </div>

        <button className="primary-btn" onClick={startCustomPuzzle}>
          Player 2 ready
          <span>→</span>
        </button>

        <button className="text-btn" onClick={() => setPhase('SETUP')}>
          ← Back to builder
        </button>
      </div>
    )
  }

  return (
    <div className="game-panel connections-panel">
      <div className="connection-mode-switch">
        <button
          className={playMode === 'BUILTIN' ? 'active' : ''}
          onClick={() => switchMode('BUILTIN')}
        >
          BUILT-IN
        </button>
        <button
          className={playMode === 'CUSTOM' ? 'active' : ''}
          onClick={() => switchMode('CUSTOM')}
        >
          2 PLAYER
        </button>
      </div>

      <div className="game-toolbar">
        <div className="mine-stats">
          <div>
            <span className="micro">GROUPS</span>
            <strong>{solved.length}/4</strong>
          </div>
          <div>
            <span className="micro">MISTAKES</span>
            <strong>{mistakes}/4</strong>
          </div>
          <div>
            <span className="micro">SOURCE</span>
            <strong>{playMode === 'CUSTOM' ? 'LOCAL' : puzzle.theme}</strong>
          </div>
        </div>

        <button className="secondary-btn" onClick={reset}>
          {playMode === 'CUSTOM' ? 'New custom' : 'New puzzle'}
        </button>
      </div>

      {playMode === 'BUILTIN' && (
        <div className="connection-filters">
          <div className="filter-row">
            <span className="filter-label">THEME</span>
            <div className="filter-chips">
              {THEMES.map((item) => (
                <button
                  className={`filter-chip ${theme === item ? 'active' : ''}`}
                  key={item}
                  onClick={() => chooseTheme(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="filter-label">DIFFICULTY</span>
            <div className="filter-chips">
              {availableDifficulties.map((item) => (
                <button
                  className={`filter-chip ${difficulty === item ? 'active' : ''}`}
                  key={item}
                  onClick={() => setDifficulty(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-summary">
            Next puzzle:
            <strong>{theme === 'ALL' ? 'ANY THEME' : theme}</strong>
            <span>•</span>
            <strong>{difficulty === 'ALL' ? 'ANY DIFFICULTY' : difficulty}</strong>
            <span>•</span>
            {matchCount} set{matchCount === 1 ? '' : 's'}
          </div>
        </div>
      )}

      <div className="connections-solved">
        {solved.map((group, index) => (
          <div className={`connection-group g${index}`} key={group.title}>
            <strong>{group.title}</strong>
            <span>{group.words.join(' · ')}</span>
          </div>
        ))}
      </div>

      <div className="connections-grid">
        {remaining.map((word) => (
          <button
            className={`connection-word ${selected.includes(word) ? 'selected' : ''}`}
            key={word}
            onClick={() => toggle(word)}
            disabled={status !== 'playing'}
          >
            {word}
          </button>
        ))}
      </div>

      <div className="connections-actions">
        <button
          className="secondary-btn"
          onClick={shuffleRemaining}
          disabled={status !== 'playing'}
        >
          Shuffle
        </button>

        <button
          className="primary-btn small-primary"
          onClick={submit}
          disabled={selected.length !== 4 || status !== 'playing'}
        >
          Submit group
        </button>
      </div>

      <div className={`game-message ${status}`}>{message}</div>
    </div>
  )
}
