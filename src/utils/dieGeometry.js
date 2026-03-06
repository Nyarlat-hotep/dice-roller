import * as THREE from 'three'

function createD10Geometry() {
  const geometry = new THREE.BufferGeometry()
  const top = 0.8, bottom = -0.8, r = 0.6
  const offset = Math.PI / 10
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
  // Interleave upper and lower kite faces so consecutive triangle pairs form real kites
  for (let i = 0; i < 5; i++) {
    const n = (i + 1) % 5
    // Upper kite face (apex = top): T → u_i → l_i, T → l_i → u_n
    verts.push(...topV, ...upper[i], ...lower[i])
    verts.push(...topV, ...lower[i], ...upper[n])
    // Lower kite face (apex = bottom): B → l_n → u_n, B → u_n → l_i
    verts.push(...botV, ...lower[n], ...upper[n])
    verts.push(...botV, ...upper[n], ...lower[i])
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.computeVertexNormals()
  return geometry
}

// Remap UVs to flat per-face projection and add material groups
function setupFaceTexturing(geometry, trianglesPerFace) {
  const posCount = geometry.attributes.position.count
  const uvArray = new Float32Array(posCount * 2)
  const vertsPerFace = trianglesPerFace * 3
  const faceCount = posCount / vertsPerFace

  for (let face = 0; face < faceCount; face++) {
    const startVert = face * vertsPerFace

    for (let tri = 0; tri < trianglesPerFace; tri++) {
      const base = (startVert + tri * 3) * 2

      if (trianglesPerFace === 1) {
        // Equilateral triangle with centroid at UV (0.5, 0.5)
        // v0 top, v1 bottom-left, v2 bottom-right — circumradius 0.44
        uvArray[base + 0] = 0.5;   uvArray[base + 1] = 0.94
        uvArray[base + 2] = 0.119; uvArray[base + 3] = 0.28
        uvArray[base + 4] = 0.881; uvArray[base + 5] = 0.28
      } else if (trianglesPerFace === 2) {
        // Diamond centered at UV (0.5, 0.5):
        // tri 0: apex(top) → left-wing → opposite-apex(bottom)
        // tri 1: apex(top) → opposite-apex(bottom) → right-wing
        if (tri === 0) {
          uvArray[base + 0] = 0.5;  uvArray[base + 1] = 0.95  // apex
          uvArray[base + 2] = 0.05; uvArray[base + 3] = 0.5   // left
          uvArray[base + 4] = 0.5;  uvArray[base + 5] = 0.05  // opposite apex
        } else {
          uvArray[base + 0] = 0.5;  uvArray[base + 1] = 0.95  // apex
          uvArray[base + 2] = 0.5;  uvArray[base + 3] = 0.05  // opposite apex
          uvArray[base + 4] = 0.95; uvArray[base + 5] = 0.5   // right
        }
      } else {
        // Three-triangle pentagon face (d12) — fan from center
        const a0 = (tri / 3) * Math.PI * 2 - Math.PI / 2
        const a1 = ((tri + 1) / 3) * Math.PI * 2 - Math.PI / 2
        uvArray[base + 0] = 0.5; uvArray[base + 1] = 0.5
        uvArray[base + 2] = 0.5 + 0.48 * Math.cos(a0)
        uvArray[base + 3] = 0.5 + 0.48 * Math.sin(a0)
        uvArray[base + 4] = 0.5 + 0.48 * Math.cos(a1)
        uvArray[base + 5] = 0.5 + 0.48 * Math.sin(a1)
      }
    }

    geometry.addGroup(startVert, vertsPerFace, face)
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2))
}

export function getDieGeometry(sides) {
  let geo
  switch (sides) {
    case 4:
      geo = new THREE.TetrahedronGeometry(0.9)
      setupFaceTexturing(geo, 1)
      return geo
    case 6:
      // BoxGeometry already has 6 material groups and correct UVs
      return new THREE.BoxGeometry(1.2, 1.2, 1.2)
    case 8:
      geo = new THREE.OctahedronGeometry(1.0)
      setupFaceTexturing(geo, 1)
      return geo
    case 10:
      geo = createD10Geometry()
      setupFaceTexturing(geo, 2)
      return geo
    case 12:
      geo = new THREE.DodecahedronGeometry(0.9)
      setupFaceTexturing(geo, 3)
      return geo
    case 20:
      geo = new THREE.IcosahedronGeometry(1.0)
      setupFaceTexturing(geo, 1)
      return geo
    case 100:
      geo = createD10Geometry()
      setupFaceTexturing(geo, 2)
      return geo
    default:
      geo = new THREE.IcosahedronGeometry(1.0)
      setupFaceTexturing(geo, 1)
      return geo
  }
}

export function getDieFaceNumbers(sides) {
  switch (sides) {
    case 4:   return [1, 2, 3, 4]
    case 6:   return [1, 2, 3, 4, 5, 6]
    case 8:   return [1, 2, 3, 4, 5, 6, 7, 8]
    case 10:  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    case 12:  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    case 20:  return Array.from({ length: 20 }, (_, i) => i + 1)
    case 100: return ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']
    default:  return [1]
  }
}

// Each die has an elemental identity
export const DIE_COLORS = {
  4:   '#d04015',   // Inferno  — fire
  6:   '#2e7d3a',   // Grove    — forest
  8:   '#1a68b0',   // Torrent  — deep water
  10:  '#7030c0',   // Void     — arcane shadow
  12:  '#b01835',   // Blood    — crimson warrior
  20:  '#b89010',   // Sacred   — gleaming gold
  100: '#5030b0',   // Arcane   — spellbook indigo
}
