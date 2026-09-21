import { useEffect, useMemo, useRef, useState } from 'react'

const SIZE = 4
const TARGETS = [1024, 2048, 4096]
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
  const empty = board
    .map((value, index) => (value === 0 ? index : -1))
    .filter((index) => index >= 0)

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

      if (
        col < SIZE - 1 &&
        value === board[row * SIZE + col + 1]
      ) return true

      if (
        row < SIZE - 1 &&
        value === board[(row + 1) * SIZE + col]
      ) return true
    }
  }

  return false
}

export default function Game2048({ onComplete }) {
  const [target, setTarget] = useState(2048)
  const [board, setBoard] = useState(freshBoard)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing')
  const [message, setMessage] = useState('Join equal tiles. Reach 2048.')
  const [history, setHistory] = useState([])
  const [undosUsed, setUndosUsed] = useState(0)
  const [targetReached, setTargetReached] = useState(false)

  const touchStart = useRef(null)
  const reported = useRef(false)

  const highest = useMemo(() => Math.max(...board), [board])

  function reset(nextTarget = target) {
    setTarget(nextTarget)
    setBoard(freshBoard())
    setScore(0)
    setStatus('playing')
    setMessage(`Join equal tiles. Reach ${nextTarget}.`)
    setHistory([])
    setUndosUsed(0)
    setTargetReached(false)
    reported.current = false
  }

  function changeTarget(nextTarget) {
    reset(nextTarget)
  }

  function reportWin(finalScore) {
    if (reported.current) return
    reported.current = true

    onComplete({
      won: true,
      score: finalScore,
      lowerIsBetter: false,
      bonusXp: Math.min(
        40,
        Math.floor(finalScore / 500) +
          (target === 4096 ? 12 : target === 2048 ? 6 : 0),
      ),
    })
  }

  function reportLoss() {
    if (reported.current) return
    reported.current = true
    onComplete({ won: false })
  }

  function move(direction) {
    if (status !== 'playing') return

    const result = moveBoard(board, direction)
    if (sameBoard(board, result.board)) return

    setHistory((current) => [
      ...current,
      { board: [...board], score },
    ].slice(-3))

    const spawned = randomTile(result.board)
    const nextScore = score + result.gained

    setBoard(spawned)
    setScore(nextScore)

    const reached = spawned.some((value) => value >= target)

    if (reached && !targetReached) {
      setTargetReached(true)
      setStatus('won')
      setMessage(`${target} reached. Continue if the number soup still looks appetizing.`)
      reportWin(nextScore)
      return
    }

    if (!canMove(spawned)) {
      setStatus('lost')
      setMessage(
        targetReached
          ? `Run ended at ${nextScore.toLocaleString()} points.`
          : 'No moves left. The grid has won.',
      )
      if (!targetReached) reportLoss()
    }
  }

  function undo() {
    if (status !== 'playing' || !history.length || undosUsed >= 3) return

    const previous = history[history.length - 1]
    setBoard(previous.board)
    setScore(previous.score)
    setHistory((current) => current.slice(0, -1))
    setUndosUsed((value) => value + 1)
    setMessage(`Undo used · ${2 - undosUsed} remaining.`)
  }

  function continueRun() {
    if (status !== 'won') return
    setStatus('playing')
    setMessage(`Target cleared. Endless run active · highest tile ${highest}.`)
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

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'z'
      ) {
        event.preventDefault()
        undo()
        return
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

    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 'RIGHT' : 'LEFT')
    } else {
      move(dy > 0 ? 'DOWN' : 'UP')
    }
  }

  return (
    <div className="game-panel game2048-panel">
      <div className="game2048-settings">
        <div>
          <span className="micro">TARGET TILE</span>
          <div className="filter-chips">
            {TARGETS.map((value) => (
              <button
                className={`filter-chip ${target === value ? 'active' : ''}`}
                onClick={() => changeTarget(value)}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <button
          className="game2048-undo"
          onClick={undo}
          disabled={status !== 'playing' || !history.length || undosUsed >= 3}
        >
          <span>UNDO</span>
          <small>{3 - undosUsed} left · Ctrl/Cmd+Z</small>
        </button>
      </div>

      <div className="game-toolbar">
        <div className="mine-stats">
          <div>
            <span className="micro">SCORE</span>
            <strong>{score.toLocaleString()}</strong>
          </div>
          <div>
            <span className="micro">BEST TILE</span>
            <strong>{highest}</strong>
          </div>
          <div>
            <span className="micro">TARGET</span>
            <strong>{target}</strong>
          </div>
        </div>

        <button className="secondary-btn" onClick={() => reset()}>
          New game
        </button>
      </div>

      <div
        className="board2048"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label="2048 board"
      >
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

      {status === 'won' && (
        <button className="primary-btn game2048-continue" onClick={continueRun}>
          Continue endless
          <span>→</span>
        </button>
      )}

      <div className={`game-message ${status}`}>{message}</div>
    </div>
  )
}
