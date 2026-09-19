import { useEffect, useMemo, useRef, useState } from 'react'

const SIZE = 4
const TARGET = 2048
const DIRECTIONS = {
  LEFT: [0, 1, 2, 3],
  RIGHT: [3, 2, 1, 0],
  UP: [0, 1, 2, 3],
  DOWN: [3, 2, 1, 0],
}

function emptyBoard() {
  return Array(SIZE * SIZE).fill(0)
}

function randomTile(board) {
  const empty = board.map((value, index) => (value === 0 ? index : -1)).filter((index) => index >= 0)
  if (!empty.length) return board
  const next = [...board]
  const index = empty[Math.floor(Math.random() * empty.length)]
  next[index] = Math.random() < 0.9 ? 2 : 4
  return next
}

function freshBoard() {
  return randomTile(randomTile(emptyBoard()))
}

function collapse(line) {
  const values = line.filter(Boolean)
  const merged = []
  let gained = 0

  for (let i = 0; i < values.length; i += 1) {
    if (values[i] === values[i + 1]) {
      const value = values[i] * 2
      merged.push(value)
      gained += value
      i += 1
    } else {
      merged.push(values[i])
    }
  }

  while (merged.length < SIZE) merged.push(0)
  return { line: merged, gained }
}

function moveBoard(board, direction) {
  const next = [...board]
  let gained = 0

  if (direction === 'LEFT' || direction === 'RIGHT') {
    for (let row = 0; row < SIZE; row += 1) {
      const order = DIRECTIONS[direction]
      const source = order.map((col) => board[row * SIZE + col])
      const result = collapse(source)
      gained += result.gained
      order.forEach((col, index) => {
        next[row * SIZE + col] = result.line[index]
      })
    }
  } else {
    for (let col = 0; col < SIZE; col += 1) {
      const order = DIRECTIONS[direction]
      const source = order.map((row) => board[row * SIZE + col])
      const result = collapse(source)
      gained += result.gained
      order.forEach((row, index) => {
        next[row * SIZE + col] = result.line[index]
      })
    }
  }

  return { board: next, gained }
}

function sameBoard(a, b) {
  return a.every((value, index) => value === b[index])
}

function canMove(board) {
  if (board.includes(0)) return true
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = board[row * SIZE + col]
      if (col < SIZE - 1 && value === board[row * SIZE + col + 1]) return true
      if (row < SIZE - 1 && value === board[(row + 1) * SIZE + col]) return true
    }
  }
  return false
}

export default function Game2048({ onComplete }) {
  const [board, setBoard] = useState(freshBoard)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState('Join equal tiles. Reach 2048.')
  const touchStart = useRef(null)
  const completed = useRef(false)

  const highest = useMemo(() => Math.max(...board), [board])

  function reset() {
    setBoard(freshBoard())
    setScore(0)
    setStatus('playing')
    setMessage('Join equal tiles. Reach 2048.')
    completed.current = false
  }

  function finish(won, finalScore) {
    if (completed.current) return
    completed.current = true
    setStatus(won ? 'won' : 'lost')
    setMessage(won ? '2048 reached. Number soup conquered.' : 'No moves left. The grid has won.')
    onComplete({
      won,
      score: finalScore,
      lowerIsBetter: false,
      bonusXp: won ? Math.min(40, Math.floor(finalScore / 500)) : 0,
    })
  }

  function move(direction) {
    if (status !== 'playing') return

    const result = moveBoard(board, direction)
    if (sameBoard(board, result.board)) return

    const spawned = randomTile(result.board)
    const nextScore = score + result.gained
    setBoard(spawned)
    setScore(nextScore)

    if (spawned.some((value) => value >= TARGET)) {
      finish(true, nextScore)
    } else if (!canMove(spawned)) {
      finish(false, nextScore)
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      const map = {
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
      }
      const direction = map[event.key]
      if (!direction) return
      event.preventDefault()
      move(direction)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function onTouchStart(event) {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd(event) {
    if (!touchStart.current) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = touch.clientY - touchStart.current.y
    touchStart.current = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return

    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'RIGHT' : 'LEFT')
    else move(dy > 0 ? 'DOWN' : 'UP')
  }

  return (
    <div className="game-panel game2048-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">SCORE</span><strong>{score.toLocaleString()}</strong></div>
          <div><span className="micro">BEST TILE</span><strong>{highest}</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>New game</button>
      </div>

      <div className="board2048" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-label="2048 board">
        {board.map((value, index) => (
          <div className={`tile2048 v${value || 0}`} key={index}>
            {value || ''}
          </div>
        ))}
      </div>

      <div className="direction-pad compact-pad" aria-label="2048 controls">
        <button onClick={() => move('UP')} aria-label="Move up">↑</button>
        <div>
          <button onClick={() => move('LEFT')} aria-label="Move left">←</button>
          <button onClick={() => move('DOWN')} aria-label="Move down">↓</button>
          <button onClick={() => move('RIGHT')} aria-label="Move right">→</button>
        </div>
      </div>

      <div className={`game-message ${status}`}>{message}</div>
    </div>
  )
}
