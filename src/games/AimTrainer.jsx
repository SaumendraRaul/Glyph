import { useEffect, useRef, useState } from 'react'

const MODES = {
  CHILL: { size: 62, life: 1400 },
  STANDARD: { size: 48, life: 1050 },
  INSANE: { size: 34, life: 780 },
}

const DURATIONS = [15, 30, 60]

export default function AimTrainer({ onComplete }) {
  const [mode, setMode] = useState('STANDARD')
  const [duration, setDuration] = useState(30)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(30)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [target, setTarget] = useState({ x: 50, y: 50, born: 0 })
  const [reactions, setReactions] = useState([])
  const zoneRef = useRef(null)
  const targetTimer = useRef(null)
  const completed = useRef(false)

  useEffect(() => () => window.clearTimeout(targetTimer.current), [])

  function spawn() {
    const size = MODES[mode].size
    const zone = zoneRef.current
    if (!zone) return
    const rect = zone.getBoundingClientRect()
    const pad = size / 2 + 8
    const x = pad + Math.random() * Math.max(1, rect.width - pad * 2)
    const y = pad + Math.random() * Math.max(1, rect.height - pad * 2)
    setTarget({ x, y, born: performance.now() })

    window.clearTimeout(targetTimer.current)
    targetTimer.current = window.setTimeout(() => {
      setMisses((value) => value + 1)
      spawn()
    }, MODES[mode].life)
  }

  function reset(nextMode = mode, nextDuration = duration) {
    window.clearTimeout(targetTimer.current)
    setMode(nextMode)
    setDuration(nextDuration)
    setRunning(false)
    setTime(nextDuration)
    setHits(0)
    setMisses(0)
    setReactions([])
    setTarget({ x: 50, y: 50, born: 0 })
    completed.current = false
  }

  function start() {
    reset(mode, duration)
    setRunning(true)
    window.setTimeout(spawn, 60)
  }

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => {
      setTime((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          window.clearTimeout(targetTimer.current)
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (time !== 0 || completed.current) return
    completed.current = true
    const avg = reactions.length ? Math.round(reactions.reduce((a,b) => a+b, 0) / reactions.length) : 9999
    const accuracy = hits + misses ? hits / (hits + misses) : 0
    const score = Math.max(0, Math.round(hits * 100 * accuracy - avg / 10))
    const targetHits = duration === 15 ? 7 : duration === 60 ? 24 : 12
    onComplete({
      won: hits >= targetHits,
      score,
      lowerIsBetter: false,
      bonusXp: Math.min(
        40,
        (hits >= 25 ? 30 : hits >= 18 ? 20 : 8) +
          (duration === 60 ? 5 : 0) +
          (mode === 'INSANE' ? 5 : 0),
      ),
    })
  }, [time, hits, misses, reactions, duration, mode, onComplete])

  function hit(event) {
    event.stopPropagation()
    if (!running) return
    const reaction = Math.round(performance.now() - target.born)
    setHits((value) => value + 1)
    setReactions((values) => [...values, reaction])
    spawn()
  }

  function miss() {
    if (!running) return
    setMisses((value) => value + 1)
  }

  const avg = reactions.length ? Math.round(reactions.reduce((a,b) => a+b, 0) / reactions.length) : null
  const accuracy = hits + misses ? Math.round((hits / (hits + misses)) * 100) : 100

  return (
    <div className="game-panel aim-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">HITS</span><strong>{hits}</strong></div>
          <div><span className="micro">ACCURACY</span><strong>{accuracy}%</strong></div>
          <div><span className="micro">AVG</span><strong>{avg == null ? '—' : `${avg}ms`}</strong></div>
          <div><span className="micro">TIME</span><strong>{time}s</strong></div>
        </div>
        <button className="secondary-btn" onClick={start}>{running ? 'Restart' : 'Start'}</button>
      </div>

      <div className="aim-settings">
        <div>
          <span className="micro">TARGET PROFILE</span>
          <div className="filter-chips aim-modes">
            {Object.keys(MODES).map((item) => (
              <button className={`filter-chip ${mode === item ? 'active' : ''}`} onClick={() => reset(item, duration)} disabled={running} key={item}>{item}</button>
            ))}
          </div>
        </div>

        <div>
          <span className="micro">RUN LENGTH</span>
          <div className="filter-chips">
            {DURATIONS.map((value) => (
              <button className={`filter-chip ${duration === value ? 'active' : ''}`} onClick={() => reset(mode, value)} disabled={running} key={value}>{value}s</button>
            ))}
          </div>
        </div>
      </div>

      <div className={`aim-zone ${running ? 'live' : ''}`} ref={zoneRef} onPointerDown={miss}>
        {!running && time > 0 && (
          <div className="aim-intro">
            <span className="aim-crosshair">⊕</span>
            <strong>Deadcenter</strong>
            <small>Hit targets fast. Clicking empty space counts as a miss.</small>
          </div>
        )}

        {running && (
          <button
            className="aim-target"
            style={{ left: target.x, top: target.y, width: MODES[mode].size, height: MODES[mode].size }}
            onPointerDown={hit}
            aria-label="Target"
          >
            <span />
          </button>
        )}

        {!running && time === 0 && (
          <div className="aim-intro">
            <span className="aim-crosshair">◎</span>
            <strong>{hits} hits · {accuracy}%</strong>
            <small>{avg == null ? 'No clean hits recorded.' : `${avg} ms average reaction`}</small>
            <button className="primary-btn" onClick={(event) => { event.stopPropagation(); start() }}>Run again ↗</button>
          </div>
        )}
      </div>
    </div>
  )
}
