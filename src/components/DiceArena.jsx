import { useRef, useEffect } from 'react'
import './DiceArena.css'

const PARTICLE_COUNT = 300
const STAR_COLORS = ['#ffffff', '#e8f4ff', '#ffeedd', '#d4e8ff', '#ccddff']
const FORM_DURATION = 450   // ms to show each digit before starting the next
const HOLD_DURATION = 2000  // ms all digits stay visible before dissipating
const SPRING_IN  = 0.07
const SPRING_OUT = 0.05
const MAX_WANDER_SPEED = 0.8

function pickColor() {
  return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
}

function randomEdgePoint(W, H) {
  const side = Math.floor(Math.random() * 4)
  if (side === 0) return { x: Math.random() * W, y: -20 }
  if (side === 1) return { x: W + 20,            y: Math.random() * H }
  if (side === 2) return { x: Math.random() * W, y: H + 20 }
  return                    { x: -20,             y: Math.random() * H }
}

function makeParticles(W, H) {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 1.5 + 0.5,
    baseOpacity: Math.random() * 0.4 + 0.25,
    opacity: 0,
    color: pickColor(),
    tx: null,
    ty: null,
    phase: 'wander',
  }))
}

function sampleDigit(label, count) {
  const size = 200
  const ofc = document.createElement('canvas')
  ofc.width = size; ofc.height = size
  const ctx = ofc.getContext('2d')
  const fontSize = String(label).length > 1 ? 110 : 140
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px Georgia, serif`
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

export default function DiceArena({ result, rolling }) {
  const canvasRef    = useRef()
  const particlesRef = useRef(null)
  const stateRef     = useRef({
    phase: 'wander',
    digitAssignments: [],
    formingDigit: 0,
    formingStart: 0,
    holdStart: 0,
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
        } else if (st.formingDigit >= digitAssignments.length - 1 && elapsed > FORM_DURATION) {
          st.phase     = 'hold'
          st.holdStart = now
          for (const { indices, isDropped } of digitAssignments) {
            if (isDropped) {
              for (const i of indices) {
                const ep = randomEdgePoint(W, H)
                ps[i].phase = 'exit'
                ps[i].tx    = ep.x
                ps[i].ty    = ep.y
              }
            }
          }
        }
      }

      if (st.phase === 'hold' && now - st.holdStart > HOLD_DURATION) {
        st.phase = 'dissipate'
        for (const { indices } of st.digitAssignments) {
          for (const i of indices) {
            if (ps[i].phase === 'formed') {
              const ep = randomEdgePoint(W, H)
              ps[i].phase = 'exit'
              ps[i].tx    = ep.x
              ps[i].ty    = ep.y
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

      // Update + draw each particle
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
          p.vx += (p.tx - p.x) * SPRING_IN * dt * 60
          p.vy += (p.ty - p.y) * SPRING_IN * dt * 60
          p.vx *= Math.pow(0.8, dt * 60); p.vy *= Math.pow(0.8, dt * 60)
          p.x += p.vx * dt * 60; p.y += p.vy * dt * 60
          p.opacity = Math.min(1, p.opacity + 0.04 * dt * 60)
          const dx = p.tx - p.x, dy = p.ty - p.y
          if (dx * dx + dy * dy < 2) {
            p.x = p.tx; p.y = p.ty; p.vx = 0; p.vy = 0
            p.phase = 'formed'
          }

        } else if (p.phase === 'formed') {
          p.x += (Math.random() - 0.5) * 0.4 * dt * 60
          p.y += (Math.random() - 0.5) * 0.4 * dt * 60
          p.opacity = Math.min(1, p.opacity + 0.04 * dt * 60)

        } else if (p.phase === 'exit') {
          p.vx += (p.tx - p.x) * SPRING_OUT * dt * 60
          p.vy += (p.ty - p.y) * SPRING_OUT * dt * 60
          p.vx *= Math.pow(0.85, dt * 60); p.vy *= Math.pow(0.85, dt * 60)
          p.x += p.vx * dt * 60; p.y += p.vy * dt * 60
          const dx = p.tx - p.x, dy = p.ty - p.y
          p.opacity = Math.max(0, Math.min(p.baseOpacity, Math.sqrt(dx * dx + dy * dy) / 60))
          if (p.x < -15 || p.x > W + 15 || p.y < -15 || p.y > H + 15) {
            p.x       = 30 + Math.random() * (W - 60)
            p.y       = 30 + Math.random() * (H - 60)
            p.vx      = (Math.random() - 0.5) * 0.5
            p.vy      = (Math.random() - 0.5) * 0.5
            p.color   = pickColor()
            p.opacity = 0
            p.phase   = 'wander'
          }
        }

        // Draw
        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
        ctx.shadowColor = p.color
        ctx.shadowBlur  = p.size * 5
        ctx.fillStyle   = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  // Reset to wander when rolling starts
  useEffect(() => {
    if (!rolling) return
    const ps = particlesRef.current
    if (!ps) return
    const st = stateRef.current
    for (const p of ps) {
      p.phase = 'wander'
      p.color = pickColor()
    }
    st.phase            = 'wander'
    st.digitAssignments = []
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
    const perDigit   = Math.floor(PARTICLE_COUNT / totalSlots)

    const assignments = allDigits.map(({ value, isDropped }, d) => {
      const slotCenterX = slotW * d + slotW / 2
      const slotCenterY = H / 2
      const scale       = Math.min(slotW, H) * 0.42 / 100

      const rawPixels = sampleDigit(value, perDigit)
      const startIdx  = d * perDigit
      const indices   = Array.from({ length: perDigit }, (_, i) => startIdx + i)

      for (let i = 0; i < indices.length; i++) {
        const pi        = indices[i]
        const [px, py]  = rawPixels[i] ?? [100, 100]
        ps[pi].tx       = slotCenterX + (px - 100) * scale + (Math.random() - 0.5) * 7
        ps[pi].ty       = slotCenterY + (py - 100) * scale + (Math.random() - 0.5) * 7
        if (isDropped) ps[pi].color = '#ff5555'
      }

      return { indices, isDropped }
    })

    for (const i of assignments[0].indices) ps[i].phase = 'converge'

    st.digitAssignments = assignments
    st.formingDigit     = 0
    st.formingStart     = performance.now()
    st.phase            = 'forming'
  }, [result, rolling])

  return (
    <div className="dice-arena">
      <canvas ref={canvasRef} className="dice-arena-canvas" />
      {!result && (
        <p className="dice-arena-hint">The bones await your command, traveller</p>
      )}
    </div>
  )
}
