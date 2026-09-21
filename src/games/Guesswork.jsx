import { useMemo, useState } from 'react'

const BANK = [
  { answer:'PYTHON', aliases:[], category:'TECH', clues:['A language named after comedy, not a snake.','Whitespace is structurally meaningful here.','Its mascot imagery often involves two snakes.','Popular in AI, data science and automation.'] },
  { answer:'FIREWALL', aliases:[], category:'TECH', clues:['I stand between trusted and untrusted traffic.','I can allow or block using rules.','Networks rely on me for security boundaries.','My name sounds much more flammable than my job.'] },
  { answer:'DATABASE', aliases:['DB'], category:'TECH', clues:['I organize persistent information.','Queries are how people ask me questions.','Tables and documents are two common models.','SQL often talks to me.'] },
  { answer:'ALGORITHM', aliases:[], category:'TECH', clues:['I am a procedure, not a programming language.','I turn inputs into outputs through steps.','Sorting and searching have famous versions of me.','Developers blame me when O(n²) becomes a lifestyle.'] },
  { answer:'SATURN', aliases:[], category:'SPACE', clues:['I am a gas giant.','I am sixth from the Sun.','My density is lower than water.','My rings are my shamelessly effective branding.'] },
  { answer:'BLACK HOLE', aliases:['BLACKHOLE'], category:'SPACE', clues:['My escape velocity exceeds light.','I have an event horizon.','Massive stars can collapse into me.','Spaghettification is one of my less welcoming features.'] },
  { answer:'MARS', aliases:[], category:'SPACE', clues:['I have two tiny moons.','Olympus Mons is on me.','I am the fourth planet from the Sun.','Humans insist on calling me the red planet.'] },
  { answer:'NEBULA', aliases:[], category:'SPACE', clues:['I can be a stellar nursery.','I am made of gas and dust.','Telescopes photograph me in dramatic colors.','My name comes from Latin for cloud.'] },
  { answer:'OCTOPUS', aliases:[], category:'NATURE', clues:['I have three hearts.','My blood uses hemocyanin.','I can solve surprisingly complex problems.','Eight arms. Zero interest in your aquarium lid.'] },
  { answer:'AXOLOTL', aliases:[], category:'NATURE', clues:['I keep juvenile traits into adulthood.','I can regenerate limbs.','I am native to lakes around Mexico City.','External gills make me look permanently surprised.'] },
  { answer:'BAOBAB', aliases:[], category:'NATURE', clues:['I am a tree adapted to dry regions.','My trunk can store huge amounts of water.','Some of my species live for thousands of years.','People sometimes say I look planted upside down.'] },
  { answer:'MANTIS SHRIMP', aliases:['MANTISSHRIMP'], category:'NATURE', clues:['I am not actually a mantis or a shrimp.','My eyes detect more color channels than human eyes.','Some species strike prey with extraordinary acceleration.','Aquarium glass has reason to fear me.'] },
  { answer:'MACHU PICCHU', aliases:['MACHUPICCHU'], category:'WORLD', clues:['I sit high in the Andes.','I was built by the Inca.','I am in modern Peru.','Terraces and stonework define my postcard career.'] },
  { answer:'SAHARA', aliases:['SAHARA DESERT'], category:'WORLD', clues:['I span much of North Africa.','I am the largest hot desert on Earth.','My landscape is not mostly dunes, despite films insisting otherwise.','My name effectively means desert in Arabic.'] },
  { answer:'VENICE', aliases:[], category:'WORLD', clues:['I am built across islands in a lagoon.','Gondolas are strongly associated with me.','I am in northeastern Italy.','Road traffic has a minor water-related problem here.'] },
  { answer:'EVEREST', aliases:['MOUNT EVEREST'], category:'WORLD', clues:['I sit on the Nepal–China border.','My summit is above 8,800 metres.','I am Earth’s highest mountain above sea level.','Climbers queue for me, which is an absurd thing to say about a mountain.'] },
  { answer:'COMPASS', aliases:[], category:'OBJECTS', clues:['I help with orientation.','One of my parts points toward magnetic north.','Explorers used me long before GPS.','I am also the tool that draws circles.'] },
  { answer:'KALEIDOSCOPE', aliases:[], category:'OBJECTS', clues:['Mirrors are central to how I work.','Rotating me creates changing patterns.','Small colored objects inside me form symmetrical images.','My name comes from Greek roots about beautiful forms.'] },
  { answer:'ABACUS', aliases:[], category:'OBJECTS', clues:['I calculate without electricity.','Beads slide along rods or wires.','Versions of me have existed for millennia.','I am arithmetic with excellent tactile feedback.'] },
  { answer:'METRONOME', aliases:[], category:'OBJECTS', clues:['Musicians use me.','I produce evenly spaced beats.','My setting is expressed in BPM.','I am professionally annoying in perfect rhythm.'] },
  { answer:'CHESS', aliases:[], category:'GAMES', clues:['I have exactly one king per side.','My board has 64 squares.','Castling moves two pieces in one turn.','Checkmate ends me.'] },
  { answer:'TETRIS', aliases:[], category:'GAMES', clues:['I was created in the Soviet Union.','Seven tetrominoes define my pieces.','Clearing four lines at once has a special name.','I turn packing anxiety into entertainment.'] },
  { answer:'SUDOKU', aliases:[], category:'GAMES', clues:['My modern standard grid has 81 cells.','Digits cannot repeat in rows, columns or boxes.','Arithmetic is not required.','I will soon exist elsewhere in this arcade, because apparently recursion is a product strategy.'] },
  { answer:'CROSSWORD', aliases:[], category:'GAMES', clues:['My answers intersect.','Across and Down clues define me.','Black squares often divide my grid.','Newspapers made me famous.'] },
]

const CATEGORIES = ['ALL','TECH','SPACE','NATURE','WORLD','OBJECTS','GAMES']
const ATTEMPT_OPTIONS = [3,4,6]

function normalize(value) {
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g,'')
}

function pick(category, previous) {
  let pool = BANK.filter((item) => category === 'ALL' || item.category === category)
  const alternatives = pool.filter((item) => item.answer !== previous)
  if (alternatives.length) pool = alternatives
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function Guesswork({ onComplete }) {
  const [playMode,setPlayMode] = useState('BUILTIN')
  const [phase,setPhase] = useState('PLAY')
  const [category,setCategory] = useState('ALL')
  const [maxWrong,setMaxWrong] = useState(4)
  const [entry,setEntry] = useState(() => pick('ALL'))
  const [guess,setGuess] = useState('')
  const [clueCount,setClueCount] = useState(1)
  const [wrong,setWrong] = useState([])
  const [status,setStatus] = useState('playing')
  const [message,setMessage] = useState('One clue. One answer. Try not to ask the internet.')

  const [customAnswer,setCustomAnswer] = useState('')
  const [customCategory,setCustomCategory] = useState('')
  const [customClues,setCustomClues] = useState(['','','',''])
  const [customError,setCustomError] = useState('')

  const possible = useMemo(
    () => [entry.answer,...entry.aliases].map(normalize),
    [entry],
  )

  function clearRound() {
    setGuess('')
    setClueCount(1)
    setWrong([])
    setStatus('playing')
    setMessage('One clue. One answer. Try not to ask the internet.')
  }

  function reset(nextCategory=category) {
    if(playMode==='CUSTOM'){
      setPhase('SETUP')
      clearRound()
      return
    }
    setEntry((current) => pick(nextCategory,current.answer))
    clearRound()
  }

  function switchMode(nextMode){
    setPlayMode(nextMode)
    setCustomError('')
    if(nextMode==='BUILTIN'){
      setPhase('PLAY')
      setEntry(pick(category,entry.answer))
      clearRound()
    }else{
      setPhase('SETUP')
      clearRound()
    }
  }

  function updateCustomClue(index,value){
    setCustomClues((current)=>current.map((clue,i)=>i===index?value.slice(0,140):clue))
  }

  function lockCustom(event){
    event.preventDefault()
    const answer=customAnswer.trim()
    const clues=customClues.map((clue)=>clue.trim()).filter(Boolean)

    if(normalize(answer).length<2){
      setCustomError('Use an answer with at least two letters or digits.')
      return
    }
    if(clues.length<2){
      setCustomError('Give Player 2 at least two clues. Cruelty has limits.')
      return
    }
    if(clues.some((clue)=>normalize(clue).includes(normalize(answer)))){
      setCustomError('A clue contains the answer itself. Subtle.')
      return
    }

    setEntry({
      answer:answer.toUpperCase(),
      aliases:[],
      category:customCategory.trim().toUpperCase()||'CUSTOM',
      clues,
    })
    setCustomError('')
    clearRound()
    setPhase('PASS')
  }

  function startCustom(){
    clearRound()
    setPhase('PLAY')
  }

  function submit(event) {
    event?.preventDefault()
    if (status !== 'playing' || !guess.trim()) return

    if (possible.includes(normalize(guess))) {
      const score = Math.max(
        100,
        1000 - (clueCount-1)*180 - wrong.length*90 - (maxWrong-3)*20,
      )
      setStatus('won')
      setMessage(`${entry.answer}. Correct with ${clueCount} clue${clueCount===1?'':'s'}.`)
      onComplete({
        won:true,
        score,
        lowerIsBetter:false,
        bonusXp:Math.min(40,Math.round(score/30)+(playMode==='CUSTOM'?3:0)),
      })
      return
    }

    const nextWrong=[...wrong,guess.trim()]
    setWrong(nextWrong)
    setGuess('')

    if (nextWrong.length >= maxWrong) {
      setStatus('lost')
      setClueCount(entry.clues.length)
      setMessage(`Answer: ${entry.answer}.`)
      onComplete({won:false})
    } else {
      setClueCount((value)=>Math.min(entry.clues.length,value+1))
      setMessage('Nope. Another clue has been unlocked.')
    }
  }

  function revealClue() {
    if(status!=='playing'||clueCount>=entry.clues.length) return
    setClueCount((value)=>value+1)
    setMessage('Extra clue revealed. Your score ceiling just became slightly less majestic.')
  }

  if(playMode==='CUSTOM'&&phase==='SETUP'){
    return(
      <div className="game-panel guesswork-panel">
        <div className="guesswork-mode-switch">
          <button onClick={()=>switchMode('BUILTIN')}>BUILT-IN</button>
          <button className="active" onClick={()=>switchMode('CUSTOM')}>2 PLAYER</button>
        </div>

        <form className="guesswork-builder" onSubmit={lockCustom}>
          <div className="guesswork-builder-head">
            <span className="micro">PLAYER 1 · MYSTERY BUILDER</span>
            <h3>Create the answer. Control the breadcrumb trail.</h3>
            <p>Write clues from vague to strong. Player 2 sees them one at a time.</p>
          </div>

          <label>
            <span>SECRET ANSWER</span>
            <input type="password" value={customAnswer} onChange={(e)=>setCustomAnswer(e.target.value.slice(0,40))} placeholder="Hidden answer" autoComplete="off"/>
          </label>

          <label>
            <span>CATEGORY <i>OPTIONAL</i></span>
            <input value={customCategory} onChange={(e)=>setCustomCategory(e.target.value.slice(0,28))} placeholder="Movies, people, places…"/>
          </label>

          <div className="guesswork-builder-clues">
            {customClues.map((clue,index)=>(
              <label key={index}>
                <span>CLUE {index+1}{index>1?' · OPTIONAL':''}</span>
                <input value={clue} onChange={(e)=>updateCustomClue(index,e.target.value)} placeholder={index===0?'Most indirect clue':index===1?'Useful clue':index===2?'Stronger clue':'Last-resort clue'}/>
              </label>
            ))}
          </div>

          <div className="guesswork-builder-attempts">
            <span className="micro">WRONG GUESSES ALLOWED</span>
            <div className="filter-chips">
              {ATTEMPT_OPTIONS.map((value)=><button type="button" className={`filter-chip ${maxWrong===value?'active':''}`} onClick={()=>setMaxWrong(value)} key={value}>{value}</button>)}
            </div>
          </div>

          {customError&&<div className="guesswork-builder-error">{customError}</div>}

          <button className="primary-btn" type="submit">Lock mystery & pass device <span>→</span></button>
        </form>
      </div>
    )
  }

  if(playMode==='CUSTOM'&&phase==='PASS'){
    return(
      <div className="game-panel guesswork-panel guesswork-pass">
        <div className="guesswork-pass-mark">?</div>
        <span className="micro">MYSTERY LOCKED</span>
        <h3>Pass the device to Player 2.</h3>
        <p>The answer is hidden. Only the first clue appears when the round starts.</p>
        <div className="guesswork-pass-meta">
          <div><span>CATEGORY</span><strong>{entry.category}</strong></div>
          <div><span>CLUES</span><strong>{entry.clues.length}</strong></div>
          <div><span>TRIES</span><strong>{maxWrong}</strong></div>
        </div>
        <button className="primary-btn" onClick={startCustom}>Player 2 ready <span>→</span></button>
        <button className="text-btn" onClick={()=>setPhase('SETUP')}>← Back to builder</button>
      </div>
    )
  }

  return (
    <div className="game-panel guesswork-panel">
      <div className="guesswork-mode-switch">
        <button className={playMode==='BUILTIN'?'active':''} onClick={()=>switchMode('BUILTIN')}>BUILT-IN</button>
        <button className={playMode==='CUSTOM'?'active':''} onClick={()=>switchMode('CUSTOM')}>2 PLAYER</button>
      </div>

      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">CLUES</span><strong>{clueCount}/{entry.clues.length}</strong></div>
          <div><span className="micro">WRONG</span><strong>{wrong.length}/{maxWrong}</strong></div>
          <div><span className="micro">CATEGORY</span><strong>{entry.category}</strong></div>
        </div>
        <button className="secondary-btn" onClick={()=>reset()}>{playMode==='CUSTOM'?'New custom':'New mystery'}</button>
      </div>

      <div className="guesswork-rules-row">
        {playMode==='BUILTIN'&&(
          <div className="filter-chips guess-categories">
            {CATEGORIES.map((item)=><button className={`filter-chip ${category===item?'active':''}`} onClick={()=>{setCategory(item);reset(item)}} key={item}>{item}</button>)}
          </div>
        )}
        <div className="filter-chips">
          {ATTEMPT_OPTIONS.map((value)=><button className={`filter-chip ${maxWrong===value?'active':''}`} onClick={()=>{setMaxWrong(value);clearRound()}} key={value}>{value} TRIES</button>)}
        </div>
      </div>

      <div className="clue-stack">
        {entry.clues.slice(0,clueCount).map((clue,index)=>(
          <div className="clue-card" key={`${clue}-${index}`}>
            <span>{String(index+1).padStart(2,'0')}</span>
            <p>{clue}</p>
          </div>
        ))}
      </div>

      <form className="guess-entry" onSubmit={submit}>
        <input value={guess} onChange={(e)=>setGuess(e.target.value)} placeholder="Type your answer…" disabled={status!=='playing'} autoCapitalize="off"/>
        <button className="primary-btn" disabled={status!=='playing'||!guess.trim()}>Guess ↗</button>
      </form>

      <div className="guess-actions">
        <button className="secondary-btn" onClick={revealClue} disabled={status!=='playing'||clueCount>=entry.clues.length}>Reveal clue</button>
        <div className="wrong-guesses">
          {wrong.map((item,index)=><span key={`${item}-${index}`}>{item}</span>)}
        </div>
      </div>

      <div className={`game-message ${status}`}>{message}</div>
    </div>
  )
}
