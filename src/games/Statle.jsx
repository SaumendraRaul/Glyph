import { useEffect, useMemo, useRef, useState } from 'react'

const TARGET = 600

const GENERATIONS = [
  { id: 1, label: 'GEN 1', start: 1, end: 151 },
  { id: 2, label: 'GEN 2', start: 152, end: 251 },
  { id: 3, label: 'GEN 3', start: 252, end: 386 },
  { id: 4, label: 'GEN 4', start: 387, end: 493 },
  { id: 5, label: 'GEN 5', start: 494, end: 649 },
  { id: 6, label: 'GEN 6', start: 650, end: 721 },
  { id: 7, label: 'GEN 7', start: 722, end: 809 },
  { id: 8, label: 'GEN 8', start: 810, end: 905 },
  { id: 9, label: 'GEN 9', start: 906, end: 1025 },
]

const STATS = [
  { key: 'hp', label: 'HP', api: 'hp' },
  { key: 'attack', label: 'ATK', api: 'attack' },
  { key: 'defense', label: 'DEF', api: 'defense' },
  { key: 'specialAttack', label: 'SpA', api: 'special-attack' },
  { key: 'specialDefense', label: 'SpD', api: 'special-defense' },
  { key: 'speed', label: 'SPE', api: 'speed' },
]

const pokemonCache = new Map()

function prettyName(value) {
  return value
    .split('-')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ')
}

function selectedRange(generation) {
  if (generation === 'ALL') return { start: 1, end: 1025 }
  return GENERATIONS.find((item) => String(item.id) === String(generation)) || GENERATIONS[0]
}

function randomPokemonId(generation, used) {
  const range = selectedRange(generation)
  const span = range.end - range.start + 1
  if (used.size >= span) return null

  let id = range.start + Math.floor(Math.random() * span)
  let guard = 0
  while (used.has(id) && guard < 2000) {
    id = range.start + Math.floor(Math.random() * span)
    guard += 1
  }
  return id
}

async function fetchPokemon(id) {
  if (pokemonCache.has(id)) return pokemonCache.get(id)

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`)

  const data = await response.json()
  const statMap = Object.fromEntries(data.stats.map((entry) => [entry.stat.name, entry.base_stat]))

  const pokemon = {
    id: data.id,
    name: prettyName(data.name),
    types: data.types.map((entry) => prettyName(entry.type.name)),
    artwork:
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.other?.home?.front_default ||
      data.sprites?.front_default ||
      '',
    sprite:
      data.sprites?.front_default ||
      data.sprites?.other?.['official-artwork']?.front_default ||
      '',
    stats: {
      hp: statMap.hp,
      attack: statMap.attack,
      defense: statMap.defense,
      specialAttack: statMap['special-attack'],
      specialDefense: statMap['special-defense'],
      speed: statMap.speed,
    },
  }

  pokemonCache.set(id, pokemon)
  return pokemon
}

function medalFor(score) {
  if (score >= 600) return { label: 'GOLD', className: 'gold' }
  if (score >= 500) return { label: 'SILVER', className: 'silver' }
  if (score >= 400) return { label: 'BRONZE', className: 'bronze' }
  return { label: 'TRAINING', className: 'training' }
}

export default function Statle({ onComplete }) {
  const [generation, setGeneration] = useState('ALL')
  const [current, setCurrent] = useState(null)
  const [claimed, setClaimed] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('playing')
  const [spriteMode, setSpriteMode] = useState('artwork')
  const [message, setMessage] = useState('Pick one stat from each Pokémon. Every stat can be claimed once.')

  const usedIds = useRef(new Set())
  const requestId = useRef(0)
  const completed = useRef(false)

  const score = useMemo(
    () => Object.values(claimed).reduce((sum, item) => sum + item.value, 0),
    [claimed],
  )
  const round = Math.min(Object.keys(claimed).length + 1, 6)
  const medal = medalFor(score)

  async function loadNext(gen = generation) {
    const id = randomPokemonId(gen, usedIds.current)
    if (!id) {
      setError('No unused Pokémon remain in this pool.')
      setLoading(false)
      return
    }

    const token = ++requestId.current
    setLoading(true)
    setError('')

    try {
      const pokemon = await fetchPokemon(id)
      if (token !== requestId.current) return
      usedIds.current.add(id)
      setCurrent(pokemon)
    } catch (err) {
      if (token !== requestId.current) return
      setError(err instanceof Error ? err.message : 'Could not load Pokémon data.')
    } finally {
      if (token === requestId.current) setLoading(false)
    }
  }

  function reset(gen = generation) {
    requestId.current += 1
    usedIds.current = new Set()
    completed.current = false
    setClaimed({})
    setCurrent(null)
    setStatus('playing')
    setError('')
    setMessage('Pick one stat from each Pokémon. Every stat can be claimed once.')
    loadNext(gen)
  }

  useEffect(() => {
    reset('ALL')
    return () => {
      requestId.current += 1
    }
    // Initial run only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function changeGeneration(next) {
    setGeneration(next)
    reset(next)
  }

  function retryLoad() {
    loadNext(generation)
  }

  function claim(statKey) {
    if (!current || loading || status !== 'playing' || claimed[statKey]) return

    const statMeta = STATS.find((item) => item.key === statKey)
    const value = current.stats[statKey]
    const nextClaimed = {
      ...claimed,
      [statKey]: {
        value,
        pokemonId: current.id,
        pokemonName: current.name,
        sprite: current.sprite,
        statLabel: statMeta.label,
      },
    }

    setClaimed(nextClaimed)
    const nextScore = Object.values(nextClaimed).reduce((sum, item) => sum + item.value, 0)

    if (Object.keys(nextClaimed).length === STATS.length) {
      const won = nextScore >= TARGET
      setStatus(won ? 'won' : 'lost')
      setMessage(
        won
          ? `${nextScore} BST. Gold target cleared.`
          : `${nextScore} BST. You needed ${TARGET - nextScore} more for gold.`,
      )

      if (!completed.current) {
        completed.current = true
        onComplete({
          won,
          score: nextScore,
          lowerIsBetter: false,
          bonusXp: won ? Math.min(40, Math.max(10, Math.floor((nextScore - TARGET) / 5) + 20)) : 0,
        })
      }
      return
    }

    setMessage(`${current.name}'s ${statMeta.label} locked at ${value}. Rolling next Pokémon…`)
    setCurrent(null)
    loadNext(generation)
  }

  return (
    <div className="game-panel statle-panel">
      <div className="game-toolbar statle-toolbar">
        <div className="mine-stats">
          <div><span className="micro">ROUND</span><strong>{round}/6</strong></div>
          <div><span className="micro">SCORE</span><strong>{score}</strong></div>
          <div><span className="micro">TARGET</span><strong>{TARGET}</strong></div>
        </div>

        <div className="toolbar-actions statle-toolbar-actions">
          <select
            className="statle-select"
            value={generation}
            onChange={(event) => changeGeneration(event.target.value)}
            aria-label="Pokémon generation filter"
          >
            <option value="ALL">All generations</option>
            {GENERATIONS.map((item) => (
              <option value={item.id} key={item.id}>{item.label}</option>
            ))}
          </select>
          <button className="secondary-btn" onClick={() => reset(generation)}>Restart</button>
        </div>
      </div>

      <div className="statle-board">
        {STATS.map((stat) => {
          const pick = claimed[stat.key]
          return (
            <div className={`statle-slot ${pick ? 'filled' : ''}`} key={stat.key}>
              <span className="micro">{stat.label}</span>
              {pick ? (
                <>
                  <img src={pick.sprite} alt="" />
                  <strong>{pick.value}</strong>
                  <small>{pick.pokemonName}</small>
                </>
              ) : (
                <>
                  <strong>?</strong>
                  <small>UNCLAIMED</small>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="statle-progress-wrap">
        <div className="statle-progress-copy">
          <span>{score} BST</span>
          <span>{Math.max(0, TARGET - score)} TO GOLD</span>
        </div>
        <div className="statle-progress">
          <i style={{ width: `${Math.min(100, (score / TARGET) * 100)}%` }} />
        </div>
      </div>

      <div className={`statle-medal ${medal.className}`}>
        <span>{medal.label}</span>
        <small>{status === 'playing' ? 'CURRENT PACE' : 'FINAL RESULT'}</small>
      </div>

      <section className="statle-current">
        {loading ? (
          <div className="statle-loading">
            <span className="statle-loader" />
            <strong>Rolling a Pokémon…</strong>
            <small>Fetching stats and sprite.</small>
          </div>
        ) : error ? (
          <div className="statle-error">
            <strong>Could not load the next Pokémon.</strong>
            <span>{error}</span>
            <button className="secondary-btn" onClick={retryLoad}>Retry</button>
          </div>
        ) : current ? (
          <>
            <div className="statle-pokemon-card">
              <div className="statle-sprite-mode">
                <button
                  className={spriteMode === 'artwork' ? 'active' : ''}
                  onClick={() => setSpriteMode('artwork')}
                >
                  ART
                </button>
                <button
                  className={spriteMode === 'pixel' ? 'active' : ''}
                  onClick={() => setSpriteMode('pixel')}
                >
                  SPRITE
                </button>
              </div>

              <div className={`statle-pokemon-image ${spriteMode}`}>
                <img
                  src={spriteMode === 'artwork' ? current.artwork : current.sprite}
                  alt={current.name}
                  loading="eager"
                />
              </div>

              <div className="statle-pokemon-info">
                <span className="micro">#{String(current.id).padStart(4, '0')}</span>
                <h3>{current.name}</h3>
                <div className="statle-types">
                  {current.types.map((type) => <span key={type}>{type}</span>)}
                </div>
              </div>
            </div>

            <div className="statle-stat-grid">
              {STATS.map((stat) => {
                const unavailable = Boolean(claimed[stat.key])
                return (
                  <button
                    className={`statle-stat-button ${unavailable ? 'used' : ''}`}
                    key={stat.key}
                    onClick={() => claim(stat.key)}
                    disabled={unavailable || status !== 'playing'}
                  >
                    <span>{stat.label}</span>
                    <strong>{current.stats[stat.key]}</strong>
                    <small>{unavailable ? 'CLAIMED' : 'SELECT'}</small>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div className="statle-finished">
            <strong>{score} BST</strong>
            <span>{message}</span>
            <button className="primary-btn" onClick={() => reset(generation)}>Play again ↗</button>
          </div>
        )}
      </section>

      <div className={`game-message ${status}`}>{message}</div>

      <div className="statle-footnote">
        Pokémon data and sprites load from PokéAPI. Generation filters use National Pokédex ranges through #1025.
      </div>
    </div>
  )
}
