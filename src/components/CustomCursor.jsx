import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import './CustomCursor.css'

const centerTransform = ({ x, y }) => `translate(${x}, ${y}) translate(-50%, -50%)`

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false)

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const ringX = useSpring(cursorX, { damping: 22, stiffness: 160, mass: 0.5 })
  const ringY = useSpring(cursorY, { damping: 22, stiffness: 160, mass: 0.5 })

  useEffect(() => {
    const onMove = (e) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }
    const onOver = (e) => {
      setIsHovering(!!e.target.closest('button, a, [role="button"], input, select, textarea'))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [cursorX, cursorY])

  return (
    <>
      <motion.div
        className="cursor-dot"
        style={{ x: cursorX, y: cursorY }}
        transformTemplate={centerTransform}
        animate={{ scale: isHovering ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        className="cursor-ring"
        style={{ x: ringX, y: ringY }}
        transformTemplate={centerTransform}
        animate={{
          scale: isHovering ? 1.6 : 1,
          borderColor: isHovering
            ? 'rgba(212, 176, 48, 0.9)'
            : 'rgba(212, 176, 48, 0.5)',
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  )
}
