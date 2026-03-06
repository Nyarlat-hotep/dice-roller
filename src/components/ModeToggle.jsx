import './ModeToggle.css'

const MODES = [
  { value: 'advantage',    label: 'ADV' },
  { value: 'normal',       label: 'NORMAL' },
  { value: 'disadvantage', label: 'DIS' },
]

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          className={`mode-btn${mode === value ? ' mode-btn--active' : ''}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
