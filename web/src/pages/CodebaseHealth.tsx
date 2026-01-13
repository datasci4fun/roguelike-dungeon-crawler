/**
 * Codebase Health Page - File statistics, refactor todos, and code health metrics
 *
 * Features:
 * - Stats dashboard with summary metrics
 * - File inventory with filtering and sorting
 * - Refactor todo list with status tracking
 * - Edit mode for status changes (persisted to localStorage)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import {
  FILE_STATS,
  REFACTOR_TODOS,
  FILE_TYPE_CONFIG,
  AREA_CONFIG,
  SIZE_CONFIG,
  REFACTOR_PRIORITY_CONFIG,
  REFACTOR_STATUS_CONFIG,
  REFACTOR_CATEGORY_CONFIG,
  EFFORT_CONFIG,
  GENERATED_AT,
  getTotalStats,
  getAreaStats,
  getLargestFiles,
  getDeepestFiles,
  getRefactorStats,
  type RefactorItem,
  type FileType,
  type Area,
  type SizeCategory,
  type RefactorPriority,
  type RefactorStatus,
} from '../data/codebaseHealthData';
import './CodebaseHealth.css';

// localStorage key for status overrides
const STORAGE_KEY = 'codebase-health-status-overrides';

type TabType = 'stats' | 'files' | 'todos';

// Status selector dropdown component
function StatusSelector({
  currentStatus,
  onStatusChange,
  itemId,
}: {
  currentStatus: RefactorStatus;
  onStatusChange: (itemId: string, status: RefactorStatus) => void;
  itemId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="status-selector">
      <button
        className={`status-selector-btn status-${currentStatus}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: REFACTOR_STATUS_CONFIG[currentStatus].color }}
      >
        {REFACTOR_STATUS_CONFIG[currentStatus].icon} {REFACTOR_STATUS_CONFIG[currentStatus].label}
        <span className="status-dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="status-dropdown">
          {(Object.keys(REFACTOR_STATUS_CONFIG) as RefactorStatus[]).map((status) => (
            <button
              key={status}
              className={`status-option ${status === currentStatus ? 'active' : ''}`}
              onClick={() => {
                onStatusChange(itemId, status);
                setIsOpen(false);
              }}
              style={{ color: REFACTOR_STATUS_CONFIG[status].color }}
            >
              {REFACTOR_STATUS_CONFIG[status].icon} {REFACTOR_STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CodebaseHealth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Tab state
  const activeTab = (searchParams.get('tab') as TabType) || 'stats';

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RefactorStatus>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // File filters
  const [fileAreaFilter, setFileAreaFilter] = useState<Area[]>([]);
  const [fileTypeFilter, _setFileTypeFilter] = useState<FileType[]>([]);
  const [fileSizeFilter, setFileSizeFilter] = useState<SizeCategory[]>([]);
  const [fileSearch, setFileSearch] = useState('');
  const [fileSortBy, setFileSortBy] = useState<'path' | 'loc' | 'type' | 'area'>('loc');
  const [fileSortDir, setFileSortDir] = useState<'asc' | 'desc'>('desc');

  // Todo filters
  const [todoPriorityFilter, setTodoPriorityFilter] = useState<RefactorPriority[]>([]);
  const [todoStatusFilter, setTodoStatusFilter] = useState<RefactorStatus[]>([]);
  const [todoSearch, setTodoSearch] = useState('');

  // Load status overrides from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStatusOverrides(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load health overrides:', e);
    }
  }, []);

  // Save status overrides to localStorage
  const saveOverrides = useCallback((overrides: Record<string, RefactorStatus>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.error('Failed to save health overrides:', e);
    }
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((itemId: string, newStatus: RefactorStatus) => {
    const originalItem = REFACTOR_TODOS.find(item => item.id === itemId);
    const newOverrides = { ...statusOverrides };

    if (originalItem && originalItem.status === newStatus) {
      delete newOverrides[itemId];
    } else {
      newOverrides[itemId] = newStatus;
    }

    setStatusOverrides(newOverrides);
    saveOverrides(newOverrides);
  }, [statusOverrides, saveOverrides]);

  // Reset all overrides
  const resetOverrides = useCallback(() => {
    setStatusOverrides({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get effective status for an item
  const getEffectiveStatus = useCallback((item: RefactorItem): RefactorStatus => {
    return statusOverrides[item.id] || item.status;
  }, [statusOverrides]);

  // Generate export JSON
  const generateExportCode = useCallback(() => {
    if (Object.keys(statusOverrides).length === 0) {
      return '// No status changes to export';
    }

    const changes: { id: string; title: string; from: string; to: string }[] = [];

    for (const [itemId, newStatus] of Object.entries(statusOverrides)) {
      const item = REFACTOR_TODOS.find(i => i.id === itemId);
      if (item) {
        changes.push({
          id: itemId,
          title: item.title,
          from: item.status,
          to: newStatus,
        });
      }
    }

    return JSON.stringify({ statusChanges: changes }, null, 2);
  }, [statusOverrides]);

  // Copy to clipboard
  const copyExportCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateExportCode());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }, [generateExportCode]);

  // Tab switching
  const setActiveTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  // Stats data
  const totalStats = getTotalStats();
  const areaStats = getAreaStats();
  const largestFiles = getLargestFiles(10);
  const deepestFiles = getDeepestFiles(10);
  const refactorStats = getRefactorStats();
  const overrideCount = Object.keys(statusOverrides).length;

  // Filtered files
  const filteredFiles = useMemo(() => {
    let files = [...FILE_STATS];

    if (fileAreaFilter.length > 0) {
      files = files.filter(f => fileAreaFilter.includes(f.area));
    }
    if (fileTypeFilter.length > 0) {
      files = files.filter(f => fileTypeFilter.includes(f.fileType));
    }
    if (fileSizeFilter.length > 0) {
      files = files.filter(f => fileSizeFilter.includes(f.sizeCategory));
    }
    if (fileSearch) {
      const search = fileSearch.toLowerCase();
      files = files.filter(f => f.path.toLowerCase().includes(search));
    }

    // Sort
    files.sort((a, b) => {
      let cmp = 0;
      switch (fileSortBy) {
        case 'path':
          cmp = a.path.localeCompare(b.path);
          break;
        case 'loc':
          cmp = a.loc - b.loc;
          break;
        case 'type':
          cmp = a.fileType.localeCompare(b.fileType);
          break;
        case 'area':
          cmp = a.area.localeCompare(b.area);
          break;
      }
      return fileSortDir === 'asc' ? cmp : -cmp;
    });

    return files;
  }, [fileAreaFilter, fileTypeFilter, fileSizeFilter, fileSearch, fileSortBy, fileSortDir]);

  // Filtered todos
  const filteredTodos = useMemo(() => {
    let todos = [...REFACTOR_TODOS];

    if (todoPriorityFilter.length > 0) {
      todos = todos.filter(t => todoPriorityFilter.includes(t.priority));
    }
    if (todoStatusFilter.length > 0) {
      todos = todos.filter(t => todoStatusFilter.includes(getEffectiveStatus(t)));
    }
    if (todoSearch) {
      const search = todoSearch.toLowerCase();
      todos = todos.filter(t =>
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    return todos;
  }, [todoPriorityFilter, todoStatusFilter, todoSearch, getEffectiveStatus]);

  // Grouped todos by priority
  const groupedTodos = useMemo(() => {
    const groups: Record<RefactorPriority, RefactorItem[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    filteredTodos.forEach(todo => {
      groups[todo.priority].push(todo);
    });

    return groups;
  }, [filteredTodos]);

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle file sort
  const toggleSort = (column: typeof fileSortBy) => {
    if (fileSortBy === column) {
      setFileSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setFileSortBy(column);
      setFileSortDir('desc');
    }
  };

  // Toggle filter helpers
  const toggleAreaFilter = (area: Area) => {
    setFileAreaFilter(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleSizeFilter = (size: SizeCategory) => {
    setFileSizeFilter(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const togglePriorityFilter = (priority: RefactorPriority) => {
    setTodoPriorityFilter(prev =>
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const toggleStatusFilter = (status: RefactorStatus) => {
    setTodoStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 15, speed: 'slow', opacity: 0.15 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="health-page">
        {/* Header */}
        <section className="health-hero">
          <PhosphorHeader
            title="CODEBASE HEALTH"
            subtitle="Repository analysis and refactoring"
            style="dramatic"
            delay={100}
          />
          <p className="hero-tagline">
            Monitor code quality, identify large files, and track refactoring tasks.
            <span className="generated-at">Generated: {new Date(GENERATED_AT).toLocaleDateString()}</span>
          </p>
        </section>

        {/* Tab Navigation */}
        <nav className="health-tabs">
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files ({FILE_STATS.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            Refactor ({REFACTOR_TODOS.length})
          </button>
        </nav>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <section className="tab-content stats-tab">
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <span className="card-value">{totalStats.fileCount}</span>
                <span className="card-label">Files</span>
              </div>
              <div className="summary-card">
                <span className="card-value">{totalStats.totalLoc.toLocaleString()}</span>
                <span className="card-label">Lines of Code</span>
              </div>
              <div className="summary-card">
                <span className="card-value">{totalStats.avgLoc}</span>
                <span className="card-label">Avg LOC/File</span>
              </div>
              <div className="summary-card">
                <span className="card-value">{refactorStats.total}</span>
                <span className="card-label">Refactor Items</span>
              </div>
            </div>

            {/* Area Distribution */}
            <div className="distribution-section">
              <h3>Files by Area</h3>
              <div className="distribution-grid">
                {(Object.keys(AREA_CONFIG) as Area[]).map(area => {
                  const stats = areaStats[area];
                  if (!stats || stats.count === 0) return null;
                  return (
                    <div
                      key={area}
                      className="distribution-item"
                      style={{ '--item-color': AREA_CONFIG[area].color } as React.CSSProperties}
                    >
                      <div className="dist-header">
                        <span className="dist-label">{AREA_CONFIG[area].label}</span>
                        <span className="dist-count">{stats.count}</span>
                      </div>
                      <div className="dist-bar">
                        <div
                          className="dist-fill"
                          style={{ width: `${(stats.count / totalStats.fileCount) * 100}%` }}
                        />
                      </div>
                      <span className="dist-loc">{stats.totalLoc.toLocaleString()} LOC</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Lists */}
            <div className="top-lists">
              <div className="top-list">
                <h3>Largest Files</h3>
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>LOC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {largestFiles.map(f => (
                      <tr key={f.path}>
                        <td className="file-path" title={f.path}>
                          {f.path.split('/').pop()}
                        </td>
                        <td className={`loc-cell size-${f.sizeCategory}`}>{f.loc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="top-list">
                <h3>Deepest Nesting</h3>
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deepestFiles.map(f => (
                      <tr key={f.path}>
                        <td className="file-path" title={f.path}>
                          {f.path.split('/').pop()}
                        </td>
                        <td>{f.nestingDepth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="top-list">
                <h3>Refactor by Priority</h3>
                <div className="priority-breakdown">
                  {(Object.keys(REFACTOR_PRIORITY_CONFIG) as RefactorPriority[]).map(p => (
                    <div key={p} className="priority-row">
                      <span
                        className="priority-dot"
                        style={{ backgroundColor: REFACTOR_PRIORITY_CONFIG[p].color }}
                      />
                      <span className="priority-label">{REFACTOR_PRIORITY_CONFIG[p].label}</span>
                      <span className="priority-count">{refactorStats.byPriority[p]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <section className="tab-content files-tab">
            {/* Filters */}
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Search files..."
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                className="search-input"
              />

              <div className="filter-group">
                <span className="filter-label">Area:</span>
                <div className="filter-chips">
                  {(Object.keys(AREA_CONFIG) as Area[]).map(area => (
                    <button
                      key={area}
                      className={`filter-chip ${fileAreaFilter.includes(area) ? 'active' : ''}`}
                      onClick={() => toggleAreaFilter(area)}
                      style={fileAreaFilter.includes(area) ? { borderColor: AREA_CONFIG[area].color, color: AREA_CONFIG[area].color } : {}}
                    >
                      {AREA_CONFIG[area].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-label">Size:</span>
                <div className="filter-chips">
                  {(Object.keys(SIZE_CONFIG) as SizeCategory[]).map(size => (
                    <button
                      key={size}
                      className={`filter-chip ${fileSizeFilter.includes(size) ? 'active' : ''}`}
                      onClick={() => toggleSizeFilter(size)}
                      style={fileSizeFilter.includes(size) ? { borderColor: SIZE_CONFIG[size].color, color: SIZE_CONFIG[size].color } : {}}
                    >
                      {SIZE_CONFIG[size].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="results-count">
              Showing {filteredFiles.length} of {FILE_STATS.length} files
            </div>

            {/* File Table */}
            <div className="file-table-container">
              <table className="file-table">
                <thead>
                  <tr>
                    <th
                      className={`sortable ${fileSortBy === 'path' ? 'sorted' : ''}`}
                      onClick={() => toggleSort('path')}
                    >
                      Path {fileSortBy === 'path' && (fileSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      className={`sortable ${fileSortBy === 'loc' ? 'sorted' : ''}`}
                      onClick={() => toggleSort('loc')}
                    >
                      LOC {fileSortBy === 'loc' && (fileSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      className={`sortable ${fileSortBy === 'type' ? 'sorted' : ''}`}
                      onClick={() => toggleSort('type')}
                    >
                      Type {fileSortBy === 'type' && (fileSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      className={`sortable ${fileSortBy === 'area' ? 'sorted' : ''}`}
                      onClick={() => toggleSort('area')}
                    >
                      Area {fileSortBy === 'area' && (fileSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.slice(0, 100).map(f => (
                    <tr key={f.path} className={`size-row-${f.sizeCategory}`}>
                      <td className="path-cell" title={f.path}>{f.path}</td>
                      <td className={`loc-cell size-${f.sizeCategory}`}>{f.loc}</td>
                      <td>
                        <span
                          className="type-badge"
                          style={{ color: FILE_TYPE_CONFIG[f.fileType].color }}
                        >
                          {FILE_TYPE_CONFIG[f.fileType].label}
                        </span>
                      </td>
                      <td>
                        <span
                          className="area-badge"
                          style={{ color: AREA_CONFIG[f.area].color }}
                        >
                          {AREA_CONFIG[f.area].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFiles.length > 100 && (
                <div className="table-truncated">
                  Showing first 100 of {filteredFiles.length} files. Use filters to narrow results.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Todos Tab */}
        {activeTab === 'todos' && (
          <section className="tab-content todos-tab">
            {/* Edit Mode Controls */}
            <div className="edit-mode-controls">
              <button
                className={`edit-mode-toggle ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? '✓ Edit Mode ON' : '✎ Edit Mode'}
              </button>

              {editMode && overrideCount > 0 && (
                <>
                  <span className="override-count">{overrideCount} change{overrideCount !== 1 ? 's' : ''}</span>
                  <button className="export-btn" onClick={() => setShowExportModal(true)}>
                    Export Changes
                  </button>
                  <button className="reset-btn" onClick={resetOverrides}>
                    Reset All
                  </button>
                </>
              )}
            </div>

            {/* Filters */}
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Search refactors..."
                value={todoSearch}
                onChange={e => setTodoSearch(e.target.value)}
                className="search-input"
              />

              <div className="filter-group">
                <span className="filter-label">Priority:</span>
                <div className="filter-chips">
                  {(Object.keys(REFACTOR_PRIORITY_CONFIG) as RefactorPriority[]).map(p => (
                    <button
                      key={p}
                      className={`filter-chip ${todoPriorityFilter.includes(p) ? 'active' : ''}`}
                      onClick={() => togglePriorityFilter(p)}
                      style={todoPriorityFilter.includes(p) ? { borderColor: REFACTOR_PRIORITY_CONFIG[p].color, color: REFACTOR_PRIORITY_CONFIG[p].color } : {}}
                    >
                      {REFACTOR_PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-label">Status:</span>
                <div className="filter-chips">
                  {(Object.keys(REFACTOR_STATUS_CONFIG) as RefactorStatus[]).map(s => (
                    <button
                      key={s}
                      className={`filter-chip ${todoStatusFilter.includes(s) ? 'active' : ''}`}
                      onClick={() => toggleStatusFilter(s)}
                      style={todoStatusFilter.includes(s) ? { borderColor: REFACTOR_STATUS_CONFIG[s].color, color: REFACTOR_STATUS_CONFIG[s].color } : {}}
                    >
                      {REFACTOR_STATUS_CONFIG[s].icon} {REFACTOR_STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="results-count">
              Showing {filteredTodos.length} of {REFACTOR_TODOS.length} items
            </div>

            {/* Todo Cards by Priority */}
            <div className="todos-content">
              {(Object.keys(REFACTOR_PRIORITY_CONFIG) as RefactorPriority[]).map(priority => {
                const items = groupedTodos[priority];
                if (items.length === 0) return null;

                return (
                  <div key={priority} className={`priority-group priority-${priority}`}>
                    <div className="priority-header">
                      <span
                        className="priority-dot"
                        style={{ backgroundColor: REFACTOR_PRIORITY_CONFIG[priority].color }}
                      />
                      <h2 className="priority-title">{REFACTOR_PRIORITY_CONFIG[priority].label}</h2>
                      <span className="priority-count">{items.length} items</span>
                    </div>

                    <div className="items-grid">
                      {items.map(item => {
                        const effectiveStatus = getEffectiveStatus(item);
                        const isModified = statusOverrides[item.id] !== undefined;

                        return (
                          <div
                            key={item.id}
                            className={`refactor-card ${expandedItems.has(item.id) ? 'expanded' : ''} ${isModified ? 'modified' : ''}`}
                          >
                            <div
                              className="card-header"
                              onClick={e => {
                                if ((e.target as HTMLElement).closest('.status-selector')) return;
                                toggleExpand(item.id);
                              }}
                            >
                              <div className="card-status">
                                {editMode ? (
                                  <StatusSelector
                                    currentStatus={effectiveStatus}
                                    onStatusChange={handleStatusChange}
                                    itemId={item.id}
                                  />
                                ) : (
                                  <span
                                    className="status-icon"
                                    style={{ color: REFACTOR_STATUS_CONFIG[effectiveStatus].color }}
                                    title={REFACTOR_STATUS_CONFIG[effectiveStatus].label}
                                  >
                                    {REFACTOR_STATUS_CONFIG[effectiveStatus].icon}
                                    {isModified && <span className="modified-dot">*</span>}
                                  </span>
                                )}
                              </div>
                              <div className="card-main">
                                <h3 className="card-title">{item.title}</h3>
                                <p className="card-description">{item.description}</p>
                              </div>
                              <div className="card-expand">
                                {item.details.length > 0 && (
                                  <span className="expand-icon">
                                    {expandedItems.has(item.id) ? '▼' : '▶'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="card-meta">
                              <div className="card-categories">
                                {item.category.map(cat => (
                                  <span key={cat} className="category-tag">
                                    {REFACTOR_CATEGORY_CONFIG[cat]?.icon} {REFACTOR_CATEGORY_CONFIG[cat]?.label}
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
                              </div>
                            </div>

                            {expandedItems.has(item.id) && (
                              <div className="card-details">
                                <ul className="details-list">
                                  {item.details.map((detail, i) => (
                                    <li key={i}>{detail}</li>
                                  ))}
                                </ul>
                                {item.affectedFiles.length > 0 && (
                                  <div className="affected-files">
                                    <span className="files-label">Affected files:</span>
                                    {item.affectedFiles.map(f => (
                                      <code key={f} className="file-path">{f}</code>
                                    ))}
                                  </div>
                                )}
                                {item.automatedReason && (
                                  <div className="automated-reason">
                                    <span className="reason-label">Detected:</span>
                                    {item.automatedReason}
                                  </div>
                                )}
                                {item.technique && (
                                  <div className="technique-recommendation">
                                    <span className="technique-label">Recommended Approach:</span>
                                    <div className="technique-content">
                                      {item.technique.split('`').map((part, i) =>
                                        i % 2 === 0 ? part : <code key={i}>{part}</code>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="export-modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="export-modal" onClick={e => e.stopPropagation()}>
              <div className="export-modal-header">
                <h3>Export Status Changes</h3>
                <button className="close-modal" onClick={() => setShowExportModal(false)}>×</button>
              </div>
              <div className="export-modal-content">
                <p>Copy these changes for tracking:</p>
                <pre className="export-code">{generateExportCode()}</pre>
                <button className="copy-btn" onClick={copyExportCode}>
                  {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <section className="health-legend">
          <h3 className="legend-title">Legend</h3>
          <div className="legend-content">
            <div className="legend-group">
              <h4>File Size</h4>
              <div className="legend-items">
                {(Object.keys(SIZE_CONFIG) as SizeCategory[]).map(s => (
                  <div key={s} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: SIZE_CONFIG[s].color }} />
                    <span className="legend-label">
                      {SIZE_CONFIG[s].label} ({SIZE_CONFIG[s].minLoc}-{SIZE_CONFIG[s].maxLoc === Infinity ? '∞' : SIZE_CONFIG[s].maxLoc})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="legend-group">
              <h4>Status</h4>
              <div className="legend-items">
                {(Object.keys(REFACTOR_STATUS_CONFIG) as RefactorStatus[]).map(s => (
                  <div key={s} className="legend-item">
                    <span className="legend-icon" style={{ color: REFACTOR_STATUS_CONFIG[s].color }}>
                      {REFACTOR_STATUS_CONFIG[s].icon}
                    </span>
                    <span className="legend-label">{REFACTOR_STATUS_CONFIG[s].label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="legend-group">
              <h4>Effort</h4>
              <div className="legend-items">
                {(Object.keys(EFFORT_CONFIG) as (keyof typeof EFFORT_CONFIG)[]).map(e => (
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
