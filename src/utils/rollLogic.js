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

export function calculateTotal(rolls, modifier) {
  return rolls.reduce((s, v) => s + v, 0) + modifier
}

export function formatNotation({ count, sides, modifier, mode }) {
  const diePart = `${count}d${sides}`
  const modPart = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''
  const modeSuffix = mode === 'advantage' ? ' ADV' : mode === 'disadvantage' ? ' DIS' : ''
  return `${diePart}${modPart}${modeSuffix}`
}
