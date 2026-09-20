const MAX_ID = 1025
const pokemonCache = new Map()
let indexPromise = null

export const GENERATIONS = [
  { id: 'ALL', label: 'All generations', start: 1, end: MAX_ID },
  { id: '1', label: 'Gen 1', start: 1, end: 151 },
  { id: '2', label: 'Gen 2', start: 152, end: 251 },
  { id: '3', label: 'Gen 3', start: 252, end: 386 },
  { id: '4', label: 'Gen 4', start: 387, end: 493 },
  { id: '5', label: 'Gen 5', start: 494, end: 649 },
  { id: '6', label: 'Gen 6', start: 650, end: 721 },
  { id: '7', label: 'Gen 7', start: 722, end: 809 },
  { id: '8', label: 'Gen 8', start: 810, end: 905 },
  { id: '9', label: 'Gen 9', start: 906, end: MAX_ID },
]

export function generationForId(id) {
  return GENERATIONS.find((gen) => gen.id !== 'ALL' && id >= gen.start && id <= gen.end)?.id || '?'
}

export function prettyPokemonName(value) {
  return String(value)
    .split('-')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ')
}

export function normalizePokemonGuess(value) {
  return String(value).trim().toLowerCase().replace(/[.’']/g, '').replace(/[^a-z0-9]/g, '')
}

export async function fetchPokemonIndex() {
  if (!indexPromise) {
    indexPromise = fetch(`https://pokeapi.co/api/v2/pokemon-species?limit=${MAX_ID}`)
      .then((response) => {
        if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`)
        return response.json()
      })
      .then((data) => data.results.map((item, index) => {
        const match = String(item.url || '').match(/\/pokemon-species\/(\d+)\/?$/)
        const id = match ? Number(match[1]) : index + 1
        return {
          id,
          apiName: item.name,
          name: prettyPokemonName(item.name),
          normalized: normalizePokemonGuess(item.name),
        }
      }))
      .catch((error) => {
        indexPromise = null
        throw error
      })
  }
  return indexPromise
}

export async function fetchPokemonById(id) {
  if (pokemonCache.has(id)) return pokemonCache.get(id)

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`)
  const data = await response.json()

  const result = {
    id: data.id,
    apiName: data.name,
    name: prettyPokemonName(data.name),
    normalized: normalizePokemonGuess(data.name),
    types: data.types.map((entry) => prettyPokemonName(entry.type.name)),
    abilities: data.abilities.map((entry) => prettyPokemonName(entry.ability.name)),
    height: data.height / 10,
    weight: data.weight / 10,
    stats: Object.fromEntries(data.stats.map((entry) => [entry.stat.name, entry.base_stat])),
    bst: data.stats.reduce((sum, entry) => sum + entry.base_stat, 0),
    sprite:
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.other?.home?.front_default ||
      data.sprites?.front_default ||
      '',
    pixel: data.sprites?.front_default || '',
    generation: generationForId(data.id),
  }

  pokemonCache.set(id, result)
  return result
}

export function randomPokemonId(generation = 'ALL', exclude = []) {
  const gen = GENERATIONS.find((item) => item.id === String(generation)) || GENERATIONS[0]
  const blocked = new Set(exclude)
  const pool = []
  for (let id = gen.start; id <= gen.end; id += 1) {
    if (!blocked.has(id)) pool.push(id)
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export async function pokemonSuggestions(query, limit = 8, generation = 'ALL') {
  const normalized = normalizePokemonGuess(query)
  if (!normalized) return []
  const index = await fetchPokemonIndex()
  const gen = GENERATIONS.find((item) => item.id === String(generation)) || GENERATIONS[0]
  return index
    .filter((item) =>
      item.id >= gen.start &&
      item.id <= gen.end &&
      (item.normalized.startsWith(normalized) || item.normalized.includes(normalized))
    )
    .sort((a, b) => {
      const aStarts = a.normalized.startsWith(normalized) ? 0 : 1
      const bStarts = b.normalized.startsWith(normalized) ? 0 : 1
      return aStarts - bStarts || a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}

export async function resolvePokemonGuess(value, generation = 'ALL') {
  const normalized = normalizePokemonGuess(value)
  const index = await fetchPokemonIndex()
  const gen = GENERATIONS.find((item) => item.id === String(generation)) || GENERATIONS[0]
  return index.find(
    (item) =>
      item.id >= gen.start &&
      item.id <= gen.end &&
      item.normalized === normalized,
  ) || null
}
