import { useRef, useEffect, useState } from 'react'
import { playDieSelect } from '../utils/sounds'
import './ModeToggle.css'

const MODES = [
  { value: 'advantage',    label: 'ADV' },
  { value: 'normal',       label: 'NORMAL' },
  { value: 'disadvantage', label: 'DIS' },
]

export default function ModeToggle({ mode, onChange, disabled = false, disabledHint }) {
  const activeIndex = MODES.findIndex(m => m.value === mode)
  const btnRefs     = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const btn = btnRefs.current[activeIndex]
    if (!btn) return
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [activeIndex])

  return (
    <div
      className={`mode-toggle${disabled ? ' mode-toggle--disabled' : ''}`}
      title={disabled ? disabledHint : undefined}
    >
      <div className="mode-indicator" style={{ left: indicator.left, width: indicator.width }} />
      {MODES.map(({ value, label }, i) => (
        <button
          key={value}
          ref={el => { btnRefs.current[i] = el }}
          className={`mode-btn${mode === value ? ' mode-btn--active' : ''}`}
          disabled={disabled}
          onClick={() => { playDieSelect(); onChange(value) }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
