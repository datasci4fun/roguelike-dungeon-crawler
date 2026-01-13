/**
 * Feature Flags Dashboard - Manage feature toggles
 *
 * Features:
 * - View all feature flags with status
 * - Toggle flags on/off
 * - Create/edit/delete flags
 * - Percentage rollout and user targeting
 * - Flag change history
 */

import { useState, useEffect, useCallback } from 'react';
import './FeatureFlags.css';

const API_BASE = 'http://localhost:8000/api/flags';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  flag_type: 'boolean' | 'percentage' | 'user_list';
  enabled: boolean;
  percentage: number;
  user_ids: number[];
  environment: 'all' | 'dev' | 'staging' | 'prod';
  created_at: string;
  updated_at: string;
  created_by: string;
  tags: string[];
}

interface FlagChange {
  timestamp: string;
  flag_key: string;
  action: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
}

interface FlagStats {
  total: number;
  enabled: number;
  disabled: number;
  by_type: Record<string, number>;
  by_environment: Record<string, number>;
  by_tag: Record<string, number>;
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  boolean: 'Boolean',
  percentage: 'Percentage',
  user_list: 'User List',
};

const ENVIRONMENT_LABELS: Record<string, string> = {
  all: 'All',
  dev: 'Dev',
  staging: 'Staging',
  prod: 'Production',
};

const ENVIRONMENT_COLORS: Record<string, string> = {
  all: '#8b949e',
  dev: '#a855f7',
  staging: '#d29922',
  prod: '#22c55e',
};

export function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [history, setHistory] = useState<FlagChange[]>([]);
  const [stats, setStats] = useState<FlagStats | null>(null);
  const [loading, setLoading] = useState(true);

  // View state
  const [view, setView] = useState<'flags' | 'history'>('flags');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterEnabled, setFilterEnabled] = useState<string>('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    flag_type: 'boolean' as 'boolean' | 'percentage' | 'user_list',
    enabled: false,
    percentage: 50,
    user_ids: '',
    environment: 'all' as 'all' | 'dev' | 'staging' | 'prod',
    tags: '',
  });

  // Fetch flags
  const fetchFlags = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterType) params.set('flag_type', filterType);
      if (filterEnabled) params.set('enabled', filterEnabled);

      const res = await fetch(`${API_BASE}?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags);
      }
    } catch {
      // Silently fail
    }
  }, [searchQuery, filterType, filterEnabled]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/history?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFlags(), fetchStats(), fetchHistory()]);
      setLoading(false);
    };
    loadData();
  }, [fetchFlags, fetchStats, fetchHistory]);

  // Toggle flag
  const toggleFlag = async (flagKey: string) => {
    try {
      await fetch(`${API_BASE}/${flagKey}/toggle`, { method: 'POST' });
      fetchFlags();
      fetchStats();
      fetchHistory();
    } catch {
      // Silently fail
    }
  };

  // Delete flag
  const deleteFlag = async (flagKey: string) => {
    if (!confirm(`Delete flag "${flagKey}"?`)) return;
    try {
      await fetch(`${API_BASE}/${flagKey}`, { method: 'DELETE' });
      fetchFlags();
      fetchStats();
      fetchHistory();
    } catch {
      // Silently fail
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingFlag(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      flag_type: 'boolean',
      enabled: false,
      percentage: 50,
      user_ids: '',
      environment: 'all',
      tags: '',
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      flag_type: flag.flag_type,
      enabled: flag.enabled,
      percentage: flag.percentage,
      user_ids: flag.user_ids.join(', '),
      environment: flag.environment,
      tags: flag.tags.join(', '),
    });
    setShowModal(true);
  };

  // Save flag
  const saveFlag = async () => {
    const payload = {
      key: formData.key,
      name: formData.name,
      description: formData.description,
      flag_type: formData.flag_type,
      enabled: formData.enabled,
      percentage: formData.percentage,
      user_ids: formData.user_ids
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(Number)
        .filter(n => !isNaN(n)),
      environment: formData.environment,
      tags: formData.tags
        .split(',')
        .map(s => s.trim())
        .filter(s => s),
    };

    try {
      if (editingFlag) {
        await fetch(`${API_BASE}/${editingFlag.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchFlags();
      fetchStats();
      fetchHistory();
    } catch {
      // Silently fail
    }
  };

  // Reset flags
  const resetFlags = async () => {
    if (!confirm('Reset all flags to defaults?')) return;
    try {
      await fetch(API_BASE, { method: 'DELETE' });
      fetchFlags();
      fetchStats();
      fetchHistory();
    } catch {
      // Silently fail
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'just now';
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="feature-flags">
        <div className="flags-loading">
          <div className="loading-spinner" />
          <p>Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-flags">
      {/* Header */}
      <header className="flags-header">
        <div className="header-left">
          <h1>Feature Flags</h1>
          <span className="header-badge">
            {stats?.enabled || 0}/{stats?.total || 0} enabled
          </span>
        </div>
        <div className="header-right">
          <button onClick={openCreateModal} className="create-btn">
            + New Flag
          </button>
          <button onClick={resetFlags} className="reset-btn">
            Reset
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Flags</div>
          </div>
          <div className="stat-card enabled">
            <div className="stat-value">{stats.enabled}</div>
            <div className="stat-label">Enabled</div>
          </div>
          <div className="stat-card disabled">
            <div className="stat-value">{stats.disabled}</div>
            <div className="stat-label">Disabled</div>
          </div>
          <div className="stat-card types">
            <div className="type-items">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="type-item">
                  <span className="type-label">{FLAG_TYPE_LABELS[type]}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
            <div className="stat-label">By Type</div>
          </div>
        </div>
      )}

      {/* View Toggle & Filters */}
      <div className="controls-row">
        <div className="view-toggle">
          <button
            className={view === 'flags' ? 'active' : ''}
            onClick={() => setView('flags')}
          >
            Flags
          </button>
          <button
            className={view === 'history' ? 'active' : ''}
            onClick={() => setView('history')}
          >
            History
          </button>
        </div>

        {view === 'flags' && (
          <div className="filters">
            <input
              type="text"
              placeholder="Search flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="boolean">Boolean</option>
              <option value="percentage">Percentage</option>
              <option value="user_list">User List</option>
            </select>
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        )}
      </div>

      {/* Flags View */}
      {view === 'flags' && (
        <div className="flags-list">
          {flags.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">🚩</div>
              <p>No feature flags found</p>
              <button onClick={openCreateModal} className="create-btn">
                Create First Flag
              </button>
            </div>
          ) : (
            flags.map((flag) => (
              <div
                key={flag.key}
                className={`flag-card ${flag.enabled ? 'enabled' : 'disabled'} ${expandedFlag === flag.key ? 'expanded' : ''}`}
              >
                <div
                  className="flag-header"
                  onClick={() => setExpandedFlag(expandedFlag === flag.key ? null : flag.key)}
                >
                  <div className="flag-main">
                    <div className="flag-toggle-wrapper">
                      <button
                        className={`flag-toggle ${flag.enabled ? 'on' : 'off'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlag(flag.key);
                        }}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>
                    <div className="flag-info">
                      <div className="flag-name-row">
                        <span className="flag-name">{flag.name}</span>
                        <code className="flag-key">{flag.key}</code>
                      </div>
                      <div className="flag-meta">
                        <span
                          className="flag-type"
                          data-type={flag.flag_type}
                        >
                          {FLAG_TYPE_LABELS[flag.flag_type]}
                        </span>
                        {flag.flag_type === 'percentage' && (
                          <span className="flag-percentage">{flag.percentage}%</span>
                        )}
                        {flag.flag_type === 'user_list' && (
                          <span className="flag-users">{flag.user_ids.length} users</span>
                        )}
                        <span
                          className="flag-env"
                          style={{ color: ENVIRONMENT_COLORS[flag.environment] }}
                        >
                          {ENVIRONMENT_LABELS[flag.environment]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flag-actions">
                    {flag.tags.map((tag) => (
                      <span key={tag} className="flag-tag">{tag}</span>
                    ))}
                    <span className="expand-icon">
                      {expandedFlag === flag.key ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {expandedFlag === flag.key && (
                  <div className="flag-details">
                    <div className="detail-grid">
                      <div className="detail-item full-width">
                        <span className="detail-label">Description</span>
                        <span className="detail-value">
                          {flag.description || 'No description'}
                        </span>
                      </div>
                      {flag.flag_type === 'percentage' && (
                        <div className="detail-item">
                          <span className="detail-label">Rollout Percentage</span>
                          <div className="percentage-bar">
                            <div
                              className="percentage-fill"
                              style={{ width: `${flag.percentage}%` }}
                            />
                            <span className="percentage-text">{flag.percentage}%</span>
                          </div>
                        </div>
                      )}
                      {flag.flag_type === 'user_list' && (
                        <div className="detail-item">
                          <span className="detail-label">Target Users</span>
                          <span className="detail-value">
                            {flag.user_ids.length > 0
                              ? flag.user_ids.join(', ')
                              : 'None'}
                          </span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">Created</span>
                        <span className="detail-value">{formatTime(flag.created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Updated</span>
                        <span className="detail-value">{formatTime(flag.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flag-detail-actions">
                      <button
                        onClick={() => openEditModal(flag)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFlag(flag.key)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div className="history-list">
          {history.length === 0 ? (
            <div className="no-data">
              <p>No history recorded</p>
            </div>
          ) : (
            <div className="history-timeline">
              {history.map((change, i) => (
                <div key={i} className="history-item">
                  <div
                    className="history-dot"
                    data-action={change.action}
                  />
                  <div className="history-content">
                    <div className="history-header">
                      <span className="history-action" data-action={change.action}>
                        {change.action.toUpperCase()}
                      </span>
                      <code className="history-key">{change.flag_key}</code>
                      <span className="history-time">
                        {formatRelativeTime(change.timestamp)}
                      </span>
                    </div>
                    {change.field && (
                      <div className="history-change">
                        <span className="change-field">{change.field}:</span>
                        {change.old_value && (
                          <span className="change-old">{change.old_value}</span>
                        )}
                        {change.old_value && change.new_value && (
                          <span className="change-arrow">→</span>
                        )}
                        {change.new_value && (
                          <span className="change-new">{change.new_value}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFlag ? 'Edit Flag' : 'Create Flag'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="feature_key"
                  disabled={!!editingFlag}
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Feature Name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this flag control?"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.flag_type}
                    onChange={(e) => setFormData({
                      ...formData,
                      flag_type: e.target.value as 'boolean' | 'percentage' | 'user_list'
                    })}
                  >
                    <option value="boolean">Boolean</option>
                    <option value="percentage">Percentage Rollout</option>
                    <option value="user_list">User List</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Environment</label>
                  <select
                    value={formData.environment}
                    onChange={(e) => setFormData({
                      ...formData,
                      environment: e.target.value as 'all' | 'dev' | 'staging' | 'prod'
                    })}
                  >
                    <option value="all">All Environments</option>
                    <option value="dev">Development</option>
                    <option value="staging">Staging</option>
                    <option value="prod">Production</option>
                  </select>
                </div>
              </div>
              {formData.flag_type === 'percentage' && (
                <div className="form-group">
                  <label>Rollout Percentage: {formData.percentage}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => setFormData({
                      ...formData,
                      percentage: parseInt(e.target.value)
                    })}
                  />
                </div>
              )}
              {formData.flag_type === 'user_list' && (
                <div className="form-group">
                  <label>User IDs (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.user_ids}
                    onChange={(e) => setFormData({ ...formData, user_ids: e.target.value })}
                    placeholder="1, 2, 3"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="beta, experimental"
                />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={saveFlag}>
                {editingFlag ? 'Save Changes' : 'Create Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureFlags;
