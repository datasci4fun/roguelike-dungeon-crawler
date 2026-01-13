/**
 * Session Inspector - View and manage user sessions
 *
 * Features:
 * - View all active sessions
 * - Session details (IP, device, browser, OS)
 * - Session activity log
 * - Revoke individual sessions
 * - Session statistics
 */

import { useState, useEffect, useCallback } from 'react';
import './SessionInspector.css';

const API_BASE = 'http://localhost:8000/api/sessions';

interface SessionInfo {
  session_id: string;
  user_id: number;
  username: string;
  display_name?: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  device_type: string;
  browser: string;
  os: string;
  status: string;
  request_count: number;
}

interface SessionActivity {
  timestamp: string;
  session_id: string;
  user_id: number;
  username: string;
  event: string;
  ip_address?: string;
  details?: string;
}

interface SessionStats {
  total_active: number;
  total_today: number;
  unique_users: number;
  by_device: Record<string, number>;
  by_browser: Record<string, number>;
  avg_session_duration_minutes: number;
}

interface UserWithSessions {
  id: number;
  username: string;
  display_name?: string;
  last_login?: string;
  created_at?: string;
  active_sessions: number;
  sessions: SessionInfo[];
}

const DEVICE_ICONS: Record<string, string> = {
  desktop: '🖥️',
  mobile: '📱',
  tablet: '📱',
  unknown: '❓',
};

const EVENT_COLORS: Record<string, string> = {
  login: '#22c55e',
  logout: '#8b949e',
  expired: '#d29922',
  revoked: '#f85149',
};

export function SessionInspector() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [users, setUsers] = useState<UserWithSessions[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode
  const [view, setView] = useState<'sessions' | 'users' | 'activity'>('sessions');

  // Expanded session
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
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

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/activity?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch users with sessions
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchStats(), fetchActivities(), fetchUsers()]);
      setLoading(false);
    };
    loadData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchSessions();
      fetchStats();
      fetchActivities();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchSessions, fetchStats, fetchActivities, fetchUsers]);

  // Revoke session
  const revokeSession = async (sessionId: string) => {
    try {
      await fetch(`${API_BASE}/${sessionId}`, { method: 'DELETE' });
      fetchSessions();
      fetchStats();
      fetchActivities();
    } catch {
      // Silently fail
    }
  };

  // Create test session
  const createTestSession = async () => {
    try {
      await fetch(`${API_BASE}/test`, { method: 'POST' });
      fetchSessions();
      fetchStats();
      fetchActivities();
    } catch {
      // Silently fail
    }
  };

  // Clear all sessions
  const clearSessions = async () => {
    try {
      await fetch(API_BASE, { method: 'DELETE' });
      setSessions([]);
      fetchStats();
      setActivities([]);
    } catch {
      // Silently fail
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'just now';
    } catch {
      return '';
    }
  };

  // Calculate session duration
  const getSessionDuration = (session: SessionInfo) => {
    try {
      const created = new Date(session.created_at);
      const last = new Date(session.last_activity);
      const diff = last.getTime() - created.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      return `${minutes}m`;
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="session-inspector">
        <div className="session-loading">
          <div className="loading-spinner" />
          <p>Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-inspector">
      {/* Header */}
      <header className="session-header">
        <div className="header-left">
          <h1>Session Inspector</h1>
          <span className="header-badge">
            {stats?.total_active || 0} active
          </span>
        </div>
        <div className="header-right">
          <button onClick={createTestSession} className="test-btn">
            + Test Session
          </button>
          <button onClick={clearSessions} className="clear-btn">
            Clear All
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total_active}</div>
            <div className="stat-label">Active Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.unique_users}</div>
            <div className="stat-label">Unique Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_today}</div>
            <div className="stat-label">Logins Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg_session_duration_minutes.toFixed(0)}m</div>
            <div className="stat-label">Avg Duration</div>
          </div>
          <div className="stat-card device-breakdown">
            <div className="device-items">
              {Object.entries(stats.by_device).map(([device, count]) => (
                <div key={device} className="device-item">
                  <span className="device-icon">{DEVICE_ICONS[device] || '❓'}</span>
                  <span className="device-count">{count}</span>
                </div>
              ))}
            </div>
            <div className="stat-label">By Device</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={view === 'sessions' ? 'active' : ''}
          onClick={() => setView('sessions')}
        >
          Active Sessions
        </button>
        <button
          className={view === 'users' ? 'active' : ''}
          onClick={() => setView('users')}
        >
          Users
        </button>
        <button
          className={view === 'activity' ? 'active' : ''}
          onClick={() => setView('activity')}
        >
          Activity Log
        </button>
      </div>

      {/* Sessions View */}
      {view === 'sessions' && (
        <div className="sessions-list">
          {sessions.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">👤</div>
              <p>No active sessions</p>
              <p className="hint">Sessions appear when users log in</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                className={`session-card ${expandedSession === session.session_id ? 'expanded' : ''}`}
              >
                <div
                  className="session-header-row"
                  onClick={() => setExpandedSession(
                    expandedSession === session.session_id ? null : session.session_id
                  )}
                >
                  <div className="session-main">
                    <span className="device-icon">{DEVICE_ICONS[session.device_type]}</span>
                    <div className="session-info">
                      <span className="session-username">{session.display_name || session.username}</span>
                      <span className="session-meta">
                        {session.browser} on {session.os}
                      </span>
                    </div>
                  </div>
                  <div className="session-stats">
                    <span className="session-requests">{session.request_count} requests</span>
                    <span className="session-duration">{getSessionDuration(session)}</span>
                    <span className="session-time" title={formatTime(session.last_activity)}>
                      {formatRelativeTime(session.last_activity)}
                    </span>
                    <span className="expand-icon">
                      {expandedSession === session.session_id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {expandedSession === session.session_id && (
                  <div className="session-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Session ID</span>
                        <code className="detail-value">{session.session_id}</code>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">User ID</span>
                        <span className="detail-value">{session.user_id}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">IP Address</span>
                        <span className="detail-value">{session.ip_address || 'Unknown'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span className={`status-badge status-${session.status}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created</span>
                        <span className="detail-value">{formatTime(session.created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Expires</span>
                        <span className="detail-value">{formatTime(session.expires_at)}</span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">User Agent</span>
                        <span className="detail-value small">{session.user_agent || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="session-actions">
                      <button
                        onClick={() => revokeSession(session.session_id)}
                        className="revoke-btn"
                      >
                        Revoke Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Users View */}
      {view === 'users' && (
        <div className="users-list">
          {users.length === 0 ? (
            <div className="no-data">
              <p>No users with recent activity</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Last Login</th>
                  <th>Active Sessions</th>
                  <th>Member Since</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="col-user">
                      <span className="user-name">{user.display_name || user.username}</span>
                      <span className="user-username">@{user.username}</span>
                    </td>
                    <td>
                      {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
                    </td>
                    <td>
                      <span className={`sessions-count ${user.active_sessions > 0 ? 'has-sessions' : ''}`}>
                        {user.active_sessions}
                      </span>
                    </td>
                    <td className="col-date">
                      {user.created_at ? formatTime(user.created_at).split(',')[0] : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activity View */}
      {view === 'activity' && (
        <div className="activity-list">
          {activities.length === 0 ? (
            <div className="no-data">
              <p>No activity recorded</p>
            </div>
          ) : (
            <div className="activity-timeline">
              {activities.map((activity, i) => (
                <div key={i} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{ background: EVENT_COLORS[activity.event] || '#8b949e' }}
                  />
                  <div className="activity-content">
                    <div className="activity-header">
                      <span
                        className="activity-event"
                        style={{ color: EVENT_COLORS[activity.event] || '#8b949e' }}
                      >
                        {activity.event.toUpperCase()}
                      </span>
                      <span className="activity-user">{activity.username}</span>
                      <span className="activity-time">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <div className="activity-details">
                      {activity.ip_address && (
                        <span className="activity-ip">IP: {activity.ip_address}</span>
                      )}
                      {activity.details && (
                        <span className="activity-detail">{activity.details}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SessionInspector;
