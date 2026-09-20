import { useEffect, useMemo, useRef, useState } from 'react'

const PIECES={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}
const FILES='abcdefgh'

const PUZZLES=[
  {id:1,difficulty:'EASY',title:'Back Rank',prompt:'White to move. Find the back-rank finish.',fen:'6k1/5ppp/8/8/8/8/6PP/4R1K1 w - - 0 1',from:'e1',to:'e8',solution:'Re8#',motif:'BACK RANK'},
  {id:2,difficulty:'EASY',title:'The Battery',prompt:'White to move. Queen and bishop are staring at h7.',fen:'6k1/5ppp/8/7Q/8/8/2B3PP/6K1 w - - 0 1',from:'h5',to:'h7',solution:'Qxh7#',motif:'BATTERY'},
  {id:3,difficulty:'MEDIUM',title:'Royal Fork',prompt:'White to move. Put the knight where king and queen both regret existing.',fen:'q3k3/8/8/1N6/8/8/6PP/6K1 w - - 0 1',from:'b5',to:'c7',solution:'Nc7+',motif:'FORK'},
  {id:4,difficulty:'MEDIUM',title:'Loose Queen',prompt:'White to move. The diagonal is doing all the work.',fen:'4k3/8/2q5/8/4B3/8/6PP/6K1 w - - 0 1',from:'e4',to:'c6',solution:'Bxc6+',motif:'SKEWER'},
  {id:5,difficulty:'HARD',title:'Rook Invasion',prompt:'White to move. Find the forcing rook entry.',fen:'6k1/5ppp/8/8/8/6Q1/5PPP/4R1K1 w - - 0 1',from:'e1',to:'e8',solution:'Re8+',motif:'INVASION'},
  {id:6,difficulty:'HARD',title:'Cornered King',prompt:'White to move. The queen has one forcing entry on the eighth rank.',fen:'6k1/7p/8/8/3Q4/8/6PP/6K1 w - - 0 1',from:'d4',to:'h8',solution:'Qh8+',motif:'QUEEN LINE'},
]

function parseFen(fen){
  const rows=fen.split(' ')[0].split('/')
  const board=Array(64).fill(null)
  rows.forEach((row,r)=>{
    let c=0
    for(const char of row){
      if(/\d/.test(char))c+=Number(char)
      else{board[r*8+c]=char;c+=1}
    }
  })
  return board
}

function squareIndex(square){return (8-Number(square[1]))*8+FILES.indexOf(square[0])}
function squareName(index){return FILES[index%8]+(8-Math.floor(index/8))}

function choose(level,exclude){
  let pool=PUZZLES.filter((p)=>level==='ALL'||p.difficulty===level)
  const alt=pool.filter((p)=>p.id!==exclude)
  const source=alt.length?alt:pool
  return source[Math.floor(Math.random()*source.length)]
}

export default function ChessPuzzle({onComplete}){
  const [level,setLevel]=useState('ALL')
  const [puzzle,setPuzzle]=useState(()=>choose('ALL'))
  const [selected,setSelected]=useState(null)
  const [mistakes,setMistakes]=useState(0)
  const [hints,setHints]=useState(0)
  const [status,setStatus]=useState('playing')
  const [time,setTime]=useState(0)
  const completed=useRef(false)
  const board=useMemo(()=>parseFen(puzzle.fen),[puzzle])

  useEffect(()=>{
    if(status!=='playing')return undefined
    const timer=window.setInterval(()=>setTime((v)=>v+1),1000)
    return()=>window.clearInterval(timer)
  },[status])

  function reset(next=level){
    setLevel(next)
    setPuzzle((p)=>choose(next,p.id))
    setSelected(null)
    setMistakes(0)
    setHints(0)
    setStatus('playing')
    setTime(0)
    completed.current=false
  }

  function click(index){
    if(status!=='playing')return

    if(selected==null){
      if(board[index]&&board[index]===board[index].toUpperCase())setSelected(index)
      return
    }

    if(board[index]&&board[index]===board[index].toUpperCase()){
      setSelected(index)
      return
    }

    const from=squareName(selected)
    const to=squareName(index)

    if(from===puzzle.from&&to===puzzle.to){
      setStatus('won')
      if(!completed.current){
        completed.current=true
        onComplete({won:true,score:time+mistakes*20+hints*30,lowerIsBetter:true,bonusXp:Math.max(8,40-mistakes*8-hints*10)})
      }
    }else{
      setMistakes((v)=>v+1)
      setSelected(null)
    }
  }

  const hintFrom=hints>=1?squareIndex(puzzle.from):-1
  const hintTo=hints>=2?squareIndex(puzzle.to):-1

  return(
    <div className="game-panel chess-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">TIME</span><strong>{time}s</strong></div>
          <div><span className="micro">MISSES</span><strong>{mistakes}</strong></div>
          <div><span className="micro">HINTS</span><strong>{hints}/2</strong></div>
        </div>
        <button className="secondary-btn" onClick={()=>reset()}>Next puzzle</button>
      </div>

      <div className="filter-chips chess-levels">
        {['ALL','EASY','MEDIUM','HARD'].map((item)=><button className={'filter-chip '+(level===item?'active':'')} onClick={()=>reset(item)} key={item}>{item}</button>)}
      </div>

      <div className="chess-puzzle-copy">
        <span className="micro">{puzzle.difficulty} · {puzzle.motif}</span>
        <h3>{puzzle.title}</h3>
        <p>{puzzle.prompt}</p>
      </div>

      <div className="chess-layout">
        <div className="chess-board">
          {board.map((piece,index)=>{
            const row=Math.floor(index/8),col=index%8
            const cls='chess-square '+(((row+col)%2)?'dark ':'light ')+(selected===index?'selected ':'')+(hintFrom===index?'hint-from ':'')+(hintTo===index?'hint-to':'')
            return <button className={cls} onClick={()=>click(index)} key={index}>
              {piece&&<span className={piece===piece.toUpperCase()?'white-piece':'black-piece'}>{PIECES[piece]}</span>}
              {col===0&&<i className="rank-label">{8-row}</i>}
              {row===7&&<i className="file-label">{FILES[col]}</i>}
            </button>
          })}
        </div>

        <aside className="chess-side">
          <div className="chess-instruction">
            <span className="micro">HOW TO MOVE</span>
            <p>Tap the piece, then tap its destination. This mode asks for the tactical move, not a whole engine game.</p>
          </div>
          <button className="secondary-btn" onClick={()=>setHints((v)=>Math.min(2,v+1))} disabled={hints>=2||status!=='playing'}>
            {hints===0?'Hint: piece':hints===1?'Hint: square':'Hints used'}
          </button>
          {status==='won'&&<div className="chess-solution"><span>SOLUTION</span><strong>{puzzle.solution}</strong><small>{puzzle.motif}</small></div>}
        </aside>
      </div>

      <div className={'game-message '+status}>
        {status==='won'?('Solved: '+puzzle.solution+'. The board can stop judging you now.'):mistakes?(mistakes+' wrong move'+(mistakes===1?'':'s')+'. Recalculate.'):'Find the best tactical move for White.'}
      </div>
    </div>
  )
}
