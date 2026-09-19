import { useMemo, useState } from 'react'

const PUZZLES = [
  [
    { title: 'EEVEELUTIONS', words: ['VAPOREON', 'JOLTEON', 'FLAREON', 'ESPEON'] },
    { title: 'PSEUDO-LEGENDARY FIRST STAGES', words: ['DRATINI', 'LARVITAR', 'BAGON', 'GIBLE'] },
    { title: 'HAVE REGIONAL FORMS', words: ['RATTATA', 'MEOWTH', 'VULPIX', 'ZIGZAGOON'] },
    { title: 'FOSSIL POKÉMON', words: ['KABUTO', 'OMANYTE', 'AERODACTYL', 'CRANIDOS'] },
  ],
  [
    { title: 'ORIGINAL TRADE EVOLUTIONS', words: ['ALAKAZAM', 'MACHAMP', 'GOLEM', 'GENGAR'] },
    { title: 'EVOLVE WITH A MOON STONE', words: ['NIDOQUEEN', 'NIDOKING', 'CLEFABLE', 'WIGGLYTUFF'] },
    { title: 'KANTO LEGENDARIES', words: ['ARTICUNO', 'ZAPDOS', 'MOLTRES', 'MEWTWO'] },
    { title: 'KANTO SAFARI ZONE FINDS', words: ['TAUROS', 'CHANSEY', 'KANGASKHAN', 'SCYTHER'] },
  ],
  [
    { title: 'FIRE-TYPE STARTERS', words: ['CHARMANDER', 'CYNDAQUIL', 'TORCHIC', 'CHIMCHAR'] },
    { title: 'WATER-TYPE STARTERS', words: ['SQUIRTLE', 'TOTODILE', 'MUDKIP', 'PIPLUP'] },
    { title: 'GRASS-TYPE STARTERS', words: ['BULBASAUR', 'CHIKORITA', 'TREECKO', 'TURTWIG'] },
    { title: 'ELECTRIC RODENTS', words: ['PIKACHU', 'PLUSLE', 'MINUN', 'PACHIRISU'] },
  ],
  [
    { title: 'TAPU GUARDIANS', words: ['TAPU KOKO', 'TAPU LELE', 'TAPU BULU', 'TAPU FINI'] },
    { title: 'REGI FAMILY', words: ['REGIROCK', 'REGICE', 'REGISTEEL', 'REGIGIGAS'] },
    { title: 'SWORDS OF JUSTICE', words: ['COBALION', 'TERRAKION', 'VIRIZION', 'KELDEO'] },
    { title: 'TREASURES OF RUIN', words: ['WO-CHIEN', 'CHIEN-PAO', 'TING-LU', 'CHI-YU'] },
  ],
  [
    { title: 'BABY POKÉMON', words: ['PICHU', 'CLEFFA', 'IGGLYBUFF', 'SMOOCHUM'] },
    { title: 'EVOLVE THROUGH FRIENDSHIP', words: ['CROBAT', 'ESPEON', 'UMBREON', 'TOGETIC'] },
    { title: 'CAN MEGA EVOLVE', words: ['CHARIZARD', 'LUCARIO', 'GARDEVOIR', 'ABSOL'] },
    { title: 'HAVE GIGANTAMAX FORMS', words: ['BUTTERFREE', 'SNORLAX', 'LAPRAS', 'GARBODOR'] },
  ],
  [
    { title: 'ULTRA BEASTS', words: ['NIHILEGO', 'BUZZWOLE', 'PHEROMOSA', 'XURKITREE'] },
    { title: 'PAST PARADOX POKÉMON', words: ['GREAT TUSK', 'SCREAM TAIL', 'BRUTE BONNET', 'FLUTTER MANE'] },
    { title: 'FUTURE PARADOX POKÉMON', words: ['IRON TREADS', 'IRON BUNDLE', 'IRON HANDS', 'IRON JUGULIS'] },
    { title: 'PALDEA-ERA LEGENDARIES', words: ['KORAIDON', 'MIRAIDON', 'OGERPON', 'TERAPAGOS'] },
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

function randomPuzzle(previousIndex = -1) {
  const choices = PUZZLES.map((_, index) => index).filter((index) => index !== previousIndex)
  const index = choices[Math.floor(Math.random() * choices.length)]
  const groups = PUZZLES[index]
  return {
    index,
    groups,
    words: shuffle(groups.flatMap((group) => group.words)),
  }
}

export default function PokemonConnections({ onComplete }) {
  const [puzzle, setPuzzle] = useState(() => randomPuzzle())
  const [selected, setSelected] = useState([])
  const [solved, setSolved] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState('Select four Pokémon that belong together.')

  const remaining = useMemo(
    () => puzzle.words.filter((word) => !solved.some((group) => group.words.includes(word))),
    [puzzle, solved],
  )

  function reset() {
    setPuzzle((current) => randomPuzzle(current.index))
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
