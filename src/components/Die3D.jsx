import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDieGeometry, getDieFaceNumbers, DIE_COLORS } from '../utils/dieGeometry'

function makeFaceTexture(label, dieColor, sides) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Die-colored background
  ctx.fillStyle = dieColor
  ctx.fillRect(0, 0, size, size)

  // Subtle inner highlight
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.5)
  grad.addColorStop(0, 'rgba(255,255,255,0.15)')
  grad.addColorStop(1, 'rgba(0,0,0,0.2)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // d6 shows the full canvas on each square face, so needs a larger font
  // Triangle/polygon faces show only a portion of the canvas, so 0.30 fills correctly
  const fontFrac = sides === 6 ? 0.44 : 0.30
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(size * fontFrac)}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(label), size / 2, size / 2)

  return new THREE.CanvasTexture(canvas)
}

// Average vertex normals per face group — handles indexed and non-indexed geometry
function computeFaceNormals(geometry) {
  if (!geometry.attributes.normal || !geometry.groups.length) return []
  const normals = geometry.attributes.normal
  const idx = geometry.index
  return geometry.groups.map(group => {
    const n = new THREE.Vector3()
    for (let i = group.start; i < group.start + group.count; i++) {
      const vi = idx ? idx.getX(i) : i
      n.x += normals.getX(vi)
      n.y += normals.getY(vi)
      n.z += normals.getZ(vi)
    }
    return n.divideScalar(group.count).normalize()
  })
}

// Approximate camera-facing direction (camera is at [0, 3, 8])
const CAMERA_DIR = new THREE.Vector3(0, 0.35, 0.94)

export default function Die3D({ sides, value, rolling, position = [0, 0, 0], dimmed = false }) {
  const meshRef = useRef()
  const stateRef = useRef({ vel: { x: 0, y: 0, z: 0 }, settled: false, elapsed: 0, snapQuat: null })

  const geometry = useMemo(() => getDieGeometry(sides), [sides])
  const faceNumbers = useMemo(() => getDieFaceNumbers(sides), [sides])
  const faceNormals = useMemo(() => computeFaceNormals(geometry), [geometry])
  const color = DIE_COLORS[sides] || '#7a5c2e'

  const materials = useMemo(() => {
    return faceNumbers.map((num) => {
      const tex = makeFaceTexture(num, color, sides)
      return new THREE.MeshPhysicalMaterial({
        map: tex,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.12,
        roughness: 0.08,
        metalness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        reflectivity: 1,
        opacity: dimmed ? 0.35 : 1,
        transparent: dimmed,
      })
    })
  }, [sides, color, dimmed])

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
        snapQuat: null,
      }
    }
  }, [rolling])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const s = stateRef.current

    // Snap phase: smoothly rotate result face toward camera
    if (s.settled) {
      // Compute snap target once we have value and normals
      if (!s.snapQuat && value !== undefined && faceNormals.length) {
        const faceIdx = faceNumbers.indexOf(value)
        if (faceIdx >= 0 && faceNormals[faceIdx]) {
          s.snapQuat = new THREE.Quaternion().setFromUnitVectors(faceNormals[faceIdx], CAMERA_DIR)
        }
      }
      if (s.snapQuat) {
        meshRef.current.quaternion.slerp(s.snapQuat, delta * 3)
      }
      return
    }

    // Tumble phase
    s.elapsed += delta
    const damping = Math.max(0, 1 - s.elapsed / 1.1)

    meshRef.current.rotation.x += s.vel.x * delta * damping
    meshRef.current.rotation.y += s.vel.y * delta * damping
    meshRef.current.rotation.z += s.vel.z * delta * damping

    if (damping === 0) s.settled = true
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geometry} material={materials} />
    </group>
  )
}
