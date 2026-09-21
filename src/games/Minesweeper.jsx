import { useEffect, useRef, useState } from 'react'

const PRESETS = {
  EASY: { size: 9, mines: 10, label: '9×9 · 10 mines', bonus: 0 },
  MEDIUM: { size: 12, mines: 20, label: '12×12 · 20 mines', bonus: 6 },
  EXPERT: { size: 16, mines: 40, label: '16×16 · 40 mines', bonus: 12 },
}

function blankBoard(size) {
  return Array.from({ length: size * size }, (_, index) => ({
    index,
    mine: false,
    revealed: false,
    flagged: false,
    count: 0,
  }))
}

function neighbors(index, size) {
  const row = Math.floor(index / size)
  const col = index % size
  const result = []

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        result.push(nr * size + nc)
      }
    }
  }

  return result
}

function armBoard(safeIndex, size, mineCount) {
  const board = blankBoard(size)
  const forbidden = new Set([safeIndex, ...neighbors(safeIndex, size)])
  const choices = board
    .map((cell) => cell.index)
    .filter((index) => !forbidden.has(index))

  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }

  choices.slice(0, mineCount).forEach((index) => {
    board[index].mine = true
  })

  board.forEach((cell) => {
    if (!cell.mine) {
      cell.count = neighbors(cell.index, size)
        .filter((index) => board[index].mine).length
    }
  })

  return board
}

function floodReveal(board, start, size) {
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
      neighbors(index, size).forEach((neighbor) => {
        if (!visited.has(neighbor)) queue.push(neighbor)
      })
    }
  }

  return next
}

function revealAllMines(board) {
  return board.map((cell) => (
    cell.mine ? { ...cell, revealed: true } : cell
  ))
}

export default function Minesweeper({ onComplete }) {
  const [difficulty, setDifficulty] = useState('EASY')
  const preset = PRESETS[difficulty]
  const [board, setBoard] = useState(() => blankBoard(PRESETS.EASY.size))
  const [started, setStarted] = useState(false)
  const [status, setStatus] = useState('playing')
  const [seconds, setSeconds] = useState(0)
  const [flagMode, setFlagMode] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (started && status === 'playing') {
      timerRef.current = window.setInterval(
        () => setSeconds((value) => value + 1),
        1000,
      )
      return () => window.clearInterval(timerRef.current)
    }
    return undefined
  }, [started, status])

  function reset(nextDifficulty = difficulty) {
    const nextPreset = PRESETS[nextDifficulty]
    setDifficulty(nextDifficulty)
    setBoard(blankBoard(nextPreset.size))
    setStarted(false)
    setStatus('playing')
    setSeconds(0)
    setFlagMode(false)
  }

  function finish(next, won) {
    setStatus(won ? 'won' : 'lost')

    if (!won) {
      setBoard(revealAllMines(next))
      onComplete({ won: false })
      return
    }

    onComplete({
      won: true,
      score: seconds,
      lowerIsBetter: true,
      bonusXp: Math.min(
        40,
        Math.max(0, 34 - Math.floor(seconds / 8)) + preset.bonus,
      ),
    })
  }

  function checkWin(next) {
    const safeRevealed = next
      .filter((cell) => !cell.mine && cell.revealed)
      .length

    if (safeRevealed === preset.size * preset.size - preset.mines) {
      finish(next, true)
      return true
    }

    return false
  }

  function reveal(index, workingBoard = board) {
    if (status !== 'playing') return

    let working = workingBoard

    if (!started) {
      working = armBoard(index, preset.size, preset.mines)
      setStarted(true)
    }

    const target = working[index]
    if (target.flagged) return

    if (target.revealed) {
      chord(index, working)
      return
    }

    if (target.mine) {
      const next = working.map((cell) =>
        cell.index === index ? { ...cell, revealed: true } : cell,
      )
      finish(next, false)
      return
    }

    const next = floodReveal(working, index, preset.size)
    setBoard(next)
    checkWin(next)
  }

  function chord(index, workingBoard = board) {
    if (status !== 'playing') return
    const target = workingBoard[index]
    if (!target.revealed || target.count <= 0) return

    const around = neighbors(index, preset.size)
    const flags = around.filter((neighbor) => workingBoard[neighbor].flagged).length

    if (flags !== target.count) return

    let next = workingBoard.map((cell) => ({ ...cell }))

    for (const neighbor of around) {
      const cell = next[neighbor]
      if (cell.flagged || cell.revealed) continue

      if (cell.mine) {
        finish(revealAllMines(next), false)
        return
      }

      next = floodReveal(next, neighbor, preset.size)
    }

    setBoard(next)
    checkWin(next)
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
      <div className="mine-difficulty">
        <span className="micro">FIELD SIZE</span>
        <div className="filter-chips">
          {Object.entries(PRESETS).map(([key, item]) => (
            <button
              className={`filter-chip ${difficulty === key ? 'active' : ''}`}
              onClick={() => reset(key)}
              key={key}
            >
              <strong>{key}</strong>
              <small>{item.label}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="game-toolbar">
        <div className="mine-stats">
          <div>
            <span className="micro">MINES</span>
            <strong>{Math.max(0, preset.mines - flags)}</strong>
          </div>
          <div>
            <span className="micro">TIME</span>
            <strong>{seconds}s</strong>
          </div>
          <div>
            <span className="micro">FLAGS</span>
            <strong>{flags}/{preset.mines}</strong>
          </div>
        </div>

        <div className="toolbar-actions">
          <button
            className={`secondary-btn ${flagMode ? 'active-control' : ''}`}
            onClick={() => setFlagMode((value) => !value)}
          >
            {flagMode ? '⚑ Flagging' : '⚐ Flag mode'}
          </button>
          <button className="secondary-btn" onClick={() => reset()}>
            Restart
          </button>
        </div>
      </div>

      <div className="mine-scroll-shell">
        <div
          className={`mine-board mine-${difficulty.toLowerCase()}`}
          style={{ gridTemplateColumns: `repeat(${preset.size}, 1fr)` }}
          aria-label="Minesweeper board"
        >
          {board.map((cell) => (
            <button
              key={cell.index}
              className={`mine-cell ${cell.revealed ? 'revealed' : ''} ${cell.mine && cell.revealed ? 'mine' : ''} n${cell.count}`}
              onClick={() => interact(cell.index)}
              onDoubleClick={() => chord(cell.index)}
              onContextMenu={(event) => {
                event.preventDefault()
                toggleFlag(cell.index)
              }}
              aria-label={
                cell.revealed
                  ? cell.mine
                    ? 'Mine'
                    : `${cell.count} nearby mines`
                  : cell.flagged
                    ? 'Flagged cell'
                    : 'Hidden cell'
              }
            >
              {cell.flagged && !cell.revealed ? '⚑' : ''}
              {cell.revealed && cell.mine ? '✦' : ''}
              {cell.revealed && !cell.mine && cell.count > 0 ? cell.count : ''}
            </button>
          ))}
        </div>
      </div>

      <div className={`game-message ${status}`}>
        {status === 'won' && `${difficulty} field cleared in ${seconds} seconds.`}
        {status === 'lost' && 'Mine found. Technically, the detector worked.'}
        {status === 'playing' && (
          started
            ? 'Reveal cells, flag mines, or tap an open number after placing the matching flags to chord-clear its neighbors.'
            : 'Your first click and its surrounding cells are always safe.'
        )}
      </div>
    </div>
  )
}
