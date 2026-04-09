import { useEffect, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import './CustomCursor.css'

const centerTransform = ({ x, y }) => `translate(${x}, ${y}) translate(-50%, -50%)`

// Pip [cx, cy] positions on a 32×32 grid
const PIPS = {
  1: [[16, 16]],
  2: [[24, 8],  [8, 24]],
  3: [[24, 8],  [16, 16], [8, 24]],
  4: [[8, 8],   [24, 8],  [8, 24],  [24, 24]],
  5: [[8, 8],   [24, 8],  [16, 16], [8, 24],  [24, 24]],
  6: [[8, 8],   [24, 8],  [8, 16],  [24, 16], [8, 24],  [24, 24]],
}

export default function CustomCursor() {
  const [face, setFace] = useState(6)
  const [isHovering, setIsHovering] = useState(false)
  const [pulse, setPulse] = useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  useEffect(() => {
    const onMove = (e) => { cursorX.set(e.clientX); cursorY.set(e.clientY) }
    const onOver = (e) => {
      setIsHovering(!!e.target.closest('button, a, [role="button"], input, select, textarea'))
    }
    const onClick = () => {
      setFace(Math.ceil(Math.random() * 6))
      setPulse(true)
      setTimeout(() => setPulse(false), 140)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('click', onClick)
    }
  }, [cursorX, cursorY])

  return (
    <motion.div
      className="cursor-die"
      style={{ x: cursorX, y: cursorY }}
      transformTemplate={centerTransform}
      animate={{
        scale: pulse ? 1.35 : isHovering ? 1.15 : 1,
        opacity: isHovering ? 1 : 0.88,
      }}
      transition={{ duration: pulse ? 0.07 : 0.18 }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect
          x="1.5" y="1.5" width="29" height="29" rx="6"
          fill="#0d0f1c"
          stroke="#d4b030"
          strokeWidth={isHovering ? 1.8 : 1.2}
          strokeOpacity={isHovering ? 1 : 0.7}
        />
        {PIPS[face].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.6" fill="#d4b030" fillOpacity="0.95" />
        ))}
      </svg>
    </motion.div>
  )
}
