import { CATEGORIES, CategoryType } from '../types'
import { Folder } from 'lucide-react'

interface CategoryFilterProps {
  selected: CategoryType | 'all'
  onChange: (category: CategoryType | 'all') => void
  counts: Record<string, number>
}

export default function CategoryFilter({ selected, onChange, counts }: CategoryFilterProps) {
  return (
    <div className="category-filter">
      <button
        className={`category-chip ${selected === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        <Folder size={16} />
        <span>全部</span>
        <span className="category-count">{counts.all || 0}</span>
      </button>

      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          className={`category-chip ${selected === cat.id ? 'active' : ''}`}
          onClick={() => onChange(cat.id)}
          style={{ '--category-color': cat.color } as React.CSSProperties}
        >
          <span
            className="category-dot"
            style={{ backgroundColor: cat.color }}
          />
          <span>{cat.name}</span>
          <span className="category-count">{counts[cat.id] || 0}</span>
        </button>
      ))}
    </div>
  )
}
