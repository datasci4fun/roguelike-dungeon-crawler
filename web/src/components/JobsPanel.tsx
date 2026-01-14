/**
 * JobsPanel - Floating panel showing active 3D generation jobs
 *
 * Displays in bottom-right corner, shows progress and logs.
 */

import { useState } from 'react';
import { useJobs } from '../contexts/JobsContext';
import type { Job } from '../contexts/JobsContext';

const STATUS_COLORS = {
  pending: '#f59f00',
  processing: '#4dabf7',
  completed: '#37b24d',
  failed: '#f03e3e',
};

function getTimeAgo(isoDate: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

function JobCard({ job, expanded, onToggle }: { job: Job; expanded: boolean; onToggle: () => void }) {
  const statusColor = STATUS_COLORS[job.status];
  const timeAgo = getTimeAgo(job.updated_at);

  // Check if job seems stuck (pending for more than 10 seconds)
  const updatedAt = new Date(job.updated_at);
  const staleMs = Date.now() - updatedAt.getTime();
  const isStale = job.status === 'pending' && staleMs > 10000;

  return (
    <div
      style={{
        background: '#232340',
        borderRadius: '8px',
        border: `1px solid ${isStale ? '#f59f00' : statusColor}44`,
        overflow: 'hidden',
        marginBottom: '8px',
      }}
    >
      {/* Header - always visible */}
      <div
        onClick={onToggle}
        style={{
          padding: '10px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Status indicator */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isStale ? '#f59f00' : statusColor,
            animation: job.status === 'processing' ? 'pulse 1.5s infinite' :
                       isStale ? 'pulse 2s infinite' : 'none',
          }}
        />

        {/* Asset name */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
            {job.asset_id}
          </div>
          <div style={{ color: '#888', fontSize: '11px' }}>
            {job.status === 'pending' && isStale
              ? 'Waiting for worker...'
              : job.progress || job.status}
            <span style={{ color: '#555', marginLeft: '6px' }}>
              ({timeAgo})
            </span>
          </div>
        </div>

        {/* Progress percentage */}
        {job.progress_pct !== undefined && job.progress_pct !== null && (
          <div style={{
            color: statusColor,
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '40px',
            textAlign: 'right',
          }}>
            {job.progress_pct}%
          </div>
        )}

        {/* Expand/collapse arrow */}
        <div style={{ color: '#666', fontSize: '12px' }}>
          {expanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Progress bar */}
      {job.status === 'processing' && job.progress_pct !== undefined && (
        <div style={{
          height: '3px',
          background: '#1a1a2e',
        }}>
          <div style={{
            width: `${job.progress_pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)`,
            transition: 'width 0.3s',
          }} />
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{
          padding: '0 12px 10px',
          borderTop: '1px solid #333',
          marginTop: '0',
        }}>
          {/* Worker hint for stuck jobs */}
          {isStale && (
            <div style={{
              padding: '8px',
              background: '#f59f0022',
              borderRadius: '4px',
              color: '#f59f00',
              fontSize: '11px',
              marginTop: '10px',
            }}>
              <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                Worker may not be running. Check:
              </div>
              <code style={{
                display: 'block',
                background: '#1a1a2e',
                padding: '6px 8px',
                borderRadius: '3px',
                fontSize: '10px',
                color: '#69db7c',
                wordBreak: 'break-all',
              }}>
                docker-compose logs 3d-worker
              </code>
            </div>
          )}

          {/* Error message */}
          {job.error && (
            <div style={{
              padding: '8px',
              background: '#f03e3e22',
              borderRadius: '4px',
              color: '#f03e3e',
              fontSize: '11px',
              marginTop: '10px',
            }}>
              {job.error}
            </div>
          )}

          {/* Result path */}
          {job.result_path && (
            <div style={{
              padding: '8px',
              background: '#37b24d22',
              borderRadius: '4px',
              color: '#37b24d',
              fontSize: '11px',
              marginTop: '10px',
              wordBreak: 'break-all',
            }}>
              Output: {job.result_path}
            </div>
          )}

          {/* Logs */}
          {job.logs && job.logs.length > 0 && (
            <div style={{
              marginTop: '10px',
              maxHeight: '120px',
              overflow: 'auto',
              background: '#1a1a2e',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#888',
            }}>
              {job.logs.slice(-10).map((line, i) => (
                <div key={i} style={{ marginBottom: '2px' }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function JobsPanel() {
  const { jobs, activeJobs, clearCompletedJobs } = useJobs();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Show recent jobs (active + last 3 completed/failed)
  const recentJobs = [
    ...activeJobs,
    ...jobs
      .filter(j => j.status === 'completed' || j.status === 'failed')
      .slice(0, 3),
  ];

  // Don't show panel if no jobs
  if (recentJobs.length === 0) {
    return null;
  }

  return (
    <>
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: isCollapsed ? 'auto' : '320px',
          maxHeight: '400px',
          background: '#1a1a2e',
          borderRadius: '12px',
          border: '1px solid #333',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 15px',
            background: '#232340',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>&#9881;</span>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
              Generation Jobs
            </span>
            {activeJobs.length > 0 && (
              <span style={{
                background: '#4dabf7',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
              }}>
                {activeJobs.length} active
              </span>
            )}
          </div>
          <span style={{ color: '#666', fontSize: '12px' }}>
            {isCollapsed ? '▲' : '▼'}
          </span>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div style={{
            padding: '10px',
            maxHeight: '320px',
            overflow: 'auto',
          }}>
            {recentJobs.map(job => (
              <JobCard
                key={job.job_id}
                job={job}
                expanded={expandedJobId === job.job_id}
                onToggle={() => setExpandedJobId(
                  expandedJobId === job.job_id ? null : job.job_id
                )}
              />
            ))}

            {/* Worker info - runs automatically via Docker */}
            {activeJobs.length > 0 && (
              <div style={{
                marginTop: '10px',
                padding: '8px 10px',
                background: '#232340',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4dabf7',
                  animation: 'pulse 1.5s infinite',
                }} />
                Worker processing automatically
              </div>
            )}

            {/* Clear button */}
            {jobs.some(j => j.status === 'completed' || j.status === 'failed') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearCompletedJobs();
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#888',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '5px',
                }}
              >
                Clear completed
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
