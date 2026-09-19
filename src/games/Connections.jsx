import { useMemo, useState } from 'react'

const PUZZLES = [
  [
    { title: 'WEB BROWSERS', words: ['CHROME', 'SAFARI', 'EDGE', 'FIREFOX'] },
    { title: 'CARD SUITS', words: ['HEART', 'SPADE', 'CLUB', 'DIAMOND'] },
    { title: 'WAYS TO MOVE FAST', words: ['SPRINT', 'DASH', 'RUSH', 'BOLT'] },
    { title: 'CAN FOLLOW “STAR”', words: ['FISH', 'LIGHT', 'DUST', 'SHIP'] },
  ],
  [
    { title: 'PROGRAMMING LANGUAGES', words: ['PYTHON', 'RUST', 'SWIFT', 'RUBY'] },
    { title: 'COFFEE ORDERS', words: ['LATTE', 'MOCHA', 'ESPRESSO', 'CAPPUCCINO'] },
    { title: 'BOARD GAME PIECES', words: ['PAWN', 'TOKEN', 'DIE', 'MEEPLE'] },
    { title: 'CAN FOLLOW “SPACE”', words: ['BAR', 'SHIP', 'SUIT', 'WALK'] },
  ],
  [
    { title: 'WEATHER', words: ['RAIN', 'HAIL', 'SNOW', 'SLEET'] },
    { title: 'PHONE ACTIONS', words: ['CALL', 'TEXT', 'SWIPE', 'SCROLL'] },
    { title: 'MUSIC TERMS', words: ['BEAT', 'NOTE', 'CHORD', 'TEMPO'] },
    { title: 'CAN FOLLOW “BLUE”', words: ['BERRY', 'TOOTH', 'PRINT', 'BIRD'] },
  ],
  [
    { title: 'GAME GENRES', words: ['RACING', 'PUZZLE', 'HORROR', 'SPORTS'] },
    { title: 'SHAPES', words: ['CIRCLE', 'SQUARE', 'OVAL', 'TRIANGLE'] },
    { title: 'THINGS WITH KEYS', words: ['PIANO', 'LOCK', 'KEYBOARD', 'MAP'] },
    { title: 'CAN FOLLOW “BLACK”', words: ['JACK', 'OUT', 'BIRD', 'BOARD'] },
  ],
]

function shuffle(values) {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function randomPuzzle() {
  const groups = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
  return {
    groups,
    words: shuffle(groups.flatMap((group) => group.words)),
  }
}

export default function Connections({ onComplete }) {
  const [puzzle, setPuzzle] = useState(randomPuzzle)
  const [selected, setSelected] = useState([])
  const [solved, setSolved] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState('Select four words that belong together.')

  const remaining = useMemo(
    () => puzzle.words.filter((word) => !solved.some((group) => group.words.includes(word))),
    [puzzle, solved],
  )

  function reset() {
    setPuzzle(randomPuzzle())
    setSelected([])
    setSolved([])
    setMistakes(0)
    setStatus('playing')
    setMessage('Select four words that belong together.')
  }

  function toggle(word) {
    if (status !== 'playing') return
    setSelected((current) => {
      if (current.includes(word)) return current.filter((item) => item !== word)
      if (current.length >= 4) return current
      return [...current, word]
    })
  }

  function submit() {
    if (status !== 'playing' || selected.length !== 4) return

    const exact = puzzle.groups.find(
      (group) => group.words.every((word) => selected.includes(word)) &&
        !solved.some((done) => done.title === group.title),
    )

    if (exact) {
      const nextSolved = [...solved, exact]
      setSolved(nextSolved)
      setSelected([])

      if (nextSolved.length === puzzle.groups.length) {
        setStatus('won')
        setMessage(`Solved with ${mistakes} mistake${mistakes === 1 ? '' : 's'}.`)
        onComplete({
          won: true,
          score: mistakes,
          lowerIsBetter: true,
          bonusXp: Math.max(0, 36 - mistakes * 9),
        })
      } else {
        setMessage(exact.title)
      }
      return
    }

    const near = puzzle.groups.some((group) => {
      const count = selected.filter((word) => group.words.includes(word)).length
      return count === 3
    })

    const nextMistakes = mistakes + 1
    setMistakes(nextMistakes)
    setSelected([])
    setMessage(near ? 'One away… painfully close.' : 'Not a group. Try another combination.')

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
        ...shuffle(current.words.filter((word) => !solved.some((group) => group.words.includes(word)))),
        ...current.words.filter((word) => solved.some((group) => group.words.includes(word))),
      ],
    }))
    setSelected([])
  }

  return (
    <div className="game-panel connections-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">GROUPS</span><strong>{solved.length}/4</strong></div>
          <div><span className="micro">MISTAKES</span><strong>{mistakes}/4</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>New puzzle</button>
      </div>

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
        <button className="secondary-btn" onClick={shuffleRemaining} disabled={status !== 'playing'}>Shuffle</button>
        <button className="primary-btn small-primary" onClick={submit} disabled={selected.length !== 4 || status !== 'playing'}>
          Submit group
        </button>
      </div>

      <div className={`game-message ${status}`}>{message}</div>
    </div>
  )
}
