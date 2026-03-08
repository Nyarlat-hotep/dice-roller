/**
 * Arcane sound engine — all sounds generated via Web Audio API.
 * No external files. Single lazy AudioContext, iOS-safe.
 */

let _ctx = null

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // iOS suspends the context until a user gesture — resume on every call
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// ─── Mute state (persisted) ──────────────────────────────────────────────────

let _muted = localStorage.getItem('dr-muted') === 'true'

export function getMuted()       { return _muted }
export function setMuted(value)  {
  _muted = value
  localStorage.setItem('dr-muted', String(value))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function connect(...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1])
}

// ─── Die select — crystal tap ─────────────────────────────────────────────────
// Pitch scales with die size: d4 is low/warm, d100 is high/bright.
// Two harmonically related sines (root + perfect fifth) decay quickly.

export function playDieSelect(sides = 20) {
  if (_muted) return
  const ctx = getCtx()
  const now = ctx.currentTime

  const pitchMap = { 4: 520, 6: 620, 8: 720, 10: 820, 12: 920, 20: 1020, 100: 1180 }
  const base = pitchMap[sides] ?? 880

  ;[[base, 0.13], [base * 1.5, 0.06]].forEach(([freq, vol]) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.frequency.exponentialRampToValueAtTime(freq * 1.04, now + 0.03)
    gain.gain.setValueAtTime(vol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    connect(osc, gain, ctx.destination)
    osc.start(now); osc.stop(now + 0.15)
  })
}

// ─── Roll cast — arcane gathering ─────────────────────────────────────────────
// Low bass drone + rising bandpass sweep + filtered noise whoosh.
// Designed to land right as the particles start converging (~300ms later).

export function playRollCast() {
  if (_muted) return
  const ctx = getCtx()
  const now = ctx.currentTime

  // Bass drone — deep, fades out
  const bass     = ctx.createOscillator()
  const bassGain = ctx.createGain()
  bass.type = 'sine'
  bass.frequency.setValueAtTime(110, now)
  bass.frequency.exponentialRampToValueAtTime(65, now + 0.5)
  bassGain.gain.setValueAtTime(0.20, now)
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  connect(bass, bassGain, ctx.destination)
  bass.start(now); bass.stop(now + 0.51)

  // Rising sweep — sawtooth through bandpass, frequency climbs
  const sweep       = ctx.createOscillator()
  const sweepFilter = ctx.createBiquadFilter()
  const sweepGain   = ctx.createGain()
  sweep.type = 'sawtooth'
  sweep.frequency.setValueAtTime(160, now)
  sweep.frequency.exponentialRampToValueAtTime(2400, now + 0.52)
  sweepFilter.type = 'bandpass'
  sweepFilter.Q.value = 3.5
  sweepFilter.frequency.setValueAtTime(250, now)
  sweepFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.52)
  sweepGain.gain.setValueAtTime(0.0, now)
  sweepGain.gain.linearRampToValueAtTime(0.10, now + 0.07)
  sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52)
  connect(sweep, sweepFilter, sweepGain, ctx.destination)
  sweep.start(now); sweep.stop(now + 0.53)

  // Noise burst — high shimmer texture
  const bufSize = Math.floor(ctx.sampleRate * 0.4)
  const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data    = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const noise       = ctx.createBufferSource()
  noise.buffer      = buf
  const noiseFilter = ctx.createBiquadFilter()
  const noiseGain   = ctx.createGain()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 2200
  noiseFilter.Q.value = 2
  noiseGain.gain.setValueAtTime(0.05, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
  connect(noise, noiseFilter, noiseGain, ctx.destination)
  noise.start(now); noise.stop(now + 0.41)
}

// ─── Digit form — particles crystallising ────────────────────────────────────
// Quick arcane shimmer: three sines in a minor-ish cluster, staggered slightly.
// Plays once per digit as its particles start converging.

export function playDigitForm() {
  if (_muted) return
  const ctx = getCtx()
  const now = ctx.currentTime

  // Eb minor shimmer (arcane / mysterious)
  const freqs = [622.25, 739.99, 932.33]
  freqs.forEach((freq, i) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = now + i * 0.018
    gain.gain.setValueAtTime(0.0, t)
    gain.gain.linearRampToValueAtTime(0.07, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
    connect(osc, gain, ctx.destination)
    osc.start(t); osc.stop(t + 0.26)
  })
}

// ─── Result reveal — all digits formed ───────────────────────────────────────
// Bell arpeggio: C major triad + octave, staggered, with inharmonic overtones
// for a genuine bell-like shimmer. The big pay-off moment.

export function playResultReveal() {
  if (_muted) return
  const ctx = getCtx()
  const now = ctx.currentTime

  const freqs = [261.63, 329.63, 392.00, 523.25] // C4 E4 G4 C5
  freqs.forEach((freq, i) => {
    const t = now + i * 0.045

    // Fundamental
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0, t)
    gain.gain.linearRampToValueAtTime(i === 3 ? 0.15 : 0.11, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0)
    connect(osc, gain, ctx.destination)
    osc.start(t); osc.stop(t + 1.05)

    // Inharmonic bell partial (2.76× — gives that crystalline shimmer)
    const osc2  = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2.756
    gain2.gain.setValueAtTime(0.0, t)
    gain2.gain.linearRampToValueAtTime(0.025, t + 0.008)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
    connect(osc2, gain2, ctx.destination)
    osc2.start(t); osc2.stop(t + 0.3)
  })
}
