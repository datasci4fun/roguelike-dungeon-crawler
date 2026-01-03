/**
 * WebSocket hook for game communication.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { getGameWsUrl } from '../services/api';

export type GameState = 'PLAYING' | 'DEAD' | 'VICTORY' | 'TITLE' | 'INTRO';
export type UIMode = 'GAME' | 'INVENTORY' | 'CHARACTER' | 'HELP' | 'MESSAGE_LOG' | 'DIALOG' | 'READING';

export interface Player {
  x: number;
  y: number;
  health: number;
  max_health: number;
  attack: number;
  defense: number;
  level: number;
  xp: number;
  xp_to_level: number;
  kills: number;
}

export interface Enemy {
  x: number;
  y: number;
  name: string;
  health: number;
  max_health: number;
  is_elite: boolean;
  symbol: string;
}

export interface Item {
  x: number;
  y: number;
  name: string;
  symbol: string;
}

export interface Dungeon {
  level: number;
  width: number;
  height: number;
  tiles: string[][];
}

export interface InventoryItem {
  name: string;
  type: string;
  rarity: string;
}

export interface GameEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface NewAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface FullGameState {
  type: 'game_state';
  session_id: string;
  game_state: GameState;
  ui_mode: UIMode;
  turn: number;
  player?: Player;
  dungeon?: Dungeon;
  enemies?: Enemy[];
  items?: Item[];
  messages?: string[];
  events?: GameEvent[];
  inventory?: {
    items: InventoryItem[];
    selected_index: number;
  };
  dialog?: {
    title: string;
    message: string;
  };
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface UseGameSocketResult {
  status: ConnectionStatus;
  gameState: FullGameState | null;
  error: string | null;
  newAchievements: NewAchievement[];
  connect: () => void;
  disconnect: () => void;
  sendCommand: (command: string) => void;
  newGame: () => void;
  quit: () => void;
  clearAchievements: () => void;
}

export function useGameSocket(token: string | null): UseGameSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [gameState, setGameState] = useState<FullGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);

  const connect = useCallback(() => {
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    setError(null);

    const ws = new WebSocket(getGameWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          // Connection confirmed
          console.log('Connected to game server:', data.message);
        } else if (data.type === 'game_state') {
          setGameState(data as FullGameState);
        } else if (data.type === 'error') {
          setError(data.message);
        } else if (data.type === 'game_ended') {
          setGameState(null);
          console.log('Game ended:', data.stats);
          // Check for new achievements
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
      setStatus('error');
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
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

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'command',
        command: command,
      }));
    }
  }, []);

  const newGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'new_game' }));
    }
  }, []);

  const quit = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'quit' }));
    }
  }, []);

  const clearAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
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
  };
}
