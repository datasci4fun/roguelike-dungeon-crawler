/**
 * Build Info - Development build and environment information
 *
 * Features:
 * - Git commit info (hash, branch, author, message)
 * - Python environment details
 * - Installed packages with versions
 * - Environment configuration
 * - Copy-to-clipboard functionality
 */

import { useState, useEffect } from 'react';
import './BuildInfo.css';

const API_BASE = 'http://localhost:8000/api/build';

interface GitInfo {
  commit_hash: string | null;
  commit_short: string | null;
  branch: string | null;
  author: string | null;
  author_email: string | null;
  commit_date: string | null;
  commit_message: string | null;
  is_dirty: boolean;
  tags: string[];
}

interface PythonInfo {
  version: string;
  implementation: string;
  executable: string;
  packages: Array<{ name: string; version: string }>;
}

interface EnvironmentInfo {
  platform: string;
  platform_release: string;
  architecture: string;
  hostname: string;
  working_directory: string;
  debug_mode: boolean;
  environment: string;
}

interface BuildInfoResponse {
  app_name: string;
  app_version: string;
  build_timestamp: string;
  git: GitInfo;
  python: PythonInfo;
  environment: EnvironmentInfo;
}

export function BuildInfo() {
  const [info, setInfo] = useState<BuildInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageFilter, setPackageFilter] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchBuildInfo();
  }, []);

  const fetchBuildInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch build info');
      }
      const data = await res.json();
      setInfo(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch build info');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const filteredPackages = info?.python.packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(packageFilter.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="build-info">
        <div className="build-loading">
          <div className="loading-spinner" />
          <p>Loading build information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="build-info">
        <div className="build-error">
          <span className="error-icon">⚠</span>
          <p>{error}</p>
          <button onClick={fetchBuildInfo} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="build-info">
      {/* Header */}
      <header className="build-header">
        <div className="header-left">
          <h1>Build Info</h1>
          <span className="header-badge">DEV</span>
        </div>
        <div className="header-right">
          <div className="app-badge">
            <span className="app-name">{info.app_name}</span>
            <span className="app-version">v{info.app_version}</span>
          </div>
        </div>
      </header>

      <div className="build-body">
        {/* Git Section */}
        <section className="info-section git-section">
          <h2 className="section-title">
            <span className="section-icon">⎇</span>
            Git Information
            {info.git.is_dirty && <span className="dirty-badge">DIRTY</span>}
          </h2>

          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Branch</span>
              <span className="info-value branch-value">
                {info.git.branch || 'unknown'}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Commit</span>
              <div className="info-value-group">
                <code
                  className="commit-hash"
                  onClick={() => info.git.commit_hash && copyToClipboard(info.git.commit_hash, 'commit')}
                  title="Click to copy full hash"
                >
                  {info.git.commit_short || 'unknown'}
                </code>
                {copiedField === 'commit' && <span className="copied-badge">Copied!</span>}
              </div>
            </div>

            <div className="info-row full-width">
              <span className="info-label">Message</span>
              <span className="info-value commit-message">
                {info.git.commit_message || 'No message'}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Author</span>
              <span className="info-value">
                {info.git.author || 'unknown'}
                {info.git.author_email && (
                  <span className="author-email"> &lt;{info.git.author_email}&gt;</span>
                )}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Date</span>
              <span className="info-value">
                {info.git.commit_date ? formatDate(info.git.commit_date) : 'unknown'}
              </span>
            </div>

            {info.git.tags.length > 0 && (
              <div className="info-row">
                <span className="info-label">Tags</span>
                <div className="tags-list">
                  {info.git.tags.map((tag) => (
                    <span key={tag} className="tag-badge">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Environment Section */}
        <section className="info-section env-section">
          <h2 className="section-title">
            <span className="section-icon">⚙</span>
            Environment
            <span className={`env-badge env-${info.environment.environment}`}>
              {info.environment.environment}
            </span>
          </h2>

          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Platform</span>
              <span className="info-value">
                {info.environment.platform} {info.environment.platform_release}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Architecture</span>
              <span className="info-value">{info.environment.architecture}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Hostname</span>
              <span className="info-value mono">{info.environment.hostname}</span>
            </div>

            <div className="info-row full-width">
              <span className="info-label">Working Dir</span>
              <span className="info-value mono path-value">
                {info.environment.working_directory}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Debug Mode</span>
              <span className={`info-value bool-${info.environment.debug_mode}`}>
                {info.environment.debug_mode ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </section>

        {/* Python Section */}
        <section className="info-section python-section">
          <h2 className="section-title">
            <span className="section-icon">🐍</span>
            Python Environment
          </h2>

          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Version</span>
              <span className="info-value python-version">
                {info.python.implementation} {info.python.version}
              </span>
            </div>

            <div className="info-row full-width">
              <span className="info-label">Executable</span>
              <span className="info-value mono path-value">
                {info.python.executable}
              </span>
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="info-section packages-section">
          <h2 className="section-title">
            <span className="section-icon">📦</span>
            Installed Packages
            <span className="package-count">{info.python.packages.length}</span>
          </h2>

          <div className="packages-toolbar">
            <input
              type="text"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              placeholder="Filter packages..."
              className="package-filter"
            />
            <span className="filter-count">
              {filteredPackages.length} / {info.python.packages.length}
            </span>
          </div>

          <div className="packages-list">
            {filteredPackages.map((pkg) => (
              <div key={pkg.name} className="package-item">
                <span className="package-name">{pkg.name}</span>
                <span className="package-version">{pkg.version}</span>
              </div>
            ))}
            {filteredPackages.length === 0 && (
              <div className="packages-empty">No packages match filter</div>
            )}
          </div>
        </section>

        {/* Build Timestamp */}
        <div className="build-timestamp">
          <span className="timestamp-label">Info retrieved at:</span>
          <span className="timestamp-value">{formatDate(info.build_timestamp)}</span>
          <button onClick={fetchBuildInfo} className="refresh-btn">↻ Refresh</button>
        </div>
      </div>
    </div>
  );
}

export default BuildInfo;
