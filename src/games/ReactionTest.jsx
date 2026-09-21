import { useEffect, useMemo, useRef, useState } from 'react'

const ROUND_OPTIONS = [3, 5, 10]
const FALSE_START_PENALTY = 1000

export default function ReactionTest({ onComplete }) {
  const [rounds, setRounds] = useState(5)
  const [ruleMode, setRuleMode] = useState('CLASSIC')
  const [phase, setPhase] = useState('idle')
  const [times, setTimes] = useState([])
  const [falseStarts, setFalseStarts] = useState(0)
  const [message, setMessage] = useState('Five rounds. Tap only when the signal turns live.')

  const timerRef = useRef(null)
  const startedAt = useRef(0)
  const completed = useRef(false)

  const average = useMemo(() => {
    if (!times.length) return null
    return Math.round(
      times.reduce((sum, value) => sum + value, 0) / times.length,
    )
  }, [times])

  const best = times.length ? Math.min(...times) : null
  const worst = times.length ? Math.max(...times) : null
  const spread = best != null && worst != null ? worst - best : null

  function clearTimer() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => clearTimer, [])

  function modeMessage(nextRounds = rounds, nextRule = ruleMode) {
    const rule = nextRule === 'STRICT'
      ? 'False starts consume a round at 1000 ms.'
      : 'False starts can be retried.'
    return `${nextRounds} rounds. ${rule}`
  }

  function reset(nextRounds = rounds, nextRule = ruleMode) {
    clearTimer()
    setRounds(nextRounds)
    setRuleMode(nextRule)
    setPhase('idle')
    setTimes([])
    setFalseStarts(0)
    setMessage(modeMessage(nextRounds, nextRule))
    completed.current = false
  }

  function armRound() {
    clearTimer()
    setPhase('waiting')
    setMessage('Wait for it…')

    const delay = 1100 + Math.random() * 2100

    timerRef.current = window.setTimeout(() => {
      startedAt.current = performance.now()
      setPhase('live')
      setMessage('NOW')
    }, delay)
  }

  function finalize(nextTimes) {
    const finalAverage = Math.round(
      nextTimes.reduce((sum, value) => sum + value, 0) / nextTimes.length,
    )

    const cleanTimes = nextTimes.filter(
      (value) => value !== FALSE_START_PENALTY,
    )
    const cleanAverage = cleanTimes.length
      ? Math.round(
          cleanTimes.reduce((sum, value) => sum + value, 0) / cleanTimes.length,
        )
      : FALSE_START_PENALTY

    setPhase('done')
    setMessage(
      ruleMode === 'STRICT' && falseStarts
        ? `Average ${finalAverage} ms · clean taps ${cleanAverage} ms`
        : `Average: ${finalAverage} ms`,
    )

    if (!completed.current) {
      completed.current = true
      onComplete({
        won: true,
        score: finalAverage,
        lowerIsBetter: true,
        bonusXp: Math.min(
          40,
          (finalAverage < 250
            ? 34
            : finalAverage < 320
              ? 24
              : finalAverage < 400
                ? 14
                : 6) +
            (rounds === 10 ? 5 : 0) +
            (ruleMode === 'STRICT' ? 3 : 0),
        ),
      })
    }
  }

  function recordSample(value) {
    const next = [...times, value]
    setTimes(next)

    if (next.length >= rounds) {
      finalize(next)
    } else {
      setPhase('result')
      setMessage(
        value === FALSE_START_PENALTY
          ? `False start penalty · Round ${next.length}/${rounds}`
          : `${value} ms · Round ${next.length}/${rounds}`,
      )
    }
  }

  function start() {
    if (phase !== 'idle' && phase !== 'result') return
    armRound()
  }

  function tapZone() {
    if (phase === 'idle' || phase === 'result' || phase === 'done') return

    if (phase === 'waiting') {
      clearTimer()
      setFalseStarts((value) => value + 1)

      if (ruleMode === 'STRICT') {
        recordSample(FALSE_START_PENALTY)
      } else {
        setPhase('false')
        setMessage('Too early. The photons had not even arrived yet.')
      }
      return
    }

    if (phase === 'false') {
      armRound()
      return
    }

    if (phase === 'live') {
      const reaction = Math.max(
        1,
        Math.round(performance.now() - startedAt.current),
      )
      recordSample(reaction)
    }
  }

  function nextRound() {
    if (phase !== 'result') return
    armRound()
  }

  return (
    <div className="game-panel reaction-panel">
      <div className="reaction-settings">
        <div>
          <span className="micro">ROUNDS</span>
          <div className="filter-chips">
            {ROUND_OPTIONS.map((value) => (
              <button
                className={`filter-chip ${rounds === value ? 'active' : ''}`}
                onClick={() => reset(value, ruleMode)}
                disabled={phase === 'waiting' || phase === 'live'}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="micro">RULES</span>
          <div className="filter-chips">
            {['CLASSIC', 'STRICT'].map((value) => (
              <button
                className={`filter-chip ${ruleMode === value ? 'active' : ''}`}
                onClick={() => reset(rounds, value)}
                disabled={phase === 'waiting' || phase === 'live'}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="game-toolbar">
        <div className="mine-stats">
          <div>
            <span className="micro">ROUND</span>
            <strong>{Math.min(times.length + 1, rounds)}/{rounds}</strong>
          </div>
          <div>
            <span className="micro">AVERAGE</span>
            <strong>{average == null ? '—' : `${average}ms`}</strong>
          </div>
          <div>
            <span className="micro">FALSE STARTS</span>
            <strong>{falseStarts}</strong>
          </div>
        </div>

        <button className="secondary-btn" onClick={() => reset()}>
          Reset
        </button>
      </div>

      <button
        className={`reaction-zone ${phase}`}
        onClick={
          phase === 'result'
            ? nextRound
            : phase === 'idle'
              ? start
              : tapZone
        }
        type="button"
      >
        <span className="reaction-symbol" aria-hidden="true">
          {phase === 'live'
            ? '●'
            : phase === 'waiting'
              ? '○'
              : phase === 'false'
                ? '×'
                : phase === 'done'
                  ? '✓'
                  : '◎'}
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

      <div className="reaction-summary">
        <div>
          <span>BEST</span>
          <strong>{best == null ? '—' : `${best}ms`}</strong>
        </div>
        <div>
          <span>WORST</span>
          <strong>{worst == null ? '—' : `${worst}ms`}</strong>
        </div>
        <div>
          <span>SPREAD</span>
          <strong>{spread == null ? '—' : `${spread}ms`}</strong>
        </div>
      </div>

      <div className="reaction-history">
        {Array.from({ length: rounds }, (_, index) => (
          <div
            className={[
              times[index] != null ? 'filled' : '',
              times[index] === FALSE_START_PENALTY ? 'penalty' : '',
            ].filter(Boolean).join(' ')}
            key={index}
          >
            <span>R{index + 1}</span>
            <strong>
              {times[index] != null
                ? times[index] === FALSE_START_PENALTY
                  ? 'FALSE'
                  : `${times[index]} ms`
                : '—'}
            </strong>
          </div>
        ))}
      </div>

      <div className={`game-message ${phase === 'done' ? 'won' : ''}`}>
        {phase === 'done'
          ? `${rounds} samples recorded · ${ruleMode.toLowerCase()} rules.`
          : ruleMode === 'STRICT'
            ? 'Strict mode turns a false start into a 1000 ms round.'
            : 'Classic mode lets you retry false starts.'}
      </div>
    </div>
  )
}
