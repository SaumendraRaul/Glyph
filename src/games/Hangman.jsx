import { useEffect, useMemo, useState } from 'react'
import { HANGMAN_WORDS } from '../data/words'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MAX_WRONG = 6
const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD']

function pickEntry(difficulty = 'ALL', excludeWord = null) {
  let pool = HANGMAN_WORDS.filter(
    (item) => difficulty === 'ALL' || item.difficulty === difficulty,
  )

  const alternatives = pool.filter((item) => item.word !== excludeWord)
  if (alternatives.length) pool = alternatives

  return pool[Math.floor(Math.random() * pool.length)]
}

function difficultyBonus(difficulty) {
  if (difficulty === 'HARD') return 12
  if (difficulty === 'MEDIUM') return 6
  return 0
}

export default function Hangman({ onComplete }) {
  const [difficulty, setDifficulty] = useState('ALL')
  const [entry, setEntry] = useState(() => pickEntry())
  const [guessed, setGuessed] = useState([])
  const [status, setStatus] = useState('playing')
  const [hintUsed, setHintUsed] = useState(false)
  const [hintPenalty, setHintPenalty] = useState(0)
  const [lastGuess, setLastGuess] = useState(null)

  const wrongLetters = useMemo(
    () => guessed.filter((letter) => !entry.word.includes(letter)),
    [guessed, entry.word],
  )

  const strikes = wrongLetters.length + hintPenalty
  const lives = Math.max(0, MAX_WRONG - strikes)
  const solved = [...entry.word].every(
    (letter) => !/[A-Z]/.test(letter) || guessed.includes(letter),
  )
  const revealedCount = [...new Set(entry.word.split(''))]
    .filter((letter) => /[A-Z]/.test(letter) && guessed.includes(letter))
    .length
  const uniqueLetters = new Set(entry.word.split('').filter((letter) => /[A-Z]/.test(letter))).size
  const progress = uniqueLetters ? Math.round((revealedCount / uniqueLetters) * 100) : 0

  function reset(nextDifficulty = difficulty) {
    setEntry((current) => pickEntry(nextDifficulty, current.word))
    setGuessed([])
    setStatus('playing')
    setHintUsed(false)
    setHintPenalty(0)
    setLastGuess(null)
  }

  function changeDifficulty(next) {
    setDifficulty(next)
    reset(next)
  }

  function choose(letter) {
    if (status !== 'playing' || guessed.includes(letter)) return

    const next = [...guessed, letter]
    const nextWrongLetters = next.filter((item) => !entry.word.includes(item))
    const nextStrikes = nextWrongLetters.length + hintPenalty
    const nextSolved = [...entry.word].every(
      (item) => !/[A-Z]/.test(item) || next.includes(item),
    )

    setGuessed(next)
    setLastGuess(letter)

    if (nextSolved) {
      setStatus('won')
      onComplete({
        won: true,
        score: nextStrikes,
        lowerIsBetter: true,
        bonusXp: Math.min(
          40,
          (MAX_WRONG - nextStrikes) * 5 + difficultyBonus(entry.difficulty),
        ),
      })
    } else if (nextStrikes >= MAX_WRONG) {
      setStatus('lost')
      onComplete({ won: false })
    }
  }

  function useHint() {
    if (status !== 'playing' || hintUsed || lives <= 1) return
    setHintUsed(true)
    setHintPenalty(1)
    setLastGuess(null)
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const letter = event.key.toUpperCase()
      if (/^[A-Z]$/.test(letter)) {
        event.preventDefault()
        choose(letter)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="game-panel hangman-panel">
      <div className="game-toolbar hangman-toolbar">
        <div className="hangman-toolbar-info">
          <div>
            <span className="micro">CATEGORY</span>
            <strong>{entry.category}</strong>
          </div>
          <div>
            <span className="micro">DIFFICULTY</span>
            <strong>{entry.difficulty}</strong>
          </div>
          <div>
            <span className="micro">WORD</span>
            <strong>{entry.word.length} letters</strong>
          </div>
        </div>

        <div className="hangman-toolbar-actions">
          <select
            className="hang-select"
            value={difficulty}
            onChange={(event) => changeDifficulty(event.target.value)}
            aria-label="Hangman difficulty"
          >
            {DIFFICULTIES.map((item) => (
              <option value={item} key={item}>
                {item === 'ALL' ? 'Any difficulty' : item[0] + item.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button className="secondary-btn" onClick={() => reset()}>New word</button>
        </div>
      </div>

      <div className="hangman-stage-strip">
        <div>
          <span className="micro">RESCUE PROGRESS</span>
          <strong>{progress}%</strong>
        </div>
        <div className="hang-stage-dots" aria-label={`${strikes} strikes out of ${MAX_WRONG}`}>
          {Array.from({ length: MAX_WRONG }, (_, index) => (
            <span
              className={index < strikes ? 'spent' : ''}
              key={index}
            />
          ))}
        </div>
      </div>

      <div className="hangman-layout">
        <div
          className={`hangman-art ${strikes >= 4 ? 'danger' : ''} ${status}`}
          aria-label={`${strikes} incorrect strikes out of ${MAX_WRONG}`}
        >
          <div className="gallows">
            <span className="beam" />
            <span className="brace" />
            <span className="rope" />
            {strikes >= 1 && <span className="head" />}
            {strikes >= 2 && <span className="body" />}
            {strikes >= 3 && <span className="arm left" />}
            {strikes >= 4 && <span className="arm right" />}
            {strikes >= 5 && <span className="leg left" />}
            {strikes >= 6 && <span className="leg right" />}
          </div>

          <div className="lives">
            <span>{lives}</span>
            <small>{lives === 1 ? 'life left' : 'lives left'}</small>
          </div>

          <div className="hang-stage-label">
            <span>STAGE</span>
            <strong>{strikes}/{MAX_WRONG}</strong>
          </div>
        </div>

        <div className="hangman-play">
          <div className={`hang-word ${status}`} aria-label="Hidden word">
            {[...entry.word].map((letter, index) => {
              const visible = status === 'lost' || guessed.includes(letter) || !/[A-Z]/.test(letter)
              return (
                <span
                  className={visible ? 'revealed' : ''}
                  key={`${letter}-${index}`}
                >
                  {visible ? letter : ''}
                </span>
              )
            })}
          </div>

          <div className="hang-support-row">
            <button
              className="hang-hint-btn"
              onClick={useHint}
              disabled={hintUsed || status !== 'playing' || lives <= 1}
            >
              <span>{hintUsed ? 'Hint used' : 'Reveal hint'}</span>
              <small>{hintUsed ? '1 life spent' : 'Costs 1 life'}</small>
            </button>

            <div className="hang-wrong-box">
              <span className="micro">WRONG LETTERS</span>
              <div className="wrong-letter-list">
                {wrongLetters.length ? (
                  wrongLetters.map((letter) => <span key={letter}>{letter}</span>)
                ) : (
                  <small>None yet. Suspiciously competent.</small>
                )}
              </div>
            </div>
          </div>

          {hintUsed && (
            <div className="hang-hint-card">
              <span className="micro">HINT</span>
              <p>{entry.hint}</p>
            </div>
          )}

          <div className="letter-grid">
            {ALPHABET.map((letter) => {
              const used = guessed.includes(letter)
              const good = used && entry.word.includes(letter)
              const bad = used && !entry.word.includes(letter)
              const recent = lastGuess === letter

              return (
                <button
                  key={letter}
                  className={[
                    'letter-key',
                    good ? 'good' : '',
                    bad ? 'bad' : '',
                    recent ? 'recent' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={used || status !== 'playing'}
                  onClick={() => choose(letter)}
                >
                  {letter}
                </button>
              )
            })}
          </div>

          <div className="hang-keyboard-note">
            <span>Keyboard works too</span>
            <span>•</span>
            <span>{guessed.length} guessed</span>
          </div>

          <div className={`game-message ${status}`}>
            {status === 'won' && (
              <>Word rescued: <strong>{entry.word}</strong>. The stick figure has filed no complaint.</>
            )}
            {status === 'lost' && (
              <>The word was <strong>{entry.word}</strong>. Grim little vocabulary lesson.</>
            )}
            {status === 'playing' && !hintUsed && !wrongLetters.length && 'Choose a letter to begin.'}
            {status === 'playing' && (hintUsed || wrongLetters.length > 0) && (
              `${lives} ${lives === 1 ? 'life' : 'lives'} left. Keep going.`
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
