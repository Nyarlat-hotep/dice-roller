import { ArrowRight, Plus, Minus } from 'lucide-react'
import './ResultDisplay.css'

export default function ResultDisplay({ result, rolling, revealed }) {
  if (!result || rolling) return null

  const { rolls, dropped, modifier, total } = result
  const rollSum = rolls.reduce((s, v) => s + v.value, 0)

  return (
    <div className={`result-display${revealed ? ' result-display--revealed' : ''}`}>
      <div className="result-fate-label">the fates decree</div>
      <div className="result-total">{total}</div>
      <div className="result-breakdown">
        <span className="result-rolls">
          {rolls.map((v, i) => (
            <span key={i} className="result-chip" data-sides={v.sides}>{v.value}</span>
          ))}
        </span>
        {rolls.length > 1 && (
          <span className="result-sum"><ArrowRight size={12} className="result-arrow" />{rollSum}</span>
        )}
        {modifier !== 0 && (
          <span className="result-modifier">
            {modifier > 0
              ? <><Plus size={11} className="result-mod-icon" />{modifier}</>
              : <><Minus size={11} className="result-mod-icon" />{Math.abs(modifier)}</>
            }<ArrowRight size={12} className="result-arrow" />{total}
          </span>
        )}
        {dropped && dropped.length > 0 && (
          <span className="result-dropped">
            {' '}· dropped:{' '}
            {dropped.map((v, i) => (
              <span key={i} className="result-chip result-chip--dropped">{v.value}</span>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
