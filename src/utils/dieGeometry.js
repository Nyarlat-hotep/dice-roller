import * as THREE from 'three'

// Custom d10 pentagonal bipyramid geometry
function createD10Geometry() {
  const geometry = new THREE.BufferGeometry()

  const top = 0.8
  const bottom = -0.8
  const r = 0.6
  const offset = Math.PI / 10  // stagger lower ring

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

  const verts = []

  // Top 5 faces
  for (let i = 0; i < 5; i++) {
    const n = (i + 1) % 5
    verts.push(...topV, ...upper[i], ...upper[n])
  }
  // Middle belt (10 triangles = 5 quads)
  for (let i = 0; i < 5; i++) {
    const n = (i + 1) % 5
    verts.push(...upper[i], ...lower[i], ...upper[n])
    verts.push(...upper[n], ...lower[i], ...lower[n])
  }
  // Bottom 5 faces
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
