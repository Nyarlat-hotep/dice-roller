import './RollButton.css'

export default function RollButton({ onClick, rolling }) {
  return (
    <button
      className={`roll-btn${rolling ? ' roll-btn--rolling' : ''}`}
      onClick={onClick}
      disabled={rolling}
    >
      {rolling ? 'Your fate is...' : 'Reveal my fate'}
    </button>
  )
}
