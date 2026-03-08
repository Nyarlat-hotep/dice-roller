import { ArrowRight } from 'lucide-react'
import './ResultDisplay.css'

export default function ResultDisplay({ result, rolling }) {
  if (!result || rolling) return null

  const { rolls, dropped, modifier, total } = result
  const rollSum = rolls.reduce((s, v) => s + v, 0)

  return (
    <div className={`result-display${rolling ? ' result-display--rolling' : ''}`}>
      <div className="result-fate-label">the fates decree</div>
      <div className="result-total">{total}</div>
      <div className="result-breakdown">
        <span className="result-rolls">
          {rolls.map((v, i) => (
            <span key={i} className="result-chip">{v}</span>
          ))}
        </span>
        {rolls.length > 1 && (
          <span className="result-sum"><ArrowRight size={12} className="result-arrow" />{rollSum}</span>
        )}
        {modifier !== 0 && (
          <span className="result-modifier">
            {modifier > 0 ? `+ ${modifier}` : `− ${Math.abs(modifier)}`}<ArrowRight size={12} className="result-arrow" />{total}
          </span>
        )}
        {dropped && dropped.length > 0 && (
          <span className="result-dropped">
            {' '}· dropped:{' '}
            {dropped.map((v, i) => (
              <span key={i} className="result-chip result-chip--dropped">{v}</span>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
