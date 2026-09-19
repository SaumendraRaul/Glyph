import { useEffect, useMemo, useRef, useState } from 'react'

const ROUNDS = 5

export default function ReactionTest({ onComplete }) {
  const [phase, setPhase] = useState('idle')
  const [times, setTimes] = useState([])
  const [message, setMessage] = useState('Five rounds. Tap only when the signal turns live.')
  const timerRef = useRef(null)
  const startedAt = useRef(0)
  const completed = useRef(false)

  const average = useMemo(() => {
    if (!times.length) return null
    return Math.round(times.reduce((sum, value) => sum + value, 0) / times.length)
  }, [times])

  function clearTimer() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => clearTimer, [])

  function armRound() {
    clearTimer()
    setPhase('waiting')
    setMessage('Wait for it…')
    const delay = 1200 + Math.random() * 1800
    timerRef.current = window.setTimeout(() => {
      startedAt.current = performance.now()
      setPhase('live')
      setMessage('NOW')
    }, delay)
  }

  function reset() {
    clearTimer()
    setPhase('idle')
    setTimes([])
    setMessage('Five rounds. Tap only when the signal turns live.')
    completed.current = false
  }

  function start() {
    if (phase !== 'idle' && phase !== 'result') return
    armRound()
  }

  function tapZone() {
    if (phase === 'idle' || phase === 'result' || phase === 'done') return

    if (phase === 'waiting') {
      clearTimer()
      setPhase('false')
      setMessage('Too early. The photons had not even arrived yet.')
      return
    }

    if (phase === 'false') {
      armRound()
      return
    }

    if (phase === 'live') {
      const reaction = Math.max(1, Math.round(performance.now() - startedAt.current))
      const next = [...times, reaction]
      setTimes(next)

      if (next.length >= ROUNDS) {
        const finalAverage = Math.round(next.reduce((sum, value) => sum + value, 0) / next.length)
        setPhase('done')
        setMessage(`Average: ${finalAverage} ms`)
        if (!completed.current) {
          completed.current = true
          onComplete({
            won: true,
            score: finalAverage,
            lowerIsBetter: true,
            bonusXp: finalAverage < 250 ? 40 : finalAverage < 320 ? 28 : finalAverage < 400 ? 16 : 8,
          })
        }
      } else {
        setPhase('result')
        setMessage(`${reaction} ms · Round ${next.length}/${ROUNDS}`)
      }
    }
  }

  function nextRound() {
    if (phase !== 'result') return
    armRound()
  }

  return (
    <div className="game-panel reaction-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">ROUND</span><strong>{Math.min(times.length + 1, ROUNDS)}/{ROUNDS}</strong></div>
          <div><span className="micro">AVERAGE</span><strong>{average == null ? '—' : `${average}ms`}</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>Reset</button>
      </div>

      <button
        className={`reaction-zone ${phase}`}
        onClick={phase === 'result' ? nextRound : phase === 'idle' ? start : tapZone}
        type="button"
      >
        <span className="reaction-symbol" aria-hidden="true">
          {phase === 'live' ? '●' : phase === 'waiting' ? '○' : phase === 'false' ? '×' : phase === 'done' ? '✓' : '◎'}
        </span>
        <strong>
          {phase === 'idle' && 'Start test'}
          {phase === 'waiting' && 'Wait…'}
          {phase === 'live' && 'TAP!'}
          {phase === 'false' && 'Too early · tap to retry'}
          {phase === 'result' && 'Next round'}
          {phase === 'done' && 'Complete'}
        </strong>
        <small>{message}</small>
      </button>

      <div className="reaction-history">
        {Array.from({ length: ROUNDS }, (_, index) => (
          <div className={times[index] != null ? 'filled' : ''} key={index}>
            <span>R{index + 1}</span>
            <strong>{times[index] != null ? `${times[index]} ms` : '—'}</strong>
          </div>
        ))}
      </div>

      <div className={`game-message ${phase === 'done' ? 'won' : ''}`}>
        {phase === 'done' ? 'Five clean samples recorded.' : 'False starts do not count as rounds.'}
      </div>
    </div>
  )
}
