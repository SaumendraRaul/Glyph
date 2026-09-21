import { useEffect, useMemo, useRef, useState } from 'react'

const SYMBOLS = ['△','○','◇','□','✦','✚','⌁','☼','♜','♞','♟','✿','☾','⚙','⌘','∞','⚡','☯']

const MODES = {
  CLASSIC: { cols: 4, rows: 4, pairs: 8, label: '4×4', bonus: 0 },
  WIDE: { cols: 5, rows: 4, pairs: 10, label: '5×4', bonus: 5 },
  GRAND: { cols: 6, rows: 6, pairs: 18, label: '6×6', bonus: 12 },
}

function shuffledCards(pairCount) {
  const chosen = SYMBOLS.slice(0, pairCount)
  const cards = [...chosen, ...chosen].map((symbol, index) => ({
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
  const [mode, setMode] = useState('CLASSIC')
  const config = MODES[mode]
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [cards, setCards] = useState(() => shuffledCards(MODES.CLASSIC.pairs))
  const [open, setOpen] = useState([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState('playing')
  const [started, setStarted] = useState(false)
  const timeoutRef = useRef(null)
  const previewRef = useRef(null)

  const matches = useMemo(
    () => cards.filter((card) => card.matched).length / 2,
    [cards],
  )

  useEffect(() => {
    if (!started || status !== 'playing' || previewing) return undefined
    const id = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    )
    return () => window.clearInterval(id)
  }, [started, status, previewing])

  useEffect(() => () => {
    window.clearTimeout(timeoutRef.current)
    window.clearTimeout(previewRef.current)
  }, [])

  function beginPreviewIfNeeded(enabled = previewEnabled) {
    window.clearTimeout(previewRef.current)

    if (!enabled) {
      setPreviewing(false)
      return
    }

    setPreviewing(true)
    previewRef.current = window.setTimeout(() => {
      setPreviewing(false)
    }, 2500)
  }

  function reset(nextMode = mode, nextPreview = previewEnabled) {
    window.clearTimeout(timeoutRef.current)
    window.clearTimeout(previewRef.current)

    const next = MODES[nextMode]
    setMode(nextMode)
    setPreviewEnabled(nextPreview)
    setCards(shuffledCards(next.pairs))
    setOpen([])
    setMoves(0)
    setSeconds(0)
    setStatus('playing')
    setStarted(false)

    window.setTimeout(() => beginPreviewIfNeeded(nextPreview), 0)
  }

  function changeMode(next) {
    reset(next, previewEnabled)
  }

  function togglePreview() {
    const next = !previewEnabled
    reset(mode, next)
  }

  function flip(index) {
    if (previewing || status !== 'playing' || open.length >= 2) return
    if (cards[index].matched || open.includes(index)) return

    if (!started) setStarted(true)

    const nextOpen = [...open, index]
    setOpen(nextOpen)

    if (nextOpen.length < 2) return

    setMoves((value) => value + 1)
    const [a, b] = nextOpen

    if (cards[a].symbol === cards[b].symbol) {
      const nextCards = cards.map((card, cardIndex) =>
        cardIndex === a || cardIndex === b
          ? { ...card, matched: true }
          : card,
      )

      setCards(nextCards)
      setOpen([])

      const complete = nextCards.every((card) => card.matched)

      if (complete) {
        const finalMoves = moves + 1
        setStatus('won')
        const ideal = config.pairs
        const efficiencyPenalty = Math.max(0, finalMoves - ideal)

        onComplete({
          won: true,
          score: finalMoves,
          lowerIsBetter: true,
          bonusXp: Math.min(
            40,
            Math.max(0, 32 - efficiencyPenalty * 2) +
              config.bonus +
              (previewEnabled ? 0 : 4),
          ),
        })
      }
    } else {
      timeoutRef.current = window.setTimeout(() => setOpen([]), 650)
    }
  }

  return (
    <div className="game-panel memory-panel">
      <div className="memory-settings">
        <div>
          <span className="micro">BOARD</span>
          <div className="filter-chips">
            {Object.entries(MODES).map(([key, item]) => (
              <button
                className={`filter-chip ${mode === key ? 'active' : ''}`}
                onClick={() => changeMode(key)}
                key={key}
              >
                {key}
                <small>{item.label}</small>
              </button>
            ))}
          </div>
        </div>

        <button
          className={`memory-preview-toggle ${previewEnabled ? 'active' : ''}`}
          onClick={togglePreview}
        >
          <span>STUDY PREVIEW</span>
          <small>{previewEnabled ? '2.5 seconds before play' : 'cards start hidden'}</small>
        </button>
      </div>

      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">MOVES</span><strong>{moves}</strong></div>
          <div><span className="micro">TIME</span><strong>{seconds}s</strong></div>
          <div><span className="micro">PAIRS</span><strong>{matches}/{config.pairs}</strong></div>
        </div>
        <button className="secondary-btn" onClick={() => reset()}>Shuffle</button>
      </div>

      {previewing && (
        <div className="memory-preview-banner">
          <span>STUDY PHASE</span>
          <strong>Memorize now. Regret later.</strong>
        </div>
      )}

      <div
        className={`memory-grid memory-${mode.toLowerCase()}`}
        style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}
      >
        {cards.map((card, index) => {
          const visible = previewing || card.matched || open.includes(index)
          return (
            <button
              key={card.id}
              className={`memory-card ${visible ? 'open' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => flip(index)}
              disabled={card.matched || previewing}
              aria-label={visible ? card.symbol : 'Hidden card'}
            >
              <span>{visible ? card.symbol : '?'}</span>
            </button>
          )
        })}
      </div>

      <div className={`game-message ${status}`}>
        {status === 'won'
          ? `${config.label} cleared in ${moves} moves and ${seconds} seconds.`
          : previewing
            ? 'Study the board. The timer starts after the preview.'
            : `Find all ${config.pairs} pairs.`}
      </div>
    </div>
  )
}
