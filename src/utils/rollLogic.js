export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

export function rollDice(count, sides) {
  return Array.from({ length: count }, () => rollDie(sides))
}

export function rollWithAdvantage(count, sides) {
  const setA = rollDice(count, sides)
  const setB = rollDice(count, sides)
  const totalA = setA.reduce((s, v) => s + v, 0)
  const totalB = setB.reduce((s, v) => s + v, 0)
  return totalA >= totalB
    ? { kept: setA, dropped: setB }
    : { kept: setB, dropped: setA }
}

export function rollWithDisadvantage(count, sides) {
  const setA = rollDice(count, sides)
  const setB = rollDice(count, sides)
  const totalA = setA.reduce((s, v) => s + v, 0)
  const totalB = setB.reduce((s, v) => s + v, 0)
  return totalA <= totalB
    ? { kept: setA, dropped: setB }
    : { kept: setB, dropped: setA }
}

// Roll a chain of differing dice terms, e.g. [{ sides: 20, count: 1 }, { sides: 4, count: 2 }].
// Returns a flat list of { sides, value } in chain order so each die keeps its identity.
export function rollChain(terms) {
  return terms.flatMap(({ sides, count }) =>
    Array.from({ length: count }, () => ({ sides, value: rollDie(sides) }))
  )
}

export function calculateTotal(rolls, modifier) {
  return rolls.reduce((s, v) => s + (typeof v === 'number' ? v : v.value), 0) + modifier
}

// Accepts either the chain shape { terms, modifier, mode } or the legacy
// single-die shape { count, sides, modifier, mode }.
export function formatNotation({ terms, count, sides, modifier = 0, mode = 'normal' }) {
  const list = terms ?? [{ sides, count }]
  const diePart = list.map(t => `${t.count}d${t.sides}`).join(' + ')
  const modPart = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''
  const modeSuffix = mode === 'advantage' ? ' ADV' : mode === 'disadvantage' ? ' DIS' : ''
  return `${diePart}${modPart}${modeSuffix}`
}
