/**
 * Error Tracker - Application error monitoring dashboard
 *
 * Features:
 * - View captured exceptions with stack traces
 * - Filter by severity, error type, resolved status
 * - Mark errors as resolved/unresolved
 * - Error statistics and trends
 * - Expandable stack trace view
 * - Test error generation
 */

import { useState, useEffect, useCallback } from 'react';
import './ErrorTracker.css';

const API_BASE = 'http://localhost:8000/api/errors';

interface ErrorEntry {
  id: number;
  timestamp: string;
  error_type: string;
  message: string;
  stack_trace: string;
  fingerprint: string;
  request_path?: string;
  request_method?: string;
  request_params?: Record<string, string>;
  user_agent?: string;
  client_ip?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  resolved: boolean;
  notes?: string;
}

interface ErrorStats {
  total_errors: number;
  unique_errors: number;
  unresolved: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  recent_24h: number;
}

interface ErrorType {
  name: string;
  count: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#8b949e',
  medium: '#d29922',
  high: '#f85149',
  critical: '#ff7b72',
};

const SEVERITY_BG: Record<string, string> = {
  low: '#8b949e15',
  medium: '#d2992220',
  high: '#f8514925',
  critical: '#ff7b7230',
};

export function ErrorTracker() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded errors
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  // Fetch errors
  const fetchErrors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (severityFilter) params.append('severity', severityFilter);
      if (typeFilter) params.append('error_type', typeFilter);
      if (unresolvedOnly) params.append('unresolved_only', 'true');
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error('Failed to fetch errors');
      const data = await res.json();
      setErrors(data.entries);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch errors');
    }
  }, [severityFilter, typeFilter, unresolvedOnly, searchTerm]);

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

  // Fetch error types
  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/types`);
      if (res.ok) {
        const data = await res.json();
        setErrorTypes(data.types);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchErrors(), fetchStats(), fetchTypes()]);
      setLoading(false);
    };
    loadData();
  }, [fetchErrors, fetchStats, fetchTypes]);

  // Refetch on filter change
  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  // Toggle error expansion
  const toggleExpanded = (id: number) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Resolve/unresolve error
  const toggleResolved = async (id: number, currentlyResolved: boolean) => {
    try {
      const endpoint = currentlyResolved ? 'unresolve' : 'resolve';
      const res = await fetch(`${API_BASE}/${id}/${endpoint}`, { method: 'PATCH' });
      if (res.ok) {
        setErrors((prev) =>
          prev.map((e) => (e.id === id ? { ...e, resolved: !currentlyResolved } : e))
        );
        fetchStats();
      }
    } catch {
      // Silently fail
    }
  };

  // Create test error
  const createTestError = async (type: string) => {
    try {
      await fetch(`${API_BASE}/test?error_type=${type}&message=Test ${type} from Error Tracker`, {
        method: 'POST',
      });
      fetchErrors();
      fetchStats();
      fetchTypes();
    } catch {
      // Silently fail
    }
  };

  // Trigger real error
  const triggerRealError = async () => {
    try {
      await fetch(`${API_BASE}/test/real`, { method: 'POST' });
    } catch {
      // Expected to fail
    }
    setTimeout(() => {
      fetchErrors();
      fetchStats();
      fetchTypes();
    }, 500);
  };

  // Clear all errors
  const clearErrors = async () => {
    try {
      await fetch(API_BASE, { method: 'DELETE' });
      setErrors([]);
      fetchStats();
      fetchTypes();
    } catch {
      // Silently fail
    }
  };

  // Format timestamp
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
      <div className="error-tracker">
        <div className="error-loading">
          <div className="loading-spinner" />
          <p>Loading error data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="error-tracker">
      {/* Header */}
      <header className="error-header">
        <div className="header-left">
          <h1>Error Tracker</h1>
          <span className="header-badge">
            {stats?.unresolved || 0} unresolved
          </span>
        </div>
        <div className="header-right">
          <button onClick={() => fetchErrors()} className="refresh-btn">
            Refresh
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_errors}</div>
            <div className="stat-label">Total Errors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.unique_errors}</div>
            <div className="stat-label">Unique Errors</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{stats.unresolved}</div>
            <div className="stat-label">Unresolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.recent_24h}</div>
            <div className="stat-label">Last 24h</div>
          </div>
          <div className="stat-card severity-breakdown">
            <div className="severity-bars">
              {Object.entries(stats.by_severity).map(([sev, count]) => (
                <div key={sev} className="severity-bar-item">
                  <span className="sev-label" style={{ color: SEVERITY_COLORS[sev] }}>
                    {sev.toUpperCase()}
                  </span>
                  <div className="sev-bar">
                    <div
                      className="sev-fill"
                      style={{
                        width: `${stats.total_errors ? (count / stats.total_errors) * 100 : 0}%`,
                        background: SEVERITY_COLORS[sev],
                      }}
                    />
                  </div>
                  <span className="sev-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="error-toolbar">
        <div className="toolbar-left">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            {errorTypes.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.count})
              </option>
            ))}
          </select>

          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={unresolvedOnly}
              onChange={(e) => setUnresolvedOnly(e.target.checked)}
            />
            Unresolved only
          </label>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search errors..."
            className="search-input"
          />
        </div>

        <div className="toolbar-right">
          <div className="test-buttons">
            <button onClick={() => createTestError('ValueError')} className="test-btn">
              + ValueError
            </button>
            <button onClick={() => createTestError('TypeError')} className="test-btn">
              + TypeError
            </button>
            <button onClick={triggerRealError} className="test-btn test-real">
              + Real Error
            </button>
          </div>
          <button onClick={clearErrors} className="clear-btn">
            Clear All
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => fetchErrors()}>Retry</button>
        </div>
      )}

      {/* Error List */}
      <div className="error-list">
        {errors.length === 0 ? (
          <div className="no-errors">
            <div className="no-errors-icon">✓</div>
            <p>No errors captured</p>
            <p className="hint">Errors will appear here when they occur</p>
          </div>
        ) : (
          errors.map((err) => (
            <div
              key={err.id}
              className={`error-item ${err.resolved ? 'resolved' : ''}`}
              style={{ borderLeftColor: SEVERITY_COLORS[err.severity] }}
            >
              {/* Error Header */}
              <div className="error-item-header" onClick={() => toggleExpanded(err.id)}>
                <div className="error-main">
                  <span
                    className="error-severity"
                    style={{
                      color: SEVERITY_COLORS[err.severity],
                      background: SEVERITY_BG[err.severity],
                    }}
                  >
                    {err.severity.toUpperCase()}
                  </span>
                  <span className="error-type">{err.error_type}</span>
                  {err.count > 1 && (
                    <span className="error-count">×{err.count}</span>
                  )}
                  {err.resolved && (
                    <span className="resolved-badge">Resolved</span>
                  )}
                </div>
                <div className="error-meta">
                  <span className="error-time" title={formatTime(err.timestamp)}>
                    {formatRelativeTime(err.timestamp)}
                  </span>
                  <span className="expand-icon">
                    {expandedErrors.has(err.id) ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              <div className="error-message">{err.message}</div>

              {/* Request Info (if available) */}
              {err.request_path && (
                <div className="error-request">
                  <span className="request-method">{err.request_method}</span>
                  <span className="request-path">{err.request_path}</span>
                </div>
              )}

              {/* Expanded Details */}
              {expandedErrors.has(err.id) && (
                <div className="error-details">
                  {/* Stack Trace */}
                  <div className="stack-trace-section">
                    <div className="section-header">Stack Trace</div>
                    <pre className="stack-trace">{err.stack_trace}</pre>
                  </div>

                  {/* Additional Info */}
                  <div className="error-info-grid">
                    <div className="info-item">
                      <span className="info-label">Fingerprint</span>
                      <code className="info-value">{err.fingerprint}</code>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Timestamp</span>
                      <span className="info-value">{formatTime(err.timestamp)}</span>
                    </div>
                    {err.client_ip && (
                      <div className="info-item">
                        <span className="info-label">Client IP</span>
                        <span className="info-value">{err.client_ip}</span>
                      </div>
                    )}
                    {err.user_agent && (
                      <div className="info-item full-width">
                        <span className="info-label">User Agent</span>
                        <span className="info-value">{err.user_agent}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="error-actions">
                    <button
                      onClick={() => toggleResolved(err.id, err.resolved)}
                      className={`action-btn ${err.resolved ? 'unresolve' : 'resolve'}`}
                    >
                      {err.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(err.stack_trace)}
                      className="action-btn"
                    >
                      Copy Stack Trace
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ErrorTracker;
