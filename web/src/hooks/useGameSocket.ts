/**
 * WebSocket hook for game communication.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { getGameWsUrl } from '../services/api';

export type GameState = 'PLAYING' | 'DEAD' | 'VICTORY' | 'TITLE' | 'INTRO';
export type UIMode = 'GAME' | 'INVENTORY' | 'CHARACTER' | 'HELP' | 'MESSAGE_LOG' | 'DIALOG' | 'READING';

// Lore system types
export type LoreCategory = 'history' | 'characters' | 'creatures' | 'locations' | 'artifacts';
export type LoreItemType = 'scroll' | 'book' | 'bestiary' | 'location' | 'character' | 'artifact' | 'chronicle';

export interface CreatureData {
  symbol: string;
  name: string;
  hp: number;
  damage: number;
  xp: number;
  is_boss: boolean;
  abilities?: string[];
  resistances?: Record<string, number>;
  element?: string;
  level_range?: [number, number];
  first_encounter_text: string;
  description?: string;
}

export interface LocationData {
  level: number;
  biome_id: string;
  biome_name: string;
  intro_message: string;
  boss_name?: string;
  boss_symbol?: string;
  creatures: string[];
}

export interface LoreEntry {
  id: string;
  title: string;
  content: string[];
  category: LoreCategory;
  item_type: LoreItemType;
  // Extended data for specific entry types
  creature_data?: CreatureData;
  location_data?: LocationData;
}

export interface FacingDirection {
  dx: number;
  dy: number;
}

// Character creation types
export type RaceId = 'HUMAN' | 'ELF' | 'DWARF' | 'HALFLING' | 'ORC';
export type ClassId = 'WARRIOR' | 'MAGE' | 'ROGUE';

export interface CharacterConfig {
  race: RaceId;
  class: ClassId;
}

export interface PlayerRace {
  id: RaceId;
  name: string;
  trait: string;
  trait_name: string;
  trait_description: string;
}

export interface PlayerClass {
  id: ClassId;
  name: string;
  description: string;
}

export interface PlayerAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  cooldown_remaining: number;
  is_ready: boolean;
  target_type: 'SELF' | 'SINGLE' | 'AOE' | 'DIRECTIONAL';
  range: number;
}

export interface PlayerPassive {
  id: string;
  name: string;
  description: string;
  bonus: number;
}

export type FeatCategory = 'COMBAT' | 'DEFENSE' | 'UTILITY' | 'SPECIAL';

export interface PlayerFeat {
  id: string;
  name: string;
  description: string;
  category: FeatCategory;
}

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
  facing?: FacingDirection;
  race?: PlayerRace;
  class?: PlayerClass;
  abilities?: PlayerAbility[];
  passives?: PlayerPassive[];
  feats?: PlayerFeat[];
  pending_feat_selection?: boolean;
  available_feats?: PlayerFeat[];
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

export interface FirstPersonTile {
  tile: string;           // Display character (~ for fog, # for unknown)
  tile_actual?: string;   // Actual map tile for geometry (even when fogged)
  // NOTE: offset may be omitted by server/debug snapshots; renderer can derive it from x/y + facing + depth.
  offset?: number;        // Lateral offset from center (-left, +right)
  x: number;
  y: number;
  visible: boolean;
  walkable: boolean;
  has_entity: boolean;
  has_secret?: boolean;   // Hidden secret door at this tile
}

export interface FirstPersonEntity {
  type: 'enemy' | 'item' | 'trap';
  name: string;
  symbol: string;
  distance: number;
  offset: number;
  x: number;
  y: number;
  health?: number;
  max_health?: number;
  is_elite?: boolean;
  // Trap-specific fields
  trap_type?: 'spike' | 'fire' | 'poison' | 'arrow';
  triggered?: boolean;
  is_active?: boolean;
}

export interface FirstPersonTorch {
  x: number;
  y: number;
  distance: number;
  offset: number;
  facing_dx: number;
  facing_dy: number;
  intensity: number;
  radius: number;
  is_lit: boolean;
  torch_type: 'wall' | 'sconce' | 'brazier';
}

export interface FirstPersonView {
  rows: FirstPersonTile[][];
  entities: FirstPersonEntity[];
  torches?: FirstPersonTorch[];
  lighting?: Record<string, number>;  // "x,y" -> light level 0.0-1.0
  facing: FacingDirection;
  depth: number;
  top_down_window?: string[][];  // 11x11 grid around player for debug
  // Room ceiling/skybox info for 3D renderer
  zone_id?: string;              // Current room's zone ID
  room_has_ceiling?: boolean;    // False for open-air rooms (e.g., courtyards)
  room_skybox_override?: string; // Biome ID to use for skybox when ceiling is off
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
  reading?: {
    title: string;
    content: string[];
  };
  lore_journal?: {
    entries: LoreEntry[];
    discovered_count: number;
    total_count: number;
  };
  first_person_view?: FirstPersonView;
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
  newGame: (config?: CharacterConfig) => void;
  quit: () => void;
  clearAchievements: () => void;
  selectFeat: (featId: string) => void;
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
    selectFeat,
  };
}
