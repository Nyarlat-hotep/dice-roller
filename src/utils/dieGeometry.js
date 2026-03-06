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
        // Pentagon fan-from-corner (d12): Three.js triangulates each pentagon as a fan
        // from its first vertex (the "fan vertex"), NOT from the geometric center.
        // UV maps all 5 pentagon vertices to a regular pentagon whose centroid is (0.5, 0.5).
        //   v0 (fan vertex) at top: (0.5, 0.94)
        //   v1..v4 arranged CCW so centroid = (0.5, 0.5)
        const PENT = [
          [0.5,   0.94],   // v0 — fan vertex (top)
          [0.918, 0.636],  // v1
          [0.759, 0.144],  // v2
          [0.241, 0.144],  // v3
          [0.082, 0.636],  // v4
        ]
        uvArray[base + 0] = PENT[0][0];       uvArray[base + 1] = PENT[0][1]
        uvArray[base + 2] = PENT[tri + 1][0]; uvArray[base + 3] = PENT[tri + 1][1]
        uvArray[base + 4] = PENT[tri + 2][0]; uvArray[base + 5] = PENT[tri + 2][1]
      }
    }

    geometry.addGroup(startVert, vertsPerFace, face)
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2))

  // Recompute flat, outward-pointing normals for every triangle.
  // This overrides any wrong winding from the source geometry and gives
  // a proper flat-faceted look for all polyhedral dice.
  const pos = geometry.attributes.position
  const normArr = new Float32Array(posCount * 3)
  for (let i = 0; i < posCount; i += 3) {
    const ax = pos.getX(i),   ay = pos.getY(i),   az = pos.getZ(i)
    const bx = pos.getX(i+1), by = pos.getY(i+1), bz = pos.getZ(i+1)
    const cx = pos.getX(i+2), cy = pos.getY(i+2), cz = pos.getZ(i+2)
    const e1x=bx-ax, e1y=by-ay, e1z=bz-az
    const e2x=cx-ax, e2y=cy-ay, e2z=cz-az
    let nx=e1y*e2z-e1z*e2y, ny=e1z*e2x-e1x*e2z, nz=e1x*e2y-e1y*e2x
    // If normal points toward origin (inward), flip it
    const mx=(ax+bx+cx)/3, my=(ay+by+cy)/3, mz=(az+bz+cz)/3
    if (nx*mx+ny*my+nz*mz < 0) { nx=-nx; ny=-ny; nz=-nz }
    const len = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1
    for (let j = 0; j < 3; j++) {
      normArr[(i+j)*3]   = nx/len
      normArr[(i+j)*3+1] = ny/len
      normArr[(i+j)*3+2] = nz/len
    }
  }
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3))
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
