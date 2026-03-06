import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { getDieGeometry, DIE_COLORS } from '../utils/dieGeometry'

export default function Die3D({ sides, value, rolling, position = [0, 0, 0], dimmed = false }) {
  const meshRef = useRef()
  const stateRef = useRef({ vel: { x: 0, y: 0, z: 0 }, settled: false, elapsed: 0 })

  const geometry = useMemo(() => getDieGeometry(sides), [sides])

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
    <group position={position}>
      {/* Die shape — rotates via meshRef */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.22}
          roughness={0.7}
          metalness={0.25}
          opacity={dimmed ? 0.3 : 1}
          transparent={dimmed}
        />
      </mesh>

      {/* Number label — always faces camera, pinned to die center */}
      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '2.4rem',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: `0 0 12px ${color}, 0 0 28px ${color}, 0 1px 2px rgba(0,0,0,0.9)`,
          opacity: dimmed ? 0.35 : 1,
          userSelect: 'none',
          whiteSpace: 'nowrap',
          display: 'block',
        }}>
          {value}
        </span>
      </Html>
    </group>
  )
}
