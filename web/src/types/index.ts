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

// Character Creation types
export type RaceId = 'HUMAN' | 'ELF' | 'DWARF' | 'HALFLING' | 'ORC';
export type ClassId = 'WARRIOR' | 'MAGE' | 'ROGUE' | 'CLERIC';

// D&D-style ability scores
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  luck: number;
  str_mod?: number;
  dex_mod?: number;
  con_mod?: number;
  luck_mod?: number;
}

// Ability score modifiers for races and classes
export interface AbilityModifiers {
  str: number;
  dex: number;
  con: number;
  luck: number;
}

// Dice roll result for frontend display
export type DiceRollType = 'attack' | 'damage' | 'saving_throw' | 'ability_check' | 'stat_roll';

export interface DiceRollEvent {
  type: DiceRollType;
  dice_notation: string;  // e.g., "1d20+3", "2d6"
  rolls: number[];        // Individual die results
  modifier: number;
  total: number;
  is_critical?: boolean;
  is_fumble?: boolean;
  target_dc?: number;
  target_ac?: number;
  success?: boolean;
  luck_applied?: boolean;
}

// Attack roll result
export interface AttackRollResult {
  d20_roll: number;
  modifier: number;
  total: number;
  target_ac: number;
  is_hit: boolean;
  is_critical: boolean;
  is_fumble: boolean;
  luck_applied: boolean;
}

// Damage roll result
export interface DamageRollResult {
  dice_notation: string;
  dice_rolls: number[];
  modifier: number;
  total: number;
  damage_type: string;
  is_critical: boolean;
}

// Combat result from backend
export interface CombatResult {
  attacker_id: string;
  target_id: string;
  attack_roll?: AttackRollResult;
  damage_roll?: DamageRollResult;
  damage_dealt: number;
  target_hp_remaining: number;
  is_kill: boolean;
  message: string;
}

export interface RaceDefinition {
  id: RaceId;
  name: string;
  description: string;
  hp_modifier: number;
  atk_modifier: number;
  def_modifier: number;
  trait: string;
  trait_name: string;
  trait_description: string;
  starts_with_feat?: boolean;
  // D&D ability score modifiers
  base_stats?: AbilityModifiers;
  ability_modifiers?: AbilityModifiers;
}

export interface ClassDefinition {
  id: ClassId;
  name: string;
  description: string;
  hp_modifier: number;
  atk_modifier: number;
  def_modifier: number;
  active_abilities: string[];
  passive_abilities: string[];
  // D&D ability score modifiers
  primary_stat?: 'STR' | 'DEX' | 'CON' | 'LUCK';
  ability_modifiers?: AbilityModifiers;
  hit_die?: string;
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

// Feat types
export type FeatCategory = 'COMBAT' | 'DEFENSE' | 'UTILITY' | 'SPECIAL';

export interface PlayerFeat {
  id: string;
  name: string;
  description: string;
  category: FeatCategory;
}

export interface CharacterConfig {
  race: RaceId;
  class: ClassId;
  ability_scores?: AbilityScores;
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
  facing?: { dx: number; dy: number };
  race?: PlayerRace;
  class?: PlayerClass;
  abilities?: PlayerAbility[];
  passives?: PlayerPassive[];
  feats?: PlayerFeat[];
  pending_feat_selection?: boolean;
  available_feats?: PlayerFeat[];
  // D&D ability scores
  ability_scores?: AbilityScores;
  armor_class?: number;
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

// Equipment types
export interface EquippedItem {
  name: string;
  type: string;
  rarity: string;
  description: string;
  // Weapon stats
  attack_bonus?: number;
  damage?: number;
  range?: number;
  is_ranged?: boolean;
  // Armor/Shield stats
  defense_bonus?: number;
  block_chance?: number;
  // Ring stats
  stat_bonuses?: Record<string, number>;
  // Amulet stats
  effect?: string;
  effect_value?: number;
}

export type EquipmentSlot = 'weapon' | 'armor' | 'off_hand' | 'ring' | 'amulet';

export interface EquipmentState {
  weapon: EquippedItem | null;
  armor: EquippedItem | null;
  off_hand: EquippedItem | null;
  ring: EquippedItem | null;
  amulet: EquippedItem | null;
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

// v6.1: Transition state for cinematic mode changes
export type TransitionKind = 'ENGAGE' | 'WIN' | 'FLEE' | 'DEFEAT' | 'BOSS_VICTORY';

export interface TransitionState {
  active: boolean;
  kind: TransitionKind | null;
  elapsed_ms: number;
  duration_ms: number;
  can_skip: boolean;
}

export interface GameState {
  type: string;
  session_id: string;
  game_state: 'TITLE' | 'INTRO' | 'PLAYING' | 'DEAD' | 'VICTORY' | 'QUIT';
  ui_mode: string;
  turn: number;
  // v6.1: Transition state
  transition?: TransitionState;
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
  equipment?: EquipmentState;
  dialog?: {
    title: string;
    message: string;
  };
  // v6.0.5: Battle mode state
  battle?: BattleState;
}

// Battle mode types (v6.0.5)
export interface BattleEntity {
  entity_id: string;
  is_player: boolean;
  arena_x: number;
  arena_y: number;
  hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  name?: string;
  symbol?: string;
  is_elite?: boolean;
  is_boss?: boolean;
  status_effects: string[];
  // v6.11: Initiative system
  display_id?: string;
  initiative?: number;
  // v7.2: Multi-tile size (bosses occupy multiple tiles)
  size_width?: number;  // 1 = normal, 2-3 = large boss
  size_height?: number; // 1 = normal, 2-3 = large boss
}

// v6.11: Turn order entry for UI display
export interface TurnOrderEntry {
  entity_id: string;
  display_id: string;
  name: string;
  initiative: number;
  hp: number;
  max_hp: number;
  is_player: boolean;
  is_elite: boolean;
  is_boss: boolean;
  symbol: string;
}

export interface BattleReinforcement {
  enemy_name: string;
  enemy_type: string;
  is_elite: boolean;
  turns_until_arrival: number;
}

export interface BattleState {
  phase: 'PLAYER_TURN' | 'ENEMY_TURN' | 'END_OF_ROUND';
  arena_width: number;
  arena_height: number;
  arena_tiles: string[][];
  player: BattleEntity;
  enemies: BattleEntity[];
  reinforcements: BattleReinforcement[];
  round: number;
  floor_level: number;
  biome: string;
  // v6.0.5: Artifact state
  duplicate_seal_armed?: boolean;
  woundglass_reveal_active?: boolean;
  safe_tiles_revealed?: [number, number][];
  // v6.11: Turn order system
  turn_order?: TurnOrderEntry[];
  active_entity_index?: number;
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
