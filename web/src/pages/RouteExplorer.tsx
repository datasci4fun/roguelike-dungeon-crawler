/**
 * Route Explorer - View all application routes
 *
 * Features:
 * - List all backend API routes
 * - List all frontend routes
 * - Filter by method, tag, search
 * - Route details and parameters
 */

import { useState, useEffect, useCallback } from 'react';
import './RouteExplorer.css';

const API_BASE = 'http://localhost:8000/api/routes';

interface ApiRoute {
  path: string;
  method: string;
  name?: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: Array<{ name: string; in: string; type: string }>;
  deprecated: boolean;
}

interface FrontendRoute {
  path: string;
  name: string;
  description?: string;
  auth_required?: boolean;
  dev_tool?: boolean;
}

interface RouteStats {
  total_routes: number;
  by_method: Record<string, number>;
  by_tag: Record<string, number>;
  deprecated_count: number;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#d29922',
  PATCH: '#a855f7',
  DELETE: '#f85149',
};

export function RouteExplorer() {
  const [apiRoutes, setApiRoutes] = useState<ApiRoute[]>([]);
  const [frontendRoutes, setFrontendRoutes] = useState<FrontendRoute[]>([]);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [view, setView] = useState<'api' | 'frontend' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  // Fetch API routes
  const fetchApiRoutes = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setApiRoutes(data.routes);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch frontend routes
  const fetchFrontendRoutes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/frontend`);
      if (res.ok) {
        const data = await res.json();
        setFrontendRoutes(data.routes);
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

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tags`);
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags);
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
        fetchApiRoutes(),
        fetchFrontendRoutes(),
        fetchStats(),
        fetchTags(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchApiRoutes, fetchFrontendRoutes, fetchStats, fetchTags]);

  // Filter API routes
  const filteredApiRoutes = apiRoutes.filter((route) => {
    if (filterMethod && route.method !== filterMethod) return false;
    if (filterTag && !route.tags.includes(filterTag)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !route.path.toLowerCase().includes(query) &&
        !route.name?.toLowerCase().includes(query) &&
        !route.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  // Filter frontend routes
  const filteredFrontendRoutes = frontendRoutes.filter((route) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !route.path.toLowerCase().includes(query) &&
        !route.name.toLowerCase().includes(query) &&
        !route.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  // Group API routes by tag
  const groupedApiRoutes = filteredApiRoutes.reduce((acc, route) => {
    const tag = route.tags[0] || 'untagged';
    if (!acc[tag]) {
      acc[tag] = [];
    }
    acc[tag].push(route);
    return acc;
  }, {} as Record<string, ApiRoute[]>);

  // Group frontend routes
  const devToolRoutes = filteredFrontendRoutes.filter((r) => r.dev_tool);
  const pageRoutes = filteredFrontendRoutes.filter((r) => !r.dev_tool);

  if (loading) {
    return (
      <div className="route-explorer">
        <div className="routes-loading">
          <div className="loading-spinner" />
          <p>Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-explorer">
      {/* Header */}
      <header className="routes-header">
        <div className="header-left">
          <h1>Route Explorer</h1>
          <span className="header-badge">
            {apiRoutes.length + frontendRoutes.length} routes
          </span>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card api">
            <div className="stat-value">{stats.total_routes}</div>
            <div className="stat-label">API Routes</div>
          </div>
          <div className="stat-card frontend">
            <div className="stat-value">{frontendRoutes.length}</div>
            <div className="stat-label">Frontend</div>
          </div>
          <div className="stat-card methods">
            <div className="method-badges">
              {Object.entries(stats.by_method).map(([method, count]) => (
                <span
                  key={method}
                  className="method-badge"
                  style={{ background: METHOD_COLORS[method] + '22', color: METHOD_COLORS[method] }}
                >
                  {method} {count}
                </span>
              ))}
            </div>
            <div className="stat-label">By Method</div>
          </div>
          <div className="stat-card tags">
            <div className="stat-value">{tags.length}</div>
            <div className="stat-label">Tags</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-row">
        <div className="view-toggle">
          <button
            className={view === 'all' ? 'active' : ''}
            onClick={() => setView('all')}
          >
            All
          </button>
          <button
            className={view === 'api' ? 'active' : ''}
            onClick={() => setView('api')}
          >
            API
          </button>
          <button
            className={view === 'frontend' ? 'active' : ''}
            onClick={() => setView('frontend')}
          >
            Frontend
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {(view === 'all' || view === 'api') && (
            <>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="filter-select"
              >
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="filter-select"
              >
                <option value="">All Tags</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Routes Content */}
      <div className="routes-content">
        {/* API Routes */}
        {(view === 'all' || view === 'api') && (
          <div className="routes-section">
            <div className="section-header">
              <span className="section-icon">🔌</span>
              <h2>API Routes</h2>
              <span className="section-count">{filteredApiRoutes.length}</span>
            </div>

            {Object.keys(groupedApiRoutes).length === 0 ? (
              <div className="no-routes">
                <p>No API routes found</p>
              </div>
            ) : (
              Object.entries(groupedApiRoutes).map(([tag, routes]) => (
                <div key={tag} className="tag-group">
                  <div className="tag-header">
                    <span className="tag-name">{tag}</span>
                    <span className="tag-count">{routes.length}</span>
                  </div>
                  <div className="routes-list">
                    {routes.map((route, idx) => {
                      const routeKey = `${route.method}-${route.path}-${idx}`;
                      return (
                        <div
                          key={routeKey}
                          className={`route-item ${expandedRoute === routeKey ? 'expanded' : ''}`}
                        >
                          <div
                            className="route-header"
                            onClick={() => setExpandedRoute(
                              expandedRoute === routeKey ? null : routeKey
                            )}
                          >
                            <span
                              className="route-method"
                              style={{
                                background: METHOD_COLORS[route.method] + '22',
                                color: METHOD_COLORS[route.method],
                              }}
                            >
                              {route.method}
                            </span>
                            <code className="route-path">{route.path}</code>
                            {route.name && (
                              <span className="route-name">{route.name}</span>
                            )}
                            {route.deprecated && (
                              <span className="deprecated-badge">deprecated</span>
                            )}
                            <span className="expand-icon">
                              {expandedRoute === routeKey ? '▼' : '▶'}
                            </span>
                          </div>

                          {expandedRoute === routeKey && (
                            <div className="route-details">
                              {route.description && (
                                <div className="detail-item">
                                  <span className="detail-label">Description</span>
                                  <span className="detail-value">{route.description}</span>
                                </div>
                              )}
                              {route.parameters.length > 0 && (
                                <div className="detail-item">
                                  <span className="detail-label">Parameters</span>
                                  <div className="params-list">
                                    {route.parameters.map((param, i) => (
                                      <span key={i} className="param-badge">
                                        {param.name}: {param.type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="detail-item">
                                <span className="detail-label">Tags</span>
                                <div className="tags-list">
                                  {route.tags.map((t) => (
                                    <span key={t} className="tag-badge">{t}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Frontend Routes */}
        {(view === 'all' || view === 'frontend') && (
          <div className="routes-section">
            <div className="section-header">
              <span className="section-icon">⚛️</span>
              <h2>Frontend Routes</h2>
              <span className="section-count">{filteredFrontendRoutes.length}</span>
            </div>

            {/* Page Routes */}
            {pageRoutes.length > 0 && (
              <div className="tag-group">
                <div className="tag-header">
                  <span className="tag-name">Pages</span>
                  <span className="tag-count">{pageRoutes.length}</span>
                </div>
                <div className="frontend-routes-grid">
                  {pageRoutes.map((route) => (
                    <div key={route.path} className="frontend-route-card">
                      <div className="frontend-route-header">
                        <code className="frontend-path">{route.path}</code>
                        {route.auth_required && (
                          <span className="auth-badge">auth</span>
                        )}
                      </div>
                      <div className="frontend-route-name">{route.name}</div>
                      {route.description && (
                        <div className="frontend-route-desc">{route.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dev Tool Routes */}
            {devToolRoutes.length > 0 && (
              <div className="tag-group">
                <div className="tag-header">
                  <span className="tag-name">Dev Tools</span>
                  <span className="tag-count">{devToolRoutes.length}</span>
                </div>
                <div className="frontend-routes-grid">
                  {devToolRoutes.map((route) => (
                    <div key={route.path} className="frontend-route-card dev-tool">
                      <div className="frontend-route-header">
                        <code className="frontend-path">{route.path}</code>
                        <span className="dev-badge">dev</span>
                      </div>
                      <div className="frontend-route-name">{route.name}</div>
                      {route.description && (
                        <div className="frontend-route-desc">{route.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteExplorer;
