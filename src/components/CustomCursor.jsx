import { useEffect, useRef } from 'react'
import './CustomCursor.css'

// 3 planets, inner → outer
const PLANETS = [
  { radius: 16, speed:  2.2, size: 8, wobble: 0.5 },
  { radius: 28, speed:  1.3, size: 6, wobble: 0.4 },
  { radius: 42, speed:  0.7, size: 4, wobble: 0.3 },
]

const HOVER_SELECTOR = 'a, button, [role="button"], input, select, textarea, label, summary'
const LINE_SPACING = 14   // px between stacked planets on hover
const LINE_OFFSET  = 16   // px below cursor for the first planet

const centerTransform = (x, y) => `translate(${x}px, ${y}px) translate(-50%, -50%)`

export default function CustomCursor() {
  const dotRef    = useRef(null)
  const ringRef   = useRef([])
  const trailRef  = useRef([])
  const mouseRef  = useRef({ x: -100, y: -100 })
  const hoverRef  = useRef(false)
  const rafRef    = useRef(null)
  const tRef      = useRef(0)

  const stateRef = useRef(
    PLANETS.map((p, i) => ({
      angle: (i / PLANETS.length) * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      lagX: -100,
      lagY: -100,
    }))
  )

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      const el = e.target
      hoverRef.current = !!(el && el.closest && el.closest(HOVER_SELECTOR))
    }
    window.addEventListener('mousemove', onMove)

    let last = performance.now()

    function loop(now) {
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      tRef.current += delta
      const t = tRef.current
      const { x: mx, y: my } = mouseRef.current

      if (dotRef.current) {
        dotRef.current.style.transform = centerTransform(mx, my)
      }

      const hovering = hoverRef.current

      // Orbit rings follow cursor; hide on hover
      PLANETS.forEach((p, i) => {
        const ring = ringRef.current[i]
        if (!ring) return
        ring.style.transform = centerTransform(mx, my)
        ring.style.width  = `${p.radius * 2}px`
        ring.style.height = `${p.radius * 2}px`
        ring.style.opacity = hovering ? 0 : 0.35
      })

      PLANETS.forEach((p, i) => {
        const el = trailRef.current[i]
        if (!el) return
        const s = stateRef.current[i]

        let tx, ty
        if (hovering) {
          // Stack vertically below cursor, largest (i=0) closest
          tx = mx
          ty = my + LINE_OFFSET + i * LINE_SPACING
        } else {
          // Orbit on personal ring; inner faster
          const r = p.radius * (0.9 + 0.1 * Math.sin(t * p.wobble + s.phase))
          const a = s.angle + t * p.speed
          tx = mx + Math.cos(a) * r
          ty = my + Math.sin(a) * r
        }

        // Lerp toward target — gentler transition into the line
        const k = hovering ? 0.07 : 0.18
        s.lagX += (tx - s.lagX) * k
        s.lagY += (ty - s.lagY) * k

        el.style.transform = centerTransform(s.lagX, s.lagY)
        el.style.width  = `${p.size}px`
        el.style.height = `${p.size}px`
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot-main" />
      {PLANETS.map((_, i) => (
        <div key={`r${i}`} ref={el => ringRef.current[i] = el} className="cursor-orbit-ring" />
      ))}
      {PLANETS.map((_, i) => (
        <div key={`p${i}`} ref={el => trailRef.current[i] = el} className="cursor-cloud-particle" />
      ))}
    </>
  )
}
