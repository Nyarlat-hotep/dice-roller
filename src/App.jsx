import { useState, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { getMuted, setMuted, playRollCast, playDisadvantage } from './utils/sounds'
import RollConfig from './components/RollConfig'
import DiceArena from './components/DiceArena'
import ResultDisplay from './components/ResultDisplay'
import HistoryLog from './components/HistoryLog'
import { rollDice, rollWithAdvantage, rollWithDisadvantage, calculateTotal, formatNotation } from './utils/rollLogic'
import './App.css'

const DEFAULT_CONFIG = { dieType: 20, count: 1, modifier: 0, mode: 'normal' }

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [muted, setMutedState] = useState(() => getMuted())

  const updateConfig = useCallback((patch) => setConfig(c => ({ ...c, ...patch })), [])

  const toggleMute = useCallback(() => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }, [muted])

  const handleRoll = useCallback(() => {
    if (config.mode === 'disadvantage') playDisadvantage()
    else playRollCast()
    const { dieType, count, modifier, mode } = config
    let rolls, dropped = null

    if (mode === 'advantage') {
      const r = rollWithAdvantage(count, dieType)
      rolls = r.kept; dropped = r.dropped
    } else if (mode === 'disadvantage') {
      const r = rollWithDisadvantage(count, dieType)
      rolls = r.kept; dropped = r.dropped
    } else {
      rolls = rollDice(count, dieType)
    }

    const total = calculateTotal(rolls, modifier)
    const notation = formatNotation({ ...config, sides: dieType })
    const entry = { id: Date.now(), notation, rolls, dropped, modifier, total, mode, sides: dieType }

    const revealDelay = 300

    setRolling(true)
    setResult(entry)

    setTimeout(() => {
      setRolling(false)
      setHistory(h => [entry, ...h])
    }, revealDelay)
  }, [config])

  return (
    <div className="app">
      <header className="app-header">
        <button className="mute-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <p className="app-eyebrow">✦ Tome of Fortune ✦</p>
        <h1 className="app-title">Roll the dice</h1>
        <p className="app-subtitle">May they be merciful, traveller</p>
        <div className="app-divider"><span>⟡</span></div>
      </header>
      <RollConfig config={config} onChange={updateConfig} onRoll={handleRoll} rolling={rolling} />
      <DiceArena result={result} rolling={rolling} dieType={config.dieType} mode={config.mode} />
      <ResultDisplay result={result} rolling={rolling} />
      <HistoryLog history={history} />
    </div>
  )
}
