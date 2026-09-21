import { useEffect, useMemo, useState } from 'react'
import englishWords from 'an-array-of-english-words'
import { WORDLE_ANSWERS } from '../data/words'

const ROWS = 6
const COLS = 5
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

function pickAnswer() {
  return WORDLE_ANSWERS[Math.floor(Math.random() * WORDLE_ANSWERS.length)]
}

function dateKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

function dailyAnswer() {
  const key = dateKey()
  let hash = 2166136261
  for (const char of key) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return WORDLE_ANSWERS[Math.abs(hash) % WORDLE_ANSWERS.length]
}

function scoreGuess(guess, answer) {
  const result = Array(COLS).fill('absent')
  const left = {}

  for (let i = 0; i < COLS; i += 1) {
    if (guess[i] === answer[i]) result[i] = 'correct'
    else left[answer[i]] = (left[answer[i]] || 0) + 1
  }

  for (let i = 0; i < COLS; i += 1) {
    if (result[i] === 'correct') continue
    if ((left[guess[i]] || 0) > 0) {
      result[i] = 'present'
      left[guess[i]] -= 1
    }
  }

  return result
}

function hardModeViolation(guess, guesses) {
  const fixed = Array(COLS).fill(null)
  const minimumCounts = {}

  guesses.forEach(({ word, marks }) => {
    const seen = {}
    marks.forEach((mark, index) => {
      if (mark === 'correct') fixed[index] = word[index]
      if (mark === 'correct' || mark === 'present') {
        seen[word[index]] = (seen[word[index]] || 0) + 1
      }
    })
    Object.entries(seen).forEach(([letter, count]) => {
      minimumCounts[letter] = Math.max(minimumCounts[letter] || 0, count)
    })
  })

  for (let index = 0; index < COLS; index += 1) {
    if (fixed[index] && guess[index] !== fixed[index]) {
      return `Position ${index + 1} must be ${fixed[index]}.`
    }
  }

  for (const [letter, minimum] of Object.entries(minimumCounts)) {
    const actual = guess.split('').filter((value) => value === letter).length
    if (actual < minimum) {
      return `Hard mode requires ${minimum > 1 ? minimum + ' ' : ''}${letter}${minimum > 1 ? 's' : ''}.`
    }
  }

  return null
}

export default function WordGrid({ onComplete }) {
  const dictionary = useMemo(() => {
    const words = englishWords
      .filter((word) => /^[a-zA-Z]{5}$/.test(word))
      .map((word) => word.toUpperCase())
    return new Set([...words, ...WORDLE_ANSWERS])
  }, [])

  const [gameMode, setGameMode] = useState('PRACTICE')
  const [hardMode, setHardMode] = useState(false)
  const [answer, setAnswer] = useState(pickAnswer)
  const [guesses, setGuesses] = useState([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState('')
  const [keyStates, setKeyStates] = useState({})

  function answerFor(mode) {
    return mode === 'DAILY' ? dailyAnswer() : pickAnswer()
  }

  function reset(nextMode = gameMode) {
    setAnswer(answerFor(nextMode))
    setGuesses([])
    setCurrent('')
    setStatus('playing')
    setMessage('')
    setKeyStates({})
  }

  function switchMode(nextMode) {
    setGameMode(nextMode)
    reset(nextMode)
  }

  function submit() {
    if (status !== 'playing') return
    if (current.length !== COLS) {
      setMessage('Five letters required.')
      return
    }
    if (!dictionary.has(current)) {
      setMessage(`${current} is not in the dictionary.`)
      return
    }

    if (hardMode && guesses.length) {
      const violation = hardModeViolation(current, guesses)
      if (violation) {
        setMessage(violation)
        return
      }
    }

    const marks = scoreGuess(current, answer)
    const nextGuesses = [...guesses, { word: current, marks }]
    setGuesses(nextGuesses)

    setKeyStates((old) => {
      const rank = { absent: 1, present: 2, correct: 3 }
      const next = { ...old }
      current.split('').forEach((letter, index) => {
        const mark = marks[index]
        if (!next[letter] || rank[mark] > rank[next[letter]]) next[letter] = mark
      })
      return next
    })

    if (current === answer) {
      const attempts = nextGuesses.length
      setStatus('won')
      setMessage(
        gameMode === 'DAILY'
          ? `Daily solved in ${attempts}/6.`
          : `Solved in ${attempts}/6.`,
      )
      onComplete({
        won: true,
        score: attempts,
        lowerIsBetter: true,
        bonusXp: Math.min(
          40,
          (ROWS - attempts) * 7 + (hardMode ? 8 : 0) + (gameMode === 'DAILY' ? 4 : 0),
        ),
      })
      return
    }

    if (nextGuesses.length >= ROWS) {
      setStatus('lost')
      setMessage(`The word was ${answer}.`)
      onComplete({ won: false })
      return
    }

    setCurrent('')
    setMessage('')
  }

  function input(key) {
    if (status !== 'playing') return
    if (key === 'ENTER') return submit()
    if (key === 'BACKSPACE') {
      setCurrent((value) => value.slice(0, -1))
      return
    }
    if (/^[A-Z]$/.test(key)) {
      setCurrent((value) => (value.length < COLS ? value + key : value))
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable)
      ) return
      const key = event.key.toUpperCase()
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        event.preventDefault()
        input(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const rows = Array.from({ length: ROWS }, (_, rowIndex) => {
    const submitted = guesses[rowIndex]
    const live = rowIndex === guesses.length && status === 'playing' ? current : ''
    const word = submitted?.word || live
    return Array.from({ length: COLS }, (_, columnIndex) => ({
      letter: word[columnIndex] || '',
      mark: submitted?.marks[columnIndex] || '',
    }))
  })

  return (
    <div className="game-panel word-panel">
      <div className="word-mode-bar">
        <div className="filter-chips">
          {['PRACTICE', 'DAILY'].map((item) => (
            <button
              className={`filter-chip ${gameMode === item ? 'active' : ''}`}
              onClick={() => switchMode(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          className={`word-hard-toggle ${hardMode ? 'active' : ''}`}
          onClick={() => setHardMode((value) => !value)}
        >
          <span>HARD MODE</span>
          <small>{hardMode ? 'revealed clues enforced' : 'optional'}</small>
        </button>
      </div>

      <div className="game-toolbar">
        <div>
          <span className="micro">{gameMode === 'DAILY' ? 'DAILY GRID' : 'DICTIONARY ONLINE'}</span>
          <strong>
            {gameMode === 'DAILY'
              ? `${dateKey()} · same word all day`
              : `${dictionary.size.toLocaleString()} valid 5-letter guesses`}
          </strong>
        </div>
        <button className="secondary-btn" onClick={() => reset()}>
          {gameMode === 'DAILY' ? 'Restart daily' : 'New word'}
        </button>
      </div>

      <div className="word-board" aria-label="Word Grid board">
        {rows.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <div
              className={`word-cell ${cell.letter ? 'filled' : ''} ${cell.mark ? `mark-${cell.mark}` : ''}`}
              key={`${rowIndex}-${columnIndex}`}
            >
              {cell.letter}
            </div>
          )),
        )}
      </div>

      <div className={`game-message ${status}`}>
        {message || (
          hardMode
            ? 'Hard mode: greens stay fixed and revealed letters must be reused.'
            : 'Type or use the keyboard below.'
        )}
      </div>

      <div className="keypad">
        {KEY_ROWS.map((letters, rowIndex) => (
          <div className="key-row" key={letters}>
            {rowIndex === 2 && <button className="key wide" onClick={() => input('ENTER')}>ENTER</button>}
            {[...letters].map((letter) => (
              <button
                className={`key ${keyStates[letter] ? `key-${keyStates[letter]}` : ''}`}
                key={letter}
                onClick={() => input(letter)}
              >
                {letter}
              </button>
            ))}
            {rowIndex === 2 && <button className="key wide" onClick={() => input('BACKSPACE')}>⌫</button>}
          </div>
        ))}
      </div>
    </div>
  )
}
