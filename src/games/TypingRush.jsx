import { useEffect, useMemo, useRef, useState } from 'react'

const WORDS = {
  EASY: 'time game code light water point world house music plant sound green river stone mouse table smile cloud dream quick apple paper train space heart flame'.split(' '),
  MEDIUM: 'binary vector galaxy puzzle socket memory object syntax random branch commit render browser function variable network module packet cipher matrix signal rocket'.split(' '),
  HARD: 'asynchronous polymorphism cryptography virtualization architecture recursion concurrency dependency algorithm framework throughput middleware hexadecimal repository'.split(' '),
}

const DURATIONS = [30,60,90]

function shuffledWords(level,count=240){
  const pool=WORDS[level]
  return Array.from({length:count},()=>pool[Math.floor(Math.random()*pool.length)])
}

export default function TypingRush({ onComplete }) {
  const [level,setLevel]=useState('MEDIUM')
  const [duration,setDuration]=useState(60)
  const [words,setWords]=useState(()=>shuffledWords('MEDIUM'))
  const [index,setIndex]=useState(0)
  const [input,setInput]=useState('')
  const [running,setRunning]=useState(false)
  const [time,setTime]=useState(60)
  const [correct,setCorrect]=useState(0)
  const [wrong,setWrong]=useState(0)
  const [chars,setChars]=useState(0)
  const [combo,setCombo]=useState(0)
  const [bestCombo,setBestCombo]=useState(0)
  const completed=useRef(false)
  const inputRef=useRef(null)

  const elapsed=Math.max(1,duration-time)
  const wpm=Math.round((chars/5)/(elapsed/60))
  const accuracy=correct+wrong?Math.round(correct/(correct+wrong)*100):100
  const score=Math.max(0,Math.round(wpm*10*accuracy/100 + bestCombo*5))

  function reset(nextLevel=level,nextDuration=duration){
    setLevel(nextLevel);setDuration(nextDuration);setWords(shuffledWords(nextLevel));setIndex(0);setInput('')
    setRunning(false);setTime(nextDuration);setCorrect(0);setWrong(0);setChars(0);setCombo(0);setBestCombo(0);completed.current=false
  }

  function start(){
    reset(level,duration)
    setRunning(true)
    window.setTimeout(()=>inputRef.current?.focus(),50)
  }

  useEffect(()=>{
    if(!running)return undefined
    const timer=window.setInterval(()=>setTime((value)=>value<=1?0:value-1),1000)
    return()=>window.clearInterval(timer)
  },[running])

  useEffect(()=>{
    if(time!==0||completed.current)return
    setRunning(false);completed.current=true
    const target=level==='HARD'?35:level==='MEDIUM'?30:25
    onComplete({won:wpm>=target,score,lowerIsBetter:false,bonusXp:wpm>=60?40:wpm>=45?28:wpm>=30?16:6})
  },[time,wpm,score,level,onComplete])

  function submitWord(){
    if(!running||!input.trim())return
    const target=words[index]
    if(input.trim()===target){
      const nextCombo=combo+1
      setCorrect((v)=>v+1);setChars((v)=>v+target.length+1);setCombo(nextCombo);setBestCombo((v)=>Math.max(v,nextCombo))
    }else{
      setWrong((v)=>v+1);setCombo(0)
    }
    setIndex((v)=>v+1);setInput('')
  }

  function keyDown(event){
    if(event.key===' '||event.key==='Enter'){
      event.preventDefault();submitWord()
    }
  }

  const upcoming=useMemo(()=>words.slice(index,index+7),[words,index])

  return (
    <div className="game-panel typing-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">WPM</span><strong>{running||time===0?wpm:'—'}</strong></div>
          <div><span className="micro">ACCURACY</span><strong>{accuracy}%</strong></div>
          <div><span className="micro">COMBO</span><strong>{combo}</strong></div>
          <div><span className="micro">TIME</span><strong>{time}s</strong></div>
        </div>
        <button className="secondary-btn" onClick={start}>{running?'Restart':'Start run'}</button>
      </div>

      <div className="typing-settings">
        <div className="filter-chips">{['EASY','MEDIUM','HARD'].map((item)=><button className={`filter-chip ${level===item?'active':''}`} disabled={running} onClick={()=>reset(item,duration)} key={item}>{item}</button>)}</div>
        <div className="filter-chips">{DURATIONS.map((item)=><button className={`filter-chip ${duration===item?'active':''}`} disabled={running} onClick={()=>reset(level,item)} key={item}>{item}s</button>)}</div>
      </div>

      <div className={`typing-stage ${running?'running':''}`}>
        <div className="word-ribbon">
          {upcoming.map((word,i)=><span className={i===0?'current':''} key={`${word}-${index+i}`}>{word}</span>)}
        </div>
        <input
          ref={inputRef}
          className="typing-input"
          value={input}
          onChange={(e)=>setInput(e.target.value.toLowerCase().replace(/[^a-z]/g,''))}
          onKeyDown={keyDown}
          placeholder={running?'type the highlighted word…':'press Start run'}
          disabled={!running}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="typing-progress"><i style={{width:`${((duration-time)/duration)*100}%`}} /></div>
      </div>

      <div className="typing-summary">
        <div><span>CORRECT</span><strong>{correct}</strong></div>
        <div><span>MISSES</span><strong>{wrong}</strong></div>
        <div><span>BEST COMBO</span><strong>{bestCombo}</strong></div>
        <div><span>SCORE</span><strong>{score}</strong></div>
      </div>

      <div className={`game-message ${time===0?(wpm>=(level==='HARD'?35:level==='MEDIUM'?30:25)?'won':'lost'):''}`}>
        {time===0?`${wpm} WPM at ${accuracy}% accuracy.`:running?'Space or Enter commits each word. Typos break the combo.':'Choose a mode and start when your fingers have stopped making excuses.'}
      </div>
    </div>
  )
}
