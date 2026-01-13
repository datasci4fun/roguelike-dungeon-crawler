/**
 * API client for the roguelike backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      data.detail || `HTTP ${response.status}`,
      data
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text);
}

// Auth API
export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    display_name?: string;
  }) =>
    request<{ access_token: string; token_type: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  login: (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return request<{ access_token: string; token_type: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );
  },

  loginJson: (username: string, password: string) =>
    request<{ access_token: string; token_type: string }>(
      '/api/auth/login/json',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    ),

  me: () =>
    request<{
      id: number;
      username: string;
      email: string;
      display_name?: string;
      high_score: number;
      games_played: number;
      victories: number;
      total_kills: number;
      max_level_reached: number;
    }>('/api/auth/me'),

  refresh: () =>
    request<{ access_token: string; token_type: string }>(
      '/api/auth/refresh',
      { method: 'POST' }
    ),
};

// Leaderboard API
export const leaderboardApi = {
  getTop: (page = 1, pageSize = 10) =>
    request<{
      entries: Array<{
        rank: number;
        game_id: number;
        user_id: number;
        username: string;
        score: number;
        victory: boolean;
        level_reached: number;
        kills: number;
        ended_at: string;
      }>;
      total: number;
      page: number;
      page_size: number;
    }>(`/api/leaderboard/top?page=${page}&page_size=${pageSize}`),

  getWeekly: (page = 1, pageSize = 10) =>
    request(`/api/leaderboard/weekly?page=${page}&page_size=${pageSize}`),

  getDaily: (page = 1, pageSize = 10) =>
    request(`/api/leaderboard/daily?page=${page}&page_size=${pageSize}`),

  getVictories: (page = 1, pageSize = 10) =>
    request(`/api/leaderboard/victories?page=${page}&page_size=${pageSize}`),

  getSpeedrun: (page = 1, pageSize = 10) =>
    request(`/api/leaderboard/speedrun?page=${page}&page_size=${pageSize}`),

  getKills: (page = 1, pageSize = 10) =>
    request(`/api/leaderboard/kills?page=${page}&page_size=${pageSize}`),

  getPlayers: (page = 1, pageSize = 10) =>
    request(`/api/leaderboard/players?page=${page}&page_size=${pageSize}`),

  getStats: () =>
    request<{
      total_games: number;
      total_victories: number;
      total_players: number;
      total_kills: number;
      average_score: number;
      highest_score: number;
      victory_rate: number;
    }>('/api/leaderboard/stats'),

  getMyStats: () => request('/api/leaderboard/me'),

  getMyHistory: (page = 1, pageSize = 10) =>
    request(`/api/leaderboard/me/history?page=${page}&page_size=${pageSize}`),

  getUserStats: (userId: number) =>
    request(`/api/leaderboard/user/${userId}`),

  getGameDetails: (gameId: number) =>
    request(`/api/leaderboard/game/${gameId}`),
};

// Ghost API
export const ghostApi = {
  getForLevel: (level: number, limit = 5) =>
    request(`/api/ghost/level/${level}?limit=${limit}`),

  getByGameId: (gameId: number) => request(`/api/ghost/game/${gameId}`),

  getRecent: (page = 1, pageSize = 10) =>
    request(`/api/ghost/recent?page=${page}&page_size=${pageSize}`),

  getMine: (page = 1, pageSize = 10) =>
    request(`/api/ghost/me?page=${page}&page_size=${pageSize}`),

  getByUser: (userId: number, page = 1, pageSize = 10) =>
    request(
      `/api/ghost/user/${userId}?page=${page}&page_size=${pageSize}`
    ),
};

// Chat API
export const chatApi = {
  getHistory: (limit = 50, beforeId?: number) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (beforeId) params.append('before_id', beforeId.toString());
    return request(`/api/chat/history?${params}`);
  },

  getWhispers: (userId: number, limit = 50, beforeId?: number) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (beforeId) params.append('before_id', beforeId.toString());
    return request(`/api/chat/whispers/${userId}?${params}`);
  },

  getConversations: (limit = 20) =>
    request(`/api/chat/whispers?limit=${limit}`),

  getOnline: () => request('/api/chat/online'),

  getStatus: () => request('/api/chat/status'),
};

// Health API
export const healthApi = {
  check: () => request('/api/health'),
  ready: () => request('/api/health/ready'),
};

// Profile API
export const profileApi = {
  getMyProfile: () =>
    request<{
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
      recent_games: Array<{
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
      }>;
      achievements: Array<{
        achievement_id: string;
        name: string;
        description: string;
        category: string;
        rarity: string;
        icon: string;
        points: number;
        unlocked_at: string;
        game_id?: number;
      }>;
      achievement_points: number;
      achievement_count: number;
      total_achievements: number;
    }>('/api/profile/me'),

  getProfile: (userId: number) => request(`/api/profile/${userId}`),

  getProfileByUsername: (username: string) =>
    request(`/api/profile/username/${username}`),
};

// Achievements API
export const achievementsApi = {
  getAll: () =>
    request<{
      achievements: Array<{
        id: string;
        name: string;
        description: string;
        category: string;
        rarity: string;
        icon: string;
        points: number;
        hidden: boolean;
      }>;
      total: number;
    }>('/api/achievements'),

  getMine: () =>
    request<{
      unlocked: Array<{
        achievement_id: string;
        name: string;
        description: string;
        category: string;
        rarity: string;
        icon: string;
        points: number;
        unlocked_at: string;
        game_id?: number;
      }>;
      total_unlocked: number;
      total_points: number;
      total_achievements: number;
      completion_percentage: number;
    }>('/api/achievements/me'),

  getForUser: (userId: number) => request(`/api/achievements/user/${userId}`),

  getRecent: (limit = 20) => request(`/api/achievements/recent?limit=${limit}`),

  getStats: () => request('/api/achievements/stats'),

  get: (achievementId: string) => request(`/api/achievements/${achievementId}`),
};

// Friends API
export const friendsApi = {
  list: () =>
    request<{
      friends: Array<{
        user_id: number;
        username: string;
        display_name?: string;
        high_score: number;
        victories: number;
        is_online: boolean;
        since: string;
      }>;
      total: number;
    }>('/api/friends'),

  getRequests: () =>
    request<{
      incoming: Array<{
        id: number;
        user_id: number;
        username: string;
        display_name?: string;
        high_score: number;
        created_at: string;
      }>;
      outgoing: Array<{
        id: number;
        user_id: number;
        username: string;
        display_name?: string;
        high_score: number;
        created_at: string;
      }>;
    }>('/api/friends/requests'),

  search: (query: string, limit = 20) =>
    request<{
      results: Array<{
        user_id: number;
        username: string;
        display_name?: string;
        high_score: number;
        victories: number;
        games_played: number;
        is_friend: boolean;
        is_pending: boolean;
        is_online: boolean;
      }>;
      total: number;
    }>(`/api/friends/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  sendRequest: (userId: number) =>
    request<{ success: boolean; message: string }>(
      `/api/friends/request/${userId}`,
      { method: 'POST' }
    ),

  acceptRequest: (userId: number) =>
    request<{ success: boolean; message: string }>(
      `/api/friends/accept/${userId}`,
      { method: 'POST' }
    ),

  rejectRequest: (userId: number) =>
    request<{ success: boolean; message: string }>(
      `/api/friends/reject/${userId}`,
      { method: 'POST' }
    ),

  remove: (userId: number) =>
    request<{ success: boolean; message: string }>(`/api/friends/${userId}`, {
      method: 'DELETE',
    }),
};

// Spectator API
export const spectatorApi = {
  getActiveGames: () =>
    request<{
      games: Array<{
        session_id: string;
        username: string;
        level: number;
        turn_count: number;
        spectator_count: number;
        started_at: string;
      }>;
    }>('/api/game/active'),
};

// Game Constants API (cached from PostgreSQL)
export const gameConstantsApi = {
  getRaces: () =>
    request<Array<{
      race_id: string;
      name: string;
      description: string;
      hp_modifier: number;
      atk_modifier: number;
      def_modifier: number;
      trait: string;
      trait_name: string;
      trait_description: string;
      starts_with_feat: boolean;
    }>>('/api/game-constants/races'),

  getClasses: () =>
    request<Array<{
      class_id: string;
      name: string;
      description: string;
      hp_modifier: number;
      atk_modifier: number;
      def_modifier: number;
      active_abilities: string[] | null;
      passive_abilities: string[] | null;
    }>>('/api/game-constants/classes'),

  getEnemies: (floor?: number) => {
    const params = floor ? `?floor=${floor}` : '';
    return request<Array<{
      enemy_id: string;
      name: string;
      symbol: string;
      hp: number;
      damage: number;
      xp: number;
      weight: number;
      min_level: number;
      max_level: number;
      ai_type: string | null;
      element: string | null;
      abilities: string[] | null;
      resistances: Record<string, number> | null;
    }>>(`/api/game-constants/enemies${params}`);
  },

  getBosses: () =>
    request<Array<{
      boss_id: string;
      name: string;
      symbol: string;
      hp: number;
      damage: number;
      xp: number;
      level: number;
      theme: string | null;
      description: string | null;
      abilities: string[] | null;
      loot: string[] | null;
    }>>('/api/game-constants/bosses'),

  getItems: (category?: string, rarity?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (rarity) params.append('rarity', rarity);
    const queryString = params.toString();
    return request<Array<{
      item_id: string;
      category: string;
      name: string;
      symbol: string;
      description: string;
      rarity: string;
      slot: string | null;
      attack_bonus: number | null;
      defense_bonus: number | null;
      stat_bonuses: Record<string, number> | null;
      block_chance: number | null;
      heal_amount: number | null;
      atk_increase: number | null;
      effect: string | null;
      effect_value: number | null;
      damage: number | null;
      range: number | null;
      is_ranged: boolean;
      key_level: number | null;
    }>>(`/api/game-constants/items${queryString ? `?${queryString}` : ''}`);
  },

  getThemes: () =>
    request<Array<{
      theme_id: string;
      name: string;
      level: number;
      tiles: Record<string, { unicode: string; ascii: string }>;
      decorations: Record<string, string[]>;
      terrain_features: string[];
      torch_count_min: number;
      torch_count_max: number;
    }>>('/api/game-constants/themes'),

  getTraps: () =>
    request<Array<{
      trap_id: string;
      name: string;
      symbol_hidden: string;
      symbol_visible: string;
      damage_min: number;
      damage_max: number;
      cooldown: number;
      effect: string | null;
      detection_dc: number;
    }>>('/api/game-constants/traps'),

  getHazards: () =>
    request<Array<{
      hazard_id: string;
      name: string;
      symbol: string;
      damage_per_turn: number;
      effect: string | null;
      blocks_movement: boolean;
      color: number;
      causes_slide: boolean;
      spreads: boolean;
      slows_movement: boolean;
      drown_chance: number | null;
    }>>('/api/game-constants/hazards'),

  getStatusEffects: () =>
    request<Array<{
      effect_id: string;
      name: string;
      damage_per_turn: number;
      duration: number;
      max_stacks: number;
      stacking: string;
      color: number;
      message: string | null;
      movement_penalty: number | null;
      skip_turn: boolean;
    }>>('/api/game-constants/status-effects'),

  getFloorPool: (floor: number) =>
    request<{
      floor: number;
      enemies: Array<{
        enemy_id: string;
        weight: number;
        theme: string | null;
        lore_aspect: string | null;
      }>;
    }>(`/api/game-constants/floor-pools/${floor}`),

  getCacheStatus: () =>
    request<{
      enemies: { cached: boolean; count: number };
      floor_pools: { cached: boolean; count: number };
      bosses: { cached: boolean; count: number };
      races: { cached: boolean; count: number };
      classes: { cached: boolean; count: number };
      themes: { cached: boolean; count: number };
      traps: { cached: boolean; count: number };
      hazards: { cached: boolean; count: number };
      status_effects: { cached: boolean; count: number };
      items: { cached: boolean; count: number };
      redis: { status: string; used_memory?: string; connected_clients?: number; error?: string };
    }>('/api/game-constants/cache-status'),
};

// WebSocket URLs
export const getGameWsUrl = (token: string) => {
  const wsBase = API_BASE_URL.replace('http', 'ws');
  return `${wsBase}/api/game/ws?token=${token}`;
};

export const getChatWsUrl = (token: string) => {
  const wsBase = API_BASE_URL.replace('http', 'ws');
  return `${wsBase}/api/chat/ws?token=${token}`;
};

export const getSpectateWsUrl = (sessionId: string, token?: string) => {
  const wsBase = API_BASE_URL.replace('http', 'ws');
  const tokenParam = token ? `?token=${token}` : '';
  return `${wsBase}/api/game/ws/spectate/${sessionId}${tokenParam}`;
};

export { ApiError };
