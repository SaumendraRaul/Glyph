import { useMemo, useState } from 'react'

const PUZZLES = [
  {
    id: 'mixed-medium',
    era: 'MIXED',
    difficulty: 'MEDIUM',
    groups: [
      { title: 'EEVEELUTIONS', words: ['VAPOREON', 'JOLTEON', 'FLAREON', 'ESPEON'] },
      { title: 'PSEUDO-LEGENDARY FIRST STAGES', words: ['DRATINI', 'LARVITAR', 'BAGON', 'GIBLE'] },
      { title: 'HAVE REGIONAL FORMS', words: ['RATTATA', 'MEOWTH', 'VULPIX', 'ZIGZAGOON'] },
      { title: 'FOSSIL POKÉMON', words: ['KABUTO', 'OMANYTE', 'AERODACTYL', 'CRANIDOS'] },
    ],
  },
  {
    id: 'kanto-easy',
    era: 'KANTO',
    difficulty: 'EASY',
    groups: [
      { title: 'ORIGINAL TRADE EVOLUTIONS', words: ['ALAKAZAM', 'MACHAMP', 'GOLEM', 'GENGAR'] },
      { title: 'EVOLVE WITH A MOON STONE', words: ['NIDOQUEEN', 'NIDOKING', 'CLEFABLE', 'WIGGLYTUFF'] },
      { title: 'KANTO LEGENDARIES', words: ['ARTICUNO', 'ZAPDOS', 'MOLTRES', 'MEWTWO'] },
      { title: 'KANTO SAFARI ZONE FINDS', words: ['TAUROS', 'CHANSEY', 'KANGASKHAN', 'SCYTHER'] },
    ],
  },
  {
    id: 'starters-easy',
    era: 'STARTERS',
    difficulty: 'EASY',
    groups: [
      { title: 'FIRE-TYPE STARTERS', words: ['CHARMANDER', 'CYNDAQUIL', 'TORCHIC', 'CHIMCHAR'] },
      { title: 'WATER-TYPE STARTERS', words: ['SQUIRTLE', 'TOTODILE', 'MUDKIP', 'PIPLUP'] },
      { title: 'GRASS-TYPE STARTERS', words: ['BULBASAUR', 'CHIKORITA', 'TREECKO', 'TURTWIG'] },
      { title: 'ELECTRIC RODENTS', words: ['PIKACHU', 'PLUSLE', 'MINUN', 'PACHIRISU'] },
    ],
  },
  {
    id: 'legends-hard',
    era: 'LEGENDS',
    difficulty: 'HARD',
    groups: [
      { title: 'TAPU GUARDIANS', words: ['TAPU KOKO', 'TAPU LELE', 'TAPU BULU', 'TAPU FINI'] },
      { title: 'REGI FAMILY', words: ['REGIROCK', 'REGICE', 'REGISTEEL', 'REGIGIGAS'] },
      { title: 'SWORDS OF JUSTICE', words: ['COBALION', 'TERRAKION', 'VIRIZION', 'KELDEO'] },
      { title: 'TREASURES OF RUIN', words: ['WO-CHIEN', 'CHIEN-PAO', 'TING-LU', 'CHI-YU'] },
    ],
  },
  {
    id: 'evolution-medium',
    era: 'EVOLUTION',
    difficulty: 'MEDIUM',
    groups: [
      { title: 'BABY POKÉMON', words: ['PICHU', 'CLEFFA', 'IGGLYBUFF', 'SMOOCHUM'] },
      { title: 'EVOLVE THROUGH FRIENDSHIP', words: ['CROBAT', 'ESPEON', 'UMBREON', 'TOGETIC'] },
      { title: 'CAN MEGA EVOLVE', words: ['CHARIZARD', 'LUCARIO', 'GARDEVOIR', 'ABSOL'] },
      { title: 'HAVE GIGANTAMAX FORMS', words: ['BUTTERFREE', 'SNORLAX', 'LAPRAS', 'GARBODOR'] },
    ],
  },
  {
    id: 'modern-hard',
    era: 'MODERN',
    difficulty: 'HARD',
    groups: [
      { title: 'ULTRA BEASTS', words: ['NIHILEGO', 'BUZZWOLE', 'PHEROMOSA', 'XURKITREE'] },
      { title: 'PAST PARADOX POKÉMON', words: ['GREAT TUSK', 'SCREAM TAIL', 'BRUTE BONNET', 'FLUTTER MANE'] },
      { title: 'FUTURE PARADOX POKÉMON', words: ['IRON TREADS', 'IRON BUNDLE', 'IRON HANDS', 'IRON JUGULIS'] },
      { title: 'PALDEA-ERA LEGENDARIES', words: ['KORAIDON', 'MIRAIDON', 'OGERPON', 'TERAPAGOS'] },
    ],
  },
]

const ERAS = ['ALL', 'KANTO', 'STARTERS', 'EVOLUTION', 'LEGENDS', 'MODERN', 'MIXED']

function shuffle(values) {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function matchesFilters(puzzle, era, difficulty) {
  return (era === 'ALL' || puzzle.era === era) &&
    (difficulty === 'ALL' || puzzle.difficulty === difficulty)
}

function randomPuzzle(era = 'ALL', difficulty = 'ALL', previousId = null) {
  let candidates = PUZZLES.filter((puzzle) => matchesFilters(puzzle, era, difficulty))
  if (!candidates.length) candidates = PUZZLES

  const alternatives = candidates.filter((puzzle) => puzzle.id !== previousId)
  const pool = alternatives.length ? alternatives : candidates
  const picked = pool[Math.floor(Math.random() * pool.length)]

  return {
    ...picked,
    words: shuffle(picked.groups.flatMap((group) => group.words)),
  }
}

export default function PokemonConnections({ onComplete }) {
  const [era, setEra] = useState('ALL')
  const [difficulty, setDifficulty] = useState('ALL')
  const [puzzle, setPuzzle] = useState(() => randomPuzzle())
  const [selected, setSelected] = useState([])
  const [solved, setSolved] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState('Select four Pokémon that belong together.')

  const availableDifficulties = useMemo(() => {
    const values = new Set(
      PUZZLES
        .filter((item) => era === 'ALL' || item.era === era)
        .map((item) => item.difficulty),
    )
    return ['ALL', ...['EASY', 'MEDIUM', 'HARD'].filter((item) => values.has(item))]
  }, [era])

  const matchCount = useMemo(
    () => PUZZLES.filter((item) => matchesFilters(item, era, difficulty)).length,
    [era, difficulty],
  )

  const remaining = useMemo(
    () => puzzle.words.filter((word) => !solved.some((group) => group.words.includes(word))),
    [puzzle, solved],
  )

  function chooseEra(nextEra) {
    setEra(nextEra)
    if (
      difficulty !== 'ALL' &&
      !PUZZLES.some((item) => matchesFilters(item, nextEra, difficulty))
    ) {
      setDifficulty('ALL')
    }
  }

  function reset() {
    setPuzzle((current) => randomPuzzle(era, difficulty, current.id))
    setSelected([])
    setSolved([])
    setMistakes(0)
    setStatus('playing')
    setMessage('Select four Pokémon that belong together.')
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
        setMessage(`Pokédex brain confirmed. Solved with ${mistakes} mistake${mistakes === 1 ? '' : 's'}.`)
        onComplete({
          won: true,
          score: mistakes,
          lowerIsBetter: true,
          bonusXp: Math.max(0, 40 - mistakes * 10),
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
    setMessage(near ? 'One away… Professor Oak is disappointed but hopeful.' : 'Not a group. Check the Pokédex in your skull.')

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
    <div className="game-panel connections-panel pokemon-connections-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">GROUPS</span><strong>{solved.length}/4</strong></div>
          <div><span className="micro">MISTAKES</span><strong>{mistakes}/4</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>New set</button>
      </div>

      <div className="pokemon-set-label">
        <span className="pokemon-ball-mark" aria-hidden="true"><i /></span>
        <div>
          <span className="micro">POKÉDEX CONNECTIONS</span>
          <strong>Find the hidden Pokémon groups.</strong>
        </div>
      </div>

      <div className="connection-filters pokemon-filter-panel">
        <div className="filter-row">
          <span className="filter-label">ERA / SET</span>
          <div className="filter-chips">
            {ERAS.map((item) => (
              <button
                className={`filter-chip ${era === item ? 'active' : ''}`}
                key={item}
                onClick={() => chooseEra(item)}
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
          Next set: <strong>{era === 'ALL' ? 'ANY SET' : era}</strong>
          <span>•</span>
          <strong>{difficulty === 'ALL' ? 'ANY DIFFICULTY' : difficulty}</strong>
          <span>•</span>
          {matchCount} set{matchCount === 1 ? '' : 's'}
        </div>
      </div>

      <div className="connections-solved">
        {solved.map((group, index) => (
          <div className={`connection-group g${index}`} key={group.title}>
            <strong>{group.title}</strong>
            <span>{group.words.join(' · ')}</span>
          </div>
        ))}
      </div>

      <div className="connections-grid pokemon-connections-grid">
        {remaining.map((word) => (
          <button
            className={`connection-word pokemon-word ${selected.includes(word) ? 'selected' : ''}`}
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
