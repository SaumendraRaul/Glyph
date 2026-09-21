import { useEffect, useRef, useState } from 'react'

const SIZE = 18
const START = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
]

const SPEEDS = {
  CHILL: { base: 185, floor: 120, bonus: 0 },
  CLASSIC: { base: 145, floor: 85, bonus: 5 },
  TURBO: { base: 108, floor: 66, bonus: 10 },
}

const GOALS = [8, 12, 20]

const VECTORS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

function pointKey(point) {
  return `${point.x},${point.y}`
}

function generateObstacles(enabled) {
  if (!enabled) return []

  const blocked = new Set(START.map(pointKey))
  const safeZone = new Set()

  for (let y = 6; y <= 12; y += 1) {
    for (let x = 4; x <= 12; x += 1) {
      safeZone.add(`${x},${y}`)
    }
  }

  const candidates = []

  for (let y = 1; y < SIZE - 1; y += 1) {
    for (let x = 1; x < SIZE - 1; x += 1) {
      const key = `${x},${y}`
      if (!blocked.has(key) && !safeZone.has(key)) {
        candidates.push({ x, y })
      }
    }
  }

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  return candidates.slice(0, 14)
}

function foodPosition(snake, obstacles) {
  const used = new Set([
    ...snake.map(pointKey),
    ...obstacles.map(pointKey),
  ])

  const open = []

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!used.has(`${x},${y}`)) open.push({ x, y })
    }
  }

  return open[Math.floor(Math.random() * open.length)] || { x: 0, y: 0 }
}

export default function Snake({ onComplete }) {
  const [speedMode, setSpeedMode] = useState('CLASSIC')
  const [wrapWalls, setWrapWalls] = useState(false)
  const [obstaclesOn, setObstaclesOn] = useState(false)
  const [goal, setGoal] = useState(12)

  const [obstacles, setObstacles] = useState([])
  const [snake, setSnake] = useState(START)
  const [food, setFood] = useState(() => foodPosition(START, []))
  const [direction, setDirection] = useState('RIGHT')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('playing')
  const [score, setScore] = useState(0)

  const directionRef = useRef('RIGHT')
  const touchStart = useRef(null)
  const completed = useRef(false)

  function reset(options = {}) {
    const nextSpeed = options.speedMode ?? speedMode
    const nextWrap = options.wrapWalls ?? wrapWalls
    const nextObstaclesOn = options.obstaclesOn ?? obstaclesOn
    const nextGoal = options.goal ?? goal
    const nextObstacles = generateObstacles(nextObstaclesOn)

    setSpeedMode(nextSpeed)
    setWrapWalls(nextWrap)
    setObstaclesOn(nextObstaclesOn)
    setGoal(nextGoal)
    setObstacles(nextObstacles)
    setSnake(START)
    setFood(foodPosition(START, nextObstacles))
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

    const difficultyBonus =
      SPEEDS[speedMode].bonus +
      (wrapWalls ? 0 : 4) +
      (obstaclesOn ? 8 : 0) +
      (goal === 20 ? 8 : goal === 12 ? 4 : 0)

    onComplete({
      won,
      score: finalScore,
      lowerIsBetter: false,
      bonusXp: won ? Math.min(40, 18 + difficultyBonus) : 0,
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

    const speedConfig = SPEEDS[speedMode]
    const speed = Math.max(
      speedConfig.floor,
      speedConfig.base - score * 4,
    )

    const timer = window.setInterval(() => {
      setSnake((current) => {
        const vector = VECTORS[directionRef.current]
        const head = current[0]

        let nextHead = {
          x: head.x + vector.x,
          y: head.y + vector.y,
        }

        const outside =
          nextHead.x < 0 ||
          nextHead.x >= SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= SIZE

        if (outside && wrapWalls) {
          nextHead = {
            x: (nextHead.x + SIZE) % SIZE,
            y: (nextHead.y + SIZE) % SIZE,
          }
        }

        if (outside && !wrapWalls) {
          finish(false, score)
          return current
        }

        const ate =
          nextHead.x === food.x &&
          nextHead.y === food.y

        const collisionBody = ate
          ? current
          : current.slice(0, -1)

        const hitSelf = collisionBody.some(
          (part) =>
            part.x === nextHead.x &&
            part.y === nextHead.y,
        )

        const hitObstacle = obstacles.some(
          (block) =>
            block.x === nextHead.x &&
            block.y === nextHead.y,
        )

        if (hitSelf || hitObstacle) {
          finish(false, score)
          return current
        }

        const next = [nextHead, ...current]

        if (!ate) next.pop()

        if (ate) {
          const nextScore = score + 1
          setScore(nextScore)

          if (nextScore >= goal) {
            finish(true, nextScore)
          } else {
            setFood(foodPosition(next, obstacles))
          }
        }

        return next
      })
    }, speed)

    return () => window.clearInterval(timer)
  }, [
    running,
    status,
    score,
    food,
    speedMode,
    wrapWalls,
    obstaclesOn,
    obstacles,
    goal,
  ])

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

    if (Math.abs(dx) > Math.abs(dy)) {
      steer(dx > 0 ? 'RIGHT' : 'LEFT')
    } else {
      steer(dy > 0 ? 'DOWN' : 'UP')
    }
  }

  const snakeMap = new Map(
    snake.map((part, index) => [pointKey(part), index]),
  )
  const obstacleMap = new Set(obstacles.map(pointKey))
  const speedConfig = SPEEDS[speedMode]
  const currentDelay = Math.max(
    speedConfig.floor,
    speedConfig.base - score * 4,
  )

  return (
    <div className="game-panel snake-panel">
      <div className="snake-settings">
        <div>
          <span className="micro">SPEED</span>
          <div className="filter-chips">
            {Object.keys(SPEEDS).map((item) => (
              <button
                className={`filter-chip ${speedMode === item ? 'active' : ''}`}
                onClick={() => reset({ speedMode: item })}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="micro">GOAL</span>
          <div className="filter-chips">
            {GOALS.map((value) => (
              <button
                className={`filter-chip ${goal === value ? 'active' : ''}`}
                onClick={() => reset({ goal: value })}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="snake-rule-toggles">
          <button
            className={wrapWalls ? 'active' : ''}
            onClick={() => reset({ wrapWalls: !wrapWalls })}
          >
            <span>WALLS</span>
            <strong>{wrapWalls ? 'WRAP' : 'SOLID'}</strong>
          </button>

          <button
            className={obstaclesOn ? 'active danger' : ''}
            onClick={() => reset({ obstaclesOn: !obstaclesOn })}
          >
            <span>OBSTACLES</span>
            <strong>{obstaclesOn ? 'ON' : 'OFF'}</strong>
          </button>
        </div>
      </div>

      <div className="game-toolbar">
        <div className="mine-stats">
          <div>
            <span className="micro">FOOD</span>
            <strong>{score}/{goal}</strong>
          </div>
          <div>
            <span className="micro">TICK</span>
            <strong>{currentDelay}ms</strong>
          </div>
          <div>
            <span className="micro">RULESET</span>
            <strong>
              {wrapWalls ? 'WRAP' : 'WALL'}{obstaclesOn ? ' + BLOCKS' : ''}
            </strong>
          </div>
        </div>

        <button className="secondary-btn" onClick={() => reset()}>
          Restart
        </button>
      </div>

      <div
        className="snake-board"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label="Snake board"
      >
        {Array.from({ length: SIZE * SIZE }, (_, index) => {
          const x = index % SIZE
          const y = Math.floor(index / SIZE)
          const key = `${x},${y}`
          const bodyIndex = snakeMap.get(key)
          const isFood = food.x === x && food.y === y
          const isObstacle = obstacleMap.has(key)

          return (
            <span
              className={[
                'snake-cell',
                bodyIndex === 0
                  ? 'snake-head'
                  : bodyIndex != null
                    ? 'snake-body'
                    : '',
                isFood ? 'snake-food' : '',
                isObstacle ? 'snake-obstacle' : '',
              ].filter(Boolean).join(' ')}
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
        {status === 'won' && `${goal} snacks acquired on ${speedMode.toLowerCase()} speed.`}
        {status === 'lost' && `Run ended at ${score} food.`}
        {status === 'playing' && (
          running
            ? `${wrapWalls ? 'Walls wrap.' : 'Walls kill.'} ${obstaclesOn ? 'Avoid the blocks too.' : 'Do not eat yourself.'}`
            : 'Press an arrow, WASD, or swipe to start.'
        )}
      </div>
    </div>
  )
}
