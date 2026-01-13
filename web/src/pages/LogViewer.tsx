/**
 * Log Viewer - Real-time application log streaming
 *
 * Features:
 * - Real-time WebSocket log streaming
 * - Filter by log level
 * - Search in messages
 * - Auto-scroll with pause
 * - Log level coloring
 * - Export logs
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './LogViewer.css';

const API_BASE = 'http://localhost:8000/api/logs';
const WS_URL = 'ws://localhost:8000/api/logs/stream';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  source?: string;
  line?: number;
}

interface LoggerInfo {
  name: string;
  count: number;
}

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: '#8b949e',
  INFO: '#58a6ff',
  WARNING: '#d29922',
  ERROR: '#f85149',
  CRITICAL: '#ff7b72',
};

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [selectedLogger, setSelectedLogger] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loggers, setLoggers] = useState<LoggerInfo[]>([]);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [isPaused, setIsPaused] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '200' });
      if (selectedLevel !== 'ALL') params.append('level', selectedLevel);
      if (selectedLogger) params.append('logger', selectedLogger);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.entries.reverse()); // Reverse to show oldest first, newest at bottom
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedLogger, searchTerm]);

  // Fetch loggers and level counts
  const fetchMetadata = useCallback(async () => {
    try {
      const [loggersRes, levelsRes] = await Promise.all([
        fetch(`${API_BASE}/loggers`),
        fetch(`${API_BASE}/levels`),
      ]);

      if (loggersRes.ok) {
        const data = await loggersRes.json();
        setLoggers(data.loggers);
      }

      if (levelsRes.ok) {
        const data = await levelsRes.json();
        setLevelCounts(data.levels);
      }
    } catch {
      // Silently fail metadata fetch
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (isPaused) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong' || data.type === 'keepalive') return;

        const entry = data as LogEntry;

        // Apply filters
        if (selectedLevel !== 'ALL') {
          const levelOrder = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
          const minLevel = levelOrder.indexOf(selectedLevel);
          if (levelOrder.indexOf(entry.level) < minLevel) return;
        }

        if (selectedLogger && !entry.logger.toLowerCase().includes(selectedLogger.toLowerCase())) {
          return;
        }

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          if (!entry.message.toLowerCase().includes(term) &&
              !entry.logger.toLowerCase().includes(term)) {
            return;
          }
        }

        setLogs((prev) => [...prev.slice(-499), entry]); // Keep last 500
      } catch {
        // Invalid JSON, ignore
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    // Ping to keep alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [isPaused, selectedLevel, selectedLogger, searchTerm]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
    fetchMetadata();
  }, [fetchLogs, fetchMetadata]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Handle scroll to detect manual scrolling
  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });
    } catch {
      return timestamp;
    }
  };

  const clearLogs = async () => {
    try {
      await fetch(API_BASE, { method: 'DELETE' });
      setLogs([]);
    } catch {
      // Ignore
    }
  };

  const createTestLog = async (level: LogLevel) => {
    try {
      await fetch(`${API_BASE}/test?level=${level}&message=Test ${level} log from Log Viewer`, {
        method: 'POST',
      });
    } catch {
      // Ignore
    }
  };

  const exportLogs = () => {
    const content = logs.map((log) =>
      `[${log.timestamp}] [${log.level.padEnd(8)}] [${log.logger}] ${log.message}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs; // Already filtered by WebSocket/fetch

  if (loading && logs.length === 0) {
    return (
      <div className="log-viewer">
        <div className="log-loading">
          <div className="loading-spinner" />
          <p>Connecting to log stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="log-viewer">
      {/* Header */}
      <header className="log-header">
        <div className="header-left">
          <h1>Log Viewer</h1>
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot" />
            {connected ? 'Live' : 'Disconnected'}
          </div>
        </div>
        <div className="header-right">
          <span className="log-count">{logs.length} entries</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="log-toolbar">
        <div className="toolbar-left">
          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'ALL')}
            className="level-select"
          >
            <option value="ALL">All Levels</option>
            <option value="DEBUG">DEBUG ({levelCounts.DEBUG || 0})</option>
            <option value="INFO">INFO ({levelCounts.INFO || 0})</option>
            <option value="WARNING">WARNING ({levelCounts.WARNING || 0})</option>
            <option value="ERROR">ERROR ({levelCounts.ERROR || 0})</option>
            <option value="CRITICAL">CRITICAL ({levelCounts.CRITICAL || 0})</option>
          </select>

          {/* Logger Filter */}
          <select
            value={selectedLogger}
            onChange={(e) => setSelectedLogger(e.target.value)}
            className="logger-select"
          >
            <option value="">All Loggers</option>
            {loggers.map((logger) => (
              <option key={logger.name} value={logger.name}>
                {logger.name} ({logger.count})
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="search-input"
          />
        </div>

        <div className="toolbar-right">
          {/* Test Log Buttons */}
          <div className="test-buttons">
            <button onClick={() => createTestLog('INFO')} className="test-btn test-info">
              + INFO
            </button>
            <button onClick={() => createTestLog('WARNING')} className="test-btn test-warning">
              + WARN
            </button>
            <button onClick={() => createTestLog('ERROR')} className="test-btn test-error">
              + ERROR
            </button>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`action-btn ${isPaused ? 'paused' : ''}`}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button onClick={exportLogs} className="action-btn">
            ⬇ Export
          </button>

          <button onClick={clearLogs} className="action-btn danger">
            🗑 Clear
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchLogs}>Retry</button>
        </div>
      )}

      {/* Log Container */}
      <div
        className="log-container"
        ref={logsContainerRef}
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            <p>No log entries yet</p>
            <p className="hint">Logs will appear here as they're generated</p>
          </div>
        ) : (
          <div className="log-entries">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`log-entry level-${log.level.toLowerCase()}`}
              >
                <span className="log-time">{formatTime(log.timestamp)}</span>
                <span
                  className="log-level"
                  style={{ color: LEVEL_COLORS[log.level as LogLevel] }}
                >
                  {log.level}
                </span>
                <span className="log-logger">{log.logger}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="log-footer">
        <div className="footer-left">
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>
        <div className="footer-right">
          <span className="footer-hint">
            {isPaused ? 'Stream paused' : 'Streaming live logs'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LogViewer;
