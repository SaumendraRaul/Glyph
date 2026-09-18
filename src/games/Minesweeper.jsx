import { useEffect, useRef, useState } from 'react'

const SIZE = 9
const MINES = 10

function blankBoard() {
  return Array.from({ length: SIZE * SIZE }, (_, index) => ({
    index,
    mine: false,
    revealed: false,
    flagged: false,
    count: 0,
  }))
}

function neighbors(index) {
  const row = Math.floor(index / SIZE)
  const col = index % SIZE
  const result = []
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) result.push(nr * SIZE + nc)
    }
  }
  return result
}

function armBoard(safeIndex) {
  const board = blankBoard()
  const forbidden = new Set([safeIndex, ...neighbors(safeIndex)])
  const choices = board.map((cell) => cell.index).filter((index) => !forbidden.has(index))

  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }

  choices.slice(0, MINES).forEach((index) => {
    board[index].mine = true
  })

  board.forEach((cell) => {
    if (!cell.mine) cell.count = neighbors(cell.index).filter((index) => board[index].mine).length
  })

  return board
}

function floodReveal(board, start) {
  const next = board.map((cell) => ({ ...cell }))
  const queue = [start]
  const visited = new Set()

  while (queue.length) {
    const index = queue.shift()
    if (visited.has(index)) continue
    visited.add(index)
    const cell = next[index]
    if (cell.flagged || cell.mine) continue
    cell.revealed = true
    if (cell.count === 0) {
      neighbors(index).forEach((neighbor) => {
        if (!visited.has(neighbor)) queue.push(neighbor)
      })
    }
  }
  return next
}

export default function Minesweeper({ onComplete }) {
  const [board, setBoard] = useState(blankBoard)
  const [started, setStarted] = useState(false)
  const [status, setStatus] = useState('playing')
  const [seconds, setSeconds] = useState(0)
  const [flagMode, setFlagMode] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (started && status === 'playing') {
      timerRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000)
      return () => window.clearInterval(timerRef.current)
    }
    return undefined
  }, [started, status])

  function reset() {
    setBoard(blankBoard())
    setStarted(false)
    setStatus('playing')
    setSeconds(0)
    setFlagMode(false)
  }

  function finish(next, won) {
    setStatus(won ? 'won' : 'lost')
    if (!won) {
      setBoard(next.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell)))
      onComplete({ won: false })
      return
    }
    onComplete({
      won: true,
      score: seconds,
      lowerIsBetter: true,
      bonusXp: Math.max(0, 40 - Math.floor(seconds / 5)),
    })
  }

  function reveal(index) {
    if (status !== 'playing') return

    let working = board
    if (!started) {
      working = armBoard(index)
      setStarted(true)
    }

    const target = working[index]
    if (target.flagged || target.revealed) return

    if (target.mine) {
      const next = working.map((cell) =>
        cell.index === index ? { ...cell, revealed: true } : cell,
      )
      finish(next, false)
      return
    }

    const next = floodReveal(working, index)
    const safeRevealed = next.filter((cell) => !cell.mine && cell.revealed).length
    setBoard(next)

    if (safeRevealed === SIZE * SIZE - MINES) finish(next, true)
  }

  function toggleFlag(index) {
    if (status !== 'playing') return
    setBoard((current) =>
      current.map((cell) =>
        cell.index === index && !cell.revealed
          ? { ...cell, flagged: !cell.flagged }
          : cell,
      ),
    )
  }

  function interact(index) {
    if (flagMode) toggleFlag(index)
    else reveal(index)
  }

  const flags = board.filter((cell) => cell.flagged).length

  return (
    <div className="game-panel mine-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">MINES</span><strong>{Math.max(0, MINES - flags)}</strong></div>
          <div><span className="micro">TIME</span><strong>{seconds}s</strong></div>
        </div>
        <div className="toolbar-actions">
          <button
            className={`secondary-btn ${flagMode ? 'active' : ''}`}
            onClick={() => setFlagMode((value) => !value)}
          >
            {flagMode ? '⚑ Flagging' : '⚐ Flag mode'}
          </button>
          <button className="secondary-btn" onClick={reset}>Restart</button>
        </div>
      </div>

      <div className="mine-board" aria-label="Minesweeper board">
        {board.map((cell) => (
          <button
            key={cell.index}
            className={`mine-cell ${cell.revealed ? 'revealed' : ''} ${cell.mine && cell.revealed ? 'mine' : ''} n${cell.count}`}
            onClick={() => interact(cell.index)}
            onContextMenu={(event) => {
              event.preventDefault()
              toggleFlag(cell.index)
            }}
            aria-label={cell.revealed ? (cell.mine ? 'Mine' : `${cell.count} nearby mines`) : cell.flagged ? 'Flagged cell' : 'Hidden cell'}
          >
            {cell.flagged && !cell.revealed ? '⚑' : ''}
            {cell.revealed && cell.mine ? '✦' : ''}
            {cell.revealed && !cell.mine && cell.count > 0 ? cell.count : ''}
          </button>
        ))}
      </div>

      <div className={`game-message ${status}`}>
        {status === 'won' && `Field cleared in ${seconds} seconds.`}
        {status === 'lost' && 'Mine found. Technically, the detector worked.'}
        {status === 'playing' && (started ? 'Left click to reveal. Right click or Flag mode to mark.' : 'Your first click is always safe.')}
      </div>
    </div>
  )
}
