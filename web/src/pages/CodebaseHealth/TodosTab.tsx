/**
 * TodosTab - Refactor todo list with status tracking and edit mode
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  REFACTOR_TODOS,
  REFACTOR_PRIORITY_CONFIG,
  REFACTOR_STATUS_CONFIG,
  REFACTOR_CATEGORY_CONFIG,
  EFFORT_CONFIG,
  type RefactorItem,
  type RefactorPriority,
  type RefactorStatus,
} from '../../data/codebaseHealthData';
import { StatusSelector } from './StatusSelector';
import { STORAGE_KEY } from './types';

export function TodosTab() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RefactorStatus>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const overrideCount = Object.keys(statusOverrides).length;

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

  // Toggle filter helpers
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
    </section>
  );
}
