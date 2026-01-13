/**
 * Changelog Page - Version history and patch notes
 *
 * Features:
 * - Chronological version list
 * - Expandable version cards with section details
 * - Search/filter by version or content
 * - Section type icons and colors
 */

import { useState, useMemo } from 'react';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import {
  CHANGELOG_ENTRIES,
  SECTION_CONFIG,
  GENERATED_AT,
  getLatestVersion,
  getVersionCount,
  getDateRange,
  type VersionEntry,
  type SectionType,
} from '../data/changelogData';
import './Changelog.css';

export function Changelog() {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => {
    // Start with latest version expanded
    const latest = getLatestVersion();
    return latest ? new Set([latest.version]) : new Set();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showMajorOnly, setShowMajorOnly] = useState(false);

  // Stats
  const versionCount = getVersionCount();
  const dateRange = getDateRange();

  // Filter entries
  const filteredEntries = useMemo(() => {
    let entries = [...CHANGELOG_ENTRIES];

    // Major versions only filter
    if (showMajorOnly) {
      entries = entries.filter(e => {
        const parts = e.version.split('.');
        // x.0.0 or x.0 are major
        return (parts[1] === '0' && (parts[2] === '0' || parts[2] === undefined)) ||
               (parts[1] === '0' && parts.length === 2);
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e => {
        // Match version
        if (e.version.includes(query)) return true;
        // Match title
        if (e.title.toLowerCase().includes(query)) return true;
        // Match content
        for (const section of e.sections) {
          for (const item of section.items) {
            if (item.text.toLowerCase().includes(query)) return true;
            for (const detail of item.details) {
              if (detail.toLowerCase().includes(query)) return true;
            }
          }
        }
        return false;
      });
    }

    return entries;
  }, [searchQuery, showMajorOnly]);

  // Toggle version expansion
  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  // Expand/collapse all
  const expandAll = () => {
    setExpandedVersions(new Set(filteredEntries.map(e => e.version)));
  };

  const collapseAll = () => {
    setExpandedVersions(new Set());
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render markdown-ish text (bold markers)
  const renderText = (text: string) => {
    // Convert **text** to <strong>text</strong>
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 10, speed: 'slow', opacity: 0.1 }}
      crt={false}
    >
      <div className="changelog-page">
        {/* Header */}
        <section className="changelog-hero">
          <PhosphorHeader
            title="PATCH NOTES"
            subtitle="Version history and updates"
            style="dramatic"
            delay={100}
          />
          <div className="changelog-stats">
            <span className="stat">
              <span className="stat-value">{versionCount}</span> versions
            </span>
            <span className="stat-sep">|</span>
            <span className="stat">
              {formatDate(dateRange.earliest)} - {formatDate(dateRange.latest)}
            </span>
          </div>
        </section>

        {/* Controls */}
        <div className="changelog-controls">
          <input
            type="text"
            placeholder="Search versions, features..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <div className="control-buttons">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showMajorOnly}
                onChange={e => setShowMajorOnly(e.target.checked)}
              />
              Major versions only
            </label>

            <button onClick={expandAll} className="control-btn">
              Expand All
            </button>
            <button onClick={collapseAll} className="control-btn">
              Collapse All
            </button>
          </div>
        </div>

        <div className="results-count">
          Showing {filteredEntries.length} of {versionCount} versions
        </div>

        {/* Version List */}
        <div className="version-list">
          {filteredEntries.map((entry) => (
            <VersionCard
              key={entry.version}
              entry={entry}
              isExpanded={expandedVersions.has(entry.version)}
              onToggle={() => toggleVersion(entry.version)}
              formatDate={formatDate}
              renderText={renderText}
            />
          ))}

          {filteredEntries.length === 0 && (
            <div className="no-results">
              No versions match your search.
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="changelog-footer">
          <p>
            Generated from <code>docs/CHANGELOG.md</code>
            <span className="generated-time">
              {new Date(GENERATED_AT).toLocaleDateString()}
            </span>
          </p>
        </footer>
      </div>
    </AtmosphericPage>
  );
}

// Version Card Component
function VersionCard({
  entry,
  isExpanded,
  onToggle,
  formatDate,
  renderText,
}: {
  entry: VersionEntry;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (d: string) => string;
  renderText: (t: string) => React.ReactNode;
}) {
  // Determine if this is a major version
  const isMajor = entry.version.endsWith('.0.0') ||
                  (entry.version.split('.').length === 2 && entry.version.endsWith('.0'));

  return (
    <article className={`version-card ${isExpanded ? 'expanded' : ''} ${isMajor ? 'major' : ''}`}>
      <header className="version-header" onClick={onToggle}>
        <div className="version-info">
          <h2 className="version-number">
            <span className="v-prefix">v</span>
            {entry.version}
          </h2>
          {entry.title && (
            <span className="version-title">{entry.title}</span>
          )}
        </div>
        <div className="version-meta">
          <time className="version-date">{formatDate(entry.date)}</time>
          <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
        </div>
      </header>

      {isExpanded && (
        <div className="version-content">
          {entry.sections.map((section, idx) => {
            const config = SECTION_CONFIG[section.type as SectionType] || {
              label: section.type,
              icon: '?',
              color: '#888',
            };

            return (
              <section key={idx} className={`change-section section-${section.type}`}>
                <h3 className="section-title" style={{ color: config.color }}>
                  <span className="section-icon">{config.icon}</span>
                  {config.label}
                </h3>
                <ul className="change-list">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="change-item">
                      <span className="item-text">{renderText(item.text)}</span>
                      {item.details.length > 0 && (
                        <ul className="item-details">
                          {item.details.map((detail, detailIdx) => (
                            <li key={detailIdx}>{renderText(detail)}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default Changelog;
