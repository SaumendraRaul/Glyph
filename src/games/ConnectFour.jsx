import { useMemo, useState } from 'react'

const ROWS = 6
const COLS = 7
const EMPTY = 0
const PLAYER = 1
const CPU = 2

function newBoard() {
  return Array(ROWS * COLS).fill(EMPTY)
}

function at(board, row, col) {
  return board[row * COLS + col]
}

function availableColumns(board) {
  return Array.from({ length: COLS }, (_, col) => col).filter((col) => at(board, 0, col) === EMPTY)
}

function drop(board, col, piece) {
  const next = [...board]
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    const index = row * COLS + col
    if (next[index] === EMPTY) {
      next[index] = piece
      return { board: next, row }
    }
  }
  return null
}

function winner(board, piece) {
  const directions = [[0,1],[1,0],[1,1],[1,-1]]
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (at(board, row, col) !== piece) continue
      for (const [dr, dc] of directions) {
        const cells = []
        let ok = true
        for (let i = 0; i < 4; i += 1) {
          const r = row + dr * i
          const c = col + dc * i
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS || at(board, r, c) !== piece) {
            ok = false
            break
          }
          cells.push(r * COLS + c)
        }
        if (ok) return cells
      }
    }
  }
  return null
}

function scoreWindow(values) {
  const cpu = values.filter((v) => v === CPU).length
  const player = values.filter((v) => v === PLAYER).length
  const empty = values.filter((v) => v === EMPTY).length
  if (cpu === 4) return 100000
  if (player === 4) return -100000
  let score = 0
  if (cpu === 3 && empty === 1) score += 110
  if (cpu === 2 && empty === 2) score += 14
  if (player === 3 && empty === 1) score -= 135
  if (player === 2 && empty === 2) score -= 10
  return score
}

function evaluate(board) {
  let score = 0
  for (let row = 0; row < ROWS; row += 1) {
    if (at(board, row, 3) === CPU) score += 7
    if (at(board, row, 3) === PLAYER) score -= 7
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      score += scoreWindow([0,1,2,3].map((i) => at(board, row, col + i)))
    }
  }
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      score += scoreWindow([0,1,2,3].map((i) => at(board, row + i, col)))
    }
  }
  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      score += scoreWindow([0,1,2,3].map((i) => at(board, row + i, col + i)))
    }
  }
  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let col = 3; col < COLS; col += 1) {
      score += scoreWindow([0,1,2,3].map((i) => at(board, row + i, col - i)))
    }
  }
  return score
}

function minimax(board, depth, alpha, beta, maximizing) {
  const cpuWin = winner(board, CPU)
  const playerWin = winner(board, PLAYER)
  const options = availableColumns(board)

  if (cpuWin) return { score: 1000000 + depth }
  if (playerWin) return { score: -1000000 - depth }
  if (!depth || !options.length) return { score: evaluate(board) }

  const ordered = [3,2,4,1,5,0,6].filter((col) => options.includes(col))

  if (maximizing) {
    let best = { score: -Infinity, col: ordered[0] }
    for (const col of ordered) {
      const result = drop(board, col, CPU)
      const score = minimax(result.board, depth - 1, alpha, beta, false).score
      if (score > best.score) best = { score, col }
      alpha = Math.max(alpha, score)
      if (alpha >= beta) break
    }
    return best
  }

  let best = { score: Infinity, col: ordered[0] }
  for (const col of ordered) {
    const result = drop(board, col, PLAYER)
    const score = minimax(result.board, depth - 1, alpha, beta, true).score
    if (score < best.score) best = { score, col }
    beta = Math.min(beta, score)
    if (alpha >= beta) break
  }
  return best
}

function aiMove(board, difficulty) {
  const options = availableColumns(board)
  if (!options.length) return null

  // Never ignore an immediate win or block.
  for (const piece of [CPU, PLAYER]) {
    for (const col of options) {
      const result = drop(board, col, piece)
      if (winner(result.board, piece)) return col
    }
  }

  if (difficulty === 'EASY') {
    return options[Math.floor(Math.random() * options.length)]
  }

  const depth = difficulty === 'HARD' ? 5 : 3
  return minimax(board, depth, -Infinity, Infinity, true).col
}

export default function ConnectFour({ onComplete }) {
  const [board, setBoard] = useState(newBoard)
  const [mode, setMode] = useState('AI')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [turn, setTurn] = useState(PLAYER)
  const [status, setStatus] = useState('playing')
  const [moves, setMoves] = useState(0)
  const [winningCells, setWinningCells] = useState([])
  const [thinking, setThinking] = useState(false)

  const filled = useMemo(() => board.filter(Boolean).length, [board])

  function reset() {
    setBoard(newBoard())
    setTurn(PLAYER)
    setStatus('playing')
    setMoves(0)
    setWinningCells([])
    setThinking(false)
  }

  function finish(nextBoard, piece, nextMoves) {
    const line = winner(nextBoard, piece)
    if (!line) return false
    setWinningCells(line)
    const won = mode === 'AI' ? piece === PLAYER : true
    setStatus(piece === PLAYER ? 'won' : 'lost')
    onComplete({
      won,
      score: nextMoves,
      lowerIsBetter: true,
      bonusXp: mode === 'AI' && piece === PLAYER ? (difficulty === 'HARD' ? 40 : difficulty === 'MEDIUM' ? 24 : 10) : 0,
    })
    return true
  }

  function playColumn(col) {
    if (status !== 'playing' || thinking) return
    const piece = mode === 'LOCAL' ? turn : PLAYER
    const result = drop(board, col, piece)
    if (!result) return

    const nextMoves = moves + 1
    setBoard(result.board)
    setMoves(nextMoves)

    if (finish(result.board, piece, nextMoves)) return

    if (!availableColumns(result.board).length) {
      setStatus('draw')
      onComplete({ won: false, score: nextMoves, lowerIsBetter: true })
      return
    }

    if (mode === 'LOCAL') {
      setTurn(piece === PLAYER ? CPU : PLAYER)
      return
    }

    setThinking(true)
    window.setTimeout(() => {
      const colChoice = aiMove(result.board, difficulty)
      if (colChoice == null) {
        setThinking(false)
        return
      }
      const cpuResult = drop(result.board, colChoice, CPU)
      const cpuMoves = nextMoves + 1
      setBoard(cpuResult.board)
      setMoves(cpuMoves)
      setThinking(false)

      if (finish(cpuResult.board, CPU, cpuMoves)) return

      if (!availableColumns(cpuResult.board).length) {
        setStatus('draw')
        onComplete({ won: false, score: cpuMoves, lowerIsBetter: true })
      }
    }, difficulty === 'HARD' ? 260 : 170)
  }

  return (
    <div className="game-panel connect4-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">MOVES</span><strong>{filled}</strong></div>
          <div><span className="micro">TURN</span><strong>{thinking ? 'AI…' : mode === 'LOCAL' ? (turn === PLAYER ? 'P1' : 'P2') : 'YOU'}</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>Restart</button>
      </div>

      <div className="connect-controls">
        <div className="filter-chips">
          {['AI','LOCAL'].map((item) => (
            <button className={`filter-chip ${mode === item ? 'active' : ''}`} onClick={() => { setMode(item); reset() }} key={item}>
              {item === 'AI' ? 'VS AI' : '2 PLAYER'}
            </button>
          ))}
        </div>
        {mode === 'AI' && (
          <div className="filter-chips">
            {['EASY','MEDIUM','HARD'].map((item) => (
              <button className={`filter-chip ${difficulty === item ? 'active' : ''}`} onClick={() => { setDifficulty(item); reset() }} key={item}>{item}</button>
            ))}
          </div>
        )}
      </div>

      <div className="connect-board" role="grid" aria-label="Connect Four board">
        {Array.from({ length: COLS }, (_, col) => (
          <button className="connect-drop" onClick={() => playColumn(col)} disabled={status !== 'playing' || thinking || at(board,0,col) !== EMPTY} key={`drop-${col}`} aria-label={`Drop in column ${col + 1}`}>↓</button>
        ))}
        {board.map((piece, index) => (
          <button
            className={`connect-cell p${piece} ${winningCells.includes(index) ? 'winner' : ''}`}
            onClick={() => playColumn(index % COLS)}
            disabled={status !== 'playing' || thinking}
            key={index}
            aria-label={piece === PLAYER ? 'Player one piece' : piece === CPU ? 'Player two piece' : 'Empty cell'}
          >
            <span />
          </button>
        ))}
      </div>

      <div className={`game-message ${status === 'draw' ? '' : status}`}>
        {status === 'playing' && (thinking ? 'The machine is plotting. Naturally.' : 'Connect four horizontally, vertically, or diagonally.')}
        {status === 'won' && (mode === 'AI' ? 'You connected four before the machine did.' : 'Player 1 connects four.')}
        {status === 'lost' && (mode === 'AI' ? 'AI connects four. The silicon gloats silently.' : 'Player 2 connects four.')}
        {status === 'draw' && 'Board full. Mutual stubbornness achieved.'}
      </div>
    </div>
  )
}
