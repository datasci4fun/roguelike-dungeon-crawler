/**
 * Dependency Viewer - View project dependencies
 *
 * Features:
 * - Python dependencies from requirements.txt
 * - Frontend dependencies from package.json
 * - Categorized view
 * - Search functionality
 * - Version information
 */

import { useState, useEffect, useCallback } from 'react';
import './DependencyViewer.css';

const API_BASE = 'http://localhost:8000/api/dependencies';

interface Dependency {
  name: string;
  version: string;
  required_version?: string;
  category: string;
  description?: string;
  homepage?: string;
  is_dev: boolean;
}

interface DependencyStats {
  python_total: number;
  python_categories: Record<string, number>;
  frontend_total: number;
  frontend_prod: number;
  frontend_dev: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  'FastAPI and server': '🚀',
  'Database': '🗄️',
  'Redis': '⚡',
  'Authentication': '🔐',
  'Validation': '✅',
  'WebSockets': '🔌',
  'System monitoring': '📊',
  'Development': '🛠️',
  'Production': '📦',
  'General': '📁',
};

export function DependencyViewer() {
  const [pythonDeps, setPythonDeps] = useState<Dependency[]>([]);
  const [frontendDeps, setFrontendDeps] = useState<Dependency[]>([]);
  const [stats, setStats] = useState<DependencyStats | null>(null);
  const [loading, setLoading] = useState(true);

  // View state
  const [view, setView] = useState<'python' | 'frontend' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDevOnly, setShowDevOnly] = useState(false);

  // Fetch all dependencies
  const fetchDependencies = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setPythonDeps(data.python);
        setFrontendDeps(data.frontend);
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

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDependencies(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchDependencies, fetchStats]);

  // Filter dependencies
  const filterDeps = (deps: Dependency[]) => {
    let filtered = deps;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query)
      );
    }

    if (showDevOnly) {
      filtered = filtered.filter((d) => d.is_dev);
    }

    return filtered;
  };

  // Group by category
  const groupByCategory = (deps: Dependency[]) => {
    return deps.reduce((acc, dep) => {
      if (!acc[dep.category]) {
        acc[dep.category] = [];
      }
      acc[dep.category].push(dep);
      return acc;
    }, {} as Record<string, Dependency[]>);
  };

  const filteredPython = filterDeps(pythonDeps);
  const filteredFrontend = filterDeps(frontendDeps);

  const pythonByCategory = groupByCategory(filteredPython);
  const frontendByCategory = groupByCategory(filteredFrontend);

  if (loading) {
    return (
      <div className="dependency-viewer">
        <div className="deps-loading">
          <div className="loading-spinner" />
          <p>Loading dependencies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dependency-viewer">
      {/* Header */}
      <header className="deps-header">
        <div className="header-left">
          <h1>Dependencies</h1>
          <span className="header-badge">
            {(stats?.python_total || 0) + (stats?.frontend_total || 0)} total
          </span>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card python">
            <div className="stat-icon">🐍</div>
            <div className="stat-value">{stats.python_total}</div>
            <div className="stat-label">Python</div>
          </div>
          <div className="stat-card frontend">
            <div className="stat-icon">⚛️</div>
            <div className="stat-value">{stats.frontend_total}</div>
            <div className="stat-label">Frontend</div>
          </div>
          <div className="stat-card prod">
            <div className="stat-value">{stats.frontend_prod}</div>
            <div className="stat-label">Production</div>
          </div>
          <div className="stat-card dev">
            <div className="stat-value">{stats.frontend_dev}</div>
            <div className="stat-label">Dev Only</div>
          </div>
          <div className="stat-card categories">
            <div className="stat-value">
              {Object.keys(stats.python_categories).length + 2}
            </div>
            <div className="stat-label">Categories</div>
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
            className={view === 'python' ? 'active' : ''}
            onClick={() => setView('python')}
          >
            Python
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
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <label className="dev-toggle">
            <input
              type="checkbox"
              checked={showDevOnly}
              onChange={(e) => setShowDevOnly(e.target.checked)}
            />
            Dev only
          </label>
        </div>
      </div>

      {/* Dependencies List */}
      <div className="deps-content">
        {/* Python Dependencies */}
        {(view === 'all' || view === 'python') && (
          <div className="deps-section">
            <div className="section-header">
              <span className="section-icon">🐍</span>
              <h2>Python Dependencies</h2>
              <span className="section-count">{filteredPython.length}</span>
            </div>

            {Object.keys(pythonByCategory).length === 0 ? (
              <div className="no-deps">
                <p>No Python dependencies found</p>
              </div>
            ) : (
              Object.entries(pythonByCategory).map(([category, deps]) => (
                <div key={category} className="category-group">
                  <div className="category-title">
                    <span className="category-icon">
                      {CATEGORY_ICONS[category] || '📁'}
                    </span>
                    <span>{category}</span>
                    <span className="category-count">{deps.length}</span>
                  </div>
                  <div className="deps-grid">
                    {deps.map((dep) => (
                      <div key={dep.name} className={`dep-card ${dep.is_dev ? 'dev' : ''}`}>
                        <div className="dep-header">
                          <span className="dep-name">{dep.name}</span>
                          <span className="dep-version">{dep.version}</span>
                        </div>
                        {dep.description && (
                          <div className="dep-description">{dep.description}</div>
                        )}
                        <div className="dep-footer">
                          {dep.is_dev && <span className="dev-badge">dev</span>}
                          {dep.homepage && (
                            <a
                              href={dep.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dep-link"
                            >
                              Docs
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Frontend Dependencies */}
        {(view === 'all' || view === 'frontend') && (
          <div className="deps-section">
            <div className="section-header">
              <span className="section-icon">⚛️</span>
              <h2>Frontend Dependencies</h2>
              <span className="section-count">{filteredFrontend.length}</span>
            </div>

            {Object.keys(frontendByCategory).length === 0 ? (
              <div className="no-deps">
                <p>No frontend dependencies found</p>
              </div>
            ) : (
              Object.entries(frontendByCategory).map(([category, deps]) => (
                <div key={category} className="category-group">
                  <div className="category-title">
                    <span className="category-icon">
                      {CATEGORY_ICONS[category] || '📁'}
                    </span>
                    <span>{category}</span>
                    <span className="category-count">{deps.length}</span>
                  </div>
                  <div className="deps-grid">
                    {deps.map((dep) => (
                      <div key={dep.name} className={`dep-card ${dep.is_dev ? 'dev' : ''}`}>
                        <div className="dep-header">
                          <span className="dep-name">{dep.name}</span>
                          <span className="dep-version">{dep.version}</span>
                        </div>
                        {dep.description && (
                          <div className="dep-description">{dep.description}</div>
                        )}
                        <div className="dep-footer">
                          {dep.is_dev && <span className="dev-badge">dev</span>}
                          {dep.homepage && (
                            <a
                              href={dep.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dep-link"
                            >
                              Docs
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DependencyViewer;
