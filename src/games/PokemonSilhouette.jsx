import { useEffect, useRef, useState } from 'react'
import { GENERATIONS, fetchPokemonById, pokemonSuggestions, randomPokemonId, resolvePokemonGuess } from '../lib/pokemon'

const MAX=5

export default function PokemonSilhouette({onComplete}){
  const [generation,setGeneration]=useState('ALL')
  const [target,setTarget]=useState(null)
  const [input,setInput]=useState('')
  const [suggestions,setSuggestions]=useState([])
  const [wrong,setWrong]=useState([])
  const [status,setStatus]=useState('loading')
  const [error,setError]=useState('')
  const requestId=useRef(0)

  async function reset(nextGen=generation){
    const token=++requestId.current
    setGeneration(String(nextGen))
    setInput('')
    setSuggestions([])
    setWrong([])
    setStatus('loading')
    setError('')
    try{
      const loaded=await fetchPokemonById(randomPokemonId(String(nextGen)))
      if(token!==requestId.current)return
      setTarget(loaded)
      setStatus('playing')
    }catch(err){
      if(token!==requestId.current)return
      setError(err instanceof Error?err.message:'Could not load silhouette.')
      setStatus('error')
    }
  }

  useEffect(()=>{reset('ALL');return()=>{requestId.current+=1}},[])

  useEffect(()=>{
    let live=true
    if(!input.trim()){
      setSuggestions([])
      return undefined
    }
    pokemonSuggestions(input).then((value)=>{if(live)setSuggestions(value)}).catch(()=>{})
    return()=>{live=false}
  },[input])

  async function submit(value=input){
    if(status!=='playing'||!target||!value.trim())return
    const resolved=await resolvePokemonGuess(value)
    if(!resolved){
      setError('Unknown National Dex name.')
      return
    }
    if(wrong.includes(resolved.id)){
      setError('Already tried that Pokémon.')
      return
    }
    setError('')
    setInput('')
    setSuggestions([])

    if(resolved.id===target.id){
      const attempts=wrong.length+1
      setStatus('won')
      onComplete({won:true,score:attempts,lowerIsBetter:true,bonusXp:Math.max(10,40-attempts*6)})
      return
    }

    const next=[...wrong,resolved.id]
    setWrong(next)
    if(next.length>=MAX){
      setStatus('lost')
      onComplete({won:false})
    }
  }

  const reveal=wrong.length

  return(
    <div className="game-panel silhouette-panel">
      <div className="game-toolbar">
        <div className="mine-stats">
          <div><span className="micro">TRIES</span><strong>{wrong.length}/{MAX}</strong></div>
          <div><span className="micro">POOL</span><strong>{generation==='ALL'?'GEN 1–9':'GEN '+generation}</strong></div>
        </div>
        <button className="secondary-btn" onClick={()=>reset()}>New shadow</button>
      </div>

      <div className="filter-chips pokemon-gen-filter">
        {GENERATIONS.map((gen)=><button className={'filter-chip '+(generation===gen.id?'active':'')} onClick={()=>reset(gen.id)} key={gen.id}>{gen.id==='ALL'?'ALL':'G'+gen.id}</button>)}
      </div>

      <div className={'silhouette-stage reveal-'+Math.min(reveal,4)+' '+status}>
        {target&&<img src={target.sprite} alt={status==='won'||status==='lost'?target.name:'Hidden Pokémon'} />}
        <div className="silhouette-ring"/>
        {(status==='won'||status==='lost')&&target&&
          <div className="silhouette-name">
            <span className="micro">#{String(target.id).padStart(4,'0')}</span>
            <strong>{target.name}</strong>
            <small>{target.types.join(' / ')}</small>
          </div>
        }
      </div>

      <div className="silhouette-clues">
        <span className={reveal>=1?'on':''}>{reveal>=1?'GEN '+target?.generation:'GEN ?'}</span>
        <span className={reveal>=2?'on':''}>{reveal>=2?(target?.types.length+' TYPE'+(target?.types.length===1?'':'S')):'TYPE COUNT ?'}</span>
        <span className={reveal>=3?'on':''}>{reveal>=3?target?.types[0].toUpperCase():'PRIMARY TYPE ?'}</span>
        <span className={reveal>=4?'on':''}>{reveal>=4?'STARTS '+target?.name[0].toUpperCase():'FIRST LETTER ?'}</span>
      </div>

      {status==='playing'&&
        <div className="pokemon-guess-input">
          <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter')submit()}} placeholder="Who's that Pokémon?" autoCapitalize="off" autoCorrect="off"/>
          <button className="primary-btn" onClick={()=>submit()} disabled={!input.trim()}>Lock guess ↗</button>
          {suggestions.length>0&&<div className="pokemon-suggestions">{suggestions.map((item)=><button onClick={()=>{setInput(item.name);setSuggestions([])}} key={item.id}>{item.name}</button>)}</div>}
        </div>
      }

      <div className="silhouette-wrongs">{wrong.map((id)=><span key={id}>#{String(id).padStart(4,'0')}</span>)}</div>

      <div className={'game-message '+(status==='won'?'won':status==='lost'?'lost':'')}>
        {error || (status==='loading'?'Summoning a suspiciously dark Pokémon…':status==='won'?(target.name+'. Shadow defeated.'):status==='lost'?('It was '+target?.name+'. The silhouette wins this round.'):'Wrong guesses gradually unlock clues and a little more visual information.')}
      </div>
    </div>
  )
}
