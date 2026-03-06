import './HistoryLog.css'

export default function HistoryLog({ history }) {
  if (history.length === 0) return null

  return (
    <div className="history-log panel">
      <div className="history-label">Roll History</div>
      <ul className="history-list">
        {history.map(entry => (
          <li key={entry.id} className="history-entry">
            <span className="history-notation">{entry.notation}</span>
            <span className="history-arrow">→</span>
            <span className="history-total">{entry.total}</span>
            <span className="history-chips">
              [{entry.rolls.join(', ')}]
            </span>
            {entry.dropped && (
              <span className="history-dropped">
                dropped [{entry.dropped.join(', ')}]
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
