# Dice Roller — Design Document

**Date:** 2026-03-06

## Overview

A D&D dice roller web app with a fantasy dungeon aesthetic, 3D animated dice using React Three Fiber, and a full-featured roll configuration panel. Deployed via GitHub Pages.

## Stack

- **Framework:** Vite + React
- **3D:** React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **Styling:** Plain CSS, no Tailwind
- **Deployment:** `gh-pages` package, `base: '/dice-roller/'` in vite.config
- **State:** Plain React `useState` — no external state library

## Dice

All 7 standard D&D dice: **d4, d6, d8, d10, d12, d20, d100**

Three.js geometries:
| Die   | Geometry                     |
|-------|------------------------------|
| d4    | `TetrahedronGeometry`        |
| d6    | `BoxGeometry`                |
| d8    | `OctahedronGeometry`         |
| d10   | Custom pentagonal bipyramid  |
| d12   | `DodecahedronGeometry`       |
| d20   | `IcosahedronGeometry`        |
| d100  | Reuses d10 geometry          |

## Roll Configuration

- **Die selector** — 7 clickable buttons, one active at a time
- **Count stepper** — [−] N [+], range 1–10
- **Modifier stepper** — [−] N [+], range −20 to +20
- **Mode toggle** — ADV / NORMAL / DIS pill (advantage rolls 2 sets, keeps highest/lowest)
- **Roll button** — triggers roll

## Animation

- Results are generated immediately via `Math.random()` on roll trigger
- Each die spawns as an R3F mesh in the DiceArena Canvas
- `useFrame` drives a scripted ease-out spin (~1s): random initial angular velocity → decelerates → settles flat
- After settling, a canvas texture on the top face reveals the result number
- **Advantage/disadvantage:** renders 2 groups side-by-side; the dropped set dims and gets a strikethrough overlay

## Result Display

- **Total** — large gold number, fades in after dice settle
- **Breakdown** — individual die chip badges (e.g. `[4]` `[6]` `[8]`) + modifier line
- Advantage mode: both sets shown, kept set highlighted, dropped set dimmed

## Roll History

- Scrollable log below the dice arena, most recent first
- Each entry: `3d8+2 → 20  [4, 6, 8]  ADV`
- Session-only (no persistence)

## Visual Theme

- **Background:** `#0d0b08` (dark stone)
- **Primary text/accent:** `#c9a84c` (aged gold/amber)
- **Die material:** `MeshStandardMaterial` with stone/bone color, amber emissive highlight
- **Lighting:** ambient + warm point light from above
- **Typography:** serif or fantasy-adjacent font for headings, monospace for numbers
- **UI controls:** parchment-toned panels with engraved/embossed feel

## Layout

```
┌─────────────────────────────────────┐
│  DICE_ROLLER          [title]       │
├─────────────────────────────────────┤
│  [d4] [d6] [d8] [d10] [d12] [d20] [d%] │
│  Count: [−] 2 [+]  Modifier: [−] +2 [+] │
│  [ADV] [NORM] [DIS]      [ROLL]    │
├─────────────────────────────────────┤
│                                     │
│    🎲  🎲  🎲   ← R3F Canvas        │
│                                     │
│  TOTAL: 20                          │
│  [4] + [6] + [8] = 18 + 2 = 20     │
├─────────────────────────────────────┤
│  HISTORY                            │
│  3d8+2 → 20   [4,6,8]   ADV        │
│  1d20 → 17                         │
└─────────────────────────────────────┘
```

## Component Tree

```
App
├── RollConfig
│   ├── DieSelector
│   ├── CountStepper
│   ├── ModifierStepper
│   ├── ModeToggle
│   └── RollButton
├── DiceArena (R3F Canvas)
│   └── Die × N (mesh + useFrame animation + canvas texture)
├── ResultDisplay
│   ├── Total
│   └── Breakdown
└── HistoryLog
    └── HistoryEntry × N
```

## Deployment

Same pattern as `better-condition-builder`:
- `vite.config.js`: `base: '/dice-roller/'`
- `package.json`: `"predeploy": "npm run build"`, `"deploy": "gh-pages -d dist"`
- GitHub Pages source: `gh-pages` branch
