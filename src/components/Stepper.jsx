import { useState, useLayoutEffect, useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import './Stepper.css'

export default function Stepper({ label, value, onChange, min, max, formatValue }) {
  const [anim, setAnim] = useState({ key: 0, leaving: null, dir: 0 })
  const prevRef = useRef(value)

  useLayoutEffect(() => {
    if (value === prevRef.current) return
    const dir  = value > prevRef.current ? 1 : -1
    const prev = prevRef.current
    prevRef.current = value

    setAnim(a => ({ key: a.key + 1, leaving: prev, dir }))

    const t = setTimeout(() => setAnim(a => ({ ...a, leaving: null })), 750)
    return () => clearTimeout(t)
  }, [value])

  const fmt = v => (formatValue ? formatValue(v) : v)
  const exitClass  = anim.dir > 0 ? 'stepper-value--exit-up'   : 'stepper-value--exit-down'
  const enterClass = anim.leaving !== null
    ? (anim.dir > 0 ? 'stepper-value--enter-up' : 'stepper-value--enter-down')
    : ''

  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus size={14} />
        </button>
        <div className="stepper-value-wrapper">
          {anim.leaving !== null && (
            <span className={`stepper-value ${exitClass}`}>
              {fmt(anim.leaving)}
            </span>
          )}
          <span key={anim.key} className={`stepper-value ${enterClass}`}>
            {fmt(value)}
          </span>
        </div>
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
