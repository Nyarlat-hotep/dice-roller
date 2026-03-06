import { useState, useCallback } from 'react'
import RollConfig from './components/RollConfig'
import { rollDice, rollWithAdvantage, rollWithDisadvantage, calculateTotal, formatNotation } from './utils/rollLogic'
import './App.css'

const DEFAULT_CONFIG = { dieType: 20, count: 1, modifier: 0, mode: 'normal' }

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const updateConfig = useCallback((patch) => setConfig(c => ({ ...c, ...patch })), [])

  const handleRoll = useCallback(() => {
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
    const notation = formatNotation(config)
    const entry = { id: Date.now(), notation, rolls, dropped, modifier, total, mode, sides: dieType }

    setRolling(true)
    setResult(entry)

    setTimeout(() => {
      setRolling(false)
      setHistory(h => [entry, ...h])
    }, 1200)
  }, [config])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Dice Roller</h1>
        <p className="app-subtitle">Roll the bones</p>
      </header>
      <RollConfig config={config} onChange={updateConfig} onRoll={handleRoll} rolling={rolling} />
      {result && <pre style={{color:'lime',fontSize:'0.7rem'}}>{JSON.stringify(result,null,2)}</pre>}
    </div>
  )
}
