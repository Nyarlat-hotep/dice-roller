import { useRef, useEffect } from 'react'
import { playDigitForm, playResultReveal } from '../utils/sounds'
import './DiceArena.css'

const PARTICLE_COUNT        = 300
const PARTICLE_COUNT_MOBILE = 500
const STAR_COLORS = ['#ffffff', '#e8f4ff', '#ffeedd', '#d4e8ff', '#ccddff']
const DIE_COLORS = {
  4:   '#e04820',
  6:   '#3a9e48',
  8:   '#2880d0',
  10:  '#8848e0',
  12:  '#20a898',
  20:  '#d4b030',
  100: '#c030a0',
}
const FORM_DURATION      = 400   // ms to show each digit before starting the next
const HOLD_DURATION      = 2500  // ms all digits stay visible before dissipating
const HOLD_REVEAL_DELAY  = 2000   // ms into hold phase before revealing the total (lets particles fully settle)
const LERP_IN            = 0.04  // fraction of remaining distance closed per frame (lerp, no bounce)
const RELEASE_FADE_RATE  = 0.005 // opacity decrease per frame when dissolving back into cloud
const MAX_WANDER_SPEED   = 0.8

function pickColor() {
  return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
}


function makeParticles(W, H, count) {
  const mobile = W < 600
  const n = count ?? (mobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT)
  return Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: mobile ? Math.random() * 0.6 + 0.35 : Math.random() * 1.5 + 0.5,
    baseOpacity: mobile ? Math.random() * 0.1 + 0.9 : Math.random() * 0.3 + 0.6,
    opacity: 0,
    color: pickColor(),
    tx: null,
    ty: null,
    phase: 'wander',
  }))
}

function sampleDigit(label, count, mobile = false) {
  const size = 200
  const ofc = document.createElement('canvas')
  ofc.width = size; ofc.height = size
  const ctx = ofc.getContext('2d')
  const fontSize = String(label).length > 1 ? 110 : 140
  ctx.fillStyle = '#fff'
  // heavier font weight on mobile fills strokes more densely with the same particle count
  ctx.font = `${mobile ? 900 : 'bold'} ${fontSize}px 'Metamorphous', serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(label), size / 2, size / 2)
  const data = ctx.getImageData(0, 0, size, size).data
  const lit = []
  for (let i = 0; i < size * size; i++) {
    if (data[i * 4 + 3] > 64) lit.push([i % size, Math.floor(i / size)])
  }
  const step = Math.max(1, Math.floor(lit.length / count))
  return lit.filter((_, i) => i % step === 0).slice(0, count)
}

export default function DiceArena({ result, rolling, dieType, mode, onFormed }) {
  const canvasRef    = useRef()
  const particlesRef = useRef(null)
  const dieTypeRef   = useRef(dieType)
  const onFormedRef  = useRef(onFormed)
  useEffect(() => { onFormedRef.current = onFormed }, [onFormed])
  const stateRef     = useRef({
    phase: 'wander',
    digitAssignments: [],
    formingDigit: 0,
    formingStart: 0,
    holdStart: 0,
    revealFired: false,
  })
  const rafRef = useRef()

  // Animation loop — runs once on mount
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const resize = () => {
      if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      if (!particlesRef.current) {
        particlesRef.current = makeParticles(canvas.width, canvas.height)
      }
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize() // also call immediately in case already laid out

    let lastTime = performance.now()

    function tick(now) {
      rafRef.current = requestAnimationFrame(tick)
      const dt = Math.min((now - lastTime) / 1000, 0.05) // seconds, capped at 50ms
      lastTime = now

      const W  = canvas.width
      const H  = canvas.height
      const ps = particlesRef.current
      const st = stateRef.current
      if (!ps) return

      ctx.clearRect(0, 0, W, H)

      // State machine transitions
      if (st.phase === 'forming') {
        const elapsed = now - st.formingStart
        const { digitAssignments } = st

        if (elapsed > FORM_DURATION && st.formingDigit < digitAssignments.length - 1) {
          st.formingDigit++
          st.formingStart = now
          for (const i of digitAssignments[st.formingDigit].indices) {
            ps[i].phase = 'converge'
          }
          playDigitForm()
        } else if (st.formingDigit >= digitAssignments.length - 1 && elapsed > FORM_DURATION) {
          st.phase       = 'hold'
          st.holdStart   = now
          st.revealFired = false
          playResultReveal()
          // Dropped digits stay visible (red) through hold, released together with kept at hold end
        }
      }

      if (st.phase === 'hold' && !st.revealFired && now - st.holdStart > HOLD_REVEAL_DELAY) {
        st.revealFired = true
        onFormedRef.current?.()
      }

      if (st.phase === 'hold' && now - st.holdStart > HOLD_DURATION) {
        st.phase = 'dissipate'
        for (const { indices } of st.digitAssignments) {
          for (const i of indices) {
            if (ps[i].phase === 'formed' || ps[i].phase === 'converge') {
              ps[i].phase = 'release'
              ps[i].vx    = (Math.random() - 0.5) * 0.6
              ps[i].vy    = (Math.random() - 0.5) * 0.6
            }
          }
        }
      }

      if (st.phase === 'dissipate') {
        let allDone = true
        outer: for (const { indices } of st.digitAssignments) {
          for (const i of indices) {
            if (ps[i].phase !== 'wander') { allDone = false; break outer }
          }
        }
        if (allDone) {
          st.phase            = 'wander'
          st.digitAssignments = []
        }
      }

      // Update each particle
      for (const p of ps) {
        if (p.phase === 'wander') {
          p.vx += (Math.random() - 0.5) * 0.02 * dt * 60
          p.vy += (Math.random() - 0.5) * 0.02 * dt * 60
          if (p.x < 20)      p.vx += 0.04 * dt * 60
          if (p.x > W - 20)  p.vx -= 0.04 * dt * 60
          if (p.y < 20)      p.vy += 0.04 * dt * 60
          if (p.y > H - 20)  p.vy -= 0.04 * dt * 60
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
          if (spd > MAX_WANDER_SPEED) { p.vx *= MAX_WANDER_SPEED / spd; p.vy *= MAX_WANDER_SPEED / spd }
          p.x += p.vx * dt * 60
          p.y += p.vy * dt * 60
          p.opacity = Math.min(p.baseOpacity, p.opacity + 0.01 * dt * 60)

        } else if (p.phase === 'converge') {
          const lf = 1 - Math.pow(1 - LERP_IN, dt * 60)
          p.x += (p.tx - p.x) * lf
          p.y += (p.ty - p.y) * lf
          p.vx = 0; p.vy = 0
          p.opacity = Math.min(1, p.opacity + 0.015 * dt * 60)
          const dx = p.tx - p.x, dy = p.ty - p.y
          if (dx * dx + dy * dy < 0.25) {
            p.x = p.tx; p.y = p.ty
            p.phase = 'formed'
          }

        } else if (p.phase === 'formed') {
          const wobble = W < 600 ? 0.15 : 0.4
          p.x += (Math.random() - 0.5) * wobble * dt * 60
          p.y += (Math.random() - 0.5) * wobble * dt * 60
          p.opacity = Math.min(1, p.opacity + 0.02 * dt * 60)

        } else if (p.phase === 'release') {
          p.vx += (Math.random() - 0.5) * 0.02 * dt * 60
          p.vy += (Math.random() - 0.5) * 0.02 * dt * 60
          if (p.x < 20)     p.vx += 0.04 * dt * 60
          if (p.x > W - 20) p.vx -= 0.04 * dt * 60
          if (p.y < 20)     p.vy += 0.04 * dt * 60
          if (p.y > H - 20) p.vy -= 0.04 * dt * 60
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
          if (spd > MAX_WANDER_SPEED) { p.vx *= MAX_WANDER_SPEED / spd; p.vy *= MAX_WANDER_SPEED / spd }
          p.x += p.vx * dt * 60
          p.y += p.vy * dt * 60
          p.opacity = Math.max(p.baseOpacity, p.opacity - RELEASE_FADE_RATE * dt * 60)
          if (p.opacity <= p.baseOpacity) {
            p.phase = 'wander'
            p.color = DIE_COLORS[dieTypeRef.current] ?? pickColor()
          }
        }
      }

      // Draw — sharp dots, no glow
      ctx.globalCompositeOperation = 'source-over'
      for (const p of ps) {
        const a = Math.max(0, Math.min(1, p.opacity))
        if (a < 0.01) continue
        ctx.globalAlpha = a
        ctx.fillStyle   = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  // Keep dieTypeRef current so other effects can read it without depending on it
  useEffect(() => { dieTypeRef.current = dieType }, [dieType])

  // When switching back to normal mode, recolor all particles to the die color
  useEffect(() => {
    if (mode !== 'normal') return
    const ps = particlesRef.current
    if (!ps) return
    const color = DIE_COLORS[dieTypeRef.current] ?? pickColor()
    for (const p of ps) p.color = color
  }, [mode])

  // Recolor all wander particles when die type changes
  useEffect(() => {
    const ps = particlesRef.current
    if (!ps) return
    const color = DIE_COLORS[dieType] ?? pickColor()
    for (const p of ps) {
      if (p.phase === 'wander' || p.phase === 'release') {
        p.color = color
      }
    }
  }, [dieType])

  // Reset to wander when rolling starts
  useEffect(() => {
    if (!rolling) return
    const ps = particlesRef.current
    if (!ps) return
    const st = stateRef.current
    const color = DIE_COLORS[dieTypeRef.current] ?? pickColor()
    for (const p of ps) {
      p.phase = 'wander'
      p.color = color
    }
    st.phase            = 'wander'
    st.digitAssignments = []
    st.revealFired      = false
  }, [rolling])

  // Trigger forming when result arrives
  useEffect(() => {
    if (rolling || !result) return
    const canvas = canvasRef.current
    if (!canvas || !particlesRef.current) return
    const W  = canvas.width
    const H  = canvas.height
    const ps = particlesRef.current
    const st = stateRef.current

    for (const p of ps) { p.phase = 'wander'; p.tx = null; p.ty = null }

    const { rolls, dropped } = result
    const allDigits = [
      ...rolls.map(v => ({ value: v, isDropped: false })),
      ...(dropped || []).map(v => ({ value: v, isDropped: true })),
    ]

    const totalSlots = allDigits.length
    const slotW      = W / totalSlots
    const scale      = Math.min(slotW, H) * (W < 600 ? 0.55 : 0.42) / 100

    // Scale particle count up as digits shrink — more particles needed for smaller glyphs
    const perDigitTarget = W < 600 ? 180 : 200
    const needed         = Math.min(totalSlots * perDigitTarget, W < 600 ? 900 : 700)
    if (ps.length < needed) {
      particlesRef.current = makeParticles(W, H, needed)
    }
    const psActive = particlesRef.current
    const perDigit = Math.floor(psActive.length / totalSlots)

    // Particle size shrinks with the digit scale so dots fit within tighter strokes
    const maxScale   = (W < 600 ? 0.55 : 0.42) * Math.min(W, H) / 100  // single-die reference scale
    const sizeFactor = Math.max(0.35, Math.min(1, scale / maxScale))
    const digitSize  = W < 600
      ? 0.65
      : Math.max(0.4, 1.8 * sizeFactor)

    const assignments = allDigits.map(({ value, isDropped }, d) => {
      const slotCenterX = slotW * d + slotW / 2
      const slotCenterY = H / 2

      const rawPixels = sampleDigit(value, perDigit, W < 600)
      const startIdx  = d * perDigit
      const indices   = Array.from({ length: perDigit }, (_, i) => startIdx + i)

      for (let i = 0; i < indices.length; i++) {
        const pi        = indices[i]
        const [px, py]  = rawPixels[i] ?? [100, 100]
        const jitter    = W < 600 ? 2 : Math.max(2, 7 * sizeFactor)
        psActive[pi].tx    = slotCenterX + (px - 100) * scale + (Math.random() - 0.5) * jitter
        psActive[pi].ty    = slotCenterY + (py - 100) * scale + (Math.random() - 0.5) * jitter
        psActive[pi].color = isDropped ? '#ff5555' : (DIE_COLORS[dieTypeRef.current] ?? pickColor())
        psActive[pi].size  = digitSize * (0.4 + Math.random() * 1.2)
      }

      return { indices, isDropped }
    })

    for (const i of assignments[0].indices) psActive[i].phase = 'converge'

    st.digitAssignments = assignments
    st.formingDigit     = 0
    st.formingStart     = performance.now()
    st.phase            = 'forming'
    playDigitForm()
  }, [result, rolling])

  return (
    <div className="dice-arena">
      <canvas ref={canvasRef} className="dice-arena-canvas" />
    </div>
  )
}
