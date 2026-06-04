import { X } from 'lucide-react'
import './ChainBar.css'

// The growing formula: 1d20 + 1d4 + 2. Tap a die chip to remove one of that type.
export default function ChainBar({ terms, modifier, onRemoveDie }) {
  if (terms.length === 0) {
    return (
      <div className="chain-bar chain-bar--empty">
        tap a die to begin your incantation
      </div>
    )
  }

  return (
    <div className="chain-bar">
      {terms.map((t, i) => (
        <span key={t.sides} className="chain-term">
          {i > 0 && <span className="chain-op">+</span>}
          <button
            type="button"
            className="chain-chip"
            data-sides={t.sides}
            onClick={() => onRemoveDie(t.sides)}
            title={`Remove a d${t.sides}`}
          >
            <span className="chain-chip-label">{t.count}d{t.sides}</span>
            <X size={11} className="chain-chip-x" />
          </button>
        </span>
      ))}
      {modifier !== 0 && (
        <span className="chain-term">
          <span className="chain-op">{modifier > 0 ? '+' : '−'}</span>
          <span className="chain-mod">{Math.abs(modifier)}</span>
        </span>
      )}
    </div>
  )
}
