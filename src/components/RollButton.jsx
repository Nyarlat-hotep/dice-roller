import { motion } from 'framer-motion'
import './RollButton.css'

export default function RollButton({ onClick, rolling }) {
  return (
    <motion.button
      className={`roll-btn${rolling ? ' roll-btn--rolling' : ''}`}
      onClick={onClick}
      disabled={rolling}
      initial={{ paddingLeft: '2.2rem', paddingRight: '2.2rem' }}
      animate={{
        paddingLeft:  rolling ? '1rem' : '2.2rem',
        paddingRight: rolling ? '1rem' : '2.2rem',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      {rolling ? 'Scrying...' : 'Reveal your fate'}
    </motion.button>
  )
}
