/**
 * Environment Config Viewer - View application configuration
 *
 * Features:
 * - View application settings by category
 * - Environment variables display
 * - Runtime information
 * - Configuration validation
 * - Reveal sensitive values (with warning)
 */

import { useState, useEffect, useCallback } from 'react';
import './EnvConfig.css';

const API_BASE = 'http://localhost:8000/api/config';

interface ConfigValue {
  key: string;
  value: string;
  category: string;
  is_sensitive: boolean;
  is_default?: boolean;
  description?: string;
}

interface EnvVar {
  key: string;
  value: string;
  is_sensitive: boolean;
}

interface RuntimeInfo {
  python_version: string;
  platform: string;
  platform_release: string;
  platform_version: string;
  architecture: string;
  hostname: string;
  cpu_count: number | null;
  pid: number;
  cwd: string;
  start_time: string;
}

interface ValidationResult {
  valid: boolean;
  issues: Array<{ key: string; message: string; severity: string }>;
  warnings: Array<{ key: string; message: string; severity: string }>;
  total_issues: number;
  total_warnings: number;
}

interface ConfigStats {
  total_settings: number;
  total_env_vars: number;
  sensitive_count: number;
  categories: Record<string, number>;
}

interface ConnectionStrings {
  database_url: string;
  database_url_sync: string;
  redis_url: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Application: '📱',
  Server: '🖥️',
  Database: '🗄️',
  Redis: '⚡',
  Authentication: '🔐',
};

const SEVERITY_COLORS: Record<string, string> = {
  error: '#f85149',
  warning: '#d29922',
  info: '#3b82f6',
};

export function EnvConfig() {
  const [settings, setSettings] = useState<ConfigValue[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [stats, setStats] = useState<ConfigStats | null>(null);
  const [connections, setConnections] = useState<ConnectionStrings | null>(null);
  const [loading, setLoading] = useState(true);

  // View state
  const [view, setView] = useState<'settings' | 'env' | 'runtime' | 'validation'>('settings');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Application');

  // Reveal state
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch env vars
  const fetchEnvVars = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/env`);
      if (res.ok) {
        const data = await res.json();
        setEnvVars(data.env_vars);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch runtime
  const fetchRuntime = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/runtime`);
      if (res.ok) {
        const data = await res.json();
        setRuntime(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch validation
  const fetchValidation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/validate`);
      if (res.ok) {
        const data = await res.json();
        setValidation(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

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

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/connections`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
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
        fetchSettings(),
        fetchEnvVars(),
        fetchRuntime(),
        fetchValidation(),
        fetchStats(),
        fetchConnections(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchSettings, fetchEnvVars, fetchRuntime, fetchValidation, fetchStats, fetchConnections]);

  // Reveal sensitive value
  const revealValue = async (key: string) => {
    if (revealedKeys.has(key)) {
      // Hide it
      const newRevealed = new Set(revealedKeys);
      newRevealed.delete(key);
      setRevealedKeys(newRevealed);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/reveal/${key}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRevealedValues({ ...revealedValues, [key]: data.value });
        setRevealedKeys(new Set([...revealedKeys, key]));
      }
    } catch {
      // Silently fail
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, ConfigValue[]>);

  // Filter env vars
  const filteredEnvVars = envVars.filter(
    (v) =>
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="env-config">
        <div className="config-loading">
          <div className="loading-spinner" />
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="env-config">
      {/* Header */}
      <header className="config-header">
        <div className="header-left">
          <h1>Environment Config</h1>
          {validation && (
            <span className={`header-badge ${validation.valid ? 'valid' : 'invalid'}`}>
              {validation.valid ? 'Valid' : `${validation.total_issues} issues`}
            </span>
          )}
        </div>
        <div className="header-right">
          <span className="config-count">
            {stats?.total_settings || 0} settings
          </span>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total_settings}</div>
            <div className="stat-label">Settings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_env_vars}</div>
            <div className="stat-label">Env Vars</div>
          </div>
          <div className="stat-card sensitive">
            <div className="stat-value">{stats.sensitive_count}</div>
            <div className="stat-label">Sensitive</div>
          </div>
          <div className="stat-card categories">
            <div className="category-items">
              {Object.entries(stats.categories).map(([cat, count]) => (
                <div key={cat} className="category-item">
                  <span className="category-icon">{CATEGORY_ICONS[cat] || '📁'}</span>
                  <span className="category-count">{count}</span>
                </div>
              ))}
            </div>
            <div className="stat-label">By Category</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="controls-row">
        <div className="view-toggle">
          <button
            className={view === 'settings' ? 'active' : ''}
            onClick={() => setView('settings')}
          >
            Settings
          </button>
          <button
            className={view === 'env' ? 'active' : ''}
            onClick={() => setView('env')}
          >
            Environment
          </button>
          <button
            className={view === 'runtime' ? 'active' : ''}
            onClick={() => setView('runtime')}
          >
            Runtime
          </button>
          <button
            className={view === 'validation' ? 'active' : ''}
            onClick={() => setView('validation')}
          >
            Validation
          </button>
        </div>

        {view === 'env' && (
          <input
            type="text"
            placeholder="Search env vars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        )}
      </div>

      {/* Settings View */}
      {view === 'settings' && (
        <div className="settings-view">
          {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
            <div key={category} className="settings-category">
              <div
                className="category-header"
                onClick={() => setExpandedCategory(
                  expandedCategory === category ? null : category
                )}
              >
                <div className="category-title">
                  <span className="category-icon">{CATEGORY_ICONS[category] || '📁'}</span>
                  <span>{category}</span>
                  <span className="category-count-badge">{categorySettings.length}</span>
                </div>
                <span className="expand-icon">
                  {expandedCategory === category ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategory === category && (
                <div className="settings-list">
                  {categorySettings.map((setting) => (
                    <div key={setting.key} className="setting-item">
                      <div className="setting-info">
                        <div className="setting-key">
                          <code>{setting.key}</code>
                          {setting.is_sensitive && (
                            <span className="sensitive-badge">sensitive</span>
                          )}
                        </div>
                        {setting.description && (
                          <div className="setting-description">{setting.description}</div>
                        )}
                      </div>
                      <div className="setting-value-wrapper">
                        <code className="setting-value">
                          {setting.is_sensitive && revealedKeys.has(setting.key)
                            ? revealedValues[setting.key]
                            : setting.value}
                        </code>
                        {setting.is_sensitive && (
                          <button
                            className="reveal-btn"
                            onClick={() => revealValue(setting.key)}
                            title={revealedKeys.has(setting.key) ? 'Hide' : 'Reveal'}
                          >
                            {revealedKeys.has(setting.key) ? '🙈' : '👁'}
                          </button>
                        )}
                        <button
                          className="copy-btn"
                          onClick={() => copyToClipboard(
                            setting.is_sensitive && revealedKeys.has(setting.key)
                              ? revealedValues[setting.key]
                              : setting.value
                          )}
                          title="Copy"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Connection Strings */}
          {connections && (
            <div className="settings-category">
              <div
                className="category-header"
                onClick={() => setExpandedCategory(
                  expandedCategory === 'Connections' ? null : 'Connections'
                )}
              >
                <div className="category-title">
                  <span className="category-icon">🔗</span>
                  <span>Connection Strings</span>
                  <span className="category-count-badge">3</span>
                </div>
                <span className="expand-icon">
                  {expandedCategory === 'Connections' ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategory === 'Connections' && (
                <div className="settings-list">
                  {Object.entries(connections).map(([key, value]) => (
                    <div key={key} className="setting-item">
                      <div className="setting-info">
                        <div className="setting-key">
                          <code>{key}</code>
                          <span className="sensitive-badge">sensitive</span>
                        </div>
                      </div>
                      <div className="setting-value-wrapper">
                        <code className="setting-value">
                          {revealedKeys.has(key) ? revealedValues[key] : value}
                        </code>
                        <button
                          className="reveal-btn"
                          onClick={() => revealValue(key)}
                          title={revealedKeys.has(key) ? 'Hide' : 'Reveal'}
                        >
                          {revealedKeys.has(key) ? '🙈' : '👁'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Environment View */}
      {view === 'env' && (
        <div className="env-view">
          {filteredEnvVars.length === 0 ? (
            <div className="no-data">
              <p>No environment variables found</p>
            </div>
          ) : (
            <div className="env-list">
              {filteredEnvVars.map((envVar) => (
                <div key={envVar.key} className="env-item">
                  <div className="env-key">
                    <code>{envVar.key}</code>
                    {envVar.is_sensitive && (
                      <span className="sensitive-badge">sensitive</span>
                    )}
                  </div>
                  <div className="env-value-wrapper">
                    <code className="env-value">{envVar.value}</code>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(envVar.value)}
                      title="Copy"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Runtime View */}
      {view === 'runtime' && runtime && (
        <div className="runtime-view">
          <div className="runtime-grid">
            <div className="runtime-card">
              <div className="runtime-icon">🐍</div>
              <div className="runtime-label">Python Version</div>
              <div className="runtime-value">{runtime.python_version.split(' ')[0]}</div>
            </div>
            <div className="runtime-card">
              <div className="runtime-icon">💻</div>
              <div className="runtime-label">Platform</div>
              <div className="runtime-value">{runtime.platform} {runtime.platform_release}</div>
            </div>
            <div className="runtime-card">
              <div className="runtime-icon">🏗️</div>
              <div className="runtime-label">Architecture</div>
              <div className="runtime-value">{runtime.architecture}</div>
            </div>
            <div className="runtime-card">
              <div className="runtime-icon">🖥️</div>
              <div className="runtime-label">Hostname</div>
              <div className="runtime-value">{runtime.hostname}</div>
            </div>
            <div className="runtime-card">
              <div className="runtime-icon">⚙️</div>
              <div className="runtime-label">CPU Cores</div>
              <div className="runtime-value">{runtime.cpu_count || 'Unknown'}</div>
            </div>
            <div className="runtime-card">
              <div className="runtime-icon">🔢</div>
              <div className="runtime-label">Process ID</div>
              <div className="runtime-value">{runtime.pid}</div>
            </div>
          </div>

          <div className="runtime-details">
            <div className="detail-row">
              <span className="detail-label">Working Directory</span>
              <code className="detail-value">{runtime.cwd}</code>
            </div>
            <div className="detail-row">
              <span className="detail-label">Platform Version</span>
              <code className="detail-value small">{runtime.platform_version}</code>
            </div>
            <div className="detail-row">
              <span className="detail-label">Full Python Version</span>
              <code className="detail-value small">{runtime.python_version}</code>
            </div>
          </div>
        </div>
      )}

      {/* Validation View */}
      {view === 'validation' && validation && (
        <div className="validation-view">
          <div className={`validation-status ${validation.valid ? 'valid' : 'invalid'}`}>
            <div className="status-icon">{validation.valid ? '✅' : '⚠️'}</div>
            <div className="status-text">
              {validation.valid
                ? 'Configuration is valid'
                : `${validation.total_issues} issue(s) found`}
            </div>
          </div>

          {validation.issues.length > 0 && (
            <div className="validation-section">
              <h3>Issues</h3>
              <div className="validation-items">
                {validation.issues.map((issue, i) => (
                  <div
                    key={i}
                    className="validation-item"
                    style={{ borderLeftColor: SEVERITY_COLORS[issue.severity] }}
                  >
                    <div className="validation-item-header">
                      <code className="validation-key">{issue.key}</code>
                      <span
                        className="severity-badge"
                        style={{ background: SEVERITY_COLORS[issue.severity] + '22', color: SEVERITY_COLORS[issue.severity] }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <div className="validation-message">{issue.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="validation-section">
              <h3>Warnings</h3>
              <div className="validation-items">
                {validation.warnings.map((warning, i) => (
                  <div
                    key={i}
                    className="validation-item"
                    style={{ borderLeftColor: SEVERITY_COLORS[warning.severity] }}
                  >
                    <div className="validation-item-header">
                      <code className="validation-key">{warning.key}</code>
                      <span
                        className="severity-badge"
                        style={{ background: SEVERITY_COLORS[warning.severity] + '22', color: SEVERITY_COLORS[warning.severity] }}
                      >
                        {warning.severity}
                      </span>
                    </div>
                    <div className="validation-message">{warning.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation.issues.length === 0 && validation.warnings.length === 0 && (
            <div className="no-issues">
              <div className="no-issues-icon">🎉</div>
              <p>No issues or warnings found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EnvConfig;
