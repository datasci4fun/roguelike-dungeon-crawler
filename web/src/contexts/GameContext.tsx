/**
 * Game context - shares WebSocket connection across routes.
 * Prevents disconnection when navigating between CharacterCreation and Play.
 */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getGameWsUrl } from '../services/api';
import { useAuth } from './AuthContext';
import type { FullGameState, ConnectionStatus, CharacterConfig, NewAchievement } from '../hooks/useGameSocket';

interface GameContextValue {
  status: ConnectionStatus;
  gameState: FullGameState | null;
  error: string | null;
  newAchievements: NewAchievement[];
  connect: () => void;
  disconnect: () => void;
  sendCommand: (command: string, data?: Record<string, unknown>) => void;
  newGame: (config?: CharacterConfig) => void;
  quit: () => void;
  clearAchievements: () => void;
  selectFeat: (featId: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const connectingRef = useRef(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [gameState, setGameState] = useState<FullGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);

  const connect = useCallback(() => {
    if (!token) return;

    // Prevent duplicate connection attempts
    if (connectingRef.current) return;

    // Don't connect if already connected
    const currentWs = wsRef.current;
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      return;
    }

    connectingRef.current = true;
    setStatus('connecting');
    setError(null);

    const ws = new WebSocket(getGameWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      connectingRef.current = false;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('Connected to game server:', data.message);
        } else if (data.type === 'game_state') {
          setGameState(data as FullGameState);
        } else if (data.type === 'error') {
          setError(data.message);
        } else if (data.type === 'game_ended') {
          setGameState(null);
          console.log('Game ended:', data.stats);
          if (data.recorded?.new_achievements?.length > 0) {
            setNewAchievements(data.recorded.new_achievements);
          }
        } else if (data.type === 'pong') {
          // Keep-alive response
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    ws.onerror = () => {
      connectingRef.current = false;
      setStatus('error');
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      connectingRef.current = false;
      setStatus('disconnected');
      wsRef.current = null;
      if (event.code === 4001) {
        setError('Invalid or expired token');
      } else if (event.code === 4002) {
        setError('Game engine not available on server');
      }
    };
  }, [token]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setGameState(null);
  }, []);

  const sendCommand = useCallback((command: string, data?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'command',
        command: command,
        data: data,
      }));
    }
  }, []);

  const newGame = useCallback((config?: CharacterConfig) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: { action: string; race?: string; class?: string } = { action: 'new_game' };
      if (config) {
        message.race = config.race;
        message.class = config.class;
      }
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const quit = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'quit' }));
    }
  }, []);

  const selectFeat = useCallback((featId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'command',
        command: 'SELECT_FEAT',
        data: { feat_id: featId },
      }));
    }
  }, []);

  const clearAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Auto-connect when token becomes available (only once)
  const hasConnectedRef = useRef(false);
  useEffect(() => {
    if (token && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connect();
    }
    // Reset if token changes (logout/login)
    if (!token) {
      hasConnectedRef.current = false;
    }
  }, [token, connect]);

  // Cleanup only on unmount of the provider (app-level)
  // Only close if connection is actually established to avoid StrictMode warnings
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <GameContext.Provider
      value={{
        status,
        gameState,
        error,
        newAchievements,
        connect,
        disconnect,
        sendCommand,
        newGame,
        quit,
        clearAchievements,
        selectFeat,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
