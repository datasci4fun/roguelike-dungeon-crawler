/**
 * API Playground - Interactive API testing tool
 *
 * Features:
 * - Request builder with method, URL, headers, body
 * - Response viewer with syntax highlighting
 * - Request history saved to localStorage
 * - Pre-built API endpoint templates
 * - Environment variables
 * - Response metrics (status, time, size)
 */

import { useState, useEffect, useCallback } from 'react';
import './ApiPlayground.css';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  method: HttpMethod;
  url: string;
  status: number;
  time: number;
}

interface EnvVariable {
  key: string;
  value: string;
}

interface ApiTemplate {
  name: string;
  method: HttpMethod;
  path: string;
  headers?: Header[];
  body?: string;
  description: string;
}

const STORAGE_KEY = 'api_playground_history';
const ENV_STORAGE_KEY = 'api_playground_env';

const DEFAULT_BASE_URL = 'http://localhost:8000';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#f97316',
  DELETE: '#ef4444',
  PATCH: '#a855f7',
};

// Pre-built API templates
const API_TEMPLATES: ApiTemplate[] = [
  { name: 'Health Check', method: 'GET', path: '/api/health', description: 'Basic health check' },
  { name: 'System Status', method: 'GET', path: '/api/status', description: 'Full system status' },
  { name: 'Cache Stats', method: 'GET', path: '/api/cache/stats', description: 'Redis cache statistics' },
  { name: 'Cache Keys', method: 'GET', path: '/api/cache/keys?pattern=*', description: 'List cache keys' },
  { name: 'DB Tables', method: 'GET', path: '/api/db/tables', description: 'List database tables' },
  { name: 'Leaderboard', method: 'GET', path: '/api/leaderboard?limit=10', description: 'Top scores' },
  { name: 'Login', method: 'POST', path: '/api/auth/login', description: 'Authenticate user', body: JSON.stringify({ username: 'demo', password: 'DemoPass123' }, null, 2) },
  { name: 'Register', method: 'POST', path: '/api/auth/register', description: 'Create account', body: JSON.stringify({ username: '', email: '', password: '' }, null, 2) },
  { name: 'Daily Challenge', method: 'GET', path: '/api/daily', description: 'Today\'s challenge' },
  { name: 'Achievements', method: 'GET', path: '/api/achievements', description: 'All achievements' },
];

export function ApiPlayground() {
  // Request state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState(`${DEFAULT_BASE_URL}/api/health`);
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState('');

  // Response state
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History & env state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([
    { key: 'BASE_URL', value: DEFAULT_BASE_URL },
  ]);
  const [showEnvPanel, setShowEnvPanel] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'response' | 'history'>('response');

  // Load history and env from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedEnv = localStorage.getItem(ENV_STORAGE_KEY);
      if (savedEnv) setEnvVars(JSON.parse(savedEnv));
    } catch (e) {
      console.warn('Failed to load saved data:', e);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [history]);

  // Save env to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(envVars));
    } catch (e) {
      console.warn('Failed to save env:', e);
    }
  }, [envVars]);

  // Replace env variables in string
  const replaceEnvVars = useCallback((str: string): string => {
    let result = str;
    envVars.forEach(({ key, value }) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  }, [envVars]);

  // Send request
  const sendRequest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setResponseStatus(null);
    setResponseTime(null);
    setResponseSize(null);
    setResponseHeaders({});

    const finalUrl = replaceEnvVars(url);
    const startTime = performance.now();

    try {
      const enabledHeaders = headers
        .filter(h => h.enabled && h.key.trim())
        .reduce((acc, h) => ({ ...acc, [h.key]: replaceEnvVars(h.value) }), {} as Record<string, string>);

      const options: RequestInit = {
        method,
        headers: enabledHeaders,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        options.body = replaceEnvVars(body);
      }

      const res = await fetch(finalUrl, options);
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      // Get response text
      const text = await res.text();
      const size = new Blob([text]).size;

      // Try to format as JSON
      let formattedResponse = text;
      try {
        const json = JSON.parse(text);
        formattedResponse = JSON.stringify(json, null, 2);
      } catch {
        // Not JSON, keep as-is
      }

      // Extract response headers
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      setResponse(formattedResponse);
      setResponseStatus(res.status);
      setResponseTime(elapsed);
      setResponseSize(size);
      setResponseHeaders(resHeaders);
      setActiveTab('response');

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        method,
        url: finalUrl,
        status: res.status,
        time: elapsed,
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 49)]);

    } catch (e) {
      const endTime = performance.now();
      setError(e instanceof Error ? e.message : 'Request failed');
      setResponseTime(Math.round(endTime - startTime));
    } finally {
      setIsLoading(false);
    }
  };

  // Load template
  const loadTemplate = (template: ApiTemplate) => {
    const baseUrl = envVars.find(v => v.key === 'BASE_URL')?.value || DEFAULT_BASE_URL;
    setMethod(template.method);
    setUrl(`${baseUrl}${template.path}`);
    if (template.body) {
      setBody(template.body);
      setActiveTab('body');
    } else {
      setBody('');
    }
    if (template.headers) {
      setHeaders(template.headers);
    }
    setShowTemplates(false);
  };

  // Load from history
  const loadFromHistory = (item: HistoryItem) => {
    setUrl(item.url);
    setMethod(item.method);
    setActiveTab('response');
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Add header
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  // Update header
  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: value };
    setHeaders(updated);
  };

  // Remove header
  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Add env variable
  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  // Update env variable
  const updateEnvVar = (index: number, field: keyof EnvVariable, value: string) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  // Remove env variable
  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  // Copy response to clipboard
  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
    }
  };

  // Format body as JSON
  const formatBody = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch {
      // Not valid JSON
    }
  };

  // Get status color
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return '#22c55e';
    if (status >= 300 && status < 400) return '#3b82f6';
    if (status >= 400 && status < 500) return '#f97316';
    return '#ef4444';
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="api-playground">
      {/* Header */}
      <header className="playground-header">
        <div className="header-left">
          <h1>API Playground</h1>
          <span className="header-badge">DEV TOOL</span>
        </div>
        <div className="header-actions">
          <button
            className={`action-btn ${showTemplates ? 'active' : ''}`}
            onClick={() => setShowTemplates(!showTemplates)}
          >
            📋 Templates
          </button>
          <button
            className={`action-btn ${showEnvPanel ? 'active' : ''}`}
            onClick={() => setShowEnvPanel(!showEnvPanel)}
          >
            ⚙️ Environment
          </button>
        </div>
      </header>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="templates-panel">
          <div className="templates-grid">
            {API_TEMPLATES.map((template, i) => (
              <button
                key={i}
                className="template-card"
                onClick={() => loadTemplate(template)}
              >
                <span
                  className="template-method"
                  style={{ color: METHOD_COLORS[template.method] }}
                >
                  {template.method}
                </span>
                <span className="template-name">{template.name}</span>
                <span className="template-desc">{template.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Environment Panel */}
      {showEnvPanel && (
        <div className="env-panel">
          <div className="env-header">
            <span>Environment Variables</span>
            <button className="env-add-btn" onClick={addEnvVar}>+ Add</button>
          </div>
          <div className="env-list">
            {envVars.map((v, i) => (
              <div key={i} className="env-item">
                <input
                  type="text"
                  value={v.key}
                  onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                  placeholder="KEY"
                  className="env-key"
                />
                <input
                  type="text"
                  value={v.value}
                  onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                  placeholder="value"
                  className="env-value"
                />
                <button className="env-remove" onClick={() => removeEnvVar(i)}>×</button>
              </div>
            ))}
          </div>
          <div className="env-hint">Use {`{{KEY}}`} in URL, headers, or body</div>
        </div>
      )}

      {/* Request Builder */}
      <div className="request-builder">
        <div className="request-row">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="method-select"
            style={{ borderColor: METHOD_COLORS[method] }}
          >
            {Object.keys(METHOD_COLORS).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="url-input"
          />
          <button
            className="send-btn"
            onClick={sendRequest}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="playground-body">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => setActiveTab('headers')}
          >
            Headers
            <span className="tab-count">{headers.filter(h => h.enabled).length}</span>
          </button>
          <button
            className={`tab ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
          <button
            className={`tab ${activeTab === 'response' ? 'active' : ''}`}
            onClick={() => setActiveTab('response')}
          >
            Response
            {responseStatus && (
              <span
                className="tab-status"
                style={{ backgroundColor: getStatusColor(responseStatus) }}
              >
                {responseStatus}
              </span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
            <span className="tab-count">{history.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="headers-editor">
              {headers.map((h, i) => (
                <div key={i} className="header-row">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => updateHeader(i, 'enabled', e.target.checked)}
                    className="header-checkbox"
                  />
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                    placeholder="Header name"
                    className="header-key"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => updateHeader(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="header-value"
                  />
                  <button className="header-remove" onClick={() => removeHeader(i)}>×</button>
                </div>
              ))}
              <button className="add-header-btn" onClick={addHeader}>+ Add Header</button>
            </div>
          )}

          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="body-editor">
              <div className="body-toolbar">
                <button onClick={formatBody} className="format-btn">Format JSON</button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request body (JSON)"
                className="body-textarea"
                spellCheck={false}
              />
            </div>
          )}

          {/* Response Tab */}
          {activeTab === 'response' && (
            <div className="response-viewer">
              {/* Response Metrics */}
              {(responseStatus || error) && (
                <div className="response-metrics">
                  {responseStatus && (
                    <span
                      className="metric status"
                      style={{ backgroundColor: getStatusColor(responseStatus) }}
                    >
                      {responseStatus}
                    </span>
                  )}
                  {responseTime !== null && (
                    <span className="metric time">{responseTime}ms</span>
                  )}
                  {responseSize !== null && (
                    <span className="metric size">{responseSize} bytes</span>
                  )}
                  {response && (
                    <button className="copy-btn" onClick={copyResponse}>
                      📋 Copy
                    </button>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="response-error">
                  <span className="error-icon">⚠</span>
                  {error}
                </div>
              )}

              {/* Response Headers */}
              {Object.keys(responseHeaders).length > 0 && (
                <details className="response-headers">
                  <summary>Response Headers ({Object.keys(responseHeaders).length})</summary>
                  <div className="headers-list">
                    {Object.entries(responseHeaders).map(([key, value]) => (
                      <div key={key} className="response-header-item">
                        <span className="rh-key">{key}:</span>
                        <span className="rh-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Response Body */}
              {response ? (
                <pre className="response-body">{response}</pre>
              ) : !error && !isLoading ? (
                <div className="response-empty">
                  <span className="empty-icon">📡</span>
                  <p>Send a request to see the response</p>
                </div>
              ) : isLoading ? (
                <div className="response-loading">
                  <div className="loading-spinner" />
                  <p>Sending request...</p>
                </div>
              ) : null}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="history-viewer">
              {history.length > 0 ? (
                <>
                  <div className="history-header">
                    <span>{history.length} requests</span>
                    <button className="clear-history-btn" onClick={clearHistory}>
                      Clear All
                    </button>
                  </div>
                  <div className="history-list">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="history-item"
                        onClick={() => loadFromHistory(item)}
                      >
                        <span
                          className="history-method"
                          style={{ color: METHOD_COLORS[item.method] }}
                        >
                          {item.method}
                        </span>
                        <span className="history-url">{item.url}</span>
                        <span
                          className="history-status"
                          style={{ backgroundColor: getStatusColor(item.status) }}
                        >
                          {item.status}
                        </span>
                        <span className="history-time">{item.time}ms</span>
                        <span className="history-ago">{formatTimeAgo(item.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="history-empty">
                  <span className="empty-icon">📜</span>
                  <p>No request history yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApiPlayground;
