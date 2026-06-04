import { RotateCcw } from 'lucide-react'
import DieSelector from './DieSelector'
import ChainBar from './ChainBar'
import Stepper from './Stepper'
import ModeToggle from './ModeToggle'
import RollButton from './RollButton'
import './RollConfig.css'

export default function RollConfig({ config, onChange, onAddDie, onRemoveDie, onRoll, onReset, rolling }) {
  const { terms, modifier, mode } = config
  const activeSides = new Set(terms.map(t => t.sides))
  const chained     = terms.length >= 2
  const canRoll     = terms.length > 0

  return (
    <div className="roll-config panel">
      <button
        type="button"
        className="roll-config-reset"
        onClick={onReset}
        aria-label="Reset to defaults"
        title="Reset"
      >
        <RotateCcw size={16} />
      </button>
      <DieSelector activeSides={activeSides} onAdd={onAddDie} />
      <ChainBar terms={terms} modifier={modifier} onRemoveDie={onRemoveDie} />
      <div className="roll-config-row">
        <Stepper
          label="Modifier"
          value={modifier}
          onChange={v => onChange({ modifier: v })}
          min={-20}
          max={20}
          formatValue={v => (v > 0 ? `+${v}` : `${v}`)}
        />
      </div>
      <div className="roll-config-row">
        <ModeToggle
          mode={chained ? 'normal' : mode}
          onChange={v => onChange({ mode: v })}
          disabled={chained}
          disabledHint="single die type only"
        />
      </div>
      <div className="roll-config-row">
        <RollButton onClick={onRoll} rolling={rolling} disabled={!canRoll} />
      </div>
    </div>
  )
}
