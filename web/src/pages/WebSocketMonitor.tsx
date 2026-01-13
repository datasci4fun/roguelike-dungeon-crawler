/**
 * WebSocket Monitor - Real-time WebSocket traffic viewer
 *
 * Features:
 * - Connect to game/chat/spectate WebSocket endpoints
 * - Real-time message log with timestamps
 * - Send custom messages
 * - Filter messages by type/direction
 * - Connection status indicator
 * - Auto-reconnect option
 * - Export message log
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './WebSocketMonitor.css';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type MessageDirection = 'sent' | 'received' | 'system';

interface WsMessage {
  id: string;
  timestamp: Date;
  direction: MessageDirection;
  data: string;
  parsed?: unknown;
}

interface WsEndpoint {
  id: string;
  name: string;
  description: string;
  getUrl: (token: string) => string;
  requiresAuth: boolean;
}

const API_BASE = 'localhost:8000';

// Available WebSocket endpoints
const WS_ENDPOINTS: WsEndpoint[] = [
  {
    id: 'game',
    name: 'Game',
    description: 'Main gameplay WebSocket',
    getUrl: (token) => `ws://${API_BASE}/api/game/ws?token=${token}`,
    requiresAuth: true,
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Global chat WebSocket',
    getUrl: (token) => `ws://${API_BASE}/api/chat/ws?token=${token}`,
    requiresAuth: true,
  },
  {
    id: 'spectate',
    name: 'Spectate',
    description: 'Watch active game sessions',
    getUrl: (token) => `ws://${API_BASE}/api/game/spectate/test?token=${token}`,
    requiresAuth: true,
  },
  {
    id: 'custom',
    name: 'Custom URL',
    description: 'Connect to any WebSocket URL',
    getUrl: () => '',
    requiresAuth: false,
  },
];

// Message type colors
const MESSAGE_COLORS: Record<string, string> = {
  game_state: '#22c55e',
  player_action: '#3b82f6',
  error: '#ef4444',
  chat: '#a855f7',
  ping: '#6b7280',
  pong: '#6b7280',
  connect: '#22c55e',
  disconnect: '#f97316',
};

export function WebSocketMonitor() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('game');
  const [customUrl, setCustomUrl] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [filter, setFilter] = useState('');
  const [filterDirection, setFilterDirection] = useState<MessageDirection | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [sendInput, setSendInput] = useState('');
  const [showParsed, setShowParsed] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Get auth token
  const getToken = (): string | null => {
    return localStorage.getItem('access_token');
  };

  // Add message to log
  const addMessage = useCallback((direction: MessageDirection, data: string) => {
    let parsed: unknown = undefined;
    try {
      parsed = JSON.parse(data);
    } catch {
      // Not JSON
    }

    const message: WsMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      direction,
      data,
      parsed,
    };

    setMessages((prev) => [...prev, message]);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const endpoint = WS_ENDPOINTS.find((e) => e.id === selectedEndpoint);
    if (!endpoint) return;

    let url: string;
    if (selectedEndpoint === 'custom') {
      url = customUrl;
      if (!url) {
        addMessage('system', 'Please enter a WebSocket URL');
        return;
      }
    } else {
      const token = getToken();
      if (endpoint.requiresAuth && !token) {
        addMessage('system', 'Authentication required. Please login first.');
        setStatus('error');
        return;
      }
      url = endpoint.getUrl(token || '');
    }

    setStatus('connecting');
    addMessage('system', `Connecting to ${url}...`);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        addMessage('system', 'Connected successfully');
      };

      ws.onmessage = (event) => {
        addMessage('received', event.data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addMessage('system', 'Connection error occurred');
        setStatus('error');
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        addMessage('system', `Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`);
        wsRef.current = null;

        // Auto-reconnect
        if (autoReconnect && event.code !== 1000) {
          addMessage('system', 'Reconnecting in 3 seconds...');
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (e) {
      setStatus('error');
      addMessage('system', `Failed to connect: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [selectedEndpoint, customUrl, autoReconnect, addMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  // Send message
  const sendMessage = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addMessage('system', 'Not connected');
      return;
    }

    if (!sendInput.trim()) return;

    try {
      wsRef.current.send(sendInput);
      addMessage('sent', sendInput);
      setSendInput('');
    } catch (e) {
      addMessage('system', `Failed to send: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [sendInput, addMessage]);

  // Clear messages
  const clearMessages = () => {
    setMessages([]);
  };

  // Export messages
  const exportMessages = () => {
    const data = messages.map((m) => ({
      timestamp: m.timestamp.toISOString(),
      direction: m.direction,
      data: m.data,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send preset messages
  const sendPreset = (type: string) => {
    const presets: Record<string, string> = {
      ping: JSON.stringify({ type: 'ping' }),
      get_state: JSON.stringify({ type: 'get_state' }),
      move_north: JSON.stringify({ type: 'action', action: 'move', direction: 'north' }),
      move_south: JSON.stringify({ type: 'action', action: 'move', direction: 'south' }),
      chat_hello: JSON.stringify({ type: 'chat', message: 'Hello from WebSocket Monitor!' }),
    };

    if (presets[type]) {
      setSendInput(presets[type]);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    if (filterDirection !== 'all' && m.direction !== filterDirection) {
      return false;
    }
    if (filter && !m.data.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Get message type from parsed data
  const getMessageType = (msg: WsMessage): string => {
    if (msg.direction === 'system') return 'system';
    if (msg.parsed && typeof msg.parsed === 'object' && msg.parsed !== null) {
      const obj = msg.parsed as Record<string, unknown>;
      return (obj.type as string) || (obj.action as string) || 'unknown';
    }
    return 'raw';
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div className="ws-monitor">
      {/* Header */}
      <header className="ws-header">
        <div className="header-left">
          <h1>WebSocket Monitor</h1>
          <span className="header-badge">REAL-TIME</span>
        </div>
        <div className="header-right">
          <div className={`connection-status status-${status}`}>
            <span className="status-dot" />
            <span className="status-text">{status}</span>
          </div>
        </div>
      </header>

      {/* Connection Panel */}
      <div className="connection-panel">
        <div className="endpoint-selector">
          {WS_ENDPOINTS.map((endpoint) => (
            <button
              key={endpoint.id}
              className={`endpoint-btn ${selectedEndpoint === endpoint.id ? 'active' : ''}`}
              onClick={() => setSelectedEndpoint(endpoint.id)}
              disabled={status === 'connected'}
            >
              <span className="endpoint-name">{endpoint.name}</span>
              <span className="endpoint-desc">{endpoint.description}</span>
            </button>
          ))}
        </div>

        {selectedEndpoint === 'custom' && (
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="ws://localhost:8000/path"
            className="custom-url-input"
            disabled={status === 'connected'}
          />
        )}

        <div className="connection-actions">
          <label className="auto-reconnect">
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
            />
            Auto-reconnect
          </label>

          {status === 'disconnected' || status === 'error' ? (
            <button className="connect-btn" onClick={connect}>
              Connect
            </button>
          ) : status === 'connecting' ? (
            <button className="connect-btn" disabled>
              Connecting...
            </button>
          ) : (
            <button className="disconnect-btn" onClick={disconnect}>
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="ws-body">
        {/* Message Log */}
        <div className="message-panel">
          {/* Toolbar */}
          <div className="message-toolbar">
            <div className="toolbar-left">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter messages..."
                className="filter-input"
              />
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value as MessageDirection | 'all')}
                className="direction-filter"
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="toolbar-right">
              <label className="toolbar-checkbox">
                <input
                  type="checkbox"
                  checked={showParsed}
                  onChange={(e) => setShowParsed(e.target.checked)}
                />
                Pretty JSON
              </label>
              <label className="toolbar-checkbox">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                Auto-scroll
              </label>
              <button className="toolbar-btn" onClick={clearMessages}>
                Clear
              </button>
              <button className="toolbar-btn" onClick={exportMessages}>
                Export
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="message-list">
            {filteredMessages.length === 0 ? (
              <div className="message-empty">
                <span className="empty-icon">📡</span>
                <p>No messages yet</p>
                <p className="empty-hint">Connect to a WebSocket endpoint to start monitoring</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const msgType = getMessageType(msg);
                const typeColor = MESSAGE_COLORS[msgType] || '#8b949e';

                return (
                  <div key={msg.id} className={`message-item message-${msg.direction}`}>
                    <div className="message-meta">
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                      <span className={`message-direction dir-${msg.direction}`}>
                        {msg.direction === 'sent' ? '↑' : msg.direction === 'received' ? '↓' : '•'}
                      </span>
                      <span className="message-type" style={{ color: typeColor }}>
                        {msgType}
                      </span>
                    </div>
                    <pre className="message-data">
                      {showParsed && msg.parsed
                        ? JSON.stringify(msg.parsed, null, 2)
                        : msg.data}
                    </pre>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Send Panel */}
        <div className="send-panel">
          <div className="send-presets">
            <span className="presets-label">Presets:</span>
            <button className="preset-btn" onClick={() => sendPreset('ping')}>Ping</button>
            <button className="preset-btn" onClick={() => sendPreset('get_state')}>Get State</button>
            <button className="preset-btn" onClick={() => sendPreset('move_north')}>Move N</button>
            <button className="preset-btn" onClick={() => sendPreset('move_south')}>Move S</button>
            <button className="preset-btn" onClick={() => sendPreset('chat_hello')}>Chat</button>
          </div>
          <div className="send-input-row">
            <textarea
              value={sendInput}
              onChange={(e) => setSendInput(e.target.value)}
              placeholder="Enter message to send (JSON or text)..."
              className="send-textarea"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  sendMessage();
                }
              }}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={status !== 'connected' || !sendInput.trim()}
            >
              Send
            </button>
          </div>
          <div className="send-hint">Press Ctrl+Enter to send</div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <span className="stat">
          Total: <strong>{messages.length}</strong>
        </span>
        <span className="stat">
          Sent: <strong>{messages.filter((m) => m.direction === 'sent').length}</strong>
        </span>
        <span className="stat">
          Received: <strong>{messages.filter((m) => m.direction === 'received').length}</strong>
        </span>
        <span className="stat">
          Filtered: <strong>{filteredMessages.length}</strong>
        </span>
      </div>
    </div>
  );
}

export default WebSocketMonitor;
