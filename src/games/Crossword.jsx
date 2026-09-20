import { useEffect, useMemo, useRef, useState } from 'react'

const KEY_ROWS=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']

const PUZZLES=[
  {
    name:'Round Things',
    rows:['BALL','AREA','LEAD','LADY'],
    across:['Round object used in many sports','Extent or region','Be in front','Polite term for a woman'],
    down:['A formal dance','Measurement of a surface','Dense metal, pronounced “led”','Title before a noblewoman’s name'],
  },
  {
    name:'Rear View',
    rows:['CARE','AREA','REAR','EARS'],
    across:['Concern or attention','A region','The back part','Organs for hearing'],
    down:['Look after','Square-unit measurement','Behind','They may ring after a loud concert'],
  },
  {
    name:'Keep Watch',
    rows:['WARD','AREA','REAR','DARN'],
    across:['Hospital division','Region or extent','Back side','Mild exclamation, or mend fabric'],
    down:['Person under a guardian','Surface measurement','Bring up the back','Repair a hole with thread'],
  },
  {
    name:'Easy Does It',
    rows:['DEAR','EASE','ASIA','REAR'],
    across:['Beloved or expensive','Lack of difficulty','Largest continent','Back part'],
    down:['Term in a friendly letter','Make less difficult','Continent containing India','Raise young, or the back'],
  },
  {
    name:'Body & Mind',
    rows:['LIMB','IDEA','MEAL','BALL'],
    across:['Arm or leg','A thought','Breakfast, lunch or dinner','Round sporting object'],
    down:['Branch of a tree, or an arm or leg','Concept in the mind','Food served at a sitting','A formal dance'],
  },
  {
    name:'Desert Edge',
    rows:['SAND','AREA','NEAR','DARN'],
    across:['Tiny grains on a beach','Region or extent','Close by','Repair with thread'],
    down:['Beach material','Surface measurement','Not far away','Mild exclamation'],
  },
  {
    name:'Running Late',
    rows:['LATE','AREA','TEAR','EARS'],
    across:['Not on time','Region or extent','Rip apart','Organs for hearing'],
    down:['After the expected time','Surface measurement','Drop from an eye, or rip','They help with hearing'],
  },
]

function choose(exclude){
  const pool=PUZZLES.filter((p)=>p.name!==exclude)
  const source=pool.length?pool:PUZZLES
  return source[Math.floor(Math.random()*source.length)]
}

export default function Crossword({onComplete}){
  const [puzzle,setPuzzle]=useState(()=>choose())
  const [grid,setGrid]=useState(()=>Array(16).fill(''))
  const [selected,setSelected]=useState(0)
  const [direction,setDirection]=useState('ACROSS')
  const [hints,setHints]=useState(0)
  const [checks,setChecks]=useState(0)
  const [wrongCells,setWrongCells]=useState([])
  const [time,setTime]=useState(0)
  const [status,setStatus]=useState('playing')
  const completed=useRef(false)
  const solution=puzzle.rows.join('')

  useEffect(()=>{
    if(status!=='playing')return undefined
    const timer=window.setInterval(()=>setTime((v)=>v+1),1000)
    return()=>window.clearInterval(timer)
  },[status])

  function reset(){
    setPuzzle((p)=>choose(p.name))
    setGrid(Array(16).fill(''))
    setSelected(0)
    setDirection('ACROSS')
    setHints(0)
    setChecks(0)
    setWrongCells([])
    setTime(0)
    setStatus('playing')
    completed.current=false
  }

  function finish(nextGrid){
    if(nextGrid.join('')!==solution||completed.current)return
    completed.current=true
    setStatus('won')
    setWrongCells([])
    const score=time+hints*30+checks*10
    onComplete({won:true,score,lowerIsBetter:true,bonusXp:Math.max(5,40-hints*8-checks*3)})
  }

  function enter(letter){
    if(status!=='playing')return
    const next=[...grid]
    next[selected]=letter
    setGrid(next)
    setWrongCells((w)=>w.filter((i)=>i!==selected))
    finish(next)
    const row=Math.floor(selected/4),col=selected%4
    if(direction==='ACROSS'&&col<3)setSelected(selected+1)
    if(direction==='DOWN'&&row<3)setSelected(selected+4)
  }

  function backspace(){
    if(status!=='playing')return
    if(grid[selected]){
      const next=[...grid]
      next[selected]=''
      setGrid(next)
      return
    }
    const row=Math.floor(selected/4),col=selected%4
    if(direction==='ACROSS'&&col>0)setSelected(selected-1)
    if(direction==='DOWN'&&row>0)setSelected(selected-4)
  }

  useEffect(()=>{
    function key(event){
      if(event.ctrlKey||event.metaKey||event.altKey)return
      if(/^[a-zA-Z]$/.test(event.key)){event.preventDefault();enter(event.key.toUpperCase())}
      else if(event.key==='Backspace'){event.preventDefault();backspace()}
      else if(event.key==='ArrowRight'){event.preventDefault();setDirection('ACROSS');setSelected((v)=>Math.min(15,v+1))}
      else if(event.key==='ArrowLeft'){event.preventDefault();setDirection('ACROSS');setSelected((v)=>Math.max(0,v-1))}
      else if(event.key==='ArrowDown'){event.preventDefault();setDirection('DOWN');setSelected((v)=>Math.min(15,v+4))}
      else if(event.key==='ArrowUp'){event.preventDefault();setDirection('DOWN');setSelected((v)=>Math.max(0,v-4))}
      else if(event.key===' '){event.preventDefault();setDirection((d)=>d==='ACROSS'?'DOWN':'ACROSS')}
    }
    window.addEventListener('keydown',key)
    return()=>window.removeEventListener('keydown',key)
  })

  const clueIndex=direction==='ACROSS'?Math.floor(selected/4):selected%4
  const activeClue=direction==='ACROSS'?puzzle.across[clueIndex]:puzzle.down[clueIndex]

  function check(){
    const wrong=grid.map((v,i)=>v&&v!==solution[i]?i:-1).filter((i)=>i>=0)
    setChecks((v)=>v+1)
    setWrongCells(wrong)
    if(!wrong.length&&grid.every(Boolean))finish(grid)
  }

  function hint(){
    if(status!=='playing'||grid[selected]===solution[selected])return
    const next=[...grid]
    next[selected]=solution[selected]
    setGrid(next)
    setHints((v)=>v+1)
    setWrongCells((w)=>w.filter((i)=>i!==selected))
    finish(next)
  }

  const complete=useMemo(()=>grid.filter(Boolean).length,[grid])

  return(
    <div className="game-panel crossword-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">FILLED</span><strong>{complete}/16</strong></div>
          <div><span className="micro">TIME</span><strong>{Math.floor(time/60)}:{String(time%60).padStart(2,'0')}</strong></div>
          <div><span className="micro">HINTS</span><strong>{hints}</strong></div>
        </div>
        <button className="secondary-btn" onClick={reset}>New mini</button>
      </div>

      <div className="crossword-title"><span className="micro">CROSSWIRE MINI</span><strong>{puzzle.name}</strong></div>

      <div className="crossword-layout">
        <div>
          <div className="crossword-grid">
            {grid.map((letter,index)=>{
              const row=Math.floor(index/4),col=index%4
              const active=direction==='ACROSS'?row===Math.floor(selected/4):col===selected%4
              const number=col===0?row+1:row===0?col+1:''
              const cls='cross-cell '+(selected===index?'selected ':'')+(active?'active-line ':'')+(wrongCells.includes(index)?'wrong':'')
              return <button className={cls} onClick={()=>{if(selected===index)setDirection((d)=>d==='ACROSS'?'DOWN':'ACROSS');setSelected(index)}} key={index}>
                {number&&<span className="cross-number">{number}</span>}{letter}
              </button>
            })}
          </div>

          <div className="cross-active-clue"><span>{direction} {clueIndex+1}</span><strong>{activeClue}</strong></div>

          <div className="cross-actions">
            <button className="secondary-btn" onClick={()=>setDirection((d)=>d==='ACROSS'?'DOWN':'ACROSS')}>{direction} ↻</button>
            <button className="secondary-btn" onClick={hint}>Hint +30s</button>
            <button className="secondary-btn" onClick={check}>Check</button>
          </div>

          <div className="cross-keyboard" aria-label="Crossword keyboard">
            {KEY_ROWS.map((row)=>(
              <div key={row}>
                {row.split('').map((letter)=><button onClick={()=>enter(letter)} disabled={status!=='playing'} key={letter}>{letter}</button>)}
              </div>
            ))}
            <button className="cross-backspace" onClick={backspace} disabled={status!=='playing'}>⌫</button>
          </div>
        </div>

        <div className="cross-clues">
          <section><h4>ACROSS</h4>{puzzle.across.map((clue,i)=><button onClick={()=>{setDirection('ACROSS');setSelected(i*4)}} key={clue}><b>{i+1}</b>{clue}</button>)}</section>
          <section><h4>DOWN</h4>{puzzle.down.map((clue,i)=><button onClick={()=>{setDirection('DOWN');setSelected(i)}} key={clue}><b>{i+1}</b>{clue}</button>)}</section>
        </div>
      </div>

      <div className={'game-message '+status}>{status==='won'?'Crosswire solved. All sixteen letters finally agree with each other.':'Type letters, use arrows to move, Space to switch Across/Down.'}</div>
    </div>
  )
}
