import { useEffect, useMemo, useState } from 'react'
import englishWords from 'an-array-of-english-words'
import { WORDLE_ANSWERS } from '../data/words'

const ROWS = 6
const COLS = 5
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

function pickAnswer() {
  return WORDLE_ANSWERS[Math.floor(Math.random() * WORDLE_ANSWERS.length)]
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

export default function WordGrid({ onComplete }) {
  const dictionary = useMemo(() => {
    const words = englishWords
      .filter((word) => /^[a-zA-Z]{5}$/.test(word))
      .map((word) => word.toUpperCase())
    return new Set([...words, ...WORDLE_ANSWERS])
  }, [])

  const [answer, setAnswer] = useState(pickAnswer)
  const [guesses, setGuesses] = useState([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState('')
  const [keyStates, setKeyStates] = useState({})

  function reset() {
    setAnswer(pickAnswer())
    setGuesses([])
    setCurrent('')
    setStatus('playing')
    setMessage('')
    setKeyStates({})
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
      setMessage(`Solved in ${attempts}/6.`)
      onComplete({
        won: true,
        score: attempts,
        lowerIsBetter: true,
        bonusXp: (ROWS - attempts) * 7,
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
      <div className="game-toolbar">
        <div>
          <span className="micro">DICTIONARY ONLINE</span>
          <strong>{dictionary.size.toLocaleString()} valid 5-letter guesses</strong>
        </div>
        <button className="secondary-btn" onClick={reset}>New word</button>
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

      <div className={`game-message ${status}`}>{message || 'Type or use the keyboard below.'}</div>

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
