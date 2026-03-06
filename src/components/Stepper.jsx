import './Stepper.css'

export default function Stepper({ label, value, onChange, min, max, formatValue }) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >−</button>
        <span className="stepper-value">
          {formatValue ? formatValue(value) : value}
        </span>
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >+</button>
      </div>
    </div>
  )
}
