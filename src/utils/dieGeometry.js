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

// Project each face onto a local 2D plane derived from the 3D vertex positions.
// This is the only approach guaranteed to be distortion-free regardless of face
// orientation, vertex ordering, or die type.
//
// For fan-triangulated faces (all types here): unique polygon vertices are at
//   s, s+1, and s+3k-1 for k=1..N  (where N = trianglesPerFace, s = startVert)
function setupFaceTexturing(geometry, trianglesPerFace) {
  const pos = geometry.attributes.position
  const posCount = pos.count
  const uvArray = new Float32Array(posCount * 2)
  const vertsPerFace = trianglesPerFace * 3
  const faceCount = posCount / vertsPerFace

  for (let face = 0; face < faceCount; face++) {
    const s = face * vertsPerFace

    // Unique polygon vertex indices (fan triangulation from s)
    const uniq = [s, s + 1]
    for (let k = 1; k <= trianglesPerFace; k++) uniq.push(s + 3 * k - 1)

    // Geometric centroid from unique vertices
    let cx = 0, cy = 0, cz = 0
    for (const i of uniq) { cx += pos.getX(i); cy += pos.getY(i); cz += pos.getZ(i) }
    cx /= uniq.length; cy /= uniq.length; cz /= uniq.length

    // Face normal from first triangle + outward-flip
    const ax=pos.getX(s), ay=pos.getY(s), az=pos.getZ(s)
    const bx=pos.getX(s+1), by=pos.getY(s+1), bz=pos.getZ(s+1)
    const gx=pos.getX(s+2), gy=pos.getY(s+2), gz=pos.getZ(s+2)
    const e1x=bx-ax, e1y=by-ay, e1z=bz-az
    const e2x=gx-ax, e2y=gy-ay, e2z=gz-az
    let nx=e1y*e2z-e1z*e2y, ny=e1z*e2x-e1x*e2z, nz=e1x*e2y-e1y*e2x
    if (nx*cx+ny*cy+nz*cz < 0) { nx=-nx; ny=-ny; nz=-nz }
    const nLen = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1
    nx/=nLen; ny/=nLen; nz/=nLen

    // Orthonormal tangent on the face plane (Gram-Schmidt from world axis)
    let tx = Math.abs(nx) < 0.9 ? 1 : 0
    let ty = Math.abs(nx) < 0.9 ? 0 : 1
    let tz = 0
    const td = tx*nx + ty*ny + tz*nz
    tx -= td*nx; ty -= td*ny; tz -= td*nz
    const tLen = Math.sqrt(tx*tx+ty*ty+tz*tz) || 1
    tx/=tLen; ty/=tLen; tz/=tLen

    // Bitangent = normal × tangent
    const btx=ny*tz-nz*ty, bty=nz*tx-nx*tz, btz=nx*ty-ny*tx

    // Project all face vertices to local 2D, measure max radius
    const u2 = [], v2 = []
    let maxR = 0
    for (let i = s; i < s + vertsPerFace; i++) {
      const dx=pos.getX(i)-cx, dy=pos.getY(i)-cy, dz=pos.getZ(i)-cz
      const u = dx*tx + dy*ty + dz*tz
      const v = dx*btx + dy*bty + dz*btz
      u2.push(u); v2.push(v)
      maxR = Math.max(maxR, Math.sqrt(u*u + v*v))
    }

    // Scale so the outermost vertex sits at UV radius 0.44 from center (0.5, 0.5)
    const scale = maxR > 0 ? 0.44 / maxR : 1
    for (let j = 0; j < vertsPerFace; j++) {
      uvArray[(s + j) * 2]     = 0.5 + u2[j] * scale
      uvArray[(s + j) * 2 + 1] = 0.5 + v2[j] * scale
    }

    geometry.addGroup(s, vertsPerFace, face)
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2))

  // Flat outward-pointing normals — overrides any wrong winding from source geometry
  const normArr = new Float32Array(posCount * 3)
  for (let i = 0; i < posCount; i += 3) {
    const ax=pos.getX(i), ay=pos.getY(i), az=pos.getZ(i)
    const bx=pos.getX(i+1), by=pos.getY(i+1), bz=pos.getZ(i+1)
    const cx=pos.getX(i+2), cy=pos.getY(i+2), cz=pos.getZ(i+2)
    const e1x=bx-ax, e1y=by-ay, e1z=bz-az
    const e2x=cx-ax, e2y=cy-ay, e2z=cz-az
    let nx=e1y*e2z-e1z*e2y, ny=e1z*e2x-e1x*e2z, nz=e1x*e2y-e1y*e2x
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
