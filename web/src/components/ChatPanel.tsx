/**
 * ChatPanel - Real-time chat component with message display and input.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, OnlineUser, ChatConnectionStatus } from '../hooks/useChatSocket';
import './ChatPanel.css';

interface ChatPanelProps {
  status: ChatConnectionStatus;
  messages: ChatMessage[];
  onlineUsers: OnlineUser[];
  currentUserId: number | null;
  onSendMessage: (content: string) => void;
  onSendWhisper: (recipientId: number, content: string) => void;
  onConnect: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatPanel({
  status,
  messages,
  onlineUsers,
  currentUserId,
  onSendMessage,
  onSendWhisper,
  onConnect,
  isCollapsed = false,
  onToggleCollapse,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [whisperTarget, setWhisperTarget] = useState<OnlineUser | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;

      if (whisperTarget) {
        onSendWhisper(whisperTarget.user_id, inputValue);
      } else {
        onSendMessage(inputValue);
      }
      setInputValue('');
    },
    [inputValue, whisperTarget, onSendMessage, onSendWhisper]
  );

  // Handle clicking on a user to start whisper
  const handleUserClick = useCallback((user: OnlineUser) => {
    if (user.user_id === currentUserId) return;
    setWhisperTarget(user);
    setShowUsers(false);
    inputRef.current?.focus();
  }, [currentUserId]);

  // Cancel whisper mode
  const cancelWhisper = useCallback(() => {
    setWhisperTarget(null);
  }, []);

  // Format timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Check if message is a system message
  const isSystemMessage = (msg: ChatMessage) => msg.sender_id === 0;

  // Check if message is a whisper
  const isWhisper = (msg: ChatMessage) => 'isWhisper' in msg || !!msg.recipient_id;

  if (isCollapsed) {
    return (
      <div className="chat-panel collapsed" onClick={onToggleCollapse}>
        <div className="chat-collapsed-header">
          <span className="chat-icon">💬</span>
          <span className="chat-badge">{onlineUsers.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          <span>Chat</span>
          <span className={`status-dot ${status}`} />
        </div>
        <div className="chat-header-actions">
          <button
            className={`users-toggle ${showUsers ? 'active' : ''}`}
            onClick={() => setShowUsers(!showUsers)}
            title="Online users"
          >
            👥 {onlineUsers.length}
          </button>
          {onToggleCollapse && (
            <button className="collapse-btn" onClick={onToggleCollapse} title="Collapse">
              −
            </button>
          )}
        </div>
      </div>

      {showUsers && (
        <div className="online-users-panel">
          <div className="online-users-header">Online Users</div>
          <div className="online-users-list">
            {onlineUsers.length === 0 ? (
              <div className="no-users">No users online</div>
            ) : (
              onlineUsers.map((user) => (
                <div
                  key={user.user_id}
                  className={`online-user ${user.user_id === currentUserId ? 'self' : ''}`}
                  onClick={() => handleUserClick(user)}
                  title={user.user_id === currentUserId ? 'You' : 'Click to whisper'}
                >
                  <span className="user-status" />
                  <span className="user-name">{user.username}</span>
                  {user.user_id === currentUserId && (
                    <span className="user-tag">(you)</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="chat-messages">
        {status === 'disconnected' && (
          <div className="chat-connect-prompt">
            <p>Chat disconnected</p>
            <button onClick={onConnect}>Connect</button>
          </div>
        )}

        {status === 'connecting' && (
          <div className="chat-connecting">Connecting to chat...</div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`chat-message ${isSystemMessage(msg) ? 'system' : ''} ${isWhisper(msg) ? 'whisper' : ''} ${msg.sender_id === currentUserId ? 'own' : ''}`}
          >
            {isSystemMessage(msg) ? (
              <div className="system-content">
                <span className="system-text">{msg.content}</span>
                <span className="message-time">{formatTime(msg.created_at)}</span>
              </div>
            ) : (
              <>
                <div className="message-header">
                  <span
                    className="sender-name"
                    onClick={() => {
                      const user = onlineUsers.find(u => u.user_id === msg.sender_id);
                      if (user) handleUserClick(user);
                    }}
                  >
                    {msg.sender_username}
                  </span>
                  {isWhisper(msg) && (
                    <span className="whisper-indicator">
                      → {msg.recipient_id === currentUserId ? 'you' : msg.recipient_username}
                    </span>
                  )}
                  <span className="message-time">{formatTime(msg.created_at)}</span>
                </div>
                <div className="message-content">{msg.content}</div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        {whisperTarget && (
          <div className="whisper-indicator-bar">
            <span>Whispering to {whisperTarget.username}</span>
            <button type="button" onClick={cancelWhisper}>×</button>
          </div>
        )}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            placeholder={whisperTarget ? `Whisper to ${whisperTarget.username}...` : 'Type a message...'}
            disabled={status !== 'connected'}
            maxLength={500}
          />
          <button type="submit" disabled={status !== 'connected' || !inputValue.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
