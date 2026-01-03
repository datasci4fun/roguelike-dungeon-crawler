// User types
export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  high_score: number;
  games_played: number;
  victories: number;
  total_kills: number;
  max_level_reached: number;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

// Game types
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

export interface GameEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface GameState {
  type: string;
  session_id: string;
  game_state: 'TITLE' | 'INTRO' | 'PLAYING' | 'DEAD' | 'VICTORY' | 'QUIT';
  ui_mode: string;
  turn: number;
  player?: Player;
  dungeon?: Dungeon;
  enemies?: Enemy[];
  items?: Item[];
  messages?: string[];
  events?: GameEvent[];
  inventory?: {
    items: { name: string; type: string; rarity: string }[];
    selected_index: number;
  };
  dialog?: {
    title: string;
    message: string;
  };
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  game_id: number;
  user_id: number;
  username: string;
  display_name?: string;
  score: number;
  victory: boolean;
  level_reached: number;
  kills: number;
  player_level: number;
  ended_at: string;
}

export interface PlayerRanking {
  rank: number;
  user_id: number;
  username: string;
  display_name?: string;
  high_score: number;
  games_played: number;
  victories: number;
  total_kills: number;
  max_level_reached: number;
}

export interface GlobalStats {
  total_games: number;
  total_victories: number;
  total_players: number;
  total_kills: number;
  average_score: number;
  highest_score: number;
  victory_rate: number;
}

// Chat types
export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_username: string;
  sender_display_name?: string;
  recipient_id?: number;
  recipient_username?: string;
  channel: 'global' | 'system' | 'whisper';
  content: string;
  created_at: string;
}

export interface OnlineUser {
  user_id: number;
  username: string;
  connected_at: string;
}

// Ghost types
export interface GhostFrame {
  turn: number;
  x: number;
  y: number;
  health: number;
  max_health: number;
  level: number;
  dungeon_level: number;
  action: string;
  target_x?: number;
  target_y?: number;
  damage_dealt?: number;
  damage_taken?: number;
  message?: string;
}

export interface GhostSummary {
  game_id: number;
  user_id: number;
  username: string;
  victory: boolean;
  cause_of_death?: string;
  killed_by?: string;
  final_level: number;
  final_score: number;
  total_turns: number;
  frame_count: number;
  started_at: string;
  ended_at: string;
}

export interface GhostDetail extends GhostSummary {
  dungeon_seed?: number;
  frames: GhostFrame[];
}

// Achievement types
export type AchievementCategory = 'combat' | 'progression' | 'efficiency' | 'collection' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  points: number;
  hidden: boolean;
}

export interface UserAchievement {
  achievement_id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  points: number;
  unlocked_at: string;
  game_id?: number;
}

export interface UserAchievementsResponse {
  unlocked: UserAchievement[];
  total_unlocked: number;
  total_points: number;
  total_achievements: number;
  completion_percentage: number;
}

export interface RecentAchievement {
  achievement_id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  points: number;
  unlocked_at: string;
  user_id: number;
  username: string;
  display_name?: string;
}

// Profile types
export interface UserGameHistory {
  id: number;
  victory: boolean;
  score: number;
  level_reached: number;
  kills: number;
  player_level: number;
  turns_taken: number;
  cause_of_death?: string;
  killed_by?: string;
  ended_at: string;
}

export interface UserProfile {
  user_id: number;
  username: string;
  display_name?: string;
  created_at: string;
  rank?: number;
  high_score: number;
  games_played: number;
  victories: number;
  total_deaths: number;
  total_kills: number;
  max_level_reached: number;
  win_rate: number;
  avg_score: number;
  avg_kills_per_game: number;
  favorite_death_cause?: string;
  recent_games: UserGameHistory[];
  achievements: UserAchievement[];
  achievement_points: number;
  achievement_count: number;
  total_achievements: number;
}

export interface PublicProfile {
  user_id: number;
  username: string;
  display_name?: string;
  created_at: string;
  rank?: number;
  high_score: number;
  games_played: number;
  victories: number;
  total_deaths: number;
  total_kills: number;
  max_level_reached: number;
  win_rate: number;
  avg_score: number;
  avg_kills_per_game: number;
  favorite_death_cause?: string;
  achievements: UserAchievement[];
  achievement_points: number;
  achievement_count: number;
  total_achievements: number;
}

// Friend types
export interface Friend {
  user_id: number;
  username: string;
  display_name?: string;
  high_score: number;
  victories: number;
  is_online: boolean;
  since: string;
}

export interface FriendRequest {
  id: number;
  user_id: number;
  username: string;
  display_name?: string;
  high_score: number;
  created_at: string;
}

export interface PlayerSearchResult {
  user_id: number;
  username: string;
  display_name?: string;
  high_score: number;
  victories: number;
  games_played: number;
  is_friend: boolean;
  is_pending: boolean;
  is_online: boolean;
}

export interface FriendsListResponse {
  friends: Friend[];
  total: number;
}

export interface FriendRequestsResponse {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface PlayerSearchResponse {
  results: PlayerSearchResult[];
  total: number;
}

export interface FriendActionResponse {
  success: boolean;
  message: string;
}
