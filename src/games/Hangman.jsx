import { useEffect, useMemo, useState } from 'react'
import { HANGMAN_WORDS } from '../data/words'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD']
const LIFE_OPTIONS = [4, 6, 8, 10]

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

function lifeModeBonus(maxLives) {
  if (maxLives === 4) return 10
  if (maxLives === 6) return 6
  if (maxLives === 8) return 3
  return 0
}

function normalizeSecret(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactLetters(value) {
  return value.replace(/[^A-Z]/g, '')
}

function normalizedHint(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export default function Hangman({ onComplete }) {
  const [mode, setMode] = useState('SOLO')
  const [phase, setPhase] = useState('PLAY')
  const [difficulty, setDifficulty] = useState('ALL')
  const [maxLives, setMaxLives] = useState(6)
  const [entry, setEntry] = useState(() => pickEntry())
  const [guessed, setGuessed] = useState([])
  const [status, setStatus] = useState('playing')
  const [strikeEvents, setStrikeEvents] = useState([])
  const [revealedHints, setRevealedHints] = useState(0)
  const [lastGuess, setLastGuess] = useState(null)

  const [customWord, setCustomWord] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [customHints, setCustomHints] = useState(['', '', ''])
  const [setupError, setSetupError] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  const wrongLetters = useMemo(
    () => guessed.filter((letter) => !entry.word.includes(letter)),
    [guessed, entry.word],
  )

  const hints = Array.isArray(entry.hints)
    ? entry.hints
    : entry.hint
      ? [entry.hint]
      : []

  const strikes = strikeEvents.length
  const lives = Math.max(0, maxLives - strikes)
  const figureStage = strikes === 0
    ? 0
    : Math.min(6, Math.ceil((strikes / maxLives) * 6))
  const danger = lives <= Math.max(2, Math.ceil(maxLives * 0.25))

  const revealedCount = [...new Set(entry.word.split(''))]
    .filter((letter) => /[A-Z]/.test(letter) && guessed.includes(letter))
    .length
  const uniqueLetters = new Set(
    entry.word.split('').filter((letter) => /[A-Z]/.test(letter),
  ).size
  const progress = uniqueLetters
    ? Math.round((revealedCount / uniqueLetters) * 100)
    : 0

  function clearRoundState() {
    setGuessed([])
    setStatus('playing')
    setStrikeEvents([])
    setRevealedHints(0)
    setLastGuess(null)
  }

  function startSolo(nextDifficulty = difficulty) {
    setEntry((current) => pickEntry(nextDifficulty, current.word))
    setPhase('PLAY')
    clearRoundState()
  }

  function changeMode(nextMode) {
    if (nextMode === mode) return

    setMode(nextMode)
    setSetupError('')
    setShowSecret(false)

    if (nextMode === 'SOLO') {
      startSolo(difficulty)
    } else {
      setPhase('SETUP')
      clearRoundState()
    }
  }

  function changeDifficulty(next) {
    setDifficulty(next)
    if (mode === 'SOLO') startSolo(next)
  }

  function changeLives(next) {
    setMaxLives(next)

    if (mode === 'SOLO') {
      startSolo(difficulty)
    } else if (phase === 'PLAY' || phase === 'PASS') {
      setPhase('SETUP')
      clearRoundState()
    }
  }

  function resetCurrentMode() {
    if (mode === 'SOLO') {
      startSolo(difficulty)
    } else {
      setPhase('SETUP')
      setSetupError('')
      setShowSecret(false)
      clearRoundState()
    }
  }

  function updateCustomHint(index, value) {
    setCustomHints((current) =>
      current.map((hint, hintIndex) => (
        hintIndex === index ? value.slice(0, 110) : hint
      )),
    )
  }

  function lockCustomWord(event) {
    event.preventDefault()

    const secret = normalizeSecret(customWord)
    const letters = compactLetters(secret)
    const preparedHints = customHints
      .map((hint) => hint.trim())
      .filter(Boolean)

    if (letters.length < 3) {
      setSetupError('Use at least 3 letters for the secret word.')
      return
    }

    if (letters.length > 28) {
      setSetupError('Keep the secret to 28 letters or fewer.')
      return
    }

    const compactSecret = normalizedHint(secret)
    const giveaway = preparedHints.find((hint) =>
      normalizedHint(hint).includes(compactSecret),
    )

    if (giveaway) {
      setSetupError('One of the hints contains the actual answer. Subtlety has left the building.')
      return
    }

    setEntry({
      word: secret,
      category: customCategory.trim() || 'Custom',
      difficulty: '2 PLAYER',
      hints: preparedHints,
    })
    setSetupError('')
    setShowSecret(false)
    clearRoundState()
    setPhase('PASS')
  }

  function startDuoGuessing() {
    clearRoundState()
    setPhase('PLAY')
  }

  function choose(letter) {
    if (
      phase !== 'PLAY' ||
      status !== 'playing' ||
      guessed.includes(letter)
    ) return

    const nextGuessed = [...guessed, letter]
    const isWrong = !entry.word.includes(letter)
    const nextStrikeEvents = isWrong
      ? [...strikeEvents, { type: 'wrong', label: letter }]
      : strikeEvents
    const nextStrikes = nextStrikeEvents.length
    const nextSolved = [...entry.word].every(
      (item) => !/[A-Z]/.test(item) || nextGuessed.includes(item),
    )

    setGuessed(nextGuessed)
    setLastGuess(letter)
    if (isWrong) setStrikeEvents(nextStrikeEvents)

    if (nextSolved) {
      setStatus('won')
      const remainingLives = Math.max(0, maxLives - nextStrikes)
      const survivalBonus = Math.round((remainingLives / maxLives) * 20)

      onComplete({
        won: true,
        score: nextStrikes,
        lowerIsBetter: true,
        bonusXp: Math.min(
          40,
          survivalBonus +
            difficultyBonus(entry.difficulty) +
            lifeModeBonus(maxLives) +
            (mode === 'DUO' ? 4 : 0),
        ),
      })
    } else if (nextStrikes >= maxLives) {
      setStatus('lost')
      onComplete({ won: false })
    }
  }

  function useHint() {
    if (
      phase !== 'PLAY' ||
      status !== 'playing' ||
      lives <= 1 ||
      revealedHints >= hints.length
    ) return

    setRevealedHints((value) => value + 1)
    setStrikeEvents((events) => [
      ...events,
      { type: 'hint', label: `H${revealedHints + 1}` },
    ])
    setLastGuess(null)
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable)
      ) return

      if (phase !== 'PLAY') return

      const letter = event.key.toUpperCase()
      if (/^[A-Z]$/.test(letter)) {
        event.preventDefault()
        choose(letter)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const nextHintNumber = revealedHints + 1
  const canUseHint =
    status === 'playing' &&
    lives > 1 &&
    revealedHints < hints.length

  if (mode === 'DUO' && phase === 'SETUP') {
    return (
      <div className="game-panel hangman-panel">
        <div className="hang-mode-switch">
          <button
            onClick={() => changeMode('SOLO')}
          >
            SOLO
          </button>
          <button
            className="active-duo"
            onClick={() => changeMode('DUO')}
          >
            2 PLAYER
          </button>
        </div>

        <div className="hang-config-row">
          <div>
            <span className="micro">LIVES</span>
            <div className="filter-chips">
              {LIFE_OPTIONS.map((option) => (
                <button
                  className={`filter-chip ${maxLives === option ? 'active' : ''}`}
                  onClick={() => setMaxLives(option)}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form className="duo-setup" onSubmit={lockCustomWord}>
          <div className="duo-setup-head">
            <span className="micro">PLAYER 1 · SECRET SETUP</span>
            <h3>Build the trap.</h3>
            <p>
              Enter a word or short phrase. Player 2 will never see this screen
              once you lock it.
            </p>
          </div>

          <label className="duo-field">
            <span>SECRET WORD</span>
            <div className="duo-secret-input">
              <input
                type={showSecret ? 'text' : 'password'}
                value={customWord}
                onChange={(event) => setCustomWord(event.target.value)}
                placeholder="e.g. CHOCOLATE"
                autoComplete="off"
                maxLength={36}
              />
              <button
                type="button"
                onClick={() => setShowSecret((value) => !value)}
              >
                {showSecret ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <small>
              Letters, spaces, apostrophes and hyphens are allowed · {compactLetters(normalizeSecret(customWord)).length}/28 letters
            </small>
          </label>

          <label className="duo-field">
            <span>CATEGORY <i>OPTIONAL</i></span>
            <input
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value.slice(0, 28))}
              placeholder="Movies, Food, Inside Joke…"
              maxLength={28}
            />
          </label>

          <div className="duo-hint-builder">
            <div className="duo-hint-head">
              <div>
                <span className="micro">OPTIONAL HINTS</span>
                <strong>Each one costs Player 2 a life.</strong>
              </div>
              <small>Write them from vague → stronger.</small>
            </div>

            {customHints.map((hint, index) => (
              <label className="duo-field duo-hint-input" key={index}>
                <span>HINT {index + 1}</span>
                <input
                  value={hint}
                  onChange={(event) => updateCustomHint(index, event.target.value)}
                  placeholder={
                    index === 0
                      ? 'Indirect clue…'
                      : index === 1
                        ? 'More useful clue…'
                        : 'Strongest clue…'
                  }
                  maxLength={110}
                />
              </label>
            ))}
          </div>

          {setupError && (
            <div className="duo-error">{setupError}</div>
          )}

          <button
            className="primary-btn duo-lock-btn"
            type="submit"
            disabled={!compactLetters(normalizeSecret(customWord)).length}
          >
            Lock word & pass device
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    )
  }

  if (mode === 'DUO' && phase === 'PASS') {
    return (
      <div className="game-panel hangman-panel duo-pass-panel">
        <div className="duo-pass-lock" aria-hidden="true">⌁</div>
        <span className="micro">SECRET LOCKED</span>
        <h3>Pass the device to Player 2.</h3>
        <p>
          The word and custom hints are hidden. No shoulder-surfing, no sudden
          attacks of photographic memory.
        </p>

        <div className="duo-pass-meta">
          <div>
            <span>CATEGORY</span>
            <strong>{entry.category}</strong>
          </div>
          <div>
            <span>LETTERS</span>
            <strong>{compactLetters(entry.word).length}</strong>
          </div>
          <div>
            <span>LIVES</span>
            <strong>{maxLives}</strong>
          </div>
          <div>
            <span>HINTS</span>
            <strong>{hints.length}</strong>
          </div>
        </div>

        <button
          className="primary-btn duo-ready-btn"
          onClick={startDuoGuessing}
        >
          Player 2 ready
          <span aria-hidden="true">→</span>
        </button>

        <button
          className="text-btn"
          onClick={() => setPhase('SETUP')}
        >
          ← Back to Player 1 setup
        </button>
      </div>
    )
  }

  return (
    <div className="game-panel hangman-panel">
      <div className="hang-mode-switch">
        <button
          className={mode === 'SOLO' ? 'active' : ''}
          onClick={() => changeMode('SOLO')}
        >
          SOLO
        </button>
        <button
          className={mode === 'DUO' ? 'active-duo' : ''}
          onClick={() => changeMode('DUO')}
        >
          2 PLAYER
        </button>
      </div>

      <div className="hang-config-row">
        {mode === 'SOLO' && (
          <div>
            <span className="micro">DIFFICULTY</span>
            <div className="filter-chips">
              {DIFFICULTIES.map((item) => (
                <button
                  className={`filter-chip ${difficulty === item ? 'active' : ''}`}
                  onClick={() => changeDifficulty(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="micro">LIVES</span>
          <div className="filter-chips">
            {LIFE_OPTIONS.map((option) => (
              <button
                className={`filter-chip ${maxLives === option ? 'active' : ''}`}
                onClick={() => changeLives(option)}
                disabled={mode === 'DUO' && phase === 'PLAY'}
                key={option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="game-toolbar hangman-toolbar">
        <div className="hangman-toolbar-info">
          <div>
            <span className="micro">CATEGORY</span>
            <strong>{entry.category}</strong>
          </div>
          <div>
            <span className="micro">{mode === 'SOLO' ? 'DIFFICULTY' : 'MODE'}</span>
            <strong>{mode === 'SOLO' ? entry.difficulty : '2 PLAYER'}</strong>
          </div>
          <div>
            <span className="micro">WORD</span>
            <strong>{compactLetters(entry.word).length} letters</strong>
          </div>
          <div>
            <span className="micro">HINTS</span>
            <strong>{revealedHints}/{hints.length}</strong>
          </div>
        </div>

        <div className="hangman-toolbar-actions">
          <button
            className="secondary-btn"
            onClick={resetCurrentMode}
          >
            {mode === 'SOLO' ? 'New word' : 'New secret'}
          </button>
        </div>
      </div>

      <div className="hangman-stage-strip">
        <div>
          <span className="micro">RESCUE PROGRESS</span>
          <strong>{progress}%</strong>
        </div>

        <div
          className="hang-stage-dots"
          aria-label={`${strikes} strikes out of ${maxLives}`}
        >
          {Array.from({ length: maxLives }, (_, index) => {
            const event = strikeEvents[index]
            return (
              <span
                className={
                  event
                    ? `spent ${event.type === 'hint' ? 'hint-spent' : 'wrong-spent'}`
                    : ''
                }
                title={
                  event
                    ? event.type === 'hint'
                      ? 'Life spent on hint'
                      : `Wrong guess: ${event.label}`
                    : 'Life remaining'
                }
                key={index}
              />
            )
          })}
        </div>
      </div>

      <div className="hangman-layout">
        <div
          className={`hangman-art ${danger ? 'danger' : ''} ${status}`}
          aria-label={`${strikes} strikes out of ${maxLives}`}
        >
          <div className="gallows">
            <span className="beam" />
            <span className="brace" />
            <span className="rope" />
            {figureStage >= 1 && <span className="head" />}
            {figureStage >= 2 && <span className="body" />}
            {figureStage >= 3 && <span className="arm left" />}
            {figureStage >= 4 && <span className="arm right" />}
            {figureStage >= 5 && <span className="leg left" />}
            {figureStage >= 6 && <span className="leg right" />}
          </div>

          <div className="lives">
            <span>{lives}</span>
            <small>{lives === 1 ? 'life left' : 'lives left'}</small>
          </div>

          <div className="hang-stage-label">
            <span>STAGE</span>
            <strong>{strikes}/{maxLives}</strong>
          </div>
        </div>

        <div className="hangman-play">
          <div className={`hang-word ${status}`} aria-label="Hidden word">
            {[...entry.word].map((letter, index) => {
              const isLetter = /[A-Z]/.test(letter)
              const visible =
                status === 'lost' ||
                guessed.includes(letter) ||
                !isLetter

              return (
                <span
                  className={[
                    visible ? 'revealed' : '',
                    !isLetter ? 'separator' : '',
                  ].filter(Boolean).join(' ')}
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
              disabled={!canUseHint}
            >
              <span>
                {revealedHints >= hints.length
                  ? hints.length
                    ? 'All hints used'
                    : 'No hints available'
                  : `Reveal hint ${nextHintNumber}`}
              </span>
              <small>
                {revealedHints >= hints.length
                  ? hints.length
                    ? `${revealedHints} lives spent`
                    : mode === 'DUO'
                      ? 'Player 1 entered none'
                      : 'No more clues'
                  : lives <= 1
                    ? 'Need at least 2 lives'
                    : 'Costs 1 life'}
              </small>
            </button>

            <div className="hang-wrong-box">
              <span className="micro">WRONG LETTERS</span>
              <div className="wrong-letter-list">
                {wrongLetters.length ? (
                  wrongLetters.map((letter) => (
                    <span key={letter}>{letter}</span>
                  ))
                ) : (
                  <small>None yet. Suspiciously competent.</small>
                )}
              </div>
            </div>
          </div>

          {revealedHints > 0 && (
            <div className="hang-hints-stack">
              {hints.slice(0, revealedHints).map((hint, index) => (
                <div className="hang-hint-card" key={`${hint}-${index}`}>
                  <span className="micro">
                    HINT {index + 1} · −1 LIFE
                  </span>
                  <p>{hint}</p>
                </div>
              ))}
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
            <span>•</span>
            <span>{mode === 'SOLO' ? `${HANGMAN_WORDS.length} words in bank` : 'custom round'}</span>
          </div>

          <div className={`game-message ${status}`}>
            {status === 'won' && (
              <>
                Word rescued: <strong>{entry.word}</strong>.{' '}
                {revealedHints
                  ? `${revealedHints} hint${revealedHints === 1 ? '' : 's'} purchased.`
                  : 'No hints required.'}
              </>
            )}

            {status === 'lost' && (
              <>
                The word was <strong>{entry.word}</strong>. The gallows has
                completed its extremely unnecessary performance.
              </>
            )}

            {status === 'playing' && !strikeEvents.length && (
              mode === 'DUO'
                ? 'Player 2: start guessing. Player 1 is legally required to maintain a neutral face.'
                : 'Choose a letter. Hints exist, but information has a price.'
            )}

            {status === 'playing' && strikeEvents.length > 0 && (
              `${lives} ${lives === 1 ? 'life' : 'lives'} left · ${wrongLetters.length} wrong · ${revealedHints} hint${revealedHints === 1 ? '' : 's'}.`
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
