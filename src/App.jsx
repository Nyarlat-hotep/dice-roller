import { useState, useCallback, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { getMuted, setMuted, playRollCast, playDisadvantage } from './utils/sounds'
import RollConfig from './components/RollConfig'
import DiceArena from './components/DiceArena'
import ResultDisplay from './components/ResultDisplay'
import HistoryLog from './components/HistoryLog'
import { rollChain, rollWithAdvantage, rollWithDisadvantage, calculateTotal, formatNotation } from './utils/rollLogic'
import CustomCursor from './components/CustomCursor'
import './App.css'

const DEFAULT_CONFIG = { terms: [{ sides: 20, count: 1 }], modifier: 0, mode: 'normal' }
const MAX_DICE = 12 // total dice across the chain — keeps the particle arena legible

const totalDice = terms => terms.reduce((s, t) => s + t.count, 0)
// Adv/Dis only makes sense on a single die type; a mixed chain forces normal.
const isChain = terms => terms.length >= 2

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [history, setHistory] = useState([])
  const [muted, setMutedState] = useState(() => getMuted())
  const pendingEntryRef = useRef(null)

  const updateConfig = useCallback((patch) => setConfig(c => ({ ...c, ...patch })), [])

  // Tap a die: increment its term if present, else append a new one.
  const addDie = useCallback((sides) => setConfig(c => {
    if (totalDice(c.terms) >= MAX_DICE) return c
    const idx = c.terms.findIndex(t => t.sides === sides)
    const terms = idx >= 0
      ? c.terms.map((t, i) => i === idx ? { ...t, count: t.count + 1 } : t)
      : [...c.terms, { sides, count: 1 }]
    return { ...c, terms, mode: isChain(terms) ? 'normal' : c.mode }
  }), [])

  // Tap a chain chip: remove one die of that type; drop the term at zero.
  const removeDie = useCallback((sides) => setConfig(c => {
    const terms = c.terms
      .map(t => t.sides === sides ? { ...t, count: t.count - 1 } : t)
      .filter(t => t.count > 0)
    return { ...c, terms }
  }), [])

  const toggleMute = useCallback(() => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }, [muted])

  const handleRoll = useCallback(() => {
    const { terms, modifier } = config
    if (terms.length === 0) return
    const mode = isChain(terms) ? 'normal' : config.mode

    if (mode === 'disadvantage') playDisadvantage()
    else playRollCast()

    let rolls, dropped = null
    if (mode === 'advantage' || mode === 'disadvantage') {
      const { sides, count } = terms[0]
      const r = mode === 'advantage' ? rollWithAdvantage(count, sides) : rollWithDisadvantage(count, sides)
      rolls   = r.kept.map(value => ({ sides, value }))
      dropped = r.dropped.map(value => ({ sides, value }))
    } else {
      rolls = rollChain(terms)
    }

    const total = calculateTotal(rolls, modifier)
    const notation = formatNotation({ terms, modifier, mode })
    const entry = { id: Date.now(), notation, rolls, dropped, modifier, total, mode }

    pendingEntryRef.current = entry
    setRolling(true)
    setRevealed(false)
    setResult(entry)

    setTimeout(() => setRolling(false), 300)
  }, [config])

  return (
    <div className="app">
      <CustomCursor />
      <header className="app-header">
        <button className="mute-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <p className="app-eyebrow">✦ Tome of Fortune ✦</p>
        <h1 className="app-title">Roll the dice</h1>
        <p className="app-subtitle">May they be merciful, traveller</p>
        <div className="app-divider"><span>⟡</span></div>
      </header>
      <RollConfig
        config={config}
        onChange={updateConfig}
        onAddDie={addDie}
        onRemoveDie={removeDie}
        onRoll={handleRoll}
        onReset={() => setConfig(DEFAULT_CONFIG)}
        rolling={rolling}
      />
      <DiceArena result={result} rolling={rolling} dieType={config.terms[config.terms.length - 1]?.sides ?? 20} mode={config.mode} onFormed={() => {
        setRevealed(true)
        const entry = pendingEntryRef.current
        pendingEntryRef.current = null
        if (entry) setHistory(h => [entry, ...h])
      }} />
      <ResultDisplay result={result} rolling={rolling} revealed={revealed} />
      <HistoryLog history={history} />
    </div>
  )
}
