import './DieSelector.css'

export const DICE = [
  { sides: 4,   label: 'd4'  },
  { sides: 6,   label: 'd6'  },
  { sides: 8,   label: 'd8'  },
  { sides: 10,  label: 'd10' },
  { sides: 12,  label: 'd12' },
  { sides: 20,  label: 'd20' },
  { sides: 100, label: 'd%'  },
]

export default function DieSelector({ selected, onChange }) {
  return (
    <div className="die-selector">
      {DICE.map(({ sides, label }) => (
        <button
          key={sides}
          className={`die-btn${selected === sides ? ' die-btn--active' : ''}`}
          data-sides={sides}
          onClick={() => onChange(sides)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
