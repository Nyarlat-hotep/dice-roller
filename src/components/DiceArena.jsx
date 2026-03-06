import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import Die3D from './Die3D'
import './DiceArena.css'

function getPositions(count) {
  const spacing = 2.2
  const offset = ((count - 1) * spacing) / 2
  return Array.from({ length: count }, (_, i) => [i * spacing - offset, 0, 0])
}

export default function DiceArena({ result, rolling }) {
  if (!result) {
    return (
      <div className="dice-arena dice-arena--empty">
        <p className="dice-arena-hint">The bones await your command, traveller</p>
      </div>
    )
  }

  const { rolls, dropped, sides } = result
  const positions = getPositions(rolls.length)
  const droppedPositions = dropped ? getPositions(dropped.length) : []
  const hasDropped = dropped && dropped.length > 0

  return (
    <div className="dice-arena">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 40 }}
        style={{ background: 'transparent' }}
      >
        {/* IBL — makes shapes read as genuinely 3D */}
        <Environment preset="night" />

        {/* Dramatic key light from top-right */}
        <directionalLight position={[4, 8, 4]} intensity={2.5} color="#fff8e8" />
        {/* Cool fill from opposite side */}
        <directionalLight position={[-4, -2, -4]} intensity={0.6} color="#8090cc" />
        {/* Warm glow from below (table bounce) */}
        <pointLight position={[0, -4, 2]} intensity={0.8} color="#cc8840" />

        {/* Kept dice */}
        {rolls.map((value, i) => (
          <Die3D
            key={`kept-${i}`}
            sides={sides}
            value={value}
            rolling={rolling}
            position={hasDropped
              ? [positions[i][0], 1.5, 0]
              : positions[i]}
          />
        ))}

        {/* Dropped dice (advantage/disadvantage) */}
        {dropped && dropped.map((value, i) => (
          <Die3D
            key={`dropped-${i}`}
            sides={sides}
            value={value}
            rolling={rolling}
            position={[droppedPositions[i][0], -1.5, 0]}
            dimmed
          />
        ))}

        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>

      {hasDropped && (
        <div className="arena-labels">
          <span className="arena-label arena-label--kept">kept</span>
          <span className="arena-label arena-label--dropped">dropped</span>
        </div>
      )}
    </div>
  )
}
