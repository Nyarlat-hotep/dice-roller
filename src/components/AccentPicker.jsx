import { useState, useEffect, useRef } from 'react'
import { Palette } from 'lucide-react'
import './AccentPicker.css'

// Curated accents — all chosen for legible contrast on the dark backdrop.
const ACCENTS = [
  { key: 'gold',   label: 'Gold',   swatch: 'rgb(212, 176, 48)' },
  { key: 'red',    label: 'Red',    swatch: 'rgb(224, 64, 72)' },
  { key: 'orange', label: 'Orange', swatch: 'rgb(240, 140, 48)' },
  { key: 'green',  label: 'Green',  swatch: 'rgb(76, 200, 110)' },
  { key: 'blue',   label: 'Blue',   swatch: 'rgb(64, 150, 240)' },
  { key: 'purple', label: 'Purple', swatch: 'rgb(168, 110, 240)' },
  { key: 'pink',   label: 'Pink',   swatch: 'rgb(240, 110, 180)' },
  { key: 'gray',   label: 'Gray',   swatch: 'rgb(170, 178, 192)' },
]

const STORAGE_KEY = 'dice-accent'

export function getStoredAccent() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return ACCENTS.some(a => a.key === stored) ? stored : 'gold'
}

export function applyAccent(key) {
  document.documentElement.setAttribute('data-accent', key)
  localStorage.setItem(STORAGE_KEY, key)
}

export default function AccentPicker() {
  const [accent, setAccent] = useState(() => getStoredAccent())
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close the popover on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = key => {
    setAccent(key)
    applyAccent(key)
    setOpen(false)
  }

  return (
    <div className="accent-picker" ref={ref}>
      <button
        className="accent-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Change accent colour"
        aria-expanded={open}
      >
        <Palette size={16} />
      </button>
      {open && (
        <div className="accent-popover" role="listbox" aria-label="Accent colour">
          {ACCENTS.map(a => (
            <button
              key={a.key}
              className={`accent-swatch${a.key === accent ? ' accent-swatch--active' : ''}`}
              style={{ '--swatch': a.swatch }}
              onClick={() => choose(a.key)}
              role="option"
              aria-selected={a.key === accent}
              aria-label={a.label}
              title={a.label}
            />
          ))}
        </div>
      )}
    </div>
  )
}
