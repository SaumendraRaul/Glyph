import { useEffect, useRef, useState } from 'react'

const SIZE = 18
const TARGET = 12
const START = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
]

const VECTORS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }

function foodPosition(snake) {
  const used = new Set(snake.map((part) => `${part.x},${part.y}`))
  const open = []
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!used.has(`${x},${y}`)) open.push({ x, y })
    }
  }
  return open[Math.floor(Math.random() * open.length)]
}

export default function Snake({ onComplete }) {
  const [snake, setSnake] = useState(START)
  const [food, setFood] = useState(() => foodPosition(START))
  const [direction, setDirection] = useState('RIGHT')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('playing')
  const [score, setScore] = useState(0)
  const directionRef = useRef('RIGHT')
  const touchStart = useRef(null)
  const completed = useRef(false)

  function reset() {
    setSnake(START)
    setFood(foodPosition(START))
    setDirection('RIGHT')
    directionRef.current = 'RIGHT'
    setRunning(false)
    setStatus('playing')
    setScore(0)
    completed.current = false
  }

  function finish(won, finalScore) {
    if (completed.current) return
    completed.current = true
    setRunning(false)
    setStatus(won ? 'won' : 'lost')
    onComplete({
      won,
      score: finalScore,
      lowerIsBetter: false,
      bonusXp: won ? 35 : 0,
    })
  }

  function steer(next) {
    if (status !== 'playing') return
    if (OPPOSITE[directionRef.current] === next) return
    directionRef.current = next
    setDirection(next)
    setRunning(true)
  }

  useEffect(() => {
    function onKeyDown(event) {
      const map = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      }
      const next = map[event.key]
      if (!next) return
      event.preventDefault()
      steer(next)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  useEffect(() => {
    if (!running || status !== 'playing') return undefined
    const speed = Math.max(82, 150 - score * 4)

    const timer = window.setInterval(() => {
      setSnake((current) => {
        const vector = VECTORS[directionRef.current]
        const head = current[0]
        const nextHead = { x: head.x + vector.x, y: head.y + vector.y }
        const hitWall = nextHead.x < 0 || nextHead.x >= SIZE || nextHead.y < 0 || nextHead.y >= SIZE
        const hitSelf = current.some((part, index) => index > 0 && part.x === nextHead.x && part.y === nextHead.y)

        if (hitWall || hitSelf) {
          finish(false, score)
          return current
        }

        const ate = nextHead.x === food.x && nextHead.y === food.y
        const next = [nextHead, ...current]
        if (!ate) next.pop()

        if (ate) {
          const nextScore = score + 1
          setScore(nextScore)
          if (nextScore >= TARGET) {
            finish(true, nextScore)
          } else {
            setFood(foodPosition(next))
          }
        }

        return next
      })
    }, speed)

    return () => window.clearInterval(timer)
  }, [running, status, score, food])

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
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? 'RIGHT' : 'LEFT')
    else steer(dy > 0 ? 'DOWN' : 'UP')
  }

  const snakeMap = new Map(snake.map((part, index) => [`${part.x},${part.y}`, index]))

  return (
    <div className="game-panel snake-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">FOOD</span><strong>{score}/{TARGET}</strong></div>
          <div><span className="micro">SPEED</span><strong>{Math.max(1, Math.round((150 - Math.max(82, 150 - score * 4)) / 10) + 1)}</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>Restart</button>
      </div>

      <div className="snake-board" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-label="Snake board">
        {Array.from({ length: SIZE * SIZE }, (_, index) => {
          const x = index % SIZE
          const y = Math.floor(index / SIZE)
          const bodyIndex = snakeMap.get(`${x},${y}`)
          const isFood = food.x === x && food.y === y
          return (
            <span
              className={`snake-cell ${bodyIndex === 0 ? 'snake-head' : bodyIndex != null ? 'snake-body' : ''} ${isFood ? 'snake-food' : ''}`}
              key={index}
            />
          )
        })}
      </div>

      <div className="direction-pad" aria-label="Snake controls">
        <button onClick={() => steer('UP')} aria-label="Move up">↑</button>
        <div>
          <button onClick={() => steer('LEFT')} aria-label="Move left">←</button>
          <button onClick={() => steer('DOWN')} aria-label="Move down">↓</button>
          <button onClick={() => steer('RIGHT')} aria-label="Move right">→</button>
        </div>
      </div>

      <div className={`game-message ${status}`}>
        {status === 'won' && 'Twelve snacks acquired. Serpent promoted.'}
        {status === 'lost' && `Run ended at ${score} food.`}
        {status === 'playing' && (running ? 'Swipe or use arrows. Do not eat yourself.' : 'Press an arrow, WASD, or swipe to start.')}
      </div>
    </div>
  )
}
