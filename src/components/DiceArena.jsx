import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
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
        camera={{ position: [0, 3, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 8, 5]} intensity={2.0} color="#ffcc66" />
        <pointLight position={[-5, -3, -5]} intensity={0.5} color="#663300" />

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
