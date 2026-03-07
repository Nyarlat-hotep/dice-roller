# Particle Visualization Design

## Goal

Replace 3D dice rendering with a 2D Canvas particle system where glowing dots wander the container at rest and converge to form rolled numbers, then dissipate back to wandering.

## Architecture

Replace `Die3D.jsx`, `dieGeometry.js`, and the Three.js `<Canvas>` in `DiceArena.jsx` with a single HTML `<canvas>` element and a self-contained 2D particle animation loop. The `DiceArena` component keeps its existing props (`result`, `rolling`) — the parent requires no changes.

## Particle System

**Pool:** ~300 particles, fixed-size. No particles created or destroyed — only their targets change.

**Per-particle state:** `{ x, y, vx, vy, size, opacity, color, targetX, targetY }`

**Visual:** Glowing dots rendered with `ctx.shadowBlur` + `ctx.shadowColor`. Color palette matches the galaxy star whites/blue-whites. Dropped dice particles use red.

**Digit sampling:** Each number is rendered to an offscreen canvas at large size. Lit pixel coordinates are collected, subsampled to ~60–80 particles per digit, and jittered for an organic (not pixel-perfect) appearance. Horizontal slot positions are calculated from the number of results and centered in the canvas.

## State Machine

1. **WANDER** — Particles drift randomly within canvas bounds (active before any roll, and between rolls). Soft wall bounce keeps them contained.
2. **FORMING** — On a new roll result, particles pull toward digit cluster positions one number at a time in quick sequence (~400ms per digit). Previous formed digits stay visible while the next forms.
3. **HOLD** — All kept digits stay formed. Dropped dice particles (red) fall outward toward edges and return to WANDER.
4. **DISSIPATE** — After ~2s delay, all remaining formed particles scatter back outward and return to WANDER.

New roll (when `rolling` prop flips to true) resets immediately to WANDER, then FORMING begins when `rolling` becomes false and `result` is set.

## Layout

Multiple results spread horizontally, centered in the container. One horizontal slot per kept die result.

## Cleanup

Files to delete: `Die3D.jsx`, `dieGeometry.js`
Files to update: `DiceArena.jsx`, `DiceArena.css` (remove Three.js styles, update canvas styling)
