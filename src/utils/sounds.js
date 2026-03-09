// ─── Mute state (persisted) ──────────────────────────────────────────────────

let _muted = localStorage.getItem('dr-muted') === 'true'

export function getMuted()       { return _muted }
export function setMuted(value)  {
  _muted = value
  localStorage.setItem('dr-muted', String(value))
}

// ─── Audio file helper ────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

function playFile(src, volume = 1) {
  if (_muted) return
  const audio = new Audio(`${BASE}${src}`)
  audio.volume = volume
  audio.play().catch(err => console.error('[sound] failed:', src, err))
}

// ─── Sounds ───────────────────────────────────────────────────────────────────

export function playDieSelect()      { playFile('/sounds/die-click.mp3', 0.8) }
export function playStepperClick()   { playFile('/sounds/die-click.mp3', 0.5) }
export function playRollCast()       { playFile('/sounds/roll-cast2.mp3', 1.0) }
export function playDisadvantage()   { playFile('/sounds/disadvantage.mp3', 1.0) }

// Placeholders — wire up to real files when sounds are ready
export function playDigitForm()   {}
export function playResultReveal() {}
