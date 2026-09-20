import { useEffect, useState } from 'react'
import { GENERATIONS, fetchPokemonById, pokemonSuggestions, randomPokemonId, resolvePokemonGuess } from '../lib/pokemon'

const MAX_GUESSES=6

function compareNumber(value,target){
  if(value===target)return 'equal'
  return value<target?'up':'down'
}

export default function PokemonGuess({onComplete}){
  const [generation,setGeneration]=useState('ALL')
  const [target,setTarget]=useState(null)
  const [input,setInput]=useState('')
  const [suggestions,setSuggestions]=useState([])
  const [guesses,setGuesses]=useState([])
  const [status,setStatus]=useState('loading')
  const [error,setError]=useState('')

  async function reset(nextGen=generation){
    setGeneration(String(nextGen))
    setInput('')
    setSuggestions([])
    setGuesses([])
    setStatus('loading')
    setError('')
    try{
      const id=randomPokemonId(String(nextGen))
      setTarget(await fetchPokemonById(id))
      setStatus('playing')
    }catch(err){
      setError(err instanceof Error?err.message:'Could not load Pokémon.')
      setStatus('error')
    }
  }

  useEffect(()=>{reset('ALL')},[])

  useEffect(()=>{
    let live=true
    if(!input.trim()){
      setSuggestions([])
      return undefined
    }
    pokemonSuggestions(input).then((items)=>{if(live)setSuggestions(items)}).catch(()=>{})
    return()=>{live=false}
  },[input])

  async function submit(value=input){
    if(status!=='playing'||!value.trim()||!target)return
    const resolved=await resolvePokemonGuess(value)
    if(!resolved){
      setError('That name is not in the National Dex.')
      return
    }
    if(guesses.some((g)=>g.id===resolved.id)){
      setError('Already guessed that one.')
      return
    }
    setError('')
    const mon=await fetchPokemonById(resolved.id)
    const next=[...guesses,mon]
    setGuesses(next)
    setInput('')
    setSuggestions([])
    if(mon.id===target.id){
      setStatus('won')
      onComplete({won:true,score:next.length,lowerIsBetter:true,bonusXp:Math.max(8,42-next.length*6)})
    }else if(next.length>=MAX_GUESSES){
      setStatus('lost')
      onComplete({won:false,score:MAX_GUESSES,lowerIsBetter:true})
    }
  }

  const clueCount=guesses.length

  return(
    <div className="game-panel pokeguess-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">GUESSES</span><strong>{guesses.length}/{MAX_GUESSES}</strong></div>
          <div><span className="micro">POOL</span><strong>{generation==='ALL'?'GEN 1–9':'GEN '+generation}</strong></div>
        </div>
        <button className="secondary-btn" onClick={()=>reset()}>New Pokémon</button>
      </div>

      <div className="filter-chips pokemon-gen-filter">
        {GENERATIONS.map((gen)=><button className={'filter-chip '+(generation===gen.id?'active':'')} onClick={()=>reset(gen.id)} key={gen.id}>{gen.id==='ALL'?'ALL':'G'+gen.id}</button>)}
      </div>

      <div className="poke-clue-ladder">
        <div className={clueCount>=1?'revealed':''}><span>01</span><strong>{clueCount>=1?'Generation '+target?.generation:'Generation'}</strong></div>
        <div className={clueCount>=2?'revealed':''}><span>02</span><strong>{clueCount>=2?(target?.types.length+' type'+(target?.types.length===1?'':'s')):'Type count'}</strong></div>
        <div className={clueCount>=3?'revealed':''}><span>03</span><strong>{clueCount>=3?target?.types[0]:'Primary type'}</strong></div>
        <div className={clueCount>=4?'revealed':''}><span>04</span><strong>{clueCount>=4?('Starts with “'+target?.name[0]+'”'):'First letter'}</strong></div>
        <div className={clueCount>=5?'revealed':''}><span>05</span><strong>{clueCount>=5?(target?.height+'m · '+target?.weight+'kg'):'Size'}</strong></div>
      </div>

      {(status==='won'||status==='lost')&&target&&
        <div className="pokeguess-reveal">
          <img src={target.sprite} alt={target.name}/>
          <div><span className="micro">ANSWER</span><strong>{target.name}</strong><small>{target.types.join(' / ')}</small></div>
        </div>
      }

      {status==='playing'&&(
        <div className="pokemon-guess-input">
          <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter')submit()}} placeholder="Guess a Pokémon…" autoCapitalize="off" autoCorrect="off"/>
          <button className="primary-btn" onClick={()=>submit()} disabled={!input.trim()}>Guess ↗</button>
          {suggestions.length>0&&<div className="pokemon-suggestions">{suggestions.map((item)=><button onClick={()=>{setInput(item.name);setSuggestions([])}} key={item.id}>#{String(item.id).padStart(4,'0')} <strong>{item.name}</strong></button>)}</div>}
        </div>
      )}

      <div className="poke-guess-history">
        {guesses.map((mon)=>{
          const typeOverlap=mon.types.some((type)=>target.types.includes(type))
          const genCmp=compareNumber(Number(mon.generation),Number(target.generation))
          const hCmp=compareNumber(mon.height,target.height)
          const wCmp=compareNumber(mon.weight,target.weight)
          return <div className={'poke-guess-row '+(mon.id===target.id?'correct':'')} key={mon.id}>
            <div><img src={mon.pixel||mon.sprite} alt=""/><strong>{mon.name}</strong></div>
            <span className={mon.generation===target.generation?'match':''}>G{mon.generation} {genCmp==='up'?'↑':genCmp==='down'?'↓':''}</span>
            <span className={typeOverlap?'partial':''}>{mon.types.join('/')}</span>
            <span className={mon.height===target.height?'match':''}>{mon.height}m {hCmp==='up'?'↑':hCmp==='down'?'↓':''}</span>
            <span className={mon.weight===target.weight?'match':''}>{mon.weight}kg {wCmp==='up'?'↑':wCmp==='down'?'↓':''}</span>
          </div>
        })}
      </div>

      <div className={'game-message '+(status==='won'?'won':status==='lost'?'lost':'')}>
        {error || (status==='loading'?'Loading a Pokémon…':status==='won'?(target.name+' found in '+guesses.length+' guess'+(guesses.length===1?'':'es')+'.'):status==='lost'?'The answer escaped the ball.':'Each wrong guess reveals another clue. Arrows mean the target value is higher or lower.')}
      </div>
    </div>
  )
}
