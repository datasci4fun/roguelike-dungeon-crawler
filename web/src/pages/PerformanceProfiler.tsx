/**
 * Performance Profiler - Request timing and metrics dashboard
 *
 * Features:
 * - Real-time request timing visualization
 * - Endpoint statistics with percentiles
 * - Slow request identification
 * - Timeline chart of request volume
 * - Filter by method, path, slow requests
 */

import { useState, useEffect, useCallback } from 'react';
import './PerformanceProfiler.css';

const API_BASE = 'http://localhost:8000/api/profiler';

interface RequestMetric {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  full_path: string;
  status_code: number;
  duration_ms: number;
  response_size?: number;
  client_ip?: string;
  user_agent?: string;
  is_slow: boolean;
}

interface OverallStats {
  total_requests: number;
  avg_duration_ms: number;
  slow_requests: number;
  error_requests: number;
  requests_per_minute: number;
  by_status: Record<string, number>;
  by_method: Record<string, number>;
}

interface EndpointStats {
  path: string;
  method: string;
  count: number;
  avg_ms: number;
  min_ms: number;
  max_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  slow_count: number;
  error_count: number;
}

interface TimelineBucket {
  time: string;
  count: number;
  avg_ms: number;
  max_ms: number;
  errors: number;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#eab308',
  PATCH: '#f97316',
  DELETE: '#ef4444',
  OPTIONS: '#8b5cf6',
};

export function PerformanceProfiler() {
  const [requests, setRequests] = useState<RequestMetric[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointStats[]>([]);
  const [timeline, setTimeline] = useState<TimelineBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowThreshold, setSlowThreshold] = useState(500);

  // Filters
  const [methodFilter, setMethodFilter] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  const [slowOnly, setSlowOnly] = useState(false);
  const [errorsOnly, setErrorsOnly] = useState(false);

  // View mode
  const [view, setView] = useState<'requests' | 'endpoints'>('requests');

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (methodFilter) params.append('method', methodFilter);
      if (pathFilter) params.append('path', pathFilter);
      if (slowOnly) params.append('slow_only', 'true');
      if (errorsOnly) params.append('errors_only', 'true');

      const res = await fetch(`${API_BASE}/requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
        setSlowThreshold(data.slow_threshold_ms);
      }
    } catch {
      // Silently fail
    }
  }, [methodFilter, pathFilter, slowOnly, errorsOnly]);

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

  // Fetch endpoints
  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/endpoints?sort_by=avg_ms`);
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data.endpoints);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch timeline
  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/timeline?minutes=10&bucket_seconds=30`);
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.buckets);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchStats(), fetchEndpoints(), fetchTimeline()]);
      setLoading(false);
    };
    loadData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchRequests();
      fetchStats();
      fetchEndpoints();
      fetchTimeline();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRequests, fetchStats, fetchEndpoints, fetchTimeline]);

  // Clear metrics
  const clearMetrics = async () => {
    try {
      await fetch(API_BASE, { method: 'DELETE' });
      setRequests([]);
      fetchStats();
      fetchEndpoints();
      fetchTimeline();
    } catch {
      // Silently fail
    }
  };

  // Format duration with color
  const getDurationClass = (ms: number) => {
    if (ms >= slowThreshold) return 'duration-slow';
    if (ms >= slowThreshold * 0.5) return 'duration-medium';
    return 'duration-fast';
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // Get status class
  const getStatusClass = (status: number) => {
    if (status >= 500) return 'status-5xx';
    if (status >= 400) return 'status-4xx';
    if (status >= 300) return 'status-3xx';
    return 'status-2xx';
  };

  // Get max value for timeline scaling
  const timelineMax = Math.max(...timeline.map(b => b.avg_ms), 1);

  if (loading) {
    return (
      <div className="performance-profiler">
        <div className="profiler-loading">
          <div className="loading-spinner" />
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-profiler">
      {/* Header */}
      <header className="profiler-header">
        <div className="header-left">
          <h1>Performance Profiler</h1>
          <span className="header-badge">{slowThreshold}ms threshold</span>
        </div>
        <div className="header-right">
          <button onClick={clearMetrics} className="clear-btn">Clear</button>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total_requests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg_duration_ms.toFixed(0)}ms</div>
            <div className="stat-label">Avg Duration</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{stats.slow_requests}</div>
            <div className="stat-label">Slow Requests</div>
          </div>
          <div className="stat-card stat-error">
            <div className="stat-value">{stats.error_requests}</div>
            <div className="stat-label">Errors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.requests_per_minute.toFixed(1)}</div>
            <div className="stat-label">Req/min</div>
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      <div className="timeline-section">
        <h2 className="section-title">Request Timeline (Last 10 min)</h2>
        <div className="timeline-chart">
          {timeline.map((bucket, i) => (
            <div key={i} className="timeline-bar-container">
              <div
                className={`timeline-bar ${bucket.errors > 0 ? 'has-errors' : ''}`}
                style={{
                  height: `${Math.max(5, (bucket.avg_ms / timelineMax) * 100)}%`,
                }}
                title={`${formatTime(bucket.time)}\n${bucket.count} requests\n${bucket.avg_ms.toFixed(0)}ms avg\n${bucket.errors} errors`}
              >
                {bucket.errors > 0 && <div className="error-indicator" />}
              </div>
              {i % 4 === 0 && (
                <span className="timeline-label">{formatTime(bucket.time)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={view === 'requests' ? 'active' : ''}
          onClick={() => setView('requests')}
        >
          Recent Requests
        </button>
        <button
          className={view === 'endpoints' ? 'active' : ''}
          onClick={() => setView('endpoints')}
        >
          Endpoint Stats
        </button>
      </div>

      {/* Requests View */}
      {view === 'requests' && (
        <>
          {/* Toolbar */}
          <div className="profiler-toolbar">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="text"
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              placeholder="Filter by path..."
              className="filter-input"
            />

            <label className="checkbox-filter">
              <input
                type="checkbox"
                checked={slowOnly}
                onChange={(e) => setSlowOnly(e.target.checked)}
              />
              Slow only
            </label>

            <label className="checkbox-filter">
              <input
                type="checkbox"
                checked={errorsOnly}
                onChange={(e) => setErrorsOnly(e.target.checked)}
              />
              Errors only
            </label>
          </div>

          {/* Request List */}
          <div className="request-list">
            {requests.length === 0 ? (
              <div className="no-data">
                <p>No requests captured yet</p>
                <p className="hint">Make some API calls to see performance data</p>
              </div>
            ) : (
              <table className="request-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className={req.is_slow ? 'slow-row' : ''}>
                      <td className="col-time">{formatTime(req.timestamp)}</td>
                      <td>
                        <span
                          className="method-badge"
                          style={{ background: METHOD_COLORS[req.method] || '#6b7280' }}
                        >
                          {req.method}
                        </span>
                      </td>
                      <td className="col-path" title={req.full_path}>
                        {req.path}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(req.status_code)}`}>
                          {req.status_code}
                        </span>
                      </td>
                      <td className={`col-duration ${getDurationClass(req.duration_ms)}`}>
                        {req.duration_ms.toFixed(0)}ms
                        {req.is_slow && <span className="slow-indicator">🐢</span>}
                      </td>
                      <td className="col-size">
                        {req.response_size ? `${(req.response_size / 1024).toFixed(1)}KB` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Endpoints View */}
      {view === 'endpoints' && (
        <div className="endpoints-section">
          {endpoints.length === 0 ? (
            <div className="no-data">
              <p>No endpoint data yet</p>
            </div>
          ) : (
            <table className="endpoints-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Requests</th>
                  <th>Avg</th>
                  <th>P50</th>
                  <th>P95</th>
                  <th>P99</th>
                  <th>Max</th>
                  <th>Slow</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep, i) => (
                  <tr key={i}>
                    <td className="col-endpoint">
                      <span
                        className="method-badge small"
                        style={{ background: METHOD_COLORS[ep.method] || '#6b7280' }}
                      >
                        {ep.method}
                      </span>
                      <span className="endpoint-path">{ep.path}</span>
                    </td>
                    <td>{ep.count}</td>
                    <td className={getDurationClass(ep.avg_ms)}>{ep.avg_ms.toFixed(0)}ms</td>
                    <td>{ep.p50_ms.toFixed(0)}ms</td>
                    <td className={getDurationClass(ep.p95_ms)}>{ep.p95_ms.toFixed(0)}ms</td>
                    <td className={getDurationClass(ep.p99_ms)}>{ep.p99_ms.toFixed(0)}ms</td>
                    <td className={getDurationClass(ep.max_ms)}>{ep.max_ms.toFixed(0)}ms</td>
                    <td className={ep.slow_count > 0 ? 'has-slow' : ''}>{ep.slow_count}</td>
                    <td className={ep.error_count > 0 ? 'has-errors' : ''}>{ep.error_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Method Distribution */}
      {stats && Object.keys(stats.by_method).length > 0 && (
        <div className="distribution-section">
          <h2 className="section-title">Request Distribution</h2>
          <div className="distribution-grid">
            <div className="distribution-card">
              <h3>By Method</h3>
              <div className="distribution-bars">
                {Object.entries(stats.by_method).map(([method, count]) => (
                  <div key={method} className="dist-item">
                    <span className="dist-label" style={{ color: METHOD_COLORS[method] }}>
                      {method}
                    </span>
                    <div className="dist-bar">
                      <div
                        className="dist-fill"
                        style={{
                          width: `${(count / stats.total_requests) * 100}%`,
                          background: METHOD_COLORS[method],
                        }}
                      />
                    </div>
                    <span className="dist-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="distribution-card">
              <h3>By Status</h3>
              <div className="distribution-bars">
                {Object.entries(stats.by_status).map(([status, count]) => (
                  <div key={status} className="dist-item">
                    <span className={`dist-label status-${status.replace('xx', '')}`}>
                      {status}
                    </span>
                    <div className="dist-bar">
                      <div
                        className={`dist-fill status-fill-${status.replace('xx', '')}`}
                        style={{ width: `${(count / stats.total_requests) * 100}%` }}
                      />
                    </div>
                    <span className="dist-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceProfiler;
