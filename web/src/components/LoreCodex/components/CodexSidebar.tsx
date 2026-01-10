/**
 * CodexSidebar - Category navigation for the Lore Codex
 */
import type { LoreCategory, CategoryConfig } from '../types';
import { CATEGORIES } from '../types';

interface CodexSidebarProps {
  selectedCategory: LoreCategory | 'all';
  categoryCounts: Record<LoreCategory | 'all', number>;
  onSelectCategory: (category: LoreCategory | 'all') => void;
}

export function CodexSidebar({
  selectedCategory,
  categoryCounts,
  onSelectCategory,
}: CodexSidebarProps) {
  return (
    <div className="codex-sidebar">
      <button
        className={`codex-category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
        onClick={() => onSelectCategory('all')}
      >
        <span className="category-icon">*</span>
        <span className="category-label">All</span>
        <span className="category-count">{categoryCounts.all}</span>
      </button>

      {CATEGORIES.map((cat: CategoryConfig) => (
        <button
          key={cat.id}
          className={`codex-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat.id)}
          disabled={categoryCounts[cat.id] === 0}
        >
          <span className="category-icon">{cat.icon}</span>
          <span className="category-label">{cat.label}</span>
          <span className="category-count">{categoryCounts[cat.id]}</span>
        </button>
      ))}
    </div>
  );
}
