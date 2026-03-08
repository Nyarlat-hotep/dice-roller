import DieSelector from './DieSelector'
import Stepper from './Stepper'
import ModeToggle from './ModeToggle'
import RollButton from './RollButton'
import './RollConfig.css'

export default function RollConfig({ config, onChange, onRoll, rolling }) {
  const { dieType, count, modifier, mode } = config

  return (
    <div className="roll-config panel">
      <DieSelector selected={dieType} onChange={v => onChange({ dieType: v })} />
      <div className="roll-config-row">
        <Stepper
          label="Count"
          value={count}
          onChange={v => onChange({ count: v })}
          min={1}
          max={10}
          formatValue={v => v}
        />
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
        <ModeToggle mode={mode} onChange={v => onChange({ mode: v })} />
      </div>
      <div className="roll-config-row">
        <RollButton onClick={onRoll} rolling={rolling} />
      </div>
    </div>
  )
}
