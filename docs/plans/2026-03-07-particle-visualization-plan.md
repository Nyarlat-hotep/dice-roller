# Particle Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace 3D dice with a 2D Canvas particle system where glowing dots wander the arena at rest and converge to form rolled numbers sequentially, then dissipate back to wandering.

**Architecture:** Single HTML `<canvas>` in `DiceArena.jsx` with a fixed pool of 300 particles driven by a `requestAnimationFrame` loop. State machine (wander → forming → hold → dissipate → wander) is managed via refs. Digit shapes are sampled from an offscreen canvas at runtime.

**Tech Stack:** React, HTML Canvas 2D API, no Three.js

---

### Task 1: Remove 3D dice files and packages

**Files:**
- Delete: `src/components/Die3D.jsx`
- Delete: `src/utils/dieGeometry.js`
- Modify: `package.json` (uninstall packages)

**Step 1: Uninstall Three.js packages**

```bash
cd /Users/taylorcornelius/Desktop/dice-roller
npm uninstall @react-three/drei @react-three/fiber three
```

Expected: packages removed from `node_modules` and `package.json`.

**Step 2: Delete the files**

```bash
rm src/components/Die3D.jsx src/utils/dieGeometry.js
```

**Step 3: Verify the dev server still starts (it will error on import — that's expected for now)**

```bash
npm run dev
```

The app will crash because `DiceArena.jsx` still imports from these files. That's fine — we fix it in Task 2.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove 3D dice files and Three.js dependencies"
```

---

### Task 2: Rewrite DiceArena.jsx — canvas scaffold + particle wander

**Files:**
- Modify: `src/components/DiceArena.jsx` (full rewrite)
- Modify: `src/components/DiceArena.css` (update styles)

**Step 1: Replace DiceArena.css with this content**

```css
.dice-arena {
  position: relative;
  height: 320px;
  border: 1px solid var(--border-gold);
  border-radius: 6px;
  background: radial-gradient(ellipse at center, #1e2250 0%, #0d0f1c 70%);
  overflow: hidden;
  box-shadow:
    inset 0 0 60px rgba(128, 80, 208, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.6);
}

.dice-arena-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.dice-arena-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--fg-gold-faint);
  font-size: 0.8rem;
  letter-spacing: 2px;
  font-family: Georgia, serif;
  font-style: italic;
  pointer-events: none;
  white-space: nowrap;
}
```

**Step 2: Replace DiceArena.jsx with this content**

```jsx
import { useRef, useEffect } from 'react'
import './DiceArena.css'

const PARTICLE_COUNT = 300
const STAR_COLORS = ['#ffffff', '#e8f4ff', '#ffeedd', '#d4e8ff', '#ccddff']
const FORM_DURATION = 450   // ms to show each digit before starting the next
const HOLD_DURATION = 2000  // ms all digits stay visible before dissipating
const SPRING_IN  = 0.07     // convergence spring strength
const SPRING_OUT = 0.05     // exit spring strength
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
    phase: 'wander',  // 'wander' | 'converge' | 'formed' | 'exit'
  }))
}

// Sample lit pixel positions from a digit rendered to an offscreen canvas.
// Returns array of [px, py] in 0–200 coordinate space.
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
  const canvasRef  = useRef()
  const particlesRef = useRef(null)
  const stateRef   = useRef({
    phase: 'wander',
    digitAssignments: [],   // [{ indices: number[], isDropped: bool }]
    formingDigit: 0,
    formingStart: 0,
    holdStart: 0,
  })
  const rafRef = useRef()

  // ── Animation loop (runs once, never recreated) ──────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      if (!particlesRef.current) {
        particlesRef.current = makeParticles(canvas.width, canvas.height)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    let lastTime = performance.now()

    function tick(now) {
      rafRef.current = requestAnimationFrame(tick)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      const W  = canvas.width
      const H  = canvas.height
      const ps = particlesRef.current
      const st = stateRef.current
      if (!ps) return

      ctx.clearRect(0, 0, W, H)

      // ── State machine transitions ──────────────────────────────────────
      if (st.phase === 'forming') {
        const elapsed = now - st.formingStart
        const { digitAssignments } = st

        // Activate next digit after FORM_DURATION
        if (elapsed > FORM_DURATION && st.formingDigit < digitAssignments.length - 1) {
          st.formingDigit++
          st.formingStart = now
          for (const i of digitAssignments[st.formingDigit].indices) {
            ps[i].phase = 'converge'
          }
        }

        // All digits shown — move to hold
        if (st.formingDigit >= digitAssignments.length - 1 && elapsed > FORM_DURATION) {
          st.phase    = 'hold'
          st.holdStart = now
          // Dropped dice particles exit immediately
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
        const allDone = st.digitAssignments.flatMap(d => d.indices).every(i => ps[i].phase === 'wander')
        if (allDone) {
          st.phase = 'wander'
          st.digitAssignments = []
        }
      }

      // ── Update + draw particles ─────────────────────────────────────────
      for (const p of ps) {
        if (p.phase === 'wander') {
          p.vx += (Math.random() - 0.5) * 0.02
          p.vy += (Math.random() - 0.5) * 0.02
          // Soft wall repulsion
          if (p.x < 20)    p.vx += 0.04
          if (p.x > W - 20) p.vx -= 0.04
          if (p.y < 20)    p.vy += 0.04
          if (p.y > H - 20) p.vy -= 0.04
          // Speed cap
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
          if (spd > MAX_WANDER_SPEED) { p.vx *= MAX_WANDER_SPEED / spd; p.vy *= MAX_WANDER_SPEED / spd }
          p.x += p.vx
          p.y += p.vy
          // Fade in from 0
          p.opacity = Math.min(p.baseOpacity, p.opacity + 0.01)

        } else if (p.phase === 'converge') {
          p.vx += (p.tx - p.x) * SPRING_IN
          p.vy += (p.ty - p.y) * SPRING_IN
          p.vx *= 0.8; p.vy *= 0.8
          p.x += p.vx; p.y += p.vy
          p.opacity = Math.min(1, p.opacity + 0.04)
          const dx = p.tx - p.x, dy = p.ty - p.y
          if (dx * dx + dy * dy < 2) {
            p.x = p.tx; p.y = p.ty; p.vx = 0; p.vy = 0
            p.phase = 'formed'
          }

        } else if (p.phase === 'formed') {
          p.x += (Math.random() - 0.5) * 0.4
          p.y += (Math.random() - 0.5) * 0.4
          p.opacity = Math.min(1, p.opacity + 0.04)

        } else if (p.phase === 'exit') {
          p.vx += (p.tx - p.x) * SPRING_OUT
          p.vy += (p.ty - p.y) * SPRING_OUT
          p.vx *= 0.85; p.vy *= 0.85
          p.x += p.vx; p.y += p.vy
          const dx = p.tx - p.x, dy = p.ty - p.y
          p.opacity = Math.max(0, Math.min(p.baseOpacity, Math.sqrt(dx * dx + dy * dy) / 60))
          // Once off-screen, return to wander inside canvas
          if (p.x < -15 || p.x > W + 15 || p.y < -15 || p.y > H + 15) {
            p.x = 30 + Math.random() * (W - 60)
            p.y = 30 + Math.random() * (H - 60)
            p.vx = (Math.random() - 0.5) * 0.5
            p.vy = (Math.random() - 0.5) * 0.5
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
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ── Reset to wander when rolling starts ──────────────────────────────────
  useEffect(() => {
    if (!rolling) return
    const ps = particlesRef.current
    if (!ps) return
    const st = stateRef.current
    for (const p of ps) {
      p.phase = 'wander'
      p.color = pickColor()
    }
    st.phase = 'wander'
    st.digitAssignments = []
  }, [rolling])

  // ── Trigger forming when result arrives ──────────────────────────────────
  useEffect(() => {
    if (rolling || !result) return
    const canvas = canvasRef.current
    if (!canvas || !particlesRef.current) return
    const W  = canvas.width
    const H  = canvas.height
    const ps = particlesRef.current
    const st = stateRef.current

    // Reset all to wander first
    for (const p of ps) { p.phase = 'wander'; p.tx = null; p.ty = null }

    const { rolls, dropped } = result
    const allDigits = [
      ...rolls.map(v => ({ value: v, isDropped: false })),
      ...(dropped || []).map(v => ({ value: v, isDropped: true })),
    ]

    const totalSlots  = allDigits.length
    const slotW       = W / totalSlots
    const perDigit    = Math.floor(PARTICLE_COUNT / totalSlots)

    const assignments = allDigits.map(({ value, isDropped }, d) => {
      const slotCenterX = slotW * d + slotW / 2
      const slotCenterY = H / 2
      const scale       = Math.min(slotW, H) * 0.42 / 100

      const rawPixels = sampleDigit(value, perDigit)
      const startIdx  = d * perDigit
      const indices   = Array.from({ length: perDigit }, (_, i) => startIdx + i)

      for (let i = 0; i < indices.length; i++) {
        const pi = indices[i]
        const [px, py] = rawPixels[i] ?? [100, 100]
        ps[pi].tx    = slotCenterX + (px - 100) * scale + (Math.random() - 0.5) * 7
        ps[pi].ty    = slotCenterY + (py - 100) * scale + (Math.random() - 0.5) * 7
        if (isDropped) ps[pi].color = '#ff5555'
      }

      return { indices, isDropped }
    })

    // Activate first digit
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
```

**Step 3: Start the dev server and verify**

```bash
npm run dev
```

Expected: App loads. Glowing dots wander inside the dark arena. Empty state hint is visible. No console errors about Three.js.

**Step 4: Commit**

```bash
git add src/components/DiceArena.jsx src/components/DiceArena.css
git commit -m "feat: replace 3D dice canvas with 2D particle wander system"
```

---

### Task 3: Verify forming, hold, and dissipate states

This task is visual verification — no new code, just confirm the full state machine works end-to-end.

**Step 1: Roll a single die (e.g. 1d20)**

In the browser: set to 1d20, click Roll.

Expected sequence:
- Particles converge to form the rolled number (e.g. "14")
- Number holds for ~2 seconds, particles glowing brightly
- Particles scatter outward, fade, then resume wandering

**Step 2: Roll multiple dice (e.g. 3d6)**

Set to 3d6, click Roll.

Expected:
- First number forms (~450ms)
- Second number forms beside it
- Third number forms
- All three numbers hold simultaneously
- All scatter after ~2s

**Step 3: Roll with advantage (2d20 advantage)**

Set mode to Advantage, click Roll.

Expected:
- Two numbers form sequentially
- Kept die = white/blue-white particles
- Dropped die = red particles that fall toward edges during hold phase
- Kept die scatters after ~2s

**Step 4: Roll again immediately (interrupt)**

Click Roll while particles are mid-formation.

Expected: particles reset to wander immediately, new result starts forming cleanly.

**Step 5: Commit if all looks good**

```bash
git add -A
git commit -m "feat: particle visualization complete"
```

---

### Task 4: Remove unused arena-labels from DiceArena.jsx and DiceArena.css

The "kept" / "dropped" text labels from the Three.js version are no longer rendered (particle colors communicate this), but their CSS rules remain. Clean them up.

**Step 1: Verify `.arena-labels` and `.arena-label` classes are not referenced in DiceArena.jsx**

Search: the new JSX in Task 2 does not include `arena-labels`, `arena-label--kept`, or `arena-label--dropped`. Confirm visually.

**Step 2: Remove the dead CSS from DiceArena.css**

Remove these blocks from `src/components/DiceArena.css`:

```css
/* DELETE these rules: */
.arena-labels { ... }
.arena-label { ... }
.arena-label--kept { ... }
.arena-label--dropped { ... }
```

The final `DiceArena.css` should contain only:

```css
.dice-arena {
  position: relative;
  height: 320px;
  border: 1px solid var(--border-gold);
  border-radius: 6px;
  background: radial-gradient(ellipse at center, #1e2250 0%, #0d0f1c 70%);
  overflow: hidden;
  box-shadow:
    inset 0 0 60px rgba(128, 80, 208, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.6);
}

.dice-arena-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.dice-arena-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--fg-gold-faint);
  font-size: 0.8rem;
  letter-spacing: 2px;
  font-family: Georgia, serif;
  font-style: italic;
  pointer-events: none;
  white-space: nowrap;
}
```

**Step 3: Verify no visual regression**

```bash
npm run dev
```

App should look and behave identically to after Task 2.

**Step 4: Run tests**

```bash
npm test
```

Expected: all existing tests pass (they test `rollLogic.js` only, no UI tests).

**Step 5: Commit**

```bash
git add src/components/DiceArena.css
git commit -m "chore: remove unused arena-label CSS from Three.js era"
```
