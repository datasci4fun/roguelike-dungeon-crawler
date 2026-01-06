/**
 * WebSocket hook for chat communication.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { getChatWsUrl } from '../services/api';

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  created_at: string;
  recipient_id?: number;
  recipient_username?: string;
}

export interface OnlineUser {
  user_id: number;
  username: string;
  connected_at: string;
}

export interface SystemMessage {
  type: 'system';
  content: string;
  created_at: string;
}

export interface UserEvent {
  type: 'user_joined' | 'user_left';
  user_id: number;
  username: string;
}

export type ChatEvent =
  | { type: 'chat_message'; channel: string; message: ChatMessage }
  | { type: 'whisper'; message: ChatMessage }
  | { type: 'system_message'; content: string; created_at: string }
  | { type: 'user_joined'; user_id: number; username: string }
  | { type: 'user_left'; user_id: number; username: string };

export type ChatConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface UseChatSocketResult {
  status: ChatConnectionStatus;
  messages: ChatMessage[];
  onlineUsers: OnlineUser[];
  error: string | null;
  currentUserId: number | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  sendWhisper: (recipientId: number, content: string) => void;
}

export function useChatSocket(token: string | null): UseChatSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const connectingRef = useRef(false);
  const [status, setStatus] = useState<ChatConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    // Prevent duplicate connection attempts
    if (connectingRef.current) return;

    // Don't connect if already connected or connecting
    const currentWs = wsRef.current;
    if (currentWs && (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING)) {
      return;
    }

    connectingRef.current = true;
    setStatus('connecting');
    setError(null);

    const ws = new WebSocket(getChatWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      connectingRef.current = false;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            setCurrentUserId(data.user_id);
            // Add system message for connection
            addSystemMessage(`Connected as ${data.username}`);
            break;

          case 'online_users':
            setOnlineUsers(data.users || []);
            break;

          case 'chat_message':
            if (data.message) {
              setMessages((prev) => [...prev, data.message]);
            }
            break;

          case 'whisper':
            if (data.message) {
              // Mark whispers with a special flag for UI
              setMessages((prev) => [
                ...prev,
                { ...data.message, isWhisper: true },
              ]);
            }
            break;

          case 'system_message':
            addSystemMessage(data.content);
            break;

          case 'user_joined':
            setOnlineUsers((prev) => [
              ...prev,
              {
                user_id: data.user_id,
                username: data.username,
                connected_at: new Date().toISOString(),
              },
            ]);
            addSystemMessage(`${data.username} joined the chat`);
            break;

          case 'user_left':
            setOnlineUsers((prev) =>
              prev.filter((u) => u.user_id !== data.user_id)
            );
            addSystemMessage(`${data.username} left the chat`);
            break;

          case 'error':
            setError(data.message);
            break;

          case 'pong':
            // Keep-alive response
            break;
        }
      } catch (e) {
        console.error('Failed to parse chat message:', e);
      }
    };

    ws.onerror = () => {
      connectingRef.current = false;
      setStatus('error');
      setError('Chat connection error');
    };

    ws.onclose = (event) => {
      connectingRef.current = false;
      setStatus('disconnected');
      wsRef.current = null;
      if (event.code === 4001) {
        setError('Invalid or expired token');
      }
    };
  }, [token]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && content.trim()) {
      wsRef.current.send(
        JSON.stringify({
          action: 'send',
          content: content.trim(),
          channel: 'global',
        })
      );
    }
  }, []);

  const sendWhisper = useCallback((recipientId: number, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && content.trim()) {
      wsRef.current.send(
        JSON.stringify({
          action: 'send',
          content: content.trim(),
          channel: 'whisper',
          recipient_id: recipientId,
        })
      );
    }
  }, []);

  // Helper to add system messages to the list
  const addSystemMessage = useCallback((content: string) => {
    const systemMsg: ChatMessage = {
      id: Date.now(),
      sender_id: 0,
      sender_username: 'System',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMsg]);
  }, []);

  // Cleanup on unmount - only close if actually open to avoid StrictMode warnings
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    status,
    messages,
    onlineUsers,
    error,
    currentUserId,
    connect,
    disconnect,
    sendMessage,
    sendWhisper,
  };
}
