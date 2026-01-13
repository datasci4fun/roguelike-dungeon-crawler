/**
 * StatsTab - Dashboard with summary metrics, area distribution, and top lists
 */
import React from 'react';
import {
  AREA_CONFIG,
  REFACTOR_PRIORITY_CONFIG,
  getTotalStats,
  getAreaStats,
  getLargestFiles,
  getDeepestFiles,
  getRefactorStats,
  type Area,
  type RefactorPriority,
} from '../../data/codebaseHealthData';

export function StatsTab() {
  const totalStats = getTotalStats();
  const areaStats = getAreaStats();
  const largestFiles = getLargestFiles(10);
  const deepestFiles = getDeepestFiles(10);
  const refactorStats = getRefactorStats();

  return (
    <section className="tab-content stats-tab">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-value">{totalStats.fileCount}</span>
          <span className="card-label">Files</span>
        </div>
        <div className="summary-card">
          <span className="card-value">{totalStats.totalLoc.toLocaleString()}</span>
          <span className="card-label">Lines of Code</span>
        </div>
        <div className="summary-card">
          <span className="card-value">{totalStats.avgLoc}</span>
          <span className="card-label">Avg LOC/File</span>
        </div>
        <div className="summary-card">
          <span className="card-value">{refactorStats.total}</span>
          <span className="card-label">Refactor Items</span>
        </div>
      </div>

      {/* Area Distribution */}
      <div className="distribution-section">
        <h3>Files by Area</h3>
        <div className="distribution-grid">
          {(Object.keys(AREA_CONFIG) as Area[]).map(area => {
            const stats = areaStats[area];
            if (!stats || stats.count === 0) return null;
            return (
              <div
                key={area}
                className="distribution-item"
                style={{ '--item-color': AREA_CONFIG[area].color } as React.CSSProperties}
              >
                <div className="dist-header">
                  <span className="dist-label">{AREA_CONFIG[area].label}</span>
                  <span className="dist-count">{stats.count}</span>
                </div>
                <div className="dist-bar">
                  <div
                    className="dist-fill"
                    style={{ width: `${(stats.count / totalStats.fileCount) * 100}%` }}
                  />
                </div>
                <span className="dist-loc">{stats.totalLoc.toLocaleString()} LOC</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Lists */}
      <div className="top-lists">
        <div className="top-list">
          <h3>Largest Files</h3>
          <table className="mini-table">
            <thead>
              <tr>
                <th>File</th>
                <th>LOC</th>
              </tr>
            </thead>
            <tbody>
              {largestFiles.map(f => (
                <tr key={f.path}>
                  <td className="file-path" title={f.path}>
                    {f.path.split('/').pop()}
                  </td>
                  <td className={`loc-cell size-${f.sizeCategory}`}>{f.loc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="top-list">
          <h3>Deepest Nesting</h3>
          <table className="mini-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Depth</th>
              </tr>
            </thead>
            <tbody>
              {deepestFiles.map(f => (
                <tr key={f.path}>
                  <td className="file-path" title={f.path}>
                    {f.path.split('/').pop()}
                  </td>
                  <td>{f.nestingDepth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="top-list">
          <h3>Refactor by Priority</h3>
          <div className="priority-breakdown">
            {(Object.keys(REFACTOR_PRIORITY_CONFIG) as RefactorPriority[]).map(p => (
              <div key={p} className="priority-row">
                <span
                  className="priority-dot"
                  style={{ backgroundColor: REFACTOR_PRIORITY_CONFIG[p].color }}
                />
                <span className="priority-label">{REFACTOR_PRIORITY_CONFIG[p].label}</span>
                <span className="priority-count">{refactorStats.byPriority[p]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
