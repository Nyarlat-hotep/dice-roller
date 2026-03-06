import './RollButton.css'

export default function RollButton({ onClick, rolling }) {
  return (
    <button
      className={`roll-btn${rolling ? ' roll-btn--rolling' : ''}`}
      onClick={onClick}
      disabled={rolling}
    >
      {rolling ? 'The bones tumble...' : 'Cast the Bones'}
    </button>
  )
}
