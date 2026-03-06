import './RollButton.css'

export default function RollButton({ onClick, rolling }) {
  return (
    <button
      className={`roll-btn${rolling ? ' roll-btn--rolling' : ''}`}
      onClick={onClick}
      disabled={rolling}
    >
      {rolling ? 'Rolling...' : 'Roll'}
    </button>
  )
}
