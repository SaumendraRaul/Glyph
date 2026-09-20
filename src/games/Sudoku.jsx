import { useEffect, useMemo, useRef, useState } from 'react'

const PUZZLES={
  EASY:[
    ['530070000600195000098000060800060003400803001700020006060000280000419005000080079','534678912672195348198342567859761423426853791713924856961537284287419635345286179'],
    ['004608000600195000100042000050761403020803001703920806061007084087410000040280109','534678912672195348198342567859761423426853791713924856961537284287419635345286179'],
  ],
  MEDIUM:[
    ['000260701680070090190004500820100040004602900050003028009300074040050036703018000','435269781682571493197834562826195347374682915951743628519326874248957136763418259'],
    ['300200000000107000706030500070009080900020004010800050009040301000702000000008006','351286497492157638786934512275469183938521764614873259829645371163792845547318926'],
  ],
  HARD:[
    ['000000010400000000020000000000050407008000300001090000300400200050100000000806000','693784512487512936125963874932651487568247391741398625319475268856129743274836159'],
    ['005300000800000020070010500400005300010070006003200080060500009004000030000009700','145327698839654127672918543496185372218473956753296481367542819984761235521839764'],
  ],
}

function makeState(puzzle){return puzzle.split('').map((v)=>Number(v))}
function choice(level,exclude){const list=PUZZLES[level];const options=list.filter((p)=>p[0]!==exclude);return (options.length?options:list)[Math.floor(Math.random()*(options.length?options:list).length)]}

export default function Sudoku({onComplete}){
  const [level,setLevel]=useState('EASY')
  const [pair,setPair]=useState(()=>choice('EASY'))
  const [grid,setGrid]=useState(()=>makeState(pair[0]))
  const [selected,setSelected]=useState(null)
  const [notes,setNotes]=useState({})
  const [noteMode,setNoteMode]=useState(false)
  const [mistakes,setMistakes]=useState(0)
  const [hints,setHints]=useState(0)
  const [time,setTime]=useState(0)
  const [status,setStatus]=useState('playing')
  const completed=useRef(false)

  const solution=pair[1].split('').map(Number)
  const fixed=useMemo(()=>pair[0].split('').map((v)=>v!=='0'),[pair])
  const complete=grid.every((v,i)=>v===solution[i])

  useEffect(()=>{
    if(status!=='playing')return undefined
    const timer=window.setInterval(()=>setTime((v)=>v+1),1000)
    return()=>window.clearInterval(timer)
  },[status])

  useEffect(()=>{
    if(!complete||status!=='playing'||completed.current)return
    completed.current=true;setStatus('won')
    const score=time+mistakes*30+hints*60
    onComplete({won:true,score,lowerIsBetter:true,bonusXp:Math.max(5,40-mistakes*8-hints*8)})
  },[complete,status,time,mistakes,hints,onComplete])

  function reset(nextLevel=level){
    const next=choice(nextLevel,pair[0]);setLevel(nextLevel);setPair(next);setGrid(makeState(next[0]));setSelected(null);setNotes({});setNoteMode(false);setMistakes(0);setHints(0);setTime(0);setStatus('playing');completed.current=false
  }

  function place(value){
    if(selected==null||fixed[selected]||status!=='playing')return
    if(noteMode){
      setNotes((current)=>{
        const values=new Set(current[selected]||[])
        values.has(value)?values.delete(value):values.add(value)
        return {...current,[selected]:[...values].sort()}
      })
      return
    }
    if(value!==solution[selected]){
      const nextMistakes=mistakes+1;setMistakes(nextMistakes)
      if(nextMistakes>=3){setStatus('lost');onComplete({won:false})}
      return
    }
    setGrid((current)=>current.map((cell,i)=>i===selected?value:cell))
    setNotes((current)=>({...current,[selected]:[]}))
  }

  function erase(){if(selected!=null&&!fixed[selected]&&status==='playing'){setGrid((g)=>g.map((v,i)=>i===selected?0:v));setNotes((n)=>({...n,[selected]:[]}))}}
  function hint(){if(selected==null||fixed[selected]||grid[selected]||status!=='playing')return;setHints((v)=>v+1);setGrid((g)=>g.map((v,i)=>i===selected?solution[selected]:v));setNotes((n)=>({...n,[selected]:[]}))}

  function related(index){
    if(selected==null)return false
    const r=Math.floor(index/9),c=index%9,sr=Math.floor(selected/9),sc=selected%9
    return r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3))
  }

  useEffect(()=>{
    function key(event){
      const target=event.target
      if(target instanceof HTMLElement&&(target.matches('input, textarea, select')||target.isContentEditable))return
      if(/^[1-9]$/.test(event.key)){event.preventDefault();place(Number(event.key));return}
      if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();erase();return}
      if(event.key.toLowerCase()==='n'){event.preventDefault();setNoteMode((v)=>!v);return}
      if(selected==null)return
      if(event.key==='ArrowLeft'){event.preventDefault();setSelected((v)=>Math.max(0,v-1))}
      if(event.key==='ArrowRight'){event.preventDefault();setSelected((v)=>Math.min(80,v+1))}
      if(event.key==='ArrowUp'){event.preventDefault();setSelected((v)=>Math.max(0,v-9))}
      if(event.key==='ArrowDown'){event.preventDefault();setSelected((v)=>Math.min(80,v+9))}
    }
    window.addEventListener('keydown',key)
    return()=>window.removeEventListener('keydown',key)
  })

  return(
    <div className="game-panel sudoku-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">TIME</span><strong>{Math.floor(time/60)}:{String(time%60).padStart(2,'0')}</strong></div>
          <div><span className="micro">MISTAKES</span><strong>{mistakes}/3</strong></div>
          <div><span className="micro">HINTS</span><strong>{hints}</strong></div>
        </div>
        <button className="secondary-btn" onClick={()=>reset()}>New puzzle</button>
      </div>

      <div className="filter-chips sudoku-levels">{Object.keys(PUZZLES).map((item)=><button className={`filter-chip ${level===item?'active':''}`} onClick={()=>reset(item)} key={item}>{item}</button>)}</div>

      <div className="sudoku-board">
        {grid.map((value,index)=>{
          const same=value&&selected!=null&&value===grid[selected]
          return <button className={`sudoku-cell ${fixed[index]?'fixed':''} ${selected===index?'selected':''} ${related(index)?'related':''} ${same?'same':''}`} onClick={()=>setSelected(index)} key={index}>
            {value||''}
            {!value&&notes[index]?.length>0&&<span className="sudoku-notes">{Array.from({length:9},(_,i)=><i key={i}>{notes[index].includes(i+1)?i+1:''}</i>)}</span>}
          </button>
        })}
      </div>

      <div className="sudoku-pad">
        {[1,2,3,4,5,6,7,8,9].map((n)=><button onClick={()=>place(n)} disabled={status!=='playing'} key={n}>{n}</button>)}
      </div>

      <div className="sudoku-actions">
        <button className={`secondary-btn ${noteMode?'active-control':''}`} onClick={()=>setNoteMode((v)=>!v)}>Notes {noteMode?'ON':'OFF'}</button>
        <button className="secondary-btn" onClick={erase}>Erase</button>
        <button className="secondary-btn" onClick={hint}>Hint +60s</button>
      </div>

      <div className={`game-message ${status}`}>{status==='won'?'Grid solved. Order has briefly defeated entropy.':status==='lost'?'Three mistakes. The grid has revoked your number privileges.':'Rows, columns and 3×3 boxes each need 1–9 exactly once.'}</div>
    </div>
  )
}
