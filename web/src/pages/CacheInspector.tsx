/**
 * Cache Inspector - Dev tool for browsing Redis cache
 *
 * Features:
 * - Redis stats overview
 * - Key browser with pattern search
 * - View key values by type
 * - Delete keys individually or by pattern
 */

import { useState, useEffect, useCallback } from 'react';
import './CacheInspector.css';

const API_BASE = 'http://localhost:8000/api/cache';

interface CacheStats {
  total_keys: number;
  memory_used: string;
  memory_peak: string;
  connected_clients: number;
  uptime_seconds: number;
  redis_version: string;
}

interface KeyInfo {
  key: string;
  type: string;
  ttl: number;
  memory_bytes: number | null;
}

interface KeyValue {
  key: string;
  type: string;
  ttl: number;
  value: unknown;
}

export function CacheInspector() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState<KeyValue | null>(null);
  const [pattern, setPattern] = useState('*');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete pattern state
  const [deletePattern, setDeletePattern] = useState('');
  const [deletePreview, setDeletePreview] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    fetchKeys('*');
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch stats');
      }
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch stats');
    }
  };

  const fetchKeys = useCallback(async (searchPattern: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/keys?pattern=${encodeURIComponent(searchPattern)}&limit=200`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch keys');
      }
      const data = await res.json();
      setKeys(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch keys');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKeyValue = async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/keys/${encodeURIComponent(key)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch key');
      }
      const data = await res.json();
      setKeyValue(data);
      setSelectedKey(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch key value');
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (key: string) => {
    if (!confirm(`Delete key "${key}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete key');
      }
      // Refresh
      fetchKeys(pattern);
      if (selectedKey === key) {
        setSelectedKey(null);
        setKeyValue(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete key');
    }
  };

  const previewDeletePattern = async () => {
    if (!deletePattern.trim()) return;

    try {
      const res = await fetch(
        `${API_BASE}/keys/delete-pattern?pattern=${encodeURIComponent(deletePattern)}&dry_run=true`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to preview');
      }
      const data = await res.json();
      setDeletePreview(data.keys);
      setShowDeleteModal(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to preview delete');
    }
  };

  const executeDeletePattern = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/keys/delete-pattern?pattern=${encodeURIComponent(deletePattern)}&dry_run=false`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete');
      }
      const data = await res.json();
      setShowDeleteModal(false);
      setDeletePattern('');
      setDeletePreview([]);
      fetchKeys(pattern);
      fetchStats();
      alert(`Deleted ${data.deleted} keys`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete keys');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeys(pattern);
  };

  const formatTTL = (ttl: number): string => {
    if (ttl === -1) return 'No expiry';
    if (ttl === -2) return 'Key missing';
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`;
    if (ttl < 86400) return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`;
    return `${Math.floor(ttl / 86400)}d ${Math.floor((ttl % 86400) / 3600)}h`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      string: '#7ee787',
      list: '#58a6ff',
      set: '#d2a8ff',
      zset: '#ff7b72',
      hash: '#ffa657',
      stream: '#79c0ff',
    };
    return colors[type] || '#8b949e';
  };

  return (
    <div className="cache-inspector">
      {/* Header with Stats */}
      <header className="cache-header">
        <div className="header-title">
          <h1>Cache Inspector</h1>
          <span className="redis-badge">Redis {stats?.redis_version || '...'}</span>
        </div>

        {stats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.total_keys}</span>
              <span className="stat-label">Keys</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.memory_used}</span>
              <span className="stat-label">Memory</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.memory_peak}</span>
              <span className="stat-label">Peak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.connected_clients}</span>
              <span className="stat-label">Clients</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatUptime(stats.uptime_seconds)}</span>
              <span className="stat-label">Uptime</span>
            </div>
            <button onClick={() => { fetchStats(); fetchKeys(pattern); }} className="refresh-btn">
              ↻ Refresh
            </button>
          </div>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="cache-body">
        {/* Key List */}
        <aside className="key-sidebar">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Pattern (e.g., user:*)"
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>

          <div className="key-list-header">
            <span>{keys.length} keys</span>
          </div>

          <ul className="key-list">
            {keys.map((k) => (
              <li
                key={k.key}
                className={`key-item ${selectedKey === k.key ? 'selected' : ''}`}
                onClick={() => fetchKeyValue(k.key)}
              >
                <div className="key-main">
                  <span className="key-type" style={{ color: getTypeColor(k.type) }}>
                    {k.type}
                  </span>
                  <span className="key-name">{k.key}</span>
                </div>
                <div className="key-meta">
                  <span className="key-ttl">{formatTTL(k.ttl)}</span>
                  <button
                    className="key-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKey(k.key);
                    }}
                    title="Delete key"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
            {keys.length === 0 && !loading && (
              <li className="key-empty">No keys found</li>
            )}
            {loading && (
              <li className="key-loading">Loading...</li>
            )}
          </ul>

          {/* Bulk Delete */}
          <div className="bulk-delete">
            <input
              type="text"
              value={deletePattern}
              onChange={(e) => setDeletePattern(e.target.value)}
              placeholder="Delete pattern..."
              className="delete-input"
            />
            <button
              onClick={previewDeletePattern}
              disabled={!deletePattern.trim()}
              className="delete-preview-btn"
            >
              Preview
            </button>
          </div>
        </aside>

        {/* Key Value Display */}
        <main className="value-panel">
          {!selectedKey ? (
            <div className="value-empty">
              <div className="empty-icon">🔑</div>
              <p>Select a key to view its value</p>
            </div>
          ) : keyValue ? (
            <div className="value-content">
              <div className="value-header">
                <h2>{keyValue.key}</h2>
                <div className="value-meta">
                  <span className="meta-type" style={{ color: getTypeColor(keyValue.type) }}>
                    {keyValue.type}
                  </span>
                  <span className="meta-ttl">TTL: {formatTTL(keyValue.ttl)}</span>
                </div>
              </div>
              <pre className="value-display">{formatValue(keyValue.value)}</pre>
            </div>
          ) : loading ? (
            <div className="value-loading">Loading...</div>
          ) : null}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Delete {deletePreview.length} keys matching pattern <code>{deletePattern}</code>?</p>
              {deletePreview.length > 0 && (
                <div className="preview-list">
                  {deletePreview.slice(0, 20).map((k) => (
                    <div key={k} className="preview-key">{k}</div>
                  ))}
                  {deletePreview.length > 20 && (
                    <div className="preview-more">...and {deletePreview.length - 20} more</div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={executeDeletePattern} className="btn-delete">
                Delete {deletePreview.length} Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CacheInspector;
