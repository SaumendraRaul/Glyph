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

const MEGA_FORMS = [
  // X/Y + ORAS Megas
  { slug: 'venusaur-mega', baseId: 3 },
  { slug: 'charizard-mega-x', baseId: 6 },
  { slug: 'charizard-mega-y', baseId: 6 },
  { slug: 'blastoise-mega', baseId: 9 },
  { slug: 'beedrill-mega', baseId: 15 },
  { slug: 'pidgeot-mega', baseId: 18 },
  { slug: 'alakazam-mega', baseId: 65 },
  { slug: 'slowbro-mega', baseId: 80 },
  { slug: 'gengar-mega', baseId: 94 },
  { slug: 'kangaskhan-mega', baseId: 115 },
  { slug: 'pinsir-mega', baseId: 127 },
  { slug: 'gyarados-mega', baseId: 130 },
  { slug: 'aerodactyl-mega', baseId: 142 },
  { slug: 'mewtwo-mega-x', baseId: 150 },
  { slug: 'mewtwo-mega-y', baseId: 150 },
  { slug: 'ampharos-mega', baseId: 181 },
  { slug: 'steelix-mega', baseId: 208 },
  { slug: 'scizor-mega', baseId: 212 },
  { slug: 'heracross-mega', baseId: 214 },
  { slug: 'houndoom-mega', baseId: 229 },
  { slug: 'tyranitar-mega', baseId: 248 },
  { slug: 'sceptile-mega', baseId: 254 },
  { slug: 'blaziken-mega', baseId: 257 },
  { slug: 'swampert-mega', baseId: 260 },
  { slug: 'gardevoir-mega', baseId: 282 },
  { slug: 'sableye-mega', baseId: 302 },
  { slug: 'mawile-mega', baseId: 303 },
  { slug: 'aggron-mega', baseId: 306 },
  { slug: 'medicham-mega', baseId: 308 },
  { slug: 'manectric-mega', baseId: 310 },
  { slug: 'sharpedo-mega', baseId: 319 },
  { slug: 'camerupt-mega', baseId: 323 },
  { slug: 'altaria-mega', baseId: 334 },
  { slug: 'banette-mega', baseId: 354 },
  { slug: 'absol-mega', baseId: 359 },
  { slug: 'glalie-mega', baseId: 362 },
  { slug: 'salamence-mega', baseId: 373 },
  { slug: 'metagross-mega', baseId: 376 },
  { slug: 'latias-mega', baseId: 380 },
  { slug: 'latios-mega', baseId: 381 },
  { slug: 'rayquaza-mega', baseId: 384 },
  { slug: 'lopunny-mega', baseId: 428 },
  { slug: 'garchomp-mega', baseId: 445 },
  { slug: 'lucario-mega', baseId: 448 },
  { slug: 'abomasnow-mega', baseId: 460 },
  { slug: 'gallade-mega', baseId: 475 },
  { slug: 'audino-mega', baseId: 531 },
  { slug: 'diancie-mega', baseId: 719 },

  // Legends: Z-A base-game Megas
  { slug: 'clefable-mega', baseId: 36 },
  { slug: 'victreebel-mega', baseId: 71 },
  { slug: 'starmie-mega', baseId: 121 },
  { slug: 'dragonite-mega', baseId: 149 },
  { slug: 'meganium-mega', baseId: 154 },
  { slug: 'feraligatr-mega', baseId: 160 },
  { slug: 'skarmory-mega', baseId: 227 },
  { slug: 'froslass-mega', baseId: 478 },
  { slug: 'emboar-mega', baseId: 500 },
  { slug: 'excadrill-mega', baseId: 530 },
  { slug: 'scolipede-mega', baseId: 545 },
  { slug: 'scrafty-mega', baseId: 560 },
  { slug: 'eelektross-mega', baseId: 604 },
  { slug: 'chandelure-mega', baseId: 609 },
  { slug: 'chesnaught-mega', baseId: 652 },
  { slug: 'delphox-mega', baseId: 655 },
  { slug: 'greninja-mega', baseId: 658 },
  { slug: 'pyroar-mega', baseId: 668 },
  { slug: 'floette-mega', baseId: 670 },
  { slug: 'malamar-mega', baseId: 687 },
  { slug: 'barbaracle-mega', baseId: 689 },
  { slug: 'dragalge-mega', baseId: 691 },
  { slug: 'hawlucha-mega', baseId: 701 },
  { slug: 'zygarde-mega', baseId: 718 },
  { slug: 'drampa-mega', baseId: 780 },
  { slug: 'falinks-mega', baseId: 870 },

  // Mega Dimension Megas
  { slug: 'raichu-mega-x', baseId: 26 },
  { slug: 'raichu-mega-y', baseId: 26 },
  { slug: 'chimecho-mega', baseId: 358 },
  { slug: 'absol-mega-z', baseId: 359 },
  { slug: 'staraptor-mega', baseId: 398 },
  { slug: 'garchomp-mega-z', baseId: 445 },
  { slug: 'lucario-mega-z', baseId: 448 },
  { slug: 'heatran-mega', baseId: 485 },
  { slug: 'darkrai-mega', baseId: 491 },
  { slug: 'golurk-mega', baseId: 623 },
  { slug: 'meowstic-mega', baseId: 678 },
  { slug: 'crabominable-mega', baseId: 740 },
  { slug: 'golisopod-mega', baseId: 768 },
  { slug: 'magearna-mega', baseId: 801 },
  { slug: 'zeraora-mega', baseId: 807 },
  { slug: 'scovillain-mega', baseId: 952 },
  { slug: 'glimmora-mega', baseId: 970 },
  { slug: 'tatsugiri-mega', baseId: 978 },
  { slug: 'baxcalibur-mega', baseId: 998 },
]

const STATS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'ATK' },
  { key: 'defense', label: 'DEF' },
  { key: 'specialAttack', label: 'SpA' },
  { key: 'specialDefense', label: 'SpD' },
  { key: 'speed', label: 'SPE' },
]

const pokemonCache = new Map()
let showdownDexPromise = null

function showdownSpriteSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function loadShowdownDex() {
  if (!showdownDexPromise) {
    showdownDexPromise = fetch('https://play.pokemonshowdown.com/data/pokedex.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Pokémon Showdown returned ${response.status}`)
        return response.json()
      })
      .catch((error) => {
        showdownDexPromise = null
        throw error
      })
  }
  return showdownDexPromise
}

function pickShowdownMega(dex, ref) {
  const candidates = Object.entries(dex).filter(([, species]) => {
    if (species.num !== ref.baseId) return false
    const name = String(species.name || '')
    const forme = String(species.forme || '')
    return /mega/i.test(name) || /mega/i.test(forme)
  })

  if (!candidates.length) return null

  const query = String(ref.query || '').toLowerCase()
  const suffix =
    query.endsWith('-x') ? 'x' :
    query.endsWith('-y') ? 'y' :
    query.endsWith('-z') ? 'z' :
    null

  if (suffix) {
    const specific = candidates.find(([, species]) => {
      const combined = `${species.name || ''} ${species.forme || ''}`.toLowerCase()
      return new RegExp(`(?:^|[-\\s])${suffix}(?:$|[-\\s])`, 'i').test(combined)
    })
    if (specific) return specific
  }

  return candidates[0]
}

async function fetchShowdownMega(ref) {
  const dex = await loadShowdownDex()
  const match = pickShowdownMega(dex, ref)
  if (!match) throw new Error(`Mega data unavailable for Pokédex #${ref.baseId}`)

  const [showdownKey, species] = match
  const stats = species.baseStats || {}
  const spriteSlug = showdownSpriteSlug(species.name || showdownKey)
  const sprite = `https://play.pokemonshowdown.com/sprites/gen5/${spriteSlug}.png`
  const fallbackSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ref.baseId}.png`

  return {
    id: ref.baseId,
    formId: showdownKey,
    isMega: true,
    name: prettyPokemonName(String(species.name || ref.query).toLowerCase()),
    types: Array.isArray(species.types) ? species.types : [],
    artwork: sprite,
    sprite,
    fallbackSprite,
    stats: {
      hp: stats.hp,
      attack: stats.atk,
      defense: stats.def,
      specialAttack: stats.spa,
      specialDefense: stats.spd,
      speed: stats.spe,
    },
  }
}


function prettyName(value) {
  return value
    .split('-')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ')
}

function prettyPokemonName(value) {
  const parts = value.split('-')
  const megaIndex = parts.indexOf('mega')

  if (megaIndex > 0) {
    const base = prettyName(parts.slice(0, megaIndex).join('-'))
    const suffix = prettyName(parts.slice(megaIndex + 1).join('-'))
    return `Mega ${base}${suffix ? ` ${suffix}` : ''}`
  }

  return prettyName(value)
}

function selectedRange(generation) {
  if (generation === 'ALL') return { start: 1, end: 1025 }
  return GENERATIONS.find((item) => String(item.id) === String(generation)) || GENERATIONS[0]
}

function refsForFilters(generation, megaMode) {
  const range = selectedRange(generation)

  const baseRefs = Array.from(
    { length: range.end - range.start + 1 },
    (_, index) => {
      const id = range.start + index
      return {
        key: `base:${id}`,
        query: id,
        baseId: id,
        isMega: false,
      }
    },
  )

  const megaRefs = MEGA_FORMS
    .filter((item) => item.baseId >= range.start && item.baseId <= range.end)
    .map((item) => ({
      key: `mega:${item.slug}`,
      query: item.slug,
      baseId: item.baseId,
      isMega: true,
    }))

  if (megaMode === 'ONLY') return megaRefs
  if (megaMode === 'NONE') return baseRefs
  return [...baseRefs, ...megaRefs]
}

function generationHasChoices(generation, megaMode) {
  return refsForFilters(generation, megaMode).length > 0
}

function randomPokemonRef(generation, megaMode, used) {
  const pool = refsForFilters(generation, megaMode).filter((item) => !used.has(item.key))
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

async function fetchPokemon(ref) {
  if (pokemonCache.has(ref.key)) return pokemonCache.get(ref.key)

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${ref.query}`)

  if (!response.ok) {
    if (!ref.isMega) {
      throw new Error(`PokéAPI returned ${response.status} for ${ref.query}`)
    }

    const fallbackMega = await fetchShowdownMega(ref)
    pokemonCache.set(ref.key, fallbackMega)
    return fallbackMega
  }

  const data = await response.json()
  const statMap = Object.fromEntries(data.stats.map((entry) => [entry.stat.name, entry.base_stat]))

  const pokemon = {
    id: ref.baseId,
    formId: data.id,
    isMega: ref.isMega,
    name: prettyPokemonName(data.name),
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
    fallbackSprite:
      data.sprites?.front_default ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ref.baseId}.png`,
    stats: {
      hp: statMap.hp,
      attack: statMap.attack,
      defense: statMap.defense,
      specialAttack: statMap['special-attack'],
      specialDefense: statMap['special-defense'],
      speed: statMap.speed,
    },
  }

  pokemonCache.set(ref.key, pokemon)
  return pokemon
}

function medalFor(score) {
  if (score >= 600) return { label: 'GOLD', className: 'gold' }
  if (score >= 500) return { label: 'SILVER', className: 'silver' }
  if (score >= 400) return { label: 'BRONZE', className: 'bronze' }
  return { label: 'TRAINING', className: 'training' }
}

function bestPossibleAssignment(pokemon) {
  if (pokemon.length !== STATS.length) return null

  let bestScore = -Infinity
  let bestPicks = []

  function search(index, remainingStats, total, picks) {
    if (index === pokemon.length) {
      if (total > bestScore) {
        bestScore = total
        bestPicks = picks
      }
      return
    }

    const mon = pokemon[index]

    remainingStats.forEach((statKey) => {
      const stat = STATS.find((item) => item.key === statKey)
      const value = Number(mon.stats?.[statKey] ?? 0)
      search(
        index + 1,
        remainingStats.filter((key) => key !== statKey),
        total + value,
        [
          ...picks,
          {
            pokemonId: mon.id,
            pokemonName: mon.name,
            sprite: mon.sprite,
            fallbackSprite: mon.fallbackSprite,
            isMega: mon.isMega,
            statKey,
            statLabel: stat.label,
            value,
          },
        ],
      )
    })
  }

  search(0, STATS.map((stat) => stat.key), 0, [])
  return { score: bestScore, picks: bestPicks }
}

export default function Statle({ onComplete }) {
  const [generation, setGeneration] = useState('ALL')
  const [megaMode, setMegaMode] = useState('NONE')
  const [current, setCurrent] = useState(null)
  const [claimed, setClaimed] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('playing')
  const [spriteMode, setSpriteMode] = useState('artwork')
  const [revealedStat, setRevealedStat] = useState(null)
  const [pendingResult, setPendingResult] = useState(null)
  const [runPokemon, setRunPokemon] = useState([])
  const [message, setMessage] = useState('Pick one hidden stat from each Pokémon. Every stat can be claimed once.')

  const usedRefs = useRef(new Set())
  const requestId = useRef(0)
  const completed = useRef(false)
  const advancing = useRef(false)

  const score = useMemo(
    () => Object.values(claimed).reduce((sum, item) => sum + item.value, 0),
    [claimed],
  )
  const round = Math.min(Object.keys(claimed).length + 1, 6)
  const medal = medalFor(score)
  const optimalResult = useMemo(
    () => bestPossibleAssignment(runPokemon),
    [runPokemon],
  )
  const actualPicks = useMemo(
    () => runPokemon
      .map((pokemon) =>
        Object.values(claimed).find(
          (pick) =>
            pick.pokemonName === pokemon.name &&
            pick.pokemonId === pokemon.id,
        ),
      )
      .filter(Boolean),
    [claimed, runPokemon],
  )

  async function loadNext(gen = generation, mode = megaMode, attempt = 0) {
    const ref = randomPokemonRef(gen, mode, usedRefs.current)
    if (!ref) {
      setError('No unused Pokémon match these filters.')
      setLoading(false)
      return
    }

    const token = ++requestId.current
    setLoading(true)
    setError('')

    try {
      const pokemon = await fetchPokemon(ref)
      if (token !== requestId.current) return
      usedRefs.current.add(ref.key)
      setCurrent(pokemon)
    } catch (err) {
      if (token !== requestId.current) return

      usedRefs.current.add(ref.key)

      if (attempt < 5) {
        setMessage('That form is unavailable from the data source. Skipping it…')
        return loadNext(gen, mode, attempt + 1)
      }

      setError(err instanceof Error ? err.message : 'Could not load Pokémon data.')
    } finally {
      if (token === requestId.current) setLoading(false)
    }
  }

  function reset(gen = generation, mode = megaMode) {
    requestId.current += 1
    usedRefs.current = new Set()
    completed.current = false
    advancing.current = false
    setClaimed({})
    setCurrent(null)
    setStatus('playing')
    setError('')
    setRevealedStat(null)
    setPendingResult(null)
    setRunPokemon([])
    setMessage('Pick one hidden stat from each Pokémon. Every stat can be claimed once.')
    loadNext(gen, mode)
  }

  useEffect(() => {
    reset('ALL', 'NONE')
    return () => {
      requestId.current += 1
    }
    // Initial run only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function changeGeneration(next) {
    setGeneration(next)
    reset(next, megaMode)
  }

  function changeMegaMode(next) {
    let nextGeneration = generation
    if (!generationHasChoices(nextGeneration, next)) {
      nextGeneration = 'ALL'
      setGeneration('ALL')
    }
    setMegaMode(next)
    reset(nextGeneration, next)
  }

  function retryLoad() {
    loadNext(generation, megaMode)
  }

  function claim(statKey) {
    if (!current || loading || status !== 'playing' || claimed[statKey] || revealedStat) return

    const statMeta = STATS.find((item) => item.key === statKey)
    const value = current.stats[statKey]
    const nextClaimed = {
      ...claimed,
      [statKey]: {
        value,
        pokemonId: current.id,
        pokemonName: current.name,
        sprite: current.sprite,
        fallbackSprite: current.fallbackSprite,
        statLabel: statMeta.label,
        isMega: current.isMega,
      },
    }

    const nextRunPokemon = [
      ...runPokemon,
      {
        id: current.id,
        name: current.name,
        sprite: current.sprite,
        fallbackSprite: current.fallbackSprite,
        isMega: current.isMega,
        stats: current.stats,
      },
    ]

    setRevealedStat({ key: statKey, label: statMeta.label, value })
    setClaimed(nextClaimed)
    setRunPokemon(nextRunPokemon)

    const nextScore = Object.values(nextClaimed).reduce((sum, item) => sum + item.value, 0)
    const isFinal = Object.keys(nextClaimed).length === STATS.length

    if (isFinal) {
      const won = nextScore >= TARGET
      setPendingResult({ won, score: nextScore })
      setMessage(
        `${current.name}'s full stat spread revealed. Review it, then finish the run.`,
      )
    } else {
      setPendingResult(null)
      setMessage(
        `${current.name}'s ${statMeta.label} was ${value}. All six stats are revealed below. Click Next Pokémon when ready.`,
      )
    }
  }

  function advance() {
    if (!revealedStat || advancing.current) return
    advancing.current = true

    if (pendingResult) {
      const { won, score: finalScore } = pendingResult
      setStatus(won ? 'won' : 'lost')
      setMessage(
        won
          ? `${finalScore} BST. Gold target cleared.`
          : `${finalScore} BST. You needed ${TARGET - finalScore} more for gold.`,
      )

      if (!completed.current) {
        completed.current = true
        onComplete({
          won,
          score: finalScore,
          lowerIsBetter: false,
          bonusXp: won
            ? Math.min(40, Math.max(10, Math.floor((finalScore - TARGET) / 5) + 20))
            : 0,
        })
      }

      setCurrent(null)
      setRevealedStat(null)
      setPendingResult(null)
      advancing.current = false
      return
    }

    setCurrent(null)
    setRevealedStat(null)
    setPendingResult(null)
    setMessage('Rolling next Pokémon…')
    loadNext(generation, megaMode).finally(() => {
      advancing.current = false
    })
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
              <option
                value={item.id}
                key={item.id}
                disabled={!generationHasChoices(item.id, megaMode)}
              >
                {item.label}
              </option>
            ))}
          </select>

          <select
            className="statle-select"
            value={megaMode}
            onChange={(event) => changeMegaMode(event.target.value)}
            aria-label="Mega Evolution filter"
          >
            <option value="ALL">All forms</option>
            <option value="ONLY">Only Megas</option>
            <option value="NONE">No Megas</option>
          </select>

          <button className="secondary-btn" onClick={() => reset(generation, megaMode)}>Restart</button>
        </div>
      </div>

      <div className="statle-filter-summary">
        <span>{generation === 'ALL' ? 'GEN 1–9' : `GEN ${generation}`}</span>
        <span>•</span>
        <strong>
          {megaMode === 'ONLY' ? 'MEGAS ONLY' : megaMode === 'NONE' ? 'NO MEGAS' : 'ALL FORMS'}
        </strong>
        <span>•</span>
        <span>{refsForFilters(generation, megaMode).length} FORMS</span>
      </div>

      <div className="statle-board">
        {STATS.map((stat) => {
          const pick = claimed[stat.key]
          return (
            <div className={`statle-slot ${pick ? 'filled' : ''}`} key={stat.key}>
              <span className="micro">{stat.label}</span>
              {pick ? (
                <>
                  <div className="statle-slot-sprite">
                    <img
                      src={pick.sprite}
                      alt=""
                      onError={(event) => {
                        if (pick.fallbackSprite && event.currentTarget.src !== pick.fallbackSprite) {
                          event.currentTarget.src = pick.fallbackSprite
                        }
                      }}
                    />
                    {pick.isMega && <span className="mega-dot" title="Mega Evolution">M</span>}
                  </div>
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

              <div className={`statle-pokemon-image ${spriteMode} ${current.isMega ? 'mega' : ''}`}>
                <img
                  src={spriteMode === 'artwork' ? current.artwork : current.sprite}
                  alt={current.name}
                  loading="eager"
                  onError={(event) => {
                    if (current.fallbackSprite && event.currentTarget.src !== current.fallbackSprite) {
                      event.currentTarget.src = current.fallbackSprite
                    }
                  }}
                />
                {current.isMega && <span className="statle-mega-badge">MEGA</span>}
              </div>

              <div className="statle-pokemon-info">
                <span className="micro">
                  #{String(current.id).padStart(4, '0')} {current.isMega ? '• MEGA FORM' : ''}
                </span>
                <h3>{current.name}</h3>
                <div className="statle-types">
                  {current.types.map((type) => <span key={type}>{type}</span>)}
                </div>
              </div>
            </div>

            <div className={`statle-stat-grid ${revealedStat ? 'is-revealed' : ''}`}>
              {STATS.map((stat) => {
                const alreadyClaimed = Boolean(claimed[stat.key])
                const isChosen = revealedStat?.key === stat.key
                const showValues = Boolean(revealedStat)

                return (
                  <button
                    className={[
                      'statle-stat-button',
                      alreadyClaimed ? 'used' : '',
                      showValues ? 'revealed' : '',
                      isChosen ? 'chosen' : '',
                    ].filter(Boolean).join(' ')}
                    key={stat.key}
                    onClick={() => claim(stat.key)}
                    disabled={alreadyClaimed || status !== 'playing' || showValues}
                  >
                    <span>{stat.label}</span>
                    <strong>{showValues ? current.stats[stat.key] : '?'}</strong>
                    <small>
                      {showValues
                        ? isChosen
                          ? 'PICKED'
                          : alreadyClaimed
                            ? 'USED'
                            : 'REVEALED'
                        : alreadyClaimed
                          ? 'CLAIMED'
                          : 'SELECT'}
                    </small>
                  </button>
                )
              })}
            </div>

            {revealedStat && (
              <div className="statle-reveal-actions">
                <div>
                  <span className="micro">FULL SPREAD REVEALED</span>
                  <strong>
                    You claimed {revealedStat.label} = {revealedStat.value}
                  </strong>
                </div>
                <button className="primary-btn" onClick={advance}>
                  {pendingResult ? 'See result' : 'Next Pokémon'}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </>
        ) : status !== 'playing' && optimalResult ? (
          <div className="statle-results">
            <div className="statle-results-head">
              <div>
                <span className="micro">ROUND RESULT</span>
                <h3>How close was the run?</h3>
              </div>
              <span className={`statle-result-grade ${status}`}>
                {status === 'won' ? 'TARGET CLEARED' : 'RUN COMPLETE'}
              </span>
            </div>

            <section className="statle-result-card actual">
              <div className="statle-result-title">
                <span>Your Final Score</span>
                <strong>{score}</strong>
              </div>

              <div className="statle-result-grid">
                {actualPicks.map((pick, index) => (
                  <div className="statle-result-pick" key={`actual-${pick.pokemonId}-${index}`}>
                    <div className="statle-result-sprite">
                      <img
                        src={pick.sprite}
                        alt={pick.pokemonName}
                        onError={(event) => {
                          if (pick.fallbackSprite && event.currentTarget.src !== pick.fallbackSprite) {
                            event.currentTarget.src = pick.fallbackSprite
                          }
                        }}
                      />
                      {pick.isMega && <span className="mega-dot">M</span>}
                    </div>
                    <strong>{pick.statLabel}: {pick.value}</strong>
                    <small>{pick.pokemonName}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="statle-result-card optimal">
              <div className="statle-result-title">
                <span>Best Possible Score</span>
                <strong>{optimalResult.score}</strong>
              </div>

              <div className="statle-result-grid">
                {optimalResult.picks.map((pick, index) => (
                  <div className="statle-result-pick" key={`optimal-${pick.pokemonId}-${index}`}>
                    <div className="statle-result-sprite">
                      <img
                        src={pick.sprite}
                        alt={pick.pokemonName}
                        onError={(event) => {
                          if (pick.fallbackSprite && event.currentTarget.src !== pick.fallbackSprite) {
                            event.currentTarget.src = pick.fallbackSprite
                          }
                        }}
                      />
                      {pick.isMega && <span className="mega-dot">M</span>}
                    </div>
                    <strong>{pick.statLabel}: {pick.value}</strong>
                    <small>{pick.pokemonName}</small>
                  </div>
                ))}
              </div>
            </section>

            <div className="statle-result-summary">
              <div>
                <span>POINTS LEFT</span>
                <strong>{Math.max(0, optimalResult.score - score)}</strong>
              </div>
              <div>
                <span>EFFICIENCY</span>
                <strong>
                  {optimalResult.score > 0 ? Math.round((score / optimalResult.score) * 100) : 100}%
                </strong>
              </div>
              <div>
                <span>PERFECT?</span>
                <strong>{score === optimalResult.score ? 'YES' : 'NO'}</strong>
              </div>
            </div>

            <button className="primary-btn statle-play-again" onClick={() => reset(generation, megaMode)}>
              Play again
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        ) : (
          <div className="statle-finished">
            <strong>{score} BST</strong>
            <span>{message}</span>
            <button className="primary-btn" onClick={() => reset(generation, megaMode)}>Play again ↗</button>
          </div>
        )}
      </section>

      <div className={`game-message ${status}`}>{message}</div>

      <div className="statle-footnote">
        Stats stay hidden until you pick one, then the full spread is revealed. Standard forms use PokéAPI; unsupported Mega forms fall back to Pokémon Showdown dex data and sprites.
      </div>
    </div>
  )
}
