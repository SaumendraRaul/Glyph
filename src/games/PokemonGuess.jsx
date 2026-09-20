import { useEffect, useMemo, useRef, useState } from 'react'
import {
  GENERATIONS,
  fetchPokemonById,
  pokemonSuggestions,
  randomPokemonId,
  resolvePokemonGuess,
} from '../lib/pokemon'

const MODES = {
  EASY: { maxGuesses: 10, initialClues: 3, autoEvery: 1, bonus: 0 },
  NORMAL: { maxGuesses: 8, initialClues: 1, autoEvery: 2, bonus: 8 },
  HARD: { maxGuesses: 6, initialClues: 0, autoEvery: 2, bonus: 16 },
}

function compareNumber(value, target) {
  if (value === target) return 'equal'
  return value < target ? 'up' : 'down'
}

function arrowFor(value, target) {
  const comparison = compareNumber(value, target)
  if (comparison === 'equal') return '✓'
  return comparison === 'up' ? '↑' : '↓'
}

function rangeLabel(value, step, unit = '') {
  const floor = Math.floor(value / step) * step
  const ceil = floor + step
  return `${floor}–${ceil}${unit}`
}

function typeClass(type, slot, target) {
  const exact = type && type === target.types[slot]
  const elsewhere = type && target.types.includes(type)
  return exact ? 'match' : elsewhere ? 'partial' : ''
}

export default function PokemonGuess({ onComplete }) {
  const [generation, setGeneration] = useState('ALL')
  const [difficulty, setDifficulty] = useState('EASY')
  const [target, setTarget] = useState(null)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [guesses, setGuesses] = useState([])
  const [revealedClues, setRevealedClues] = useState(MODES.EASY.initialClues)
  const [manualHints, setManualHints] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const requestId = useRef(0)

  const mode = MODES[difficulty]
  const maxGuesses = mode.maxGuesses

  const clues = useMemo(() => {
    if (!target) return []
    return [
      { label: 'GENERATION', value: `Generation ${target.generation}` },
      { label: 'TYPE COUNT', value: `${target.types.length} type${target.types.length === 1 ? '' : 's'}` },
      { label: 'PRIMARY TYPE', value: target.types[0] },
      { label: 'FIRST LETTER', value: `Starts with “${target.name[0]}”` },
      { label: 'ABILITY', value: target.abilities[0] || 'Unknown' },
      { label: 'HEIGHT BAND', value: rangeLabel(target.height, 0.5, 'm') },
      { label: 'BST BAND', value: rangeLabel(target.bst, 50) },
    ]
  }, [target])

  async function reset(nextGen = generation, nextDifficulty = difficulty) {
    const token = ++requestId.current
    const nextMode = MODES[nextDifficulty] || MODES.EASY

    setGeneration(String(nextGen))
    setDifficulty(nextDifficulty)
    setInput('')
    setSuggestions([])
    setGuesses([])
    setRevealedClues(nextMode.initialClues)
    setManualHints(0)
    setStatus('loading')
    setError('')
    setSubmitting(false)

    try {
      const id = randomPokemonId(String(nextGen))
      const loaded = await fetchPokemonById(id)
      if (token !== requestId.current) return
      setTarget(loaded)
      setStatus('playing')
    } catch (err) {
      if (token !== requestId.current) return
      setError(err instanceof Error ? err.message : 'Could not load Pokémon.')
      setStatus('error')
    }
  }

  useEffect(() => {
    reset('ALL', 'EASY')
    return () => {
      requestId.current += 1
    }
  }, [])

  useEffect(() => {
    let live = true

    if (!input.trim() || status !== 'playing') {
      setSuggestions([])
      return undefined
    }

    pokemonSuggestions(input, 8, generation)
      .then((items) => {
        if (live) setSuggestions(items)
      })
      .catch(() => {})

    return () => {
      live = false
    }
  }, [input, generation, status])

  async function submit(value = input) {
    if (status !== 'playing' || submitting || !value.trim() || !target) return

    setSubmitting(true)
    setError('')

    try {
      const resolved = await resolvePokemonGuess(value, generation)

      if (!resolved) {
        setError(
          generation === 'ALL'
            ? 'That name is not in the National Dex.'
            : `That Pokémon is not in the selected Gen ${generation} pool.`,
        )
        return
      }

      if (guesses.some((guess) => guess.id === resolved.id)) {
        setError('Already guessed that Pokémon.')
        return
      }

      const mon = await fetchPokemonById(resolved.id)
      const next = [...guesses, mon]

      setGuesses(next)
      setInput('')
      setSuggestions([])

      if (mon.id === target.id) {
        setStatus('won')
        const difficultyBonus = mode.bonus
        const hintPenalty = manualHints * 5
        onComplete({
          won: true,
          score: next.length,
          lowerIsBetter: true,
          bonusXp: Math.max(
            6,
            44 - next.length * 4 + difficultyBonus - hintPenalty,
          ),
        })
        return
      }

      const autoClues =
        mode.initialClues +
        Math.floor(next.length / mode.autoEvery)

      setRevealedClues((current) =>
        Math.min(clues.length, Math.max(current, autoClues)),
      )

      if (next.length >= maxGuesses) {
        setStatus('lost')
        onComplete({ won: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load that Pokémon.')
    } finally {
      setSubmitting(false)
    }
  }

  function revealHint() {
    if (
      status !== 'playing' ||
      !target ||
      revealedClues >= clues.length
    ) return

    setManualHints((value) => value + 1)
    setRevealedClues((value) => Math.min(clues.length, value + 1))
  }

  const visibleClues = clues.slice(0, revealedClues)

  return (
    <div className="game-panel pokeguess-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div>
            <span className="micro">GUESSES</span>
            <strong>{guesses.length}/{maxGuesses}</strong>
          </div>
          <div>
            <span className="micro">POOL</span>
            <strong>{generation === 'ALL' ? 'GEN 1–9' : `GEN ${generation}`}</strong>
          </div>
          <div>
            <span className="micro">MODE</span>
            <strong>{difficulty}</strong>
          </div>
        </div>
        <button className="secondary-btn" onClick={() => reset()}>
          New Pokémon
        </button>
      </div>

      <div className="pokeguess-settings">
        <div>
          <span className="micro">DIFFICULTY</span>
          <div className="filter-chips">
            {Object.keys(MODES).map((item) => (
              <button
                className={`filter-chip ${difficulty === item ? 'active' : ''}`}
                onClick={() => reset(generation, item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="micro">TARGET GENERATION</span>
          <div className="filter-chips pokemon-gen-filter">
            {GENERATIONS.map((gen) => (
              <button
                className={`filter-chip ${generation === gen.id ? 'active' : ''}`}
                onClick={() => reset(gen.id, difficulty)}
                key={gen.id}
              >
                {gen.id === 'ALL' ? 'ALL' : `G${gen.id}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pokeguess-help">
        <span>↑ hidden Pokémon is higher</span>
        <span>↓ hidden Pokémon is lower</span>
        <span className="legend-exact">GREEN = exact</span>
        <span className="legend-partial">YELLOW = type exists in other slot</span>
      </div>

      <div className="poke-clue-area">
        <div className="poke-clue-head">
          <div>
            <span className="micro">TARGET INTEL</span>
            <strong>{visibleClues.length} / {clues.length} clues revealed</strong>
          </div>
          <button
            className="secondary-btn"
            onClick={revealHint}
            disabled={status !== 'playing' || revealedClues >= clues.length}
          >
            Reveal hint
          </button>
        </div>

        <div className="poke-clue-ladder">
          {clues.map((clue, index) => {
            const visible = index < revealedClues
            return (
              <div className={visible ? 'revealed' : ''} key={clue.label}>
                <span>{String(index + 1).padStart(2, '0')} · {clue.label}</span>
                <strong>{visible ? clue.value : 'LOCKED'}</strong>
              </div>
            )
          })}
        </div>
      </div>

      {(status === 'won' || status === 'lost') && target && (
        <div className="pokeguess-reveal">
          <img src={target.sprite} alt={target.name} />
          <div>
            <span className="micro">ANSWER</span>
            <strong>{target.name}</strong>
            <small>
              Gen {target.generation} · {target.types.join(' / ')} · {target.bst} BST
            </small>
          </div>
        </div>
      )}

      {status === 'playing' && (
        <div className="pokemon-guess-input">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
            placeholder={
              generation === 'ALL'
                ? 'Guess any National Dex Pokémon…'
                : `Guess a Gen ${generation} Pokémon…`
            }
            autoCapitalize="off"
            autoCorrect="off"
            disabled={submitting}
          />
          <button
            className="primary-btn"
            onClick={() => submit()}
            disabled={!input.trim() || submitting}
          >
            {submitting ? 'Checking…' : 'Guess ↗'}
          </button>

          {suggestions.length > 0 && (
            <div className="pokemon-suggestions">
              {suggestions.map((item) => (
                <button
                  onClick={() => {
                    setInput(item.name)
                    setSuggestions([])
                  }}
                  key={item.id}
                >
                  #{String(item.id).padStart(4, '0')}
                  <strong>{item.name}</strong>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {guesses.length > 0 && (
        <div className="poke-table-wrap">
          <div className="poke-guess-header">
            <span>POKÉMON</span>
            <span>GEN</span>
            <span>TYPE 1</span>
            <span>TYPE 2</span>
            <span>HEIGHT</span>
            <span>WEIGHT</span>
            <span>BST</span>
          </div>

          <div className="poke-guess-history">
            {guesses.map((mon) => {
              const genCmp = compareNumber(
                Number(mon.generation),
                Number(target.generation),
              )

              return (
                <div
                  className={`poke-guess-row ${mon.id === target.id ? 'correct' : ''}`}
                  key={mon.id}
                >
                  <div className="poke-guess-mon">
                    <img src={mon.pixel || mon.sprite} alt="" />
                    <strong>{mon.name}</strong>
                  </div>

                  <span className={genCmp === 'equal' ? 'match' : ''}>
                    G{mon.generation} {arrowFor(Number(mon.generation), Number(target.generation))}
                  </span>

                  <span className={typeClass(mon.types[0], 0, target)}>
                    {mon.types[0] || '—'}
                  </span>

                  <span className={typeClass(mon.types[1], 1, target)}>
                    {mon.types[1] || '—'}
                  </span>

                  <span className={mon.height === target.height ? 'match' : ''}>
                    {mon.height}m {arrowFor(mon.height, target.height)}
                  </span>

                  <span className={mon.weight === target.weight ? 'match' : ''}>
                    {mon.weight}kg {arrowFor(mon.weight, target.weight)}
                  </span>

                  <span className={mon.bst === target.bst ? 'match' : ''}>
                    {mon.bst} {arrowFor(mon.bst, target.bst)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className={`game-message ${status === 'won' ? 'won' : status === 'lost' ? 'lost' : ''}`}>
        {error
          ? error
          : status === 'loading'
            ? 'Loading a Pokémon…'
            : status === 'error'
              ? 'Could not start this round.'
              : status === 'won'
                ? `${target.name} found in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}.`
                : status === 'lost'
                  ? `The answer was ${target?.name}. The Pokédex remains smug.`
                  : difficulty === 'EASY'
                    ? 'Easy mode starts with useful clues and reveals more after every miss.'
                    : 'Use the comparison table to eliminate possibilities. Exact matches turn green.'}
      </div>
    </div>
  )
}
