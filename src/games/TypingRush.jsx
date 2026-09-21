import { useEffect, useMemo, useRef, useState } from 'react'

const WORDS = {
  EASY: 'time game code light water point world house music plant sound green river stone mouse table smile cloud dream quick apple paper train space heart flame'.split(' '),
  MEDIUM: 'binary vector galaxy puzzle socket memory object syntax random branch commit render browser function variable network module packet cipher matrix signal rocket'.split(' '),
  HARD: 'asynchronous polymorphism cryptography virtualization architecture recursion concurrency dependency algorithm framework throughput middleware hexadecimal repository'.split(' '),
}

const DURATIONS = [30,60,90]

function shuffledWords(level,count=240,pool=null){
  const source=pool?.length?pool:WORDS[level]
  return Array.from({length:count},()=>source[Math.floor(Math.random()*source.length)])
}

function customPoolFromText(value){
  return value
    .toLowerCase()
    .split(/[^a-z]+/)
    .map((word)=>word.trim())
    .filter((word)=>word.length>=2)
    .slice(0,120)
}

export default function TypingRush({ onComplete }) {
  const [level,setLevel]=useState('MEDIUM')
  const [duration,setDuration]=useState(60)
  const [runMode,setRunMode]=useState('STANDARD')
  const [sourceMode,setSourceMode]=useState('BUILTIN')
  const [customText,setCustomText]=useState('')
  const [customError,setCustomError]=useState('')
  const [activePool,setActivePool]=useState(null)

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
  const [endedByMiss,setEndedByMiss]=useState(false)

  const completed=useRef(false)
  const inputRef=useRef(null)

  const elapsed=Math.max(1,duration-time)
  const wpm=Math.round((chars/5)/(elapsed/60))
  const accuracy=correct+wrong?Math.round(correct/(correct+wrong)*100):100
  const score=Math.max(0,Math.round(wpm*10*accuracy/100 + bestCombo*5))

  function reset(nextLevel=level,nextDuration=duration,pool=activePool){
    setLevel(nextLevel)
    setDuration(nextDuration)
    setWords(shuffledWords(nextLevel,240,pool))
    setIndex(0)
    setInput('')
    setRunning(false)
    setTime(nextDuration)
    setCorrect(0)
    setWrong(0)
    setChars(0)
    setCombo(0)
    setBestCombo(0)
    setEndedByMiss(false)
    completed.current=false
  }

  function start(){
    let pool=null

    if(sourceMode==='CUSTOM'){
      pool=customPoolFromText(customText)
      if(pool.length<5){
        setCustomError('Add at least five usable words to the custom bank.')
        return
      }
    }

    setCustomError('')
    setActivePool(pool)
    reset(level,duration,pool)
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
    setRunning(false)
    completed.current=true
    const target=level==='HARD'?35:level==='MEDIUM'?30:25

    onComplete({
      won:runMode==='SUDDEN'?(!endedByMiss&&correct>0):wpm>=target,
      score,
      lowerIsBetter:false,
      bonusXp:Math.min(
        40,
        (wpm>=60?34:wpm>=45?24:wpm>=30?14:5)+
          (runMode==='SUDDEN'&&!endedByMiss?5:0)+
          (sourceMode==='CUSTOM'?2:0),
      ),
    })
  },[
    time,
    wpm,
    score,
    level,
    runMode,
    endedByMiss,
    correct,
    sourceMode,
    onComplete,
  ])

  function submitWord(){
    if(!running||!input.trim())return

    const target=words[index]

    if(input.trim()===target){
      const nextCombo=combo+1
      setCorrect((v)=>v+1)
      setChars((v)=>v+target.length+1)
      setCombo(nextCombo)
      setBestCombo((v)=>Math.max(v,nextCombo))
    }else{
      setWrong((v)=>v+1)
      setCombo(0)

      if(runMode==='SUDDEN'){
        setEndedByMiss(true)
        setInput('')
        setTime(0)
        return
      }
    }

    setIndex((v)=>v+1)
    setInput('')
  }

  function keyDown(event){
    if(event.key===' '||event.key==='Enter'){
      event.preventDefault()
      submitWord()
    }
  }

  const upcoming=useMemo(()=>words.slice(index,index+7),[words,index])

  return (
    <div className="game-panel typing-panel">
      <div className="typing-mode-grid">
        <div>
          <span className="micro">RULESET</span>
          <div className="filter-chips">
            {['STANDARD','SUDDEN'].map((item)=><button className={`filter-chip ${runMode===item?'active':''}`} disabled={running} onClick={()=>{setRunMode(item);reset()}} key={item}>{item}</button>)}
          </div>
        </div>

        <div>
          <span className="micro">WORD SOURCE</span>
          <div className="filter-chips">
            {['BUILTIN','CUSTOM'].map((item)=><button className={`filter-chip ${sourceMode===item?'active':''}`} disabled={running} onClick={()=>{setSourceMode(item);setCustomError('');reset(level,duration,item==='CUSTOM'?customPoolFromText(customText):null)}} key={item}>{item}</button>)}
          </div>
        </div>
      </div>

      {sourceMode==='CUSTOM'&&(
        <div className="typing-custom-bank">
          <span className="micro">CUSTOM WORD BANK</span>
          <textarea
            value={customText}
            onChange={(event)=>setCustomText(event.target.value.slice(0,1800))}
            disabled={running}
            placeholder="Paste or type words separated by spaces, commas or lines…"
          />
          <div>
            <span>{customPoolFromText(customText).length} usable words</span>
            <small>At least 5 required · duplicates are allowed</small>
          </div>
          {customError&&<strong>{customError}</strong>}
        </div>
      )}

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
        <div className="filter-chips">
          {['EASY','MEDIUM','HARD'].map((item)=><button className={`filter-chip ${level===item?'active':''}`} disabled={running||sourceMode==='CUSTOM'} onClick={()=>reset(item,duration)} key={item}>{item}</button>)}
        </div>
        <div className="filter-chips">
          {DURATIONS.map((item)=><button className={`filter-chip ${duration===item?'active':''}`} disabled={running} onClick={()=>reset(level,item)} key={item}>{item}s</button>)}
        </div>
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

        <div className="typing-progress">
          <i style={{width:`${((duration-time)/duration)*100}%`}} />
        </div>
      </div>

      <div className="typing-summary">
        <div><span>CORRECT</span><strong>{correct}</strong></div>
        <div><span>MISSES</span><strong>{wrong}</strong></div>
        <div><span>BEST COMBO</span><strong>{bestCombo}</strong></div>
        <div><span>SCORE</span><strong>{score}</strong></div>
      </div>

      <div className={`game-message ${time===0?(runMode==='SUDDEN'?(endedByMiss?'lost':'won'):(wpm>=(level==='HARD'?35:level==='MEDIUM'?30:25)?'won':'lost')):''}`}>
        {time===0
          ? endedByMiss
            ? `Sudden Death ended on the first miss · ${wpm} WPM.`
            : `${wpm} WPM at ${accuracy}% accuracy.`
          : running
            ? runMode==='SUDDEN'
              ? 'One wrong word ends the run. Humans apparently requested this.'
              : 'Space or Enter commits each word. Typos break the combo.'
            : 'Choose a ruleset, source and duration, then start.'}
      </div>
    </div>
  )
}
