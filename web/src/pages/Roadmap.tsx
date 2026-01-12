/**
 * Roadmap Page - Public development roadmap with prioritized items
 *
 * Features:
 * - Priority-grouped items with color coding
 * - Filter by priority, category, status
 * - Search functionality
 * - Stats overview
 * - URL persistence for filters
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import {
  ROADMAP_ITEMS,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  CATEGORY_CONFIG,
  EFFORT_CONFIG,
  getCompletionStats,
  getPriorityStats,
  type RoadmapItem,
  type Priority,
  type Status,
  type Category,
} from '../data/roadmapData';
import './Roadmap.css';

// Filter state type
interface FilterState {
  priorities: Priority[];
  categories: Category[];
  statuses: Status[];
  search: string;
}

export function Roadmap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Initialize filters from URL params
  const filters: FilterState = useMemo(() => ({
    priorities: (searchParams.get('priority')?.split(',').filter(Boolean) as Priority[]) || [],
    categories: (searchParams.get('category')?.split(',').filter(Boolean) as Category[]) || [],
    statuses: (searchParams.get('status')?.split(',').filter(Boolean) as Status[]) || [],
    search: searchParams.get('q') || '',
  }), [searchParams]);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    const params = new URLSearchParams();

    if (updated.priorities.length) params.set('priority', updated.priorities.join(','));
    if (updated.categories.length) params.set('category', updated.categories.join(','));
    if (updated.statuses.length) params.set('status', updated.statuses.join(','));
    if (updated.search) params.set('q', updated.search);

    setSearchParams(params);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return ROADMAP_ITEMS.filter((item) => {
      // Priority filter
      if (filters.priorities.length && !filters.priorities.includes(item.priority)) {
        return false;
      }
      // Category filter
      if (filters.categories.length && !item.category.some((c) => filters.categories.includes(c))) {
        return false;
      }
      // Status filter
      if (filters.statuses.length && !filters.statuses.includes(item.status)) {
        return false;
      }
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.details?.some((d) => d.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [filters]);

  // Group filtered items by priority
  const groupedItems = useMemo(() => {
    const groups: Record<Priority, RoadmapItem[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      research: [],
    };

    filteredItems.forEach((item) => {
      groups[item.priority].push(item);
    });

    return groups;
  }, [filteredItems]);

  // Stats
  const completionStats = getCompletionStats();
  const priorityStats = getPriorityStats();

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle filter
  const togglePriority = (p: Priority) => {
    const current = filters.priorities;
    const updated = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    updateFilters({ priorities: updated });
  };

  const toggleCategory = (c: Category) => {
    const current = filters.categories;
    const updated = current.includes(c)
      ? current.filter((x) => x !== c)
      : [...current, c];
    updateFilters({ categories: updated });
  };

  const toggleStatus = (s: Status) => {
    const current = filters.statuses;
    const updated = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    updateFilters({ statuses: updated });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = filters.priorities.length || filters.categories.length || filters.statuses.length || filters.search;

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 15, speed: 'slow', opacity: 0.15 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="roadmap-page">
        {/* Header */}
        <section className="roadmap-hero">
          <PhosphorHeader
            title="DEVELOPMENT ROADMAP"
            subtitle="The path ahead..."
            style="dramatic"
            delay={100}
          />
          <p className="hero-tagline">
            Track our progress as we continue building the ultimate roguelike experience.
            Features are prioritized by impact and grouped by development status.
          </p>
        </section>

        {/* Stats Bar */}
        <section className="roadmap-stats">
          <div className="stats-grid">
            <div className="stat-item" style={{ '--stat-color': 'var(--roadmap-critical)' } as React.CSSProperties}>
              <span className="stat-value">{priorityStats.critical}</span>
              <span className="stat-label">Critical</span>
            </div>
            <div className="stat-item" style={{ '--stat-color': 'var(--roadmap-high)' } as React.CSSProperties}>
              <span className="stat-value">{priorityStats.high}</span>
              <span className="stat-label">High</span>
            </div>
            <div className="stat-item" style={{ '--stat-color': 'var(--roadmap-medium)' } as React.CSSProperties}>
              <span className="stat-value">{priorityStats.medium}</span>
              <span className="stat-label">Medium</span>
            </div>
            <div className="stat-item" style={{ '--stat-color': 'var(--roadmap-low)' } as React.CSSProperties}>
              <span className="stat-value">{priorityStats.low}</span>
              <span className="stat-label">Low</span>
            </div>
            <div className="stat-item" style={{ '--stat-color': 'var(--roadmap-research)' } as React.CSSProperties}>
              <span className="stat-value">{priorityStats.research}</span>
              <span className="stat-label">Research</span>
            </div>
          </div>
          <div className="completion-bar">
            <div className="completion-label">
              Progress: {completionStats.completed}/{completionStats.total} completed ({completionStats.percentage}%)
            </div>
            <div className="completion-track">
              <div
                className="completion-fill"
                style={{ width: `${completionStats.percentage}%` }}
              />
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="roadmap-filters">
          {/* Search */}
          <div className="filter-search">
            <input
              type="text"
              placeholder="Search roadmap..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="search-input"
            />
          </div>

          {/* Priority Filters */}
          <div className="filter-group">
            <span className="filter-label">Priority:</span>
            <div className="filter-chips">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                <button
                  key={p}
                  className={`filter-chip priority-${p} ${filters.priorities.includes(p) ? 'active' : ''}`}
                  onClick={() => togglePriority(p)}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filters */}
          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <div className="filter-chips">
              {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
                <button
                  key={s}
                  className={`filter-chip status-${s} ${filters.statuses.includes(s) ? 'active' : ''}`}
                  onClick={() => toggleStatus(s)}
                >
                  {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filters */}
          <div className="filter-group">
            <span className="filter-label">Category:</span>
            <div className="filter-chips">
              {(Object.keys(CATEGORY_CONFIG) as Category[]).map((c) => (
                <button
                  key={c}
                  className={`filter-chip ${filters.categories.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleCategory(c)}
                >
                  {CATEGORY_CONFIG[c].icon} {CATEGORY_CONFIG[c].label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </section>

        {/* Results Count */}
        <div className="results-count">
          Showing {filteredItems.length} of {ROADMAP_ITEMS.length} items
        </div>

        {/* Roadmap Items */}
        <section className="roadmap-content">
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((priority) => {
            const items = groupedItems[priority];
            if (items.length === 0) return null;

            return (
              <div key={priority} className={`priority-group priority-${priority}`}>
                <div className="priority-header">
                  <span
                    className="priority-dot"
                    style={{ backgroundColor: PRIORITY_CONFIG[priority].color }}
                  />
                  <h2 className="priority-title">{PRIORITY_CONFIG[priority].label}</h2>
                  <span className="priority-count">{items.length} items</span>
                </div>

                <div className="items-grid">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`roadmap-card ${expandedItems.has(item.id) ? 'expanded' : ''}`}
                    >
                      <div className="card-header" onClick={() => toggleExpand(item.id)}>
                        <div className="card-status">
                          <span
                            className="status-icon"
                            style={{ color: STATUS_CONFIG[item.status].color }}
                            title={STATUS_CONFIG[item.status].label}
                          >
                            {STATUS_CONFIG[item.status].icon}
                          </span>
                        </div>
                        <div className="card-main">
                          <h3 className="card-title">{item.title}</h3>
                          <p className="card-description">{item.description}</p>
                        </div>
                        <div className="card-expand">
                          {item.details && item.details.length > 0 && (
                            <span className="expand-icon">
                              {expandedItems.has(item.id) ? '▼' : '▶'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="card-meta">
                        <div className="card-categories">
                          {item.category.map((cat) => (
                            <span key={cat} className="category-tag">
                              {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                            </span>
                          ))}
                        </div>
                        <div className="card-effort">
                          <span className="effort-label">Effort:</span>
                          <span className="effort-dots">
                            {Array.from({ length: EFFORT_CONFIG[item.effort].dots }).map((_, i) => (
                              <span key={i} className="effort-dot filled" />
                            ))}
                            {Array.from({ length: 4 - EFFORT_CONFIG[item.effort].dots }).map((_, i) => (
                              <span key={i} className="effort-dot" />
                            ))}
                          </span>
                          <span className="effort-text">{EFFORT_CONFIG[item.effort].label}</span>
                        </div>
                      </div>

                      {expandedItems.has(item.id) && item.details && (
                        <div className="card-details">
                          <ul className="details-list">
                            {item.details.map((detail, i) => (
                              <li key={i}>{detail}</li>
                            ))}
                          </ul>
                          {item.dependencies && item.dependencies.length > 0 && (
                            <div className="card-dependencies">
                              <span className="dep-label">Depends on:</span>
                              {item.dependencies.map((dep) => (
                                <span key={dep} className="dep-id">{dep}</span>
                              ))}
                            </div>
                          )}
                          {item.targetVersion && (
                            <div className="card-target">
                              <span className="target-label">Target:</span>
                              <span className="target-version">{item.targetVersion}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Legend */}
        <section className="roadmap-legend">
          <h3 className="legend-title">Legend</h3>
          <div className="legend-content">
            <div className="legend-group">
              <h4>Priority</h4>
              <div className="legend-items">
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                  <div key={p} className="legend-item">
                    <span
                      className="legend-color"
                      style={{ backgroundColor: PRIORITY_CONFIG[p].color }}
                    />
                    <span className="legend-label">{PRIORITY_CONFIG[p].label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="legend-group">
              <h4>Status</h4>
              <div className="legend-items">
                {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
                  <div key={s} className="legend-item">
                    <span
                      className="legend-icon"
                      style={{ color: STATUS_CONFIG[s].color }}
                    >
                      {STATUS_CONFIG[s].icon}
                    </span>
                    <span className="legend-label">{STATUS_CONFIG[s].label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="legend-group">
              <h4>Effort</h4>
              <div className="legend-items">
                {(Object.keys(EFFORT_CONFIG) as (keyof typeof EFFORT_CONFIG)[]).map((e) => (
                  <div key={e} className="legend-item">
                    <span className="legend-dots">
                      {Array.from({ length: EFFORT_CONFIG[e].dots }).map((_, i) => (
                        <span key={i} className="effort-dot filled" />
                      ))}
                    </span>
                    <span className="legend-label">{EFFORT_CONFIG[e].label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AtmosphericPage>
  );
}
