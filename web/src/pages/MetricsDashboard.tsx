/**
 * Metrics Dashboard - Application performance metrics
 *
 * Features:
 * - Overview stats (requests, errors, response times)
 * - System metrics (CPU, memory, disk)
 * - Per-endpoint metrics
 * - Recent requests log
 * - Timeseries visualization
 * - Auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import './MetricsDashboard.css';

const API_BASE = 'http://localhost:8000/api/metrics';

interface OverviewMetrics {
  total_requests: number;
  total_errors: number;
  error_rate: number;
  avg_response_time_ms: number;
  p50_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  requests_per_minute: number;
  uptime_seconds: number;
}

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_available_mb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_free_gb: number;
  open_files: number;
  threads: number;
}

interface EndpointMetric {
  path: string;
  method: string;
  request_count: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  p50_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  error_count: number;
  error_rate: number;
}

interface RecentRequest {
  timestamp: number;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
}

interface TimeseriesPoint {
  timestamp: number;
  requests: number;
  avg_response_time: number;
  errors: number;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#d29922',
  PATCH: '#a855f7',
  DELETE: '#f85149',
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

export function MetricsDashboard() {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [system, setSystem] = useState<SystemMetrics | null>(null);
  const [methodCounts, setMethodCounts] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [endpoints, setEndpoints] = useState<EndpointMetric[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [view, setView] = useState<'overview' | 'endpoints' | 'requests'>('overview');

  // Fetch overview metrics
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
        setSystem(data.system);
        setMethodCounts(data.method_counts || {});
        setStatusCounts(data.status_counts || {});
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch endpoint metrics
  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/endpoints`);
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data.endpoints);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch recent requests
  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/recent?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setRecentRequests(data.requests);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch timeseries
  const fetchTimeseries = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/timeseries?minutes=5`);
      if (res.ok) {
        const data = await res.json();
        setTimeseries(data.timeseries);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchEndpoints(),
        fetchRecent(),
        fetchTimeseries(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchOverview, fetchEndpoints, fetchRecent, fetchTimeseries]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOverview();
      fetchEndpoints();
      fetchRecent();
      fetchTimeseries();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchOverview, fetchEndpoints, fetchRecent, fetchTimeseries]);

  // Reset metrics
  const handleReset = async () => {
    if (!confirm('Reset all metrics? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) {
        await Promise.all([
          fetchOverview(),
          fetchEndpoints(),
          fetchRecent(),
          fetchTimeseries(),
        ]);
      }
    } catch {
      // Silently fail
    }
  };

  // Get status color
  const getStatusColor = (status: number): string => {
    if (status >= 500) return '#f85149';
    if (status >= 400) return '#d29922';
    if (status >= 300) return '#3b82f6';
    return '#22c55e';
  };

  // Get response time color
  const getResponseTimeColor = (ms: number): string => {
    if (ms > 1000) return '#f85149';
    if (ms > 500) return '#d29922';
    if (ms > 200) return '#3b82f6';
    return '#22c55e';
  };

  if (loading) {
    return (
      <div className="metrics-dashboard">
        <div className="metrics-loading">
          <div className="loading-spinner" />
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-dashboard">
      {/* Header */}
      <header className="metrics-header">
        <div className="header-left">
          <h1>Metrics Dashboard</h1>
          {overview && (
            <span className="uptime-badge">
              Uptime: {formatUptime(overview.uptime_seconds)}
            </span>
          )}
        </div>
        <div className="header-right">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button onClick={handleReset} className="reset-btn">
            Reset
          </button>
        </div>
      </header>

      {/* Overview Stats */}
      {overview && (
        <div className="stats-grid">
          <div className="stat-card requests">
            <div className="stat-value">{overview.total_requests.toLocaleString()}</div>
            <div className="stat-label">Total Requests</div>
            <div className="stat-subvalue">
              {overview.requests_per_minute.toFixed(1)}/min
            </div>
          </div>
          <div className="stat-card errors">
            <div className="stat-value">{overview.total_errors.toLocaleString()}</div>
            <div className="stat-label">Total Errors</div>
            <div className="stat-subvalue">
              {(overview.error_rate * 100).toFixed(2)}% rate
            </div>
          </div>
          <div className="stat-card response-time">
            <div className="stat-value">{overview.avg_response_time_ms.toFixed(1)}</div>
            <div className="stat-label">Avg Response (ms)</div>
            <div className="stat-subvalue">
              p50: {overview.p50_response_time_ms.toFixed(1)}ms
            </div>
          </div>
          <div className="stat-card percentiles">
            <div className="percentile-row">
              <span className="percentile-label">p95</span>
              <span className="percentile-value">
                {overview.p95_response_time_ms.toFixed(1)}ms
              </span>
            </div>
            <div className="percentile-row">
              <span className="percentile-label">p99</span>
              <span className="percentile-value">
                {overview.p99_response_time_ms.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* System Stats */}
      {system && (
        <div className="system-stats">
          <div className="system-stat">
            <div className="system-icon">💻</div>
            <div className="system-info">
              <div className="system-value">{system.cpu_percent.toFixed(1)}%</div>
              <div className="system-label">CPU</div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill cpu"
                style={{ width: `${Math.min(system.cpu_percent, 100)}%` }}
              />
            </div>
          </div>
          <div className="system-stat">
            <div className="system-icon">🧠</div>
            <div className="system-info">
              <div className="system-value">{system.memory_percent.toFixed(1)}%</div>
              <div className="system-label">
                Memory ({formatBytes(system.memory_used_mb)})
              </div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill memory"
                style={{ width: `${Math.min(system.memory_percent, 100)}%` }}
              />
            </div>
          </div>
          <div className="system-stat">
            <div className="system-icon">💾</div>
            <div className="system-info">
              <div className="system-value">{system.disk_percent.toFixed(1)}%</div>
              <div className="system-label">
                Disk ({system.disk_free_gb.toFixed(1)} GB free)
              </div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill disk"
                style={{ width: `${Math.min(system.disk_percent, 100)}%` }}
              />
            </div>
          </div>
          <div className="system-stat mini">
            <div className="mini-stat">
              <span className="mini-value">{system.threads}</span>
              <span className="mini-label">Threads</span>
            </div>
            <div className="mini-stat">
              <span className="mini-value">{system.open_files}</span>
              <span className="mini-label">Open Files</span>
            </div>
          </div>
        </div>
      )}

      {/* Method and Status Distribution */}
      <div className="distribution-row">
        <div className="distribution-card">
          <h3>By Method</h3>
          <div className="method-bars">
            {Object.entries(methodCounts).map(([method, count]) => {
              const total = Object.values(methodCounts).reduce((a, b) => a + b, 0);
              const percent = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={method} className="method-bar-row">
                  <span
                    className="method-badge"
                    style={{
                      background: METHOD_COLORS[method] + '22',
                      color: METHOD_COLORS[method],
                    }}
                  >
                    {method}
                  </span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${percent}%`,
                        background: METHOD_COLORS[method],
                      }}
                    />
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="distribution-card">
          <h3>By Status</h3>
          <div className="status-bars">
            {Object.entries(statusCounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([status, count]) => {
                const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status} className="status-bar-row">
                    <span
                      className="status-badge"
                      style={{
                        background: getStatusColor(Number(status)) + '22',
                        color: getStatusColor(Number(status)),
                      }}
                    >
                      {status}
                    </span>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${percent}%`,
                          background: getStatusColor(Number(status)),
                        }}
                      />
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-controls">
        <div className="view-toggle">
          <button
            className={view === 'overview' ? 'active' : ''}
            onClick={() => setView('overview')}
          >
            Timeseries
          </button>
          <button
            className={view === 'endpoints' ? 'active' : ''}
            onClick={() => setView('endpoints')}
          >
            Endpoints
          </button>
          <button
            className={view === 'requests' ? 'active' : ''}
            onClick={() => setView('requests')}
          >
            Recent Requests
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="metrics-content">
        {/* Timeseries View */}
        {view === 'overview' && (
          <div className="timeseries-section">
            <h3>Request Rate (Last 5 minutes)</h3>
            {timeseries.length === 0 ? (
              <div className="no-data">No timeseries data yet</div>
            ) : (
              <div className="timeseries-chart">
                {timeseries.slice(-60).map((point, idx) => {
                  const maxReqs = Math.max(...timeseries.map((p) => p.requests), 1);
                  const height = (point.requests / maxReqs) * 100;
                  return (
                    <div key={idx} className="chart-bar-container">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${height}%`,
                          background: point.errors > 0 ? '#f85149' : '#22c55e',
                        }}
                        title={`${point.requests} requests, ${point.errors} errors, ${point.avg_response_time}ms avg`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color success" />
                Success
              </span>
              <span className="legend-item">
                <span className="legend-color error" />
                With Errors
              </span>
            </div>
          </div>
        )}

        {/* Endpoints View */}
        {view === 'endpoints' && (
          <div className="endpoints-section">
            <h3>Endpoint Metrics</h3>
            {endpoints.length === 0 ? (
              <div className="no-data">No endpoint data yet</div>
            ) : (
              <div className="endpoints-table">
                <div className="table-header">
                  <span className="col-endpoint">Endpoint</span>
                  <span className="col-count">Requests</span>
                  <span className="col-avg">Avg</span>
                  <span className="col-p95">p95</span>
                  <span className="col-errors">Errors</span>
                </div>
                {endpoints.map((ep, idx) => (
                  <div key={idx} className="table-row">
                    <span className="col-endpoint">
                      <span
                        className="method-badge small"
                        style={{
                          background: METHOD_COLORS[ep.method] + '22',
                          color: METHOD_COLORS[ep.method],
                        }}
                      >
                        {ep.method}
                      </span>
                      <code>{ep.path}</code>
                    </span>
                    <span className="col-count">{ep.request_count}</span>
                    <span
                      className="col-avg"
                      style={{ color: getResponseTimeColor(ep.avg_response_time_ms) }}
                    >
                      {ep.avg_response_time_ms.toFixed(1)}ms
                    </span>
                    <span
                      className="col-p95"
                      style={{ color: getResponseTimeColor(ep.p95_response_time_ms) }}
                    >
                      {ep.p95_response_time_ms.toFixed(1)}ms
                    </span>
                    <span className="col-errors">
                      {ep.error_count > 0 ? (
                        <span className="error-count">{ep.error_count}</span>
                      ) : (
                        <span className="no-errors">0</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Requests View */}
        {view === 'requests' && (
          <div className="requests-section">
            <h3>Recent Requests</h3>
            {recentRequests.length === 0 ? (
              <div className="no-data">No recent requests</div>
            ) : (
              <div className="requests-list">
                {recentRequests.map((req, idx) => (
                  <div key={idx} className="request-row">
                    <span
                      className="method-badge small"
                      style={{
                        background: METHOD_COLORS[req.method] + '22',
                        color: METHOD_COLORS[req.method],
                      }}
                    >
                      {req.method}
                    </span>
                    <code className="request-path">{req.path}</code>
                    <span
                      className="status-code"
                      style={{
                        background: getStatusColor(req.status_code) + '22',
                        color: getStatusColor(req.status_code),
                      }}
                    >
                      {req.status_code}
                    </span>
                    <span
                      className="response-time"
                      style={{ color: getResponseTimeColor(req.response_time_ms) }}
                    >
                      {req.response_time_ms.toFixed(1)}ms
                    </span>
                    <span className="timestamp">
                      {new Date(req.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsDashboard;
