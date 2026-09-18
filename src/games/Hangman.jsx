import { useMemo, useState } from 'react'
import { HANGMAN_WORDS } from '../data/words'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MAX_WRONG = 6

function pickEntry() {
  return HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)]
}

export default function Hangman({ onComplete }) {
  const [entry, setEntry] = useState(pickEntry)
  const [guessed, setGuessed] = useState([])
  const [status, setStatus] = useState('playing')
  const [showHint, setShowHint] = useState(false)

  const wrong = useMemo(
    () => guessed.filter((letter) => !entry.word.includes(letter)),
    [guessed, entry.word],
  )

  const solved = [...entry.word].every((letter) => guessed.includes(letter))

  function reset() {
    setEntry(pickEntry())
    setGuessed([])
    setStatus('playing')
    setShowHint(false)
  }

  function choose(letter) {
    if (status !== 'playing' || guessed.includes(letter)) return

    const next = [...guessed, letter]
    const nextWrong = next.filter((item) => !entry.word.includes(item))
    const nextSolved = [...entry.word].every((item) => next.includes(item))
    setGuessed(next)

    if (nextSolved) {
      setStatus('won')
      onComplete({
        won: true,
        score: nextWrong.length,
        lowerIsBetter: true,
        bonusXp: (MAX_WRONG - nextWrong.length) * 6,
      })
    } else if (nextWrong.length >= MAX_WRONG) {
      setStatus('lost')
      onComplete({ won: false })
    }
  }

  return (
    <div className="game-panel">
      <div className="game-toolbar">
        <div>
          <span className="micro">CATEGORY</span>
          <strong>{entry.category}</strong>
        </div>
        <button className="secondary-btn" onClick={reset}>New word</button>
      </div>

      <div className="hangman-layout">
        <div className="hangman-art" aria-label={`${wrong.length} incorrect guesses out of ${MAX_WRONG}`}>
          <div className="gallows">
            <span className="beam" />
            <span className="rope" />
            {wrong.length >= 1 && <span className="head" />}
            {wrong.length >= 2 && <span className="body" />}
            {wrong.length >= 3 && <span className="arm left" />}
            {wrong.length >= 4 && <span className="arm right" />}
            {wrong.length >= 5 && <span className="leg left" />}
            {wrong.length >= 6 && <span className="leg right" />}
          </div>
          <div className="lives">
            <span>{MAX_WRONG - wrong.length}</span>
            <small>lives left</small>
          </div>
        </div>

        <div className="hangman-play">
          <div className="hang-word" aria-label="Hidden word">
            {[...entry.word].map((letter, index) => (
              <span key={`${letter}-${index}`}>
                {status === 'lost' || guessed.includes(letter) ? letter : ''}
              </span>
            ))}
          </div>

          <div className="hang-meta">
            <button className="text-btn" onClick={() => setShowHint(true)} disabled={showHint}>
              {showHint ? 'Hint used' : 'Show hint'}
            </button>
            {showHint && <p>{entry.hint}</p>}
          </div>

          <div className="letter-grid">
            {ALPHABET.map((letter) => {
              const used = guessed.includes(letter)
              const good = used && entry.word.includes(letter)
              const bad = used && !entry.word.includes(letter)
              return (
                <button
                  key={letter}
                  className={`letter-key ${good ? 'good' : ''} ${bad ? 'bad' : ''}`}
                  disabled={used || status !== 'playing'}
                  onClick={() => choose(letter)}
                >
                  {letter}
                </button>
              )
            })}
          </div>

          <div className={`game-message ${status}`}>
            {status === 'won' && 'Word rescued. The stick figure sends its regards.'}
            {status === 'lost' && `The word was ${entry.word}.`}
            {status === 'playing' && (wrong.length ? `Wrong letters: ${wrong.join(' ')}` : 'Choose a letter.')}
          </div>
        </div>
      </div>
    </div>
  )
}
