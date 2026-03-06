# Dice Roller Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fantasy-themed D&D dice roller with 3D React Three Fiber dice, roll history, modifiers, and advantage/disadvantage — deployed to GitHub Pages.

**Architecture:** Vite + React SPA. Roll logic lives in pure utility functions (testable). R3F Canvas renders animated 3D dice meshes using `useFrame` for scripted ease-out tumble. UI controls are plain React components styled with CSS custom properties for the fantasy theme.

**Tech Stack:** React 18, Vite, @react-three/fiber, @react-three/drei, gh-pages, Vitest

---

### Task 1: Scaffold Vite + React project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/App.css`, `src/index.css`

**Step 1: Initialise project**

```bash
cd /Users/taylorcornelius/Desktop/dice-roller
npm create vite@latest . -- --template react
npm install
```

**Step 2: Install dependencies**

```bash
npm install @react-three/fiber@^8 @react-three/drei@^9 three@^0.169
npm install --save-dev gh-pages vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

**Step 3: Configure vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dice-roller/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

**Step 4: Create test setup file**

Create `src/test/setup.js`:
```js
import '@testing-library/jest-dom'
```

**Step 5: Add deploy scripts to package.json**

In `package.json`, add to `"scripts"`:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist",
"test": "vitest"
```

**Step 6: Replace src/App.jsx with minimal shell**

```jsx
export default function App() {
  return <div className="app"><h1>DICE_ROLLER</h1></div>
}
```

**Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: browser shows "DICE_ROLLER" at localhost:5173

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold vite react project with r3f and gh-pages"
```

---

### Task 2: Roll logic utilities (pure functions)

**Files:**
- Create: `src/utils/rollLogic.js`
- Create: `src/test/rollLogic.test.js`

**Step 1: Write failing tests**

Create `src/test/rollLogic.test.js`:
```js
import { describe, it, expect, vi } from 'vitest'
import {
  rollDie,
  rollDice,
  rollWithAdvantage,
  rollWithDisadvantage,
  calculateTotal,
  formatNotation,
} from '../utils/rollLogic'

describe('rollDie', () => {
  it('returns integer within [1, sides]', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie(20)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
      expect(Number.isInteger(result)).toBe(true)
    }
  })
})

describe('rollDice', () => {
  it('returns array of length count', () => {
    expect(rollDice(3, 6)).toHaveLength(3)
  })
  it('each value is within [1, sides]', () => {
    rollDice(10, 8).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(8)
    })
  })
})

describe('rollWithAdvantage', () => {
  it('returns object with kept (max) and dropped arrays', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9)
    const result = rollWithAdvantage(1, 20)
    expect(result.kept[0]).toBeGreaterThan(result.dropped[0])
    vi.restoreAllMocks()
  })
})

describe('rollWithDisadvantage', () => {
  it('returns object with kept (min) and dropped arrays', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9)
    const result = rollWithDisadvantage(1, 20)
    expect(result.kept[0]).toBeLessThan(result.dropped[0])
    vi.restoreAllMocks()
  })
})

describe('calculateTotal', () => {
  it('sums rolls and adds modifier', () => {
    expect(calculateTotal([4, 6, 8], 2)).toBe(20)
    expect(calculateTotal([10], -3)).toBe(7)
  })
})

describe('formatNotation', () => {
  it('formats standard roll', () => {
    expect(formatNotation({ count: 3, sides: 8, modifier: 2, mode: 'normal' })).toBe('3d8+2')
  })
  it('omits zero modifier', () => {
    expect(formatNotation({ count: 1, sides: 20, modifier: 0, mode: 'normal' })).toBe('1d20')
  })
  it('includes ADV/DIS suffix', () => {
    expect(formatNotation({ count: 1, sides: 20, modifier: 0, mode: 'advantage' })).toBe('1d20 ADV')
    expect(formatNotation({ count: 1, sides: 20, modifier: 0, mode: 'disadvantage' })).toBe('1d20 DIS')
  })
})
```

**Step 2: Run tests — expect all to fail**

```bash
npm test
```
Expected: all tests fail with "Cannot find module"

**Step 3: Implement rollLogic.js**

Create `src/utils/rollLogic.js`:
```js
export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

export function rollDice(count, sides) {
  return Array.from({ length: count }, () => rollDie(sides))
}

export function rollWithAdvantage(count, sides) {
  const setA = rollDice(count, sides)
  const setB = rollDice(count, sides)
  const totalA = setA.reduce((s, v) => s + v, 0)
  const totalB = setB.reduce((s, v) => s + v, 0)
  return totalA >= totalB
    ? { kept: setA, dropped: setB }
    : { kept: setB, dropped: setA }
}

export function rollWithDisadvantage(count, sides) {
  const setA = rollDice(count, sides)
  const setB = rollDice(count, sides)
  const totalA = setA.reduce((s, v) => s + v, 0)
  const totalB = setB.reduce((s, v) => s + v, 0)
  return totalA <= totalB
    ? { kept: setA, dropped: setB }
    : { kept: setB, dropped: setA }
}

export function calculateTotal(rolls, modifier) {
  return rolls.reduce((s, v) => s + v, 0) + modifier
}

export function formatNotation({ count, sides, modifier, mode }) {
  const diePart = `${count}d${sides}`
  const modPart = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''
  const modeSuffix = mode === 'advantage' ? ' ADV' : mode === 'disadvantage' ? ' DIS' : ''
  return `${diePart}${modPart}${modeSuffix}`
}
```

**Step 4: Run tests — expect all to pass**

```bash
npm test
```
Expected: all 8 tests pass

**Step 5: Commit**

```bash
git add src/utils/rollLogic.js src/test/
git commit -m "feat: add roll logic utilities with tests"
```

---

### Task 3: Fantasy theme CSS + App shell

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.css`
- Modify: `src/App.jsx`

**Step 1: Write index.css with CSS variables**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-body: #0d0b08;
  --bg-surface: #1a1610;
  --bg-panel: #211d14;
  --fg-gold: #c9a84c;
  --fg-gold-dim: rgba(201, 168, 76, 0.6);
  --fg-gold-faint: rgba(201, 168, 76, 0.25);
  --fg-parchment: #e8d5a3;
  --fg-parchment-dim: rgba(232, 213, 163, 0.6);
  --border-gold: rgba(201, 168, 76, 0.25);
  --border-gold-hover: rgba(201, 168, 76, 0.5);
  --accent-red: #8b1a1a;
  --accent-red-bright: #c0392b;
  --shadow: rgba(0, 0, 0, 0.8);
}

body {
  font-family: 'Georgia', serif;
  background: var(--bg-body);
  color: var(--fg-parchment);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

button { font-family: inherit; cursor: pointer; }
```

**Step 2: Write App.css**

```css
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  gap: 1.5rem;
}

.app-header { text-align: center; }

.app-title {
  font-size: 0.7rem;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: var(--fg-gold);
  font-family: monospace;
}

.app-subtitle {
  font-size: 0.75rem;
  color: var(--fg-gold-dim);
  margin-top: 0.25rem;
  letter-spacing: 1px;
}

.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-gold);
  border-radius: 8px;
  padding: 1.25rem;
}
```

**Step 3: Write App.jsx shell**

```jsx
import { useState } from 'react'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Dice Roller</h1>
        <p className="app-subtitle">Roll the bones</p>
      </header>
    </div>
  )
}
```

**Step 4: Verify it looks right**

```bash
npm run dev
```
Expected: dark page, gold title, no errors

**Step 5: Commit**

```bash
git add src/index.css src/App.css src/App.jsx
git commit -m "feat: fantasy theme CSS variables and app shell"
```

---

### Task 4: DieSelector component

**Files:**
- Create: `src/components/DieSelector.jsx`
- Create: `src/components/DieSelector.css`

**Step 1: Create DieSelector.jsx**

```jsx
import './DieSelector.css'

export const DICE = [
  { sides: 4,   label: 'd4'  },
  { sides: 6,   label: 'd6'  },
  { sides: 8,   label: 'd8'  },
  { sides: 10,  label: 'd10' },
  { sides: 12,  label: 'd12' },
  { sides: 20,  label: 'd20' },
  { sides: 100, label: 'd%'  },
]

export default function DieSelector({ selected, onChange }) {
  return (
    <div className="die-selector">
      {DICE.map(({ sides, label }) => (
        <button
          key={sides}
          className={`die-btn${selected === sides ? ' die-btn--active' : ''}`}
          onClick={() => onChange(sides)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Create DieSelector.css**

```css
.die-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.die-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-gold);
  background: transparent;
  color: var(--fg-gold-dim);
  font-family: monospace;
  font-size: 0.85rem;
  letter-spacing: 1px;
  transition: all 0.15s ease;
}

.die-btn:hover {
  border-color: var(--border-gold-hover);
  color: var(--fg-gold);
  background: rgba(201, 168, 76, 0.05);
}

.die-btn--active {
  border-color: var(--fg-gold);
  color: var(--fg-gold);
  background: rgba(201, 168, 76, 0.12);
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.2);
}
```

**Step 3: Wire into App.jsx to test visually**

```jsx
import { useState } from 'react'
import DieSelector from './components/DieSelector'
import './App.css'

export default function App() {
  const [dieType, setDieType] = useState(20)
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Dice Roller</h1>
        <p className="app-subtitle">Roll the bones</p>
      </header>
      <div className="panel">
        <DieSelector selected={dieType} onChange={setDieType} />
      </div>
    </div>
  )
}
```

**Step 4: Verify visually — d20 highlighted by default**

```bash
npm run dev
```

**Step 5: Commit**

```bash
git add src/components/DieSelector.jsx src/components/DieSelector.css src/App.jsx
git commit -m "feat: add DieSelector component"
```

---

### Task 5: CountStepper and ModifierStepper

**Files:**
- Create: `src/components/Stepper.jsx`
- Create: `src/components/Stepper.css`

**Step 1: Create Stepper.jsx (reusable for count and modifier)**

```jsx
import './Stepper.css'

export default function Stepper({ label, value, onChange, min, max }) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >−</button>
        <span className="stepper-value">
          {value > 0 ? `+${value}` : value}
        </span>
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >+</button>
      </div>
    </div>
  )
}
```

**Step 2: Create Stepper.css**

```css
.stepper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.stepper-label {
  font-size: 0.6rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fg-gold-dim);
  font-family: monospace;
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stepper-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-gold);
  background: transparent;
  color: var(--fg-gold);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  line-height: 1;
}

.stepper-btn:hover:not(:disabled) {
  border-color: var(--fg-gold);
  background: rgba(201, 168, 76, 0.1);
}

.stepper-btn:disabled {
  opacity: 0.25;
  cursor: default;
}

.stepper-value {
  min-width: 3ch;
  text-align: center;
  font-family: monospace;
  font-size: 1rem;
  color: var(--fg-parchment);
}
```

**Step 3: Note — CountStepper uses min=1, max=10 and shows plain number (no +/- prefix). Modify Stepper.jsx to accept a `formatValue` prop:**

```jsx
// Replace the stepper-value span:
<span className="stepper-value">
  {formatValue ? formatValue(value) : value}
</span>
```

**Step 4: Commit**

```bash
git add src/components/Stepper.jsx src/components/Stepper.css
git commit -m "feat: add reusable Stepper component"
```

---

### Task 6: ModeToggle and RollButton

**Files:**
- Create: `src/components/ModeToggle.jsx`
- Create: `src/components/ModeToggle.css`
- Create: `src/components/RollButton.jsx`
- Create: `src/components/RollButton.css`

**Step 1: Create ModeToggle.jsx**

```jsx
import './ModeToggle.css'

const MODES = [
  { value: 'advantage',    label: 'ADV' },
  { value: 'normal',       label: 'NORMAL' },
  { value: 'disadvantage', label: 'DIS' },
]

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          className={`mode-btn${mode === value ? ' mode-btn--active' : ''}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Create ModeToggle.css**

```css
.mode-toggle {
  display: flex;
  border: 1px solid var(--border-gold);
  border-radius: 6px;
  overflow: hidden;
}

.mode-btn {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: none;
  background: transparent;
  color: var(--fg-gold-dim);
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  transition: all 0.15s ease;
  border-right: 1px solid var(--border-gold);
}

.mode-btn:last-child { border-right: none; }

.mode-btn:hover { color: var(--fg-gold); background: rgba(201, 168, 76, 0.05); }

.mode-btn--active {
  background: rgba(201, 168, 76, 0.15);
  color: var(--fg-gold);
}
```

**Step 3: Create RollButton.jsx**

```jsx
import './RollButton.css'

export default function RollButton({ onClick, rolling }) {
  return (
    <button
      className={`roll-btn${rolling ? ' roll-btn--rolling' : ''}`}
      onClick={onClick}
      disabled={rolling}
    >
      {rolling ? 'Rolling...' : 'Roll'}
    </button>
  )
}
```

**Step 4: Create RollButton.css**

```css
.roll-btn {
  padding: 0.6rem 2rem;
  border-radius: 6px;
  border: 1px solid var(--fg-gold);
  background: rgba(201, 168, 76, 0.12);
  color: var(--fg-gold);
  font-family: monospace;
  font-size: 0.9rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  transition: all 0.15s ease;
}

.roll-btn:hover:not(:disabled) {
  background: rgba(201, 168, 76, 0.22);
  box-shadow: 0 0 16px rgba(201, 168, 76, 0.3);
}

.roll-btn--rolling {
  opacity: 0.5;
  cursor: default;
}
```

**Step 5: Commit**

```bash
git add src/components/ModeToggle.jsx src/components/ModeToggle.css src/components/RollButton.jsx src/components/RollButton.css
git commit -m "feat: add ModeToggle and RollButton components"
```

---

### Task 7: RollConfig panel + wire up App state

**Files:**
- Create: `src/components/RollConfig.jsx`
- Create: `src/components/RollConfig.css`
- Modify: `src/App.jsx`

**Step 1: Create RollConfig.jsx**

```jsx
import DieSelector from './DieSelector'
import Stepper from './Stepper'
import ModeToggle from './ModeToggle'
import RollButton from './RollButton'
import './RollConfig.css'

export default function RollConfig({ config, onChange, onRoll, rolling }) {
  const { dieType, count, modifier, mode } = config

  return (
    <div className="roll-config panel">
      <DieSelector selected={dieType} onChange={v => onChange({ dieType: v })} />
      <div className="roll-config-row">
        <Stepper
          label="Count"
          value={count}
          onChange={v => onChange({ count: v })}
          min={1}
          max={10}
          formatValue={v => v}
        />
        <Stepper
          label="Modifier"
          value={modifier}
          onChange={v => onChange({ modifier: v })}
          min={-20}
          max={20}
          formatValue={v => (v > 0 ? `+${v}` : `${v}`)}
        />
        <ModeToggle mode={mode} onChange={v => onChange({ mode: v })} />
        <RollButton onClick={onRoll} rolling={rolling} />
      </div>
    </div>
  )
}
```

**Step 2: Create RollConfig.css**

```css
.roll-config { display: flex; flex-direction: column; gap: 1rem; }

.roll-config-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
```

**Step 3: Update App.jsx with full state**

```jsx
import { useState, useCallback } from 'react'
import RollConfig from './components/RollConfig'
import { rollDice, rollWithAdvantage, rollWithDisadvantage, calculateTotal, formatNotation } from './utils/rollLogic'
import './App.css'

const DEFAULT_CONFIG = { dieType: 20, count: 1, modifier: 0, mode: 'normal' }

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const updateConfig = useCallback((patch) => setConfig(c => ({ ...c, ...patch })), [])

  const handleRoll = useCallback(() => {
    const { dieType, count, modifier, mode } = config
    let rolls, dropped = null

    if (mode === 'advantage') {
      const r = rollWithAdvantage(count, dieType)
      rolls = r.kept; dropped = r.dropped
    } else if (mode === 'disadvantage') {
      const r = rollWithDisadvantage(count, dieType)
      rolls = r.kept; dropped = r.dropped
    } else {
      rolls = rollDice(count, dieType)
    }

    const total = calculateTotal(rolls, modifier)
    const notation = formatNotation(config)
    const entry = { id: Date.now(), notation, rolls, dropped, modifier, total, mode }

    setRolling(true)
    setResult(entry)

    setTimeout(() => {
      setRolling(false)
      setHistory(h => [entry, ...h])
    }, 1200)
  }, [config])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Dice Roller</h1>
        <p className="app-subtitle">Roll the bones</p>
      </header>
      <RollConfig config={config} onChange={updateConfig} onRoll={handleRoll} rolling={rolling} />
      {result && <pre style={{color:'lime',fontSize:'0.7rem'}}>{JSON.stringify(result,null,2)}</pre>}
    </div>
  )
}
```

**Step 4: Verify roll produces correct data in the debug output**

```bash
npm run dev
```
Click Roll. Confirm the result JSON appears with correct values.

**Step 5: Commit**

```bash
git add src/components/RollConfig.jsx src/components/RollConfig.css src/App.jsx
git commit -m "feat: wire up RollConfig with full roll state in App"
```

---

### Task 8: 3D Die mesh component

**Files:**
- Create: `src/components/Die3D.jsx`
- Create: `src/utils/dieGeometry.js`

**Step 1: Create dieGeometry.js — maps sides to Three.js geometry args**

```js
import * as THREE from 'three'

// Custom d10 pentagonal bipyramid geometry
function createD10Geometry() {
  const geometry = new THREE.BufferGeometry()

  const phi = (1 + Math.sqrt(5)) / 2
  const top = 0.8
  const bottom = -0.8
  const r = 0.6
  const offset = Math.PI / 10  // stagger lower ring

  // 7 vertices: top, 5 upper ring, bottom (we duplicate for normals)
  // Build 10 triangular faces manually
  const verts = []
  const topV = [0, top, 0]
  const botV = [0, bottom, 0]

  const upper = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2
    return [Math.cos(a) * r, 0.1, Math.sin(a) * r]
  })
  const lower = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + offset
    return [Math.cos(a) * r, -0.1, Math.sin(a) * r]
  })

  // Top 5 faces
  for (let i = 0; i < 5; i++) {
    const n = (i + 1) % 5
    verts.push(...topV, ...upper[i], ...upper[n])
  }
  // Middle 5 faces
  for (let i = 0; i < 5; i++) {
    const n = (i + 1) % 5
    verts.push(...upper[i], ...lower[i], ...upper[n])
    verts.push(...upper[n], ...lower[i], ...lower[n])
  }
  // Bottom 5 faces — wait that's 15 total, need 10
  // Simpler: top cap (5) + bottom cap (5)
  for (let i = 0; i < 5; i++) {
    const n = (i + 1) % 5
    verts.push(...botV, ...lower[n], ...lower[i])
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.computeVertexNormals()
  return geometry
}

export function getDieGeometry(sides) {
  switch (sides) {
    case 4:   return new THREE.TetrahedronGeometry(0.9)
    case 6:   return new THREE.BoxGeometry(1.2, 1.2, 1.2)
    case 8:   return new THREE.OctahedronGeometry(1.0)
    case 10:  return createD10Geometry()
    case 12:  return new THREE.DodecahedronGeometry(0.9)
    case 20:  return new THREE.IcosahedronGeometry(1.0)
    case 100: return createD10Geometry()
    default:  return new THREE.IcosahedronGeometry(1.0)
  }
}

export const DIE_COLORS = {
  4:   '#8b6914',
  6:   '#7a5c2e',
  8:   '#6b4423',
  10:  '#5c3317',
  12:  '#4a2810',
  20:  '#3d1f0a',
  100: '#5c3317',
}
```

**Step 2: Create Die3D.jsx**

```jsx
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDieGeometry, DIE_COLORS } from '../utils/dieGeometry'

function makeNumberTexture(value, sides) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#2a1f0a'
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = '#c9a84c'
  ctx.font = 'bold 120px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(value), 128, 128)

  return new THREE.CanvasTexture(canvas)
}

export default function Die3D({ sides, value, rolling, position = [0, 0, 0], dimmed = false }) {
  const meshRef = useRef()
  const stateRef = useRef({ vel: { x: 0, y: 0, z: 0 }, settled: false, elapsed: 0 })

  const geometry = useMemo(() => getDieGeometry(sides), [sides])
  const texture = useMemo(() => makeNumberTexture(value, sides), [value, sides])

  // Reset animation when a new roll starts
  useEffect(() => {
    if (rolling) {
      stateRef.current = {
        vel: {
          x: (Math.random() - 0.5) * 25,
          y: (Math.random() - 0.5) * 25,
          z: (Math.random() - 0.5) * 25,
        },
        settled: false,
        elapsed: 0,
      }
    }
  }, [rolling])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const s = stateRef.current
    if (s.settled) return

    s.elapsed += delta
    const damping = Math.max(0, 1 - s.elapsed / 1.1)

    meshRef.current.rotation.x += s.vel.x * delta * damping
    meshRef.current.rotation.y += s.vel.y * delta * damping
    meshRef.current.rotation.z += s.vel.z * delta * damping

    if (damping === 0) s.settled = true
  })

  const color = DIE_COLORS[sides] || '#7a5c2e'

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.08}
        roughness={0.85}
        metalness={0.1}
        map={texture}
        opacity={dimmed ? 0.3 : 1}
        transparent={dimmed}
      />
    </mesh>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/Die3D.jsx src/utils/dieGeometry.js
git commit -m "feat: add 3D die mesh with tumble animation"
```

---

### Task 9: DiceArena R3F Canvas

**Files:**
- Create: `src/components/DiceArena.jsx`
- Create: `src/components/DiceArena.css`

**Step 1: Create DiceArena.jsx**

```jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Die3D from './Die3D'
import './DiceArena.css'

function getPositions(count) {
  const spacing = 2.2
  const total = count
  const offset = ((total - 1) * spacing) / 2
  return Array.from({ length: total }, (_, i) => [i * spacing - offset, 0, 0])
}

export default function DiceArena({ result, rolling }) {
  if (!result) {
    return (
      <div className="dice-arena dice-arena--empty">
        <p className="dice-arena-hint">Configure your roll and press Roll</p>
      </div>
    )
  }

  const { rolls, dropped, sides } = result
  const positions = getPositions(rolls.length)
  const droppedPositions = dropped ? getPositions(dropped.length) : []
  const hasDropped = dropped && dropped.length > 0

  return (
    <div className="dice-arena">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 8, 5]} intensity={1.2} color="#ffcc66" />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#441100" />

        {/* Kept dice */}
        {rolls.map((value, i) => (
          <Die3D
            key={`kept-${i}`}
            sides={sides}
            value={value}
            rolling={rolling}
            position={hasDropped
              ? [positions[i][0], 1.5, 0]
              : positions[i]}
          />
        ))}

        {/* Dropped dice (advantage/disadvantage) */}
        {dropped && dropped.map((value, i) => (
          <Die3D
            key={`dropped-${i}`}
            sides={sides}
            value={value}
            rolling={rolling}
            position={[droppedPositions[i][0], -1.5, 0]}
            dimmed
          />
        ))}

        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>

      {hasDropped && (
        <div className="arena-labels">
          <span className="arena-label arena-label--kept">kept</span>
          <span className="arena-label arena-label--dropped">dropped</span>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create DiceArena.css**

```css
.dice-arena {
  position: relative;
  height: 320px;
  border: 1px solid var(--border-gold);
  border-radius: 8px;
  background: radial-gradient(ellipse at center, #1a1208 0%, #0d0b08 100%);
  overflow: hidden;
}

.dice-arena--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-arena-hint {
  color: var(--fg-gold-faint);
  font-size: 0.8rem;
  letter-spacing: 1px;
  font-family: monospace;
}

.arena-labels {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 3rem;
  text-align: right;
}

.arena-label {
  font-size: 0.55rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: monospace;
}

.arena-label--kept { color: var(--fg-gold); }
.arena-label--dropped { color: rgba(201, 168, 76, 0.3); }
```

**Step 3: Wire DiceArena into App.jsx — add after RollConfig:**

```jsx
import DiceArena from './components/DiceArena'
// ... inside return, after RollConfig:
<DiceArena result={result} rolling={rolling} />
```

Note: pass `sides: config.dieType` when building the result entry in `handleRoll`:
```js
const entry = { id: Date.now(), notation, rolls, dropped, modifier, total, mode, sides: dieType }
```

**Step 4: Verify dice appear and tumble on roll**

```bash
npm run dev
```
Expected: clicking Roll spawns tumbling 3D dice in the arena

**Step 5: Commit**

```bash
git add src/components/DiceArena.jsx src/components/DiceArena.css src/App.jsx
git commit -m "feat: add DiceArena with R3F canvas and tumbling dice"
```

---

### Task 10: ResultDisplay

**Files:**
- Create: `src/components/ResultDisplay.jsx`
- Create: `src/components/ResultDisplay.css`

**Step 1: Create ResultDisplay.jsx**

```jsx
import './ResultDisplay.css'

export default function ResultDisplay({ result, rolling }) {
  if (!result) return null

  const { rolls, dropped, modifier, total, mode } = result
  const rollSum = rolls.reduce((s, v) => s + v, 0)

  return (
    <div className={`result-display${rolling ? ' result-display--rolling' : ''}`}>
      <div className="result-total">{total}</div>
      <div className="result-breakdown">
        <span className="result-rolls">
          {rolls.map((v, i) => (
            <span key={i} className="result-chip">{v}</span>
          ))}
        </span>
        {rolls.length > 1 && (
          <span className="result-sum"> = {rollSum}</span>
        )}
        {modifier !== 0 && (
          <span className="result-modifier">
            {modifier > 0 ? ` + ${modifier}` : ` − ${Math.abs(modifier)}`} = {total}
          </span>
        )}
        {dropped && dropped.length > 0 && (
          <span className="result-dropped">
            {' '}· dropped:{' '}
            {dropped.map((v, i) => (
              <span key={i} className="result-chip result-chip--dropped">{v}</span>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create ResultDisplay.css**

```css
.result-display {
  text-align: center;
  padding: 1rem;
  transition: opacity 0.3s ease;
}

.result-display--rolling { opacity: 0.3; }

.result-total {
  font-size: 4rem;
  font-family: Georgia, serif;
  color: var(--fg-gold);
  line-height: 1;
  text-shadow: 0 0 24px rgba(201, 168, 76, 0.4);
}

.result-breakdown {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--fg-parchment-dim);
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
}

.result-chip {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--border-gold);
  border-radius: 4px;
  color: var(--fg-parchment);
  background: rgba(201, 168, 76, 0.07);
}

.result-chip--dropped {
  opacity: 0.35;
  text-decoration: line-through;
}

.result-sum, .result-modifier { color: var(--fg-gold-dim); }
.result-dropped { color: rgba(201, 168, 76, 0.4); }
```

**Step 3: Add to App.jsx return after DiceArena:**

```jsx
import ResultDisplay from './components/ResultDisplay'
// ...
<ResultDisplay result={result} rolling={rolling} />
```

**Step 4: Verify result shows after dice settle**

**Step 5: Commit**

```bash
git add src/components/ResultDisplay.jsx src/components/ResultDisplay.css src/App.jsx
git commit -m "feat: add ResultDisplay with total and breakdown"
```

---

### Task 11: HistoryLog

**Files:**
- Create: `src/components/HistoryLog.jsx`
- Create: `src/components/HistoryLog.css`

**Step 1: Create HistoryLog.jsx**

```jsx
import './HistoryLog.css'

export default function HistoryLog({ history }) {
  if (history.length === 0) return null

  return (
    <div className="history-log panel">
      <div className="history-label">Roll History</div>
      <ul className="history-list">
        {history.map(entry => (
          <li key={entry.id} className="history-entry">
            <span className="history-notation">{entry.notation}</span>
            <span className="history-arrow">→</span>
            <span className="history-total">{entry.total}</span>
            <span className="history-chips">
              [{entry.rolls.join(', ')}]
            </span>
            {entry.dropped && (
              <span className="history-dropped">
                dropped [{entry.dropped.join(', ')}]
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Step 2: Create HistoryLog.css**

```css
.history-log { max-height: 200px; overflow-y: auto; }

.history-label {
  font-size: 0.55rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--fg-gold-dim);
  font-family: monospace;
  margin-bottom: 0.75rem;
}

.history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.history-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--fg-parchment-dim);
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(201, 168, 76, 0.08);
}

.history-notation { color: var(--fg-gold-dim); min-width: 6ch; }
.history-arrow { color: var(--fg-gold-faint); }
.history-total { color: var(--fg-parchment); font-size: 1rem; min-width: 3ch; }
.history-chips { color: var(--fg-gold-dim); font-size: 0.75rem; }
.history-dropped { color: rgba(201, 168, 76, 0.3); font-size: 0.7rem; }
```

**Step 3: Add to App.jsx — remove the debug `<pre>` and add HistoryLog:**

```jsx
import HistoryLog from './components/HistoryLog'
// ...
<HistoryLog history={history} />
```

**Step 4: Verify history accumulates per roll, newest first**

**Step 5: Commit**

```bash
git add src/components/HistoryLog.jsx src/components/HistoryLog.css src/App.jsx
git commit -m "feat: add HistoryLog component"
```

---

### Task 12: GitHub Pages deployment

**Files:**
- Modify: `vite.config.js` (base already set in Task 1)
- Modify: `package.json` (scripts already set in Task 1)

**Step 1: Verify build succeeds**

```bash
npm run build
```
Expected: `dist/` folder created, no errors

**Step 2: Deploy to GitHub Pages**

```bash
npm run deploy
```
Expected: "Published" message. This pushes the `dist/` folder to a `gh-pages` branch on the remote.

**Step 3: Enable GitHub Pages in the repo settings**

Go to: `https://github.com/Nyarlat-hotep/dice-roller` → Settings → Pages → Source: `gh-pages` branch, `/ (root)`

**Step 4: Verify live at**

`https://nyarlat-hotep.github.io/dice-roller/`
(Allow 1-2 minutes for GitHub to build)

**Step 5: Final commit with any cleanup**

```bash
git add -A
git commit -m "feat: complete dice roller — deploy to github pages"
git push origin main
```
