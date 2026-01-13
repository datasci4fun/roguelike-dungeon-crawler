/**
 * Legend - File size, status, and effort legend
 */
import {
  SIZE_CONFIG,
  REFACTOR_STATUS_CONFIG,
  EFFORT_CONFIG,
  type SizeCategory,
  type RefactorStatus,
} from '../../data/codebaseHealthData';

export function Legend() {
  return (
    <section className="health-legend">
      <h3 className="legend-title">Legend</h3>
      <div className="legend-content">
        <div className="legend-group">
          <h4>File Size</h4>
          <div className="legend-items">
            {(Object.keys(SIZE_CONFIG) as SizeCategory[]).map(s => (
              <div key={s} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: SIZE_CONFIG[s].color }} />
                <span className="legend-label">
                  {SIZE_CONFIG[s].label} ({SIZE_CONFIG[s].minLoc}-{SIZE_CONFIG[s].maxLoc === Infinity ? '∞' : SIZE_CONFIG[s].maxLoc})
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="legend-group">
          <h4>Status</h4>
          <div className="legend-items">
            {(Object.keys(REFACTOR_STATUS_CONFIG) as RefactorStatus[]).map(s => (
              <div key={s} className="legend-item">
                <span className="legend-icon" style={{ color: REFACTOR_STATUS_CONFIG[s].color }}>
                  {REFACTOR_STATUS_CONFIG[s].icon}
                </span>
                <span className="legend-label">{REFACTOR_STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="legend-group">
          <h4>Effort</h4>
          <div className="legend-items">
            {(Object.keys(EFFORT_CONFIG) as (keyof typeof EFFORT_CONFIG)[]).map(e => (
              <div key={e} className="legend-item">
                <span className="legend-dots">
                  {Array.from({ length: EFFORT_CONFIG[e].dots }).map((_, i) => (
                    <span key={i} className="effort-dot filled" />
                  ))}
                </span>
                <span className="legend-label">{EFFORT_CONFIG[e].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
