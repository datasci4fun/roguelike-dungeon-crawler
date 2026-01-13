/**
 * System Status - Mission Control Dashboard
 *
 * Features:
 * - Real-time service health monitoring
 * - System resource gauges (CPU, Memory, Disk)
 * - Latency visualization
 * - Auto-refresh with countdown
 * - Uptime display
 */

import { useState, useEffect, useCallback } from 'react';
import './SystemStatus.css';

const API_BASE = 'http://localhost:8000/api/status';
const REFRESH_INTERVAL = 10000; // 10 seconds

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency_ms: number | null;
  message: string | null;
  details?: Record<string, unknown>;
}

interface SystemInfo {
  platform: string;
  python_version: string;
  cpu_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  memory_percent: number;
  disk_used_gb: number | null;
  disk_total_gb: number | null;
  disk_percent: number | null;
}

interface AppInfo {
  name: string;
  version: string;
  environment: string;
  debug_mode: boolean;
  uptime_seconds: number;
  uptime_human: string;
}

interface StatusResponse {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceStatus[];
  system: SystemInfo;
  app: AppInfo;
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  healthy: '#22c55e',
  degraded: '#eab308',
  unhealthy: '#ef4444',
  unknown: '#6b7280',
};

export function SystemStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch status');
      }
      const data = await res.json();
      setStatus(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
      setCountdown(REFRESH_INTERVAL / 1000);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format bytes
  const formatBytes = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  // Get latency color
  const getLatencyColor = (ms: number): string => {
    if (ms < 50) return '#22c55e';
    if (ms < 100) return '#84cc16';
    if (ms < 200) return '#eab308';
    if (ms < 500) return '#f97316';
    return '#ef4444';
  };

  // Render gauge
  const renderGauge = (
    label: string,
    value: number,
    max: number,
    unit: string,
    color: string
  ) => {
    const percent = Math.min(100, (value / max) * 100);
    return (
      <div className="gauge">
        <div className="gauge-label">{label}</div>
        <div className="gauge-ring">
          <svg viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#21262d"
              strokeWidth="8"
            />
            {/* Value arc */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${percent * 2.64} 264`}
              transform="rotate(-90 50 50)"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </svg>
          <div className="gauge-value">
            <span className="gauge-number">{value.toFixed(1)}</span>
            <span className="gauge-unit">{unit}</span>
          </div>
        </div>
        <div className="gauge-max">/ {max.toFixed(0)} {unit}</div>
      </div>
    );
  };

  if (loading && !status) {
    return (
      <div className="system-status">
        <div className="status-loading">
          <div className="loading-spinner" />
          <p>Establishing connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="system-status">
      {/* Header */}
      <header className="status-header">
        <div className="header-left">
          <h1>System Status</h1>
          <span className="mission-badge">MISSION CONTROL</span>
        </div>
        <div className="header-right">
          <div className="refresh-info">
            <span className="refresh-label">Next update in</span>
            <span className="refresh-countdown">{countdown}s</span>
          </div>
          <button onClick={fetchStatus} className="refresh-btn" disabled={loading}>
            {loading ? '...' : '↻'} Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="status-error">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {status && (
        <>
          {/* Overall Status Banner */}
          <div
            className={`overall-status overall-${status.overall_status}`}
            style={{ '--status-color': STATUS_COLORS[status.overall_status] } as React.CSSProperties}
          >
            <div className="status-indicator">
              <span className="status-dot" />
              <span className="status-text">
                {status.overall_status.toUpperCase()}
              </span>
            </div>
            <div className="status-meta">
              <span>Last check: {lastUpdated?.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="status-grid">
            {/* Services Panel */}
            <section className="panel services-panel">
              <h2 className="panel-title">
                <span className="panel-icon">◈</span>
                Services
              </h2>
              <div className="services-list">
                {status.services.map((service) => (
                  <div
                    key={service.name}
                    className={`service-card service-${service.status}`}
                  >
                    <div className="service-header">
                      <span
                        className="service-status-dot"
                        style={{ backgroundColor: STATUS_COLORS[service.status] }}
                      />
                      <span className="service-name">{service.name}</span>
                      <span
                        className="service-badge"
                        style={{ color: STATUS_COLORS[service.status] }}
                      >
                        {service.status}
                      </span>
                    </div>
                    <div className="service-body">
                      {service.latency_ms !== null && (
                        <div className="service-latency">
                          <span className="latency-label">Latency</span>
                          <div className="latency-bar-container">
                            <div
                              className="latency-bar"
                              style={{
                                width: `${Math.min(100, service.latency_ms / 5)}%`,
                                backgroundColor: getLatencyColor(service.latency_ms),
                              }}
                            />
                          </div>
                          <span
                            className="latency-value"
                            style={{ color: getLatencyColor(service.latency_ms) }}
                          >
                            {service.latency_ms.toFixed(1)}ms
                          </span>
                        </div>
                      )}
                      {service.message && (
                        <div className="service-message">{service.message}</div>
                      )}
                      {service.details && (
                        <div className="service-details">
                          {Object.entries(service.details).map(([key, value]) => (
                            <span key={key} className="detail-item">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* System Resources Panel */}
            <section className="panel resources-panel">
              <h2 className="panel-title">
                <span className="panel-icon">◉</span>
                System Resources
              </h2>
              <div className="gauges-container">
                {renderGauge(
                  'CPU',
                  status.system.cpu_percent,
                  100,
                  '%',
                  status.system.cpu_percent > 80 ? '#ef4444' : status.system.cpu_percent > 60 ? '#eab308' : '#22c55e'
                )}
                {renderGauge(
                  'Memory',
                  status.system.memory_used_mb,
                  status.system.memory_total_mb,
                  'MB',
                  status.system.memory_percent > 80 ? '#ef4444' : status.system.memory_percent > 60 ? '#eab308' : '#22c55e'
                )}
                {status.system.disk_percent !== null && (
                  renderGauge(
                    'Disk',
                    status.system.disk_used_gb || 0,
                    status.system.disk_total_gb || 100,
                    'GB',
                    (status.system.disk_percent || 0) > 80 ? '#ef4444' : (status.system.disk_percent || 0) > 60 ? '#eab308' : '#22c55e'
                  )
                )}
              </div>
              <div className="system-info-grid">
                <div className="info-item">
                  <span className="info-label">Platform</span>
                  <span className="info-value">{status.system.platform}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Python</span>
                  <span className="info-value">{status.system.python_version}</span>
                </div>
              </div>
            </section>

            {/* Application Info Panel */}
            <section className="panel app-panel">
              <h2 className="panel-title">
                <span className="panel-icon">◆</span>
                Application
              </h2>
              <div className="app-info">
                <div className="app-name">
                  <span className="app-title">{status.app.name}</span>
                  <span className="app-version">v{status.app.version}</span>
                </div>
                <div className="app-env">
                  <span
                    className={`env-badge env-${status.app.environment}`}
                  >
                    {status.app.environment}
                  </span>
                  {status.app.debug_mode && (
                    <span className="debug-badge">DEBUG</span>
                  )}
                </div>
                <div className="uptime-display">
                  <div className="uptime-label">Uptime</div>
                  <div className="uptime-value">{status.app.uptime_human}</div>
                  <div className="uptime-seconds">
                    {status.app.uptime_seconds.toLocaleString()}s
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Stats Panel */}
            <section className="panel stats-panel">
              <h2 className="panel-title">
                <span className="panel-icon">◇</span>
                Quick Stats
              </h2>
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon">🗄️</div>
                  <div className="stat-info">
                    <div className="stat-label">Database</div>
                    <div className="stat-value">
                      {status.services.find(s => s.name === 'PostgreSQL')?.latency_ms?.toFixed(0) || '—'}ms
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-info">
                    <div className="stat-label">Cache</div>
                    <div className="stat-value">
                      {status.services.find(s => s.name === 'Redis')?.latency_ms?.toFixed(0) || '—'}ms
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💾</div>
                  <div className="stat-info">
                    <div className="stat-label">Memory</div>
                    <div className="stat-value">
                      {formatBytes(status.system.memory_used_mb)}
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-info">
                    <div className="stat-label">Uptime</div>
                    <div className="stat-value">{status.app.uptime_human}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default SystemStatus;
