import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDieGeometry, DIE_COLORS } from '../utils/dieGeometry'

function makeNumberTexture(value) {
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
  const texture = useMemo(() => makeNumberTexture(value), [value])

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
