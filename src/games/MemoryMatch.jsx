import { useEffect, useMemo, useRef, useState } from 'react'

const SYMBOLS = ['△', '○', '◇', '□', '✦', '✚', '⌁', '☼']

function shuffledCards() {
  const cards = [...SYMBOLS, ...SYMBOLS].map((symbol, index) => ({
    id: `${symbol}-${index}`,
    symbol,
    matched: false,
  }))
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export default function MemoryMatch({ onComplete }) {
  const [cards, setCards] = useState(shuffledCards)
  const [open, setOpen] = useState([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState('playing')
  const [started, setStarted] = useState(false)
  const timeoutRef = useRef(null)

  const matches = useMemo(() => cards.filter((card) => card.matched).length / 2, [cards])

  useEffect(() => {
    if (!started || status !== 'playing') return undefined
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [started, status])

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  function reset() {
    window.clearTimeout(timeoutRef.current)
    setCards(shuffledCards())
    setOpen([])
    setMoves(0)
    setSeconds(0)
    setStatus('playing')
    setStarted(false)
  }

  function flip(index) {
    if (status !== 'playing' || open.length >= 2) return
    if (cards[index].matched || open.includes(index)) return
    if (!started) setStarted(true)

    const nextOpen = [...open, index]
    setOpen(nextOpen)

    if (nextOpen.length < 2) return

    setMoves((value) => value + 1)
    const [a, b] = nextOpen

    if (cards[a].symbol === cards[b].symbol) {
      const nextCards = cards.map((card, cardIndex) =>
        cardIndex === a || cardIndex === b ? { ...card, matched: true } : card,
      )
      setCards(nextCards)
      setOpen([])

      const complete = nextCards.every((card) => card.matched)
      if (complete) {
        const finalMoves = moves + 1
        setStatus('won')
        onComplete({
          won: true,
          score: finalMoves,
          lowerIsBetter: true,
          bonusXp: Math.max(0, 40 - Math.max(0, finalMoves - 8) * 3),
        })
      }
    } else {
      timeoutRef.current = window.setTimeout(() => setOpen([]), 650)
    }
  }

  return (
    <div className="game-panel memory-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">MOVES</span><strong>{moves}</strong></div>
          <div><span className="micro">TIME</span><strong>{seconds}s</strong></div>
          <div><span className="micro">PAIRS</span><strong>{matches}/8</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>Shuffle</button>
      </div>

      <div className="memory-grid">
        {cards.map((card, index) => {
          const visible = card.matched || open.includes(index)
          return (
            <button
              key={card.id}
              className={`memory-card ${visible ? 'open' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => flip(index)}
              disabled={card.matched}
              aria-label={visible ? card.symbol : 'Hidden card'}
            >
              <span>{visible ? card.symbol : '?'}</span>
            </button>
          )
        })}
      </div>

      <div className={`game-message ${status}`}>
        {status === 'won'
          ? `All pairs found in ${moves} moves and ${seconds} seconds.`
          : 'Find all eight pairs. The cards are definitely not conspiring.'}
      </div>
    </div>
  )
}
