import { describe, it, expect, vi } from 'vitest'
import {
  rollDie,
  rollDice,
  rollChain,
  rollWithAdvantage,
  rollWithDisadvantage,
  calculateTotal,
  formatNotation,
} from '../utils/rollLogic'

describe('rollDie', () => {
  it('returns integer within [1, sides]', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie(20)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
      expect(Number.isInteger(result)).toBe(true)
    }
  })
})

describe('rollDice', () => {
  it('returns array of length count', () => {
    expect(rollDice(3, 6)).toHaveLength(3)
  })
  it('each value is within [1, sides]', () => {
    rollDice(10, 8).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(8)
    })
  })
})

describe('rollWithAdvantage', () => {
  it('returns object with kept (max) and dropped arrays', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9)
    const result = rollWithAdvantage(1, 20)
    expect(result.kept[0]).toBeGreaterThan(result.dropped[0])
    vi.restoreAllMocks()
  })
})

describe('rollWithDisadvantage', () => {
  it('returns object with kept (min) and dropped arrays', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9)
    const result = rollWithDisadvantage(1, 20)
    expect(result.kept[0]).toBeLessThan(result.dropped[0])
    vi.restoreAllMocks()
  })
})

describe('rollChain', () => {
  it('returns one { sides, value } per die across all terms, in order', () => {
    const rolls = rollChain([{ sides: 20, count: 1 }, { sides: 4, count: 2 }])
    expect(rolls).toHaveLength(3)
    expect(rolls.map(r => r.sides)).toEqual([20, 4, 4])
    rolls.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(1)
      expect(r.value).toBeLessThanOrEqual(r.sides)
    })
  })
})

describe('calculateTotal', () => {
  it('sums rolls and adds modifier', () => {
    expect(calculateTotal([4, 6, 8], 2)).toBe(20)
    expect(calculateTotal([10], -3)).toBe(7)
  })
  it('sums { sides, value } chain rolls', () => {
    expect(calculateTotal([{ sides: 20, value: 15 }, { sides: 4, value: 3 }], 2)).toBe(20)
  })
})

describe('formatNotation', () => {
  it('formats standard roll', () => {
    expect(formatNotation({ count: 3, sides: 8, modifier: 2, mode: 'normal' })).toBe('3d8+2')
  })
  it('omits zero modifier', () => {
    expect(formatNotation({ count: 1, sides: 20, modifier: 0, mode: 'normal' })).toBe('1d20')
  })
  it('includes ADV/DIS suffix', () => {
    expect(formatNotation({ count: 1, sides: 20, modifier: 0, mode: 'advantage' })).toBe('1d20 ADV')
    expect(formatNotation({ count: 1, sides: 20, modifier: 0, mode: 'disadvantage' })).toBe('1d20 DIS')
  })
  it('chains multiple dice terms', () => {
    expect(formatNotation({ terms: [{ sides: 20, count: 1 }, { sides: 4, count: 2 }], modifier: 3 }))
      .toBe('1d20 + 2d4+3')
  })
})
