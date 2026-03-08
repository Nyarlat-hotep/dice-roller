import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import './Stepper.css'

const variants = {
  initial: (dir) => ({ y: dir > 0 ? 20 : -20, opacity: 0 }),
  animate:         ({ y: 0,  opacity: 1 }),
  exit:    (dir) => ({ y: dir > 0 ? -20 : 20, opacity: 0 }),
}

export default function Stepper({ label, value, onChange, min, max, formatValue }) {
  const prevRef = useRef(value)
  const dirRef  = useRef(0)

  if (value !== prevRef.current) {
    dirRef.current = value > prevRef.current ? 1 : -1
    prevRef.current = value
  }

  const dir = dirRef.current
  const fmt = v => (formatValue ? formatValue(v) : v)

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
          <AnimatePresence initial={false} custom={dir}>
            <motion.span
              key={value}
              className="stepper-value"
              custom={dir}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {fmt(value)}
            </motion.span>
          </AnimatePresence>
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
