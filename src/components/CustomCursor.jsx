import { useEffect, useRef } from 'react'
import './CustomCursor.css'

const PARTICLE_COUNT = 14

// Each particle gets unique orbital params
function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle:   (i / PARTICLE_COUNT) * Math.PI * 2,
    radius:  18 + Math.random() * 22,
    speed:   (0.6 + Math.random() * 1.0) * (Math.random() < 0.5 ? 1 : -1),
    phase:   Math.random() * Math.PI * 2,
    wobble:  0.4 + Math.random() * 0.6,
    size:    3 + Math.random() * 4,
    lagX:    -100,
    lagY:    -100,
    lerpK:   0.06 + Math.random() * 0.08,
  }))
}

const centerTransform = (x, y) => `translate(${x}px, ${y}px) translate(-50%, -50%)`

export default function CustomCursor() {
  const dotRef      = useRef(null)
  const trailRef    = useRef([])
  const mouseRef    = useRef({ x: -100, y: -100 })
  const particles   = useRef(makeParticles())
  const rafRef      = useRef(null)
  const tRef        = useRef(0)

  useEffect(() => {
    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)

    let last = performance.now()

    function loop(now) {
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      tRef.current += delta

      const { x: mx, y: my } = mouseRef.current
      const t = tRef.current

      // Main dot — snaps directly
      if (dotRef.current) {
        dotRef.current.style.transform = centerTransform(mx, my)
      }

      // Each particle orbits cursor with lazy lerp
      particles.current.forEach((p, i) => {
        const el = trailRef.current[i]
        if (!el) return

        // Animated orbital target around cursor
        const r = p.radius * (0.75 + 0.25 * Math.sin(t * p.wobble + p.phase))
        const a = p.angle + t * p.speed
        const tx = mx + Math.cos(a) * r
        const ty = my + Math.sin(a) * r * 0.55  // flatten to ellipse (isometric feel)

        // Lazy lerp toward target
        p.lagX += (tx - p.lagX) * p.lerpK
        p.lagY += (ty - p.lagY) * p.lerpK

        const dist = Math.hypot(p.lagX - mx, p.lagY - my)
        const maxDist = p.radius + 10
        const proximity = 1 - Math.min(dist / maxDist, 1)
        const opacity = 0.25 + proximity * 0.65

        el.style.transform = centerTransform(p.lagX, p.lagY)
        el.style.opacity   = opacity
        el.style.width     = `${p.size}px`
        el.style.height    = `${p.size}px`
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
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <div key={i} ref={el => trailRef.current[i] = el} className="cursor-cloud-particle" />
      ))}
    </>
  )
}
