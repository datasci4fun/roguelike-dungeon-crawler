/**
 * Roadmap Data - Future development items with priority and status tracking
 */

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'research';
export type Status = 'planned' | 'in-progress' | 'completed' | 'blocked' | 'deferred';
export type Effort = 'small' | 'medium' | 'large' | 'epic';
export type Category =
  | 'gameplay'
  | 'content'
  | 'backend'
  | 'frontend'
  | '3d'
  | 'audio'
  | 'lore'
  | 'multiplayer'
  | 'infrastructure'
  | 'accessibility';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category: Category[];
  effort: Effort;
  targetVersion?: string;
  dependencies?: string[];
  details?: string[];
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; order: number }> = {
  critical: { label: 'Critical', color: '#ef4444', order: 0 },
  high: { label: 'High', color: '#f97316', order: 1 },
  medium: { label: 'Medium', color: '#eab308', order: 2 },
  low: { label: 'Low', color: '#22c55e', order: 3 },
  research: { label: 'Research', color: '#a855f7', order: 4 },
};

export const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: string }> = {
  planned: { label: 'Planned', color: '#6b7280', icon: '○' },
  'in-progress': { label: 'In Progress', color: '#3b82f6', icon: '◐' },
  completed: { label: 'Completed', color: '#22c55e', icon: '●' },
  blocked: { label: 'Blocked', color: '#ef4444', icon: '✕' },
  deferred: { label: 'Deferred', color: '#4b5563', icon: '◷' },
};

export const CATEGORY_CONFIG: Record<Category, { label: string; icon: string }> = {
  gameplay: { label: 'Gameplay', icon: '🎮' },
  content: { label: 'Content', icon: '📦' },
  backend: { label: 'Backend', icon: '⚙️' },
  frontend: { label: 'Frontend', icon: '🖥️' },
  '3d': { label: '3D', icon: '🎨' },
  audio: { label: 'Audio', icon: '🔊' },
  lore: { label: 'Lore', icon: '📜' },
  multiplayer: { label: 'Multiplayer', icon: '👥' },
  infrastructure: { label: 'Infrastructure', icon: '🔧' },
  accessibility: { label: 'Accessibility', icon: '♿' },
};

export const EFFORT_CONFIG: Record<Effort, { label: string; dots: number }> = {
  small: { label: 'Small', dots: 1 },
  medium: { label: 'Medium', dots: 2 },
  large: { label: 'Large', dots: 3 },
  epic: { label: 'Epic', dots: 4 },
};

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // ============================================================================
  // CRITICAL PRIORITY
  // ============================================================================
  {
    id: 'crit-01',
    title: 'Fix Missing Enum Values',
    description: 'Investigation found no missing enums - TargetType.SELF exists, KitingPhase not needed',
    priority: 'critical',
    status: 'completed',
    category: ['backend'],
    effort: 'small',
    details: [
      'Investigated: CandidateType.SELF not needed - self-buffs use ABILITY with self_buff=True',
      'Investigated: KitingPhase enum does not exist and is not needed',
      'All 54 tests pass, no runtime errors found',
      'Marked as resolved/invalid on 2026-01-12',
    ],
  },
  {
    id: 'crit-02',
    title: 'Ghost Victory Behaviors',
    description: 'All victory ghost behaviors now fully implemented',
    priority: 'critical',
    status: 'completed',
    category: ['backend', 'multiplayer'],
    effort: 'medium',
    details: [
      'Beacon: Points toward stairs with directional guidance',
      'Champion: +3 HP when low health OR combat trial (elite enemy + reward)',
      'Archivist: Reveals tiles (6 radius in lore zones, 4 elsewhere)',
      'Champion trial rewards: +5 HP and +20% damage for 3 combats',
      'Completed 2026-01-12',
    ],
  },

  // ============================================================================
  // HIGH PRIORITY
  // ============================================================================
  {
    id: 'high-01',
    title: 'Database Save System',
    description: 'Persist game state to PostgreSQL with multiple save slots per account',
    priority: 'high',
    status: 'completed',
    category: ['backend'],
    effort: 'large',
    targetVersion: 'v6.5.0',
    details: [
      'GameSave model with user/slot unique constraint',
      'REST API: list, get, create/update, delete saves',
      '3 save slots per user account',
      'Progress metadata for quick display without deserializing',
      'Alembic migration for game_saves table',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'high-02',
    title: 'Complete STEALTH AI',
    description: 'Finish stealth enemy behavior including ambush and concealment mechanics',
    priority: 'high',
    status: 'completed',
    category: ['backend', 'gameplay'],
    effort: 'medium',
    details: [
      'Ambush: backstab deals 3x damage from stealth',
      'Shadow concealment: auto-hide in unlit areas',
      'Light reveals: torchlight exposes hidden enemies',
      'Detection radius: sense invisible enemies within 1 tile',
      'Shimmer effect: detected enemies show as ?',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'high-03',
    title: 'Complete ELEMENTAL AI',
    description: 'Finish elemental enemy behavior with resistance cycling and elemental attacks',
    priority: 'high',
    status: 'completed',
    category: ['backend', 'gameplay'],
    effort: 'medium',
    details: [
      'Element cycling: FIRE→ICE→LIGHTNING every 5 turns',
      'Dynamic resistances: immune to current element',
      'Weakness system: 1.5x damage on element weakness',
      'Element-based ability selection',
      'Visual indicators: color-coded by element',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'high-04',
    title: 'Missing Artifacts',
    description: 'Implement 2 remaining artifacts (5 referenced in lore, only 3 in code)',
    priority: 'high',
    status: 'completed',
    category: ['content', 'lore'],
    effort: 'medium',
    details: [
      'Crown-Splinter: X-ray vision, costs sight range',
      'Ledger of the Unborn: summon phantom ally, costs max HP',
      'All 5 lore artifacts now implemented',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'high-05',
    title: 'Field Pulse Micro-Events',
    description: 'Add 1 micro-event per floor during Field Pulse windows',
    priority: 'high',
    status: 'completed',
    category: ['gameplay', 'lore'],
    effort: 'medium',
    details: [
      'Triggers only during pulse windows',
      'Deterministic per seed/floor',
      '1-2 narrative messages + safe effect',
      'Never blocks paths or violates hazard fairness',
      '8 floor-specific events with unique effects',
      'Each event unlocks codex evidence entry',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'high-06',
    title: 'Error Boundaries',
    description: 'Add React error boundaries for graceful failure handling',
    priority: 'high',
    status: 'completed',
    category: ['frontend'],
    effort: 'small',
    details: [
      'Wrap major components in error boundaries',
      'Display user-friendly error messages',
      'Log errors for debugging',
      'Recovery options where possible',
      'Specialized Graphics3DErrorBoundary for WebGL',
      'Root-level and component-level boundaries',
      'Completed 2026-01-12',
    ],
  },

  // ============================================================================
  // MEDIUM PRIORITY
  // ============================================================================
  {
    id: 'med-01',
    title: 'Micro-Event Codex Evidence',
    description: 'Each Field Pulse micro-event unlocks 1 codex entry for completionists',
    priority: 'medium',
    status: 'completed',
    category: ['lore', 'gameplay'],
    effort: 'small',
    dependencies: ['high-05'],
    details: [
      'Each micro-event has an evidence_* entry',
      'Discovered on first trigger',
      'Adds to sealed-page completion %',
      '8 unique narrative entries added',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'med-02',
    title: 'Extra Enemy Variety',
    description: 'Add 1 "spice" enemy per floor at low spawn weight (5-12%)',
    priority: 'medium',
    status: 'completed',
    category: ['content'],
    effort: 'medium',
    details: [
      'Added 8 floor-specific rare variants (7-8% spawn weight)',
      'F1: Shade (stealth), F2: Bile Lurker (chase)',
      'F3: Thornling (ranged), F4: Doppelganger (stealth)',
      'F5: Frost Wisp (elemental), F6: Ink Phantom (ranged)',
      'F7: Ember Sprite (elemental), F8: Prism Watcher (aggressive)',
      'Each has unique stats, elements, and encounter messages',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'med-03',
    title: 'Battle System Polish',
    description: 'Additional ability effects, arena templates, and boss phase transitions',
    priority: 'medium',
    status: 'completed',
    category: ['gameplay', '3d'],
    effort: 'medium',
    details: [
      'Camera shake on damage (intensity scales with damage amount)',
      'Hit particle burst effects (expand and fade)',
      'Attack telegraph system (pulsing danger zone overlays)',
      'Boss entity glow ring (pulsing purple aura)',
      'All effects auto-cleanup with proper disposal',
      'Completed 2026-01-12',
    ],
  },
  {
    id: 'med-04',
    title: 'Performance Optimization',
    description: 'Canvas texture caching and reduced re-renders for smoother gameplay',
    priority: 'medium',
    status: 'planned',
    category: ['frontend', '3d'],
    effort: 'medium',
    details: [
      'Cache canvas textures instead of regenerating',
      'Reduce unnecessary React re-renders',
      'Optimize Three.js draw calls',
      'Profile and fix memory leaks',
    ],
  },
  {
    id: 'med-05',
    title: 'Keyboard Navigation',
    description: 'Full keyboard support for all menus and inventory management',
    priority: 'medium',
    status: 'planned',
    category: ['accessibility', 'frontend'],
    effort: 'small',
    details: [
      'Tab navigation through UI elements',
      'Arrow key selection in menus',
      'Enter to confirm, Escape to cancel',
      'Focus indicators for current element',
    ],
  },
  {
    id: 'med-06',
    title: 'Screen Reader Labels',
    description: 'ARIA labels for game elements to support screen reader users',
    priority: 'medium',
    status: 'planned',
    category: ['accessibility', 'frontend'],
    effort: 'small',
    details: [
      'Add aria-label to interactive elements',
      'Announce game state changes',
      'Describe visual-only information',
      'Test with common screen readers',
    ],
  },
  {
    id: 'med-07',
    title: 'Secret Ending Hooks',
    description: 'Track conditions for secret ending without revealing requirements',
    priority: 'medium',
    status: 'planned',
    category: ['gameplay', 'lore'],
    effort: 'medium',
    details: [
      'Add invisible tracking flags',
      'Never set SECRET_ENDING_ENABLED yet',
      'Record candidate flags in CompletionLedger',
      'Prepare for future content unlock',
    ],
  },
  {
    id: 'med-08',
    title: 'Boss Documentation Sync',
    description: 'Update documentation to match actual implemented boss roster',
    priority: 'medium',
    status: 'completed',
    category: ['infrastructure'],
    effort: 'small',
    details: [
      'Fixed outdated Lich Lord reference → The Regent',
      'Reordered wardens by floor number (1-8)',
      'All 8 bosses documented with floor assignments',
      'LORE_COMPENDIUM.md now matches constants.py',
      'Completed 2026-01-12',
    ],
  },

  // ============================================================================
  // LOW PRIORITY
  // ============================================================================
  {
    id: 'low-01',
    title: 'ICE Slide Mechanic',
    description: 'Floor 5 ice lanes cause sliding movement (fairness-tested)',
    priority: 'low',
    status: 'planned',
    category: ['gameplay'],
    effort: 'medium',
    details: [
      'Ice tiles already placed in Floor 5',
      'Add sliding momentum when walking on ice',
      'Must not create unwinnable forced-slide scenarios',
      'Requires thorough fairness testing',
    ],
  },
  {
    id: 'low-02',
    title: 'Floor Diorama 3D',
    description: 'Three.js cross-section visualization showing all 8 floors for Home page',
    priority: 'low',
    status: 'planned',
    category: ['frontend', '3d'],
    effort: 'large',
    details: [
      '8 stacked platform layers',
      'Biome-specific colors and effects',
      'Floating enemy/boss icons',
      'Parallax camera on scroll',
    ],
  },
  {
    id: 'low-03',
    title: 'Character Preview 3D',
    description: '3D character preview in character creation screen',
    priority: 'low',
    status: 'planned',
    category: ['frontend', '3d'],
    effort: 'medium',
    details: [
      'Show selected race/class combo',
      'Animated idle pose',
      'Equipment preview',
      'Rotate on drag',
    ],
  },
  {
    id: 'low-04',
    title: 'Achievement System',
    description: 'Track and display player achievements with rarity tiers',
    priority: 'low',
    status: 'planned',
    category: ['gameplay', 'multiplayer'],
    effort: 'large',
    details: [
      '33 planned achievements',
      '5 rarity tiers',
      'Track unlock percentages',
      'Display in profile and dedicated page',
    ],
  },
  {
    id: 'low-05',
    title: 'Daily Challenges',
    description: 'Seeded daily runs with dedicated leaderboard',
    priority: 'low',
    status: 'planned',
    category: ['gameplay', 'multiplayer'],
    effort: 'large',
    details: [
      'Same seed for all players each day',
      'Dedicated leaderboard',
      'Special rewards for top performers',
      'Streak tracking',
    ],
  },
  {
    id: 'low-06',
    title: 'Spectator Mode',
    description: 'Watch other players\' runs in real-time',
    priority: 'low',
    status: 'planned',
    category: ['multiplayer'],
    effort: 'large',
    details: [
      'Real-time game state streaming',
      'Spectator chat',
      'Multiple camera views',
      'Privacy controls for players',
    ],
  },

  // ============================================================================
  // RESEARCH PRIORITY
  // ============================================================================
  {
    id: 'res-01',
    title: '3D Asset Pipeline',
    description: 'CLI workflow for AI-generated 3D models using Meshy, Tripo, or Rodin APIs',
    priority: 'research',
    status: 'planned',
    category: ['3d', 'infrastructure'],
    effort: 'epic',
    details: [
      'Research available AI 3D generation APIs',
      'Design CLI workflow for asset generation',
      'Integration with existing Three.js renderer',
      'Replace procedural geometry with actual 3D assets',
    ],
  },
  {
    id: 'res-02',
    title: 'Mobile Performance',
    description: 'Profile and optimize game for mobile devices',
    priority: 'research',
    status: 'planned',
    category: ['frontend', 'infrastructure'],
    effort: 'large',
    details: [
      'Profile on actual mobile devices',
      'Identify performance bottlenecks',
      'Reduce Three.js complexity on mobile',
      'Test touch controls responsiveness',
    ],
  },
  {
    id: 'res-03',
    title: 'WebGPU Migration',
    description: 'Future-proof 3D rendering by migrating to WebGPU',
    priority: 'research',
    status: 'planned',
    category: ['3d'],
    effort: 'epic',
    details: [
      'WebGPU browser support assessment',
      'Three.js WebGPU renderer evaluation',
      'Performance comparison vs WebGL',
      'Fallback strategy for unsupported browsers',
    ],
  },
  {
    id: 'res-04',
    title: 'Procedural Music',
    description: 'Generate music that responds dynamically to gameplay',
    priority: 'research',
    status: 'planned',
    category: ['audio'],
    effort: 'large',
    details: [
      'Research procedural music generation',
      'Intensity based on combat/exploration',
      'Biome-specific instrumentation',
      'Smooth transitions between states',
    ],
  },
];

// Helper functions
export function getItemsByPriority(priority: Priority): RoadmapItem[] {
  return ROADMAP_ITEMS.filter((item) => item.priority === priority);
}

export function getItemsByStatus(status: Status): RoadmapItem[] {
  return ROADMAP_ITEMS.filter((item) => item.status === status);
}

export function getItemsByCategory(category: Category): RoadmapItem[] {
  return ROADMAP_ITEMS.filter((item) => item.category.includes(category));
}

export function getCompletionStats() {
  const total = ROADMAP_ITEMS.length;
  const completed = ROADMAP_ITEMS.filter((item) => item.status === 'completed').length;
  const inProgress = ROADMAP_ITEMS.filter((item) => item.status === 'in-progress').length;
  return { total, completed, inProgress, percentage: Math.round((completed / total) * 100) };
}

export function getPriorityStats() {
  return {
    critical: getItemsByPriority('critical').length,
    high: getItemsByPriority('high').length,
    medium: getItemsByPriority('medium').length,
    low: getItemsByPriority('low').length,
    research: getItemsByPriority('research').length,
  };
}
