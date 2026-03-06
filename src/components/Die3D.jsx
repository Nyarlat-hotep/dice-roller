import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDieGeometry, getDieFaceNumbers, DIE_COLORS } from '../utils/dieGeometry'

function makeFaceTexture(label, dieColor) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Die-colored background
  ctx.fillStyle = dieColor
  ctx.fillRect(0, 0, size, size)

  // Subtle inner highlight
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.5)
  grad.addColorStop(0, 'rgba(255,255,255,0.18)')
  grad.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Number glow
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 14
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(size * 0.44)}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(label), size / 2, size / 2)

  return new THREE.CanvasTexture(canvas)
}

export default function Die3D({ sides, value, rolling, position = [0, 0, 0], dimmed = false }) {
  const meshRef = useRef()
  const stateRef = useRef({ vel: { x: 0, y: 0, z: 0 }, settled: false, elapsed: 0 })

  const geometry = useMemo(() => getDieGeometry(sides), [sides])
  const faceNumbers = useMemo(() => getDieFaceNumbers(sides), [sides])
  const color = DIE_COLORS[sides] || '#7a5c2e'

  const materials = useMemo(() => {
    return faceNumbers.map((num) => {
      const tex = makeFaceTexture(num, color)
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

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geometry} material={materials} />
    </group>
  )
}
