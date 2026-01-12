# Project State

**Last Updated:** 2026-01-12
**Branch:** master
**Version:** v6.5.1 (Roadmap Complete) - SHIPPED

---

## v6.5.1 SHIPPED (2026-01-12) - Roadmap Complete

**Merge Commits:** PRs #21-24 → develop → master

### Summary
All roadmap implementation items completed. Only research/exploratory items remain.

### Completed Roadmap Items

#### Critical Priority (crit-01, crit-02) ✅
- Investigated missing enums - none found, marked resolved
- Ghost victory behaviors fully implemented

#### High Priority (high-01 through high-06) ✅
- **high-01**: Database Save System - PostgreSQL game saves with multiple slots
- **high-02**: Stealth AI - Sneak attacks, backstab detection, noise system
- **high-03**: Elemental AI - Fire/ice/poison elemental behaviors with hazard creation
- **high-04**: Missing Artifacts - All 3 artifacts spawn correctly
- **high-05**: Field Pulse Events - Micro-events with codex evidence
- **high-06**: Error Boundaries - React error boundaries with graceful fallbacks

#### Medium Priority (med-01 through med-07) ✅
- **med-01**: Micro-Event Codex - Evidence collection and display
- **med-02**: Stats Dashboard - Player statistics page
- **med-03**: Social Features - Friends list and activity feed
- **med-04**: Settings Persistence - User preferences saved to backend
- **med-05**: Keyboard Navigation - Arrow key navigation in character creation
- **med-06**: Screen Reader Labels - ARIA labels and live regions for accessibility
- **med-07**: Secret Ending Hooks - SecretFlag enum and SecretProgress tracker

#### Low Priority (low-01 through low-06) ✅
- **low-01**: ICE Slide Mechanic - Players slide on ice tiles until hitting obstacle
- **low-02**: Floor Diorama 3D - Three.js visualization of all 8 floors on Home page
- **low-03**: Character Preview 3D - Interactive 3D character in creation screen
- **low-04**: Achievement System - Already implemented (33 achievements)
- **low-05**: Daily Challenges - Backend API for seeded daily runs with leaderboards
- **low-06**: Spectator Mode - Already implemented (WebSocket streaming)

### Remaining Items (Research Priority)
| ID | Title | Description | Effort |
|----|-------|-------------|--------|
| res-01 | 3D Asset Pipeline | CLI workflow for AI-generated 3D models | Epic |
| res-02 | Mobile Performance | Profile and optimize for mobile devices | Large |
| res-03 | WebGPU Migration | Future-proof 3D rendering | Epic |
| res-04 | Procedural Music | Dynamic music responding to gameplay | Large |

### New Components Created (v6.5.1)

| Component | Purpose |
|-----------|---------|
| `FloorDiorama3D` | 8-floor visualization with biome colors, boss symbols, camera rotation |
| `CharacterPreview3D` | Race/class preview with drag-to-rotate, idle animation |
| `DailyChallenge` model | Seeded daily runs with deterministic generation |
| `DailyChallengeResult` model | User attempt tracking with score/rank |
| `DailyChallengeService` | Streak tracking, leaderboards, daily seed generation |

### API Endpoints Added (v6.5.1)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/daily` | Today's challenge overview with user stats |
| `POST /api/daily/result` | Submit daily challenge result |
| `GET /api/daily/leaderboard` | Daily challenge leaderboard |
| `GET /api/daily/stats` | User's daily challenge statistics |
| `GET /api/daily/streaks` | Active streak leaderboard |

---

## v6.4.0 SHIPPED (2026-01-12) - Frontend Lore Alignment

**Merge Commit:** feature/frontend-lore-alignment → develop → master (PR #19, #20)

### Core Concept
**Immersive pre-game experience aligned with Skyfall Seed lore, plus AI Usage Case Study presentation.**

Complete redesign of Home, Login, Register, and CharacterCreation pages with atmospheric effects, lore integration, and cinematic polish. New About page showcasing AI-built attribution. New Presentation page for Jan 17 share-out.

### Key Features

#### AtmosphericPage Component
- Reusable wrapper with layered effects (z-index stacking)
- Parallax backgrounds (landing, entrance, kingdom, underground)
- Particle systems (dust, embers, mist)
- CRT scanline overlay with intensity options
- Fog and vignette layers
- Optional Three.js canvas layer

#### PhosphorHeader Component
- Animated phosphor text reveals
- Multiple styles (dramatic, emphasis, normal, whisper)
- Configurable delays and callbacks

#### DungeonPortal3D Component
- Three.js animated dungeon entrance
- Flickering torch lights
- Swirling fog with UV animation
- Field glow emanating from portal

#### Page Redesigns
- **Home**: Skyfall Seed lore, floor descriptions, rotating quotes
- **Login**: "Resume Your Descent" with portal background
- **Register**: "Begin Your Legend" with kingdom parallax
- **CharacterCreation**: Race/class lore integration

#### New Pages
- **About**: "Built by AI" technical showcase (4 AI credits, stats, philosophy)
- **Features**: Game features overview
- **Presentation**: 23-slide AI Usage Case Study
  - Export/print functionality for PDF
  - Headers (title + author) and footers (event + page numbers)
  - Title page isolation with page breaks
  - Author: Blixa Markham a.k.a. DataSci4Fun

### Implementation Files

| File | Purpose |
|------|---------|
| `web/src/components/AtmosphericPage/` | Atmospheric wrapper component |
| `web/src/components/PhosphorHeader/` | Phosphor text reveals |
| `web/src/components/DungeonPortal3D/` | Three.js portal background |
| `web/src/data/loreSkyfall.ts` | Lore data (quotes, floors, races, classes) |
| `web/src/pages/Home.tsx` | Redesigned landing page |
| `web/src/pages/Login.tsx` | Atmospheric login |
| `web/src/pages/Register.tsx` | Atmospheric register |
| `web/src/pages/CharacterCreation.tsx` | Lore-enhanced creation |
| `web/src/pages/About.tsx` | AI attribution page |
| `web/src/pages/Features.tsx` | Features overview |
| `web/src/pages/Presentation.tsx` | Case study presentation |

---

## v6.3.1 SHIPPED (2026-01-12) - Battle Polish

**Merge Commit:** fix/v6.3.1-battle-polish → develop

### Core Concept
**Combat polish with smooth animations, damage feedback, and tactical consistency.**

Enemies now properly initiate battles instead of dealing exploration damage, entity sprites animate smoothly, damage numbers float up when hits land, and reinforcements display correct symbols.

### Key Features

#### Enemy Attack Consistency
- Enemies no longer attack directly in exploration mode
- When enemy bumps into player, initiates tactical battle instead
- Same flow whether player or enemy initiates combat

#### Smooth Move Transitions
- Entity sprites lerp to target positions (15% per frame)
- Position tracking via `EntityAnimState` map by entity ID
- HP bars recreated when health changes, preserving position
- Natural, fluid movement instead of instant snapping

#### Floating Damage Numbers
- DAMAGE_NUMBER events spawn floating text sprites
- Red damage numbers rise and fade over 1.2 seconds
- Eased opacity for smooth fade-out
- Automatic cleanup when expired

#### Reinforcement Symbol Fix
- Added `name`, `symbol`, `is_elite`, `is_boss` to BattleEntity
- Added `symbol` to PendingReinforcement
- Fields populated when entities are created
- Serialization updated to send display data to frontend

### Implementation Files

| File | Changes |
|------|---------|
| `src/managers/combat_manager.py` | Enemy bump → start_battle() |
| `src/combat/battle_types.py` | Display fields on BattleEntity/PendingReinforcement |
| `src/combat/battle_manager.py` | Populate display fields on entity creation |
| `server/app/services/game_session.py` | Serialize display fields |
| `web/src/components/BattleRenderer3D.tsx` | Animation system + damage numbers |
| `web/src/pages/Play.tsx` | Pass events to BattleRenderer3D |

### Technical Details

**Entity Animation State:**
```typescript
interface EntityAnimState {
  sprite: THREE.Group;
  currentX: number;
  currentZ: number;
  targetX: number;
  targetZ: number;
  lastHp: number;
}
```

**Damage Number Lifecycle:**
- Created on DAMAGE_NUMBER event with arena coords
- Float speed: 0.002 units/ms
- Duration: 1200ms
- Opacity: `1 - (elapsed/duration)²` (eased fade)

---

## v6.3 SHIPPED (2026-01-12) - Three.js First-Person Battle Renderer

**Merge Commit:** feature/v6.3-battle-firstperson-threejs → develop

### Core Concept
**Immersive first-person 3D tactical combat replacing DOM grid overlay.**

Battle mode now renders in the same Three.js view as exploration, with cinematic overview and mouse-based tile interaction.

### Key Features

#### Three.js Battle Renderer
- First-person 3D arena with biome-themed textures and lighting
- Entity sprites with HP bars (player during overview, enemies always)
- Tile highlighting for move/attack/ability ranges (green/red/blue)
- Mouse-based tile selection with raycasting
- Camera drag controls (right-click or shift+click to look around)
- Cinematic overview phase: zoom_out → pan_enemies → pan_player → settle

#### Overlay Containment
- All cutscenes and overlays contained within scene-wrapper
- CutscenePlayer, TransitionCurtain, GameOver use `position: absolute`
- Proper z-index stacking within 3D view container
- No more full-screen overlays breaking layout

#### Death Cutscene Spacing
- Reduced font sizes for death-title, death-claim, death-whisper
- Tightened line-height and padding for abyss-claims, fate, prompt scenes
- Compact GameOver stats panel and ghost lore components
- All text fits properly within contained 3D view

#### Battle UI Fixes
- BattleHUD with pointer-events: none (panels have their own)
- Fixed mouse-to-tile coordinate calculation (+0.5 offset)
- Removed debug console.log statements
- CharacterHUD allows clicks through to 3D canvas

### Implementation Files

| File | Purpose |
|------|---------|
| `web/src/components/BattleRenderer3D.tsx` | Three.js battle arena renderer |
| `web/src/components/BattleHUD.tsx` | RPG-style battle menu overlay |
| `web/src/components/BattleHUD.css` | Battle menu styling |
| `web/src/components/GameOver.css` | Compact game over styling |
| `web/src/components/CharacterHUD.css` | Pointer-events fix |
| `web/src/cutscenes/engine/CutscenePlayer.scss` | Absolute positioning |
| `web/src/cutscenes/engine/text/RetroCaption.scss` | Death scene spacing |
| `web/src/pages/Play.tsx` | Component containment in scene-wrapper |

### Technical Details

**Arena Rendering:**
- TILE_SIZE = 2, WALL_HEIGHT = 2.5, CAMERA_HEIGHT = 1.4
- Biome-themed floor/wall/ceiling colors from `getBiome()`
- Hazard tiles with emissive glow (lava, poison, water, ice)
- 3-tile padding around arena for immersion

**Tile Coordinate Fix:**
```javascript
// Before (offset by half tile):
const tileX = Math.floor(intersectPoint.x / TILE_SIZE + arena_width / 2);

// After (correct):
const tileX = Math.floor(intersectPoint.x / TILE_SIZE + 0.5 + arena_width / 2);
```

**Z-Index Layering (within scene-wrapper):**
| Layer | Z-Index | Component |
|-------|---------|-----------|
| Battle HUD | 10 | Command menus, status panels |
| TransitionCurtain | 50 | Fade-to-black |
| GameOver/Cutscenes | 100 | Death/victory screens |

### Next Steps
- Polish battle animations (attack effects, damage numbers)
- Add sound effects for battle actions
- Consider isometric camera option for better tactical overview

---

## v6.2.1 SHIPPED (2026-01-11) - Kiting Heuristics

**Merge Commit:** feature/v6.2.1-kiting-heuristics → develop

### Core Concept
**Ranged AI kiting/spacing for hunter-like behavior.**

Ranged enemies now maintain preferred distance, avoid adjacency unless killshot, and don't corner themselves.

### Key Features
- Preferred range band (3-5, sweet spot 4)
- Decisive adjacency penalty (-60) unless killshot
- Break melee lock bonus (+20) when escaping to dist >= 3
- Edge/corner avoidance to prevent self-cornering
- Retreat lane preservation

### Implementation
- `src/combat/ai_kiting.py`: New kiting module (341 lines)
- Applies to `RANGED_KITE` and `ELEMENTAL` AI behaviors
- 13 new tests, 41 total AI tests pass

### Next Steps
- v6.3: Zone-Specific Arenas (zone overrides + boss motifs)
- Alternative: Secret ending hooks or meta progression

---

## v6.2.0 SHIPPED (2026-01-11) - Tactical Depth

**Merge Commit:** feature/v6.2-tactical-depth → develop

### Core Concept
**Deterministic AI scoring and boss-specific heuristics for learnable, fair combat.**

All enemies use numeric scoring to select actions. Bosses layer signature abilities on top. Same seed + same state = same action, always.

### Completed Slices

#### Slice 1: AI Scoring Foundation
- `enumerate_candidate_actions()` - lists legal MOVE/ATTACK/WAIT
- `score_action()` - deterministic numeric scoring
- `choose_action()` - picks best with stable tie-break

**Scoring Weights:**
| Weight | Value | Description |
|--------|-------|-------------|
| W_KILL | 80 | Kill shot priority |
| W_DMG | 2.5 | Per HP damage |
| W_ADJACENCY_MELEE | 18 | Melee wants adjacency |
| W_RANGED_DIST | 12 | Ranged prefers distance 4 |
| W_TOO_CLOSE_PENALTY | 25 | Ranged penalty for dist 1 |

#### Slice 2: Hazard Intelligence
- `min_cost_path_hazard()` - BFS/Dijkstra with hazard costs
- `is_tile_hazard()` - check if tile is dangerous
- `player_safe_escape_count()` - count player's safe options

**Hazard Costs:**
| Tile | Cost | Description |
|------|------|-------------|
| LAVA (~) | 120 | Nearly impassable |
| POISON (!) | 55 | High penalty |
| DEEP_WATER (≈) | 30 | Moderate penalty |
| ICE (=) | 18 | Minor penalty |

**Pressure Scoring:**
- W_EXIT_HAZARD = 15 (bonus for leaving hazard)
- W_STAY_HAZARD = 40 (penalty for staying)
- PRESSURE_WEIGHT = 4 (melee cornering bonus)

#### Slice 3: Boss Heuristics
Priority-based rule system for signature boss behaviors:

| Boss | Signature Abilities |
|------|---------------------|
| Regent | Royal Decree (summon guards), Counterfeit Crown (debuff) |
| Rat King | Summon Swarm, Plague Bite, Burrow (escape) |
| Spider Queen | Web Trap, Poison Bite, Summon Spiders |
| Frost Giant | Freeze Ground, Ice Blast |
| Arcane Keeper | Teleport (when adjacent), Arcane Bolt |
| Flame Lord | Lava Pool, Inferno, Fire Breath |
| Dragon Emperor | Dragon Fear (round 1), Tail Sweep, Fire Breath |

**Key Features:**
- Rule priority system with predicate-based activation
- Cooldown tracking per boss ability
- Falls back to ai_scoring when no rule matches
- Deterministic: same state → same action
- Bosses avoid stepping into lava unless killshot

### Implementation Files

| File | Purpose |
|------|---------|
| `src/combat/ai_scoring.py` | Core AI scoring (Slices 1 & 2) |
| `src/combat/boss_heuristics.py` | Boss decision rules (Slice 3) |
| `src/combat/battle_actions.py` | Boss ability definitions |
| `src/combat/battle_manager.py` | Integration layer |
| `tests/test_ai_scoring.py` | AI scoring tests (28 tests) |
| `tests/test_boss_heuristics.py` | Boss behavior tests |

### Test Results
All 28 tests pass:
- Determinism tests (same state → same action)
- Hazard avoidance tests
- Kill shot priority tests
- Position scoring tests
- Boss-specific behavior tests

### Next Steps
- v6.2.1: Option A - Kiting/spacing heuristics for ranged enemies (recommended)
- v6.3+: Option B - Bresenham LoS + cover tiles (if needed)

---

## v6.1.0 SHIPPED (2026-01-12) - Cinematic Glue

**Merge Commit:** feature/v6.1-cinematic-glue → develop

### Core Concept
**No-flicker transitions between exploration, battle, and cutscene modes.**

Cinematic presentation layer that smooths mode changes with fade-to-black curtains and camera pans.

### Key Features
- Transition orchestrator with input locking
- TransitionKind enum: ENGAGE, WIN, FLEE, DEFEAT, BOSS_VICTORY
- Web transition curtain with phase-based animation
- Letterbox bars for cinematic transitions (ENGAGE, BOSS_VICTORY)
- Arena overview pan on battle start (zoom_out → pan_enemies → pan_player → settle)
- Hazard/edge highlighting during overview
- Skip support (Space/Escape) with clean state reset
- Duration scales by arena size (9×7: 1.5s, 11×9: 1.7s, 11×11: 2.0s)

### Implementation Files
| File | Purpose |
|------|---------|
| `src/core/events.py` | TransitionKind enum, TransitionState dataclass |
| `src/core/engine.py` | start_transition(), tick_transition(), is_input_locked() |
| `src/combat/battle_manager.py` | Emit transitions on battle start/end |
| `web/src/components/TransitionCurtain.tsx` | Fade-to-black overlay |
| `web/src/components/BattleOverlay.tsx` | Arena overview pan |
| `web/src/types/index.ts` | TransitionState TypeScript types |

### Z-Index Layering
| Layer | Z-Index | Component |
|-------|---------|-----------|
| BattleOverlay | 100 | Tactical arena |
| TransitionCurtain | 175 | Fade-to-black |
| Cutscenes | 200+ | Death/Victory cinematics |

### Acceptance Gates Verified
- ✅ Works on 9×7, 11×9, 11×11 arena sizes
- ✅ Skipping resets cleanly, never breaks turn order
- ✅ Player can't act until overview completes/skipped
- ✅ No UI flicker between modes

---

## v6.0.0 SHIPPED (2026-01-11) - Tactical Battle Mode

**Merge Commit:** feature/v6-battle-mode-skeleton → develop

### Core Concept
**Exploration is grid-based; combat is instanced tactical arenas.**

Deterministic battles with reinforcement system and field pulse integration.

### Key Features
- 9x7 tactical arenas with biome-specific templates
- 4 class ability kits (Warrior, Mage, Rogue, Cleric)
- Reinforcement spawning from arena edges
- Field pulse accelerates reinforcement arrival
- Artifact effects in battle (Duplicate Seal, Woundglass, Oathstone)
- Ghost battle effects (Champion, Archivist, Beacon)
- Full save/load support for mid-battle state

### Implementation Files
| File | Purpose |
|------|---------|
| `src/combat/battle_types.py` | BattleState, BattleEntity, PendingReinforcement |
| `src/combat/battle_actions.py` | BattleAction enum |
| `src/combat/battle_manager.py` | Turn processing, abilities, reinforcements |
| `web/src/components/BattleOverlay.tsx` | Arena visualization |
| `web/src/types/index.ts` | Frontend battle types |

### Manual Validation Checklist
- [ ] Engage → win → return to exploration
- [ ] Engage → flee → return to exploration
- [ ] Reinforcement arrives mid-fight
- [ ] Pulse battle (accelerated reinforcements)
- [ ] Artifacts in battle
- [ ] Victory floor 8

### Developer Notes: Determinism
```python
from src.combat.battle_manager import BattleManager
manager = BattleManager(floor_level=3, biome='FOREST', zone_id='canopy_halls', seed=12345)
# Same seed produces identical arena layout and reinforcement queue
```

---

## v5.7.0 Changes (2026-01-11) - Game Integrity Skill

### Game Integrity Validation Skill (`/game-integrity`)

Added comprehensive validation skill to ensure all game systems remain consistent. Invoked via `/game-integrity` or trigger phrases like "validate all game systems".

**17 Validation Steps:**

| Step | Test | What It Validates |
|------|------|-------------------|
| 1 | Environment Check | Core modules compile cleanly |
| 2 | Zone Validation | 8 floors have required zones, start zones exist |
| 3 | Enemy Pool Validation | FLOOR_ENEMY_POOLS weights sum to 100, enemies exist |
| 4 | Encounter Messages | All enemies have first-encounter text |
| 5 | Dragon Constraint | Max 1 dragon per Floor 8 run |
| 6 | Dungeon Structure | All rooms have zones assigned |
| 7 | Lore Codex | 32 lore entries across 8 floors (4 per floor) |
| 8 | Ghost System | 6 ghost types with zone biases and messages |
| 9 | Artifact System | 3 artifacts, 3 vows with required data |
| 10 | Completion Ledger | Serialization roundtrip, legacy derivation |
| 11 | Skybox/Ceiling | Outdoor floors and open-air zones configured |
| 12 | Canonical Matrix | Theme/boss/intro/pools/zones consistency |
| 13 | Seed Determinism | Same seed produces identical dungeons |
| 14 | Save/Load Roundtrip | Ledger, artifact, ghost state survives serialization |
| 15 | Payload Contract | Frontend-required keys present in serializer |
| 16 | Glyph Collision | 53 glyphs distinct (3 acceptable overlaps) |
| 17 | Integration Test | Game launches without errors |

**Skill Location:**
- Primary: `skills/game-integrity/SKILL.md`
- Mirror: `.claude/skills/game-integrity/SKILL.md`

**Usage:**
```
/game-integrity
# or
"run game integrity checks"
"validate all game systems"
```

### Future Roadmap Added

Created `FUTURE_TODO.md` with Content Pass v1 roadmap:

1. **Field Pulse Micro-Events** — 1 authored moment per floor
2. **Micro-Event Codex Evidence** — collectible progress hooks
3. **Extra Thematic Enemy Variety** — 1 spice enemy per floor
4. **ICE Slide Mechanic** — Floor 5 polish
5. **Secret Ending Hooks** — invisible flags for future content

---

## v5.6.0 Changes (2026-01-11) - Core Loop Complete

### Floor-Themed Enemy System

Complete overhaul of enemy spawning to match biome themes. Each floor now has a canonical enemy roster.

**8 New Thematic Enemies:**

| Enemy | Symbol | HP | DMG | Floors | Theme |
|-------|--------|-----|-----|--------|-------|
| Rat | r | 5 | 1 | 2-3 | Sewers |
| Plague Rat | p | 7 | 2 | 2-4 | Sewers (diseased) |
| Spiderling | x | 6 | 2 | 3-4 | Forest (scout) |
| Webweaver | w | 9 | 3 | 3-5 | Forest (intelligent) |
| Oathbound Guard | G | 16 | 5 | 4-6 | Mirror Valdris (undead soldier) |
| Court Scribe | q | 10 | 4 | 4-6 | Mirror Valdris (spectral clerk) |
| Animated Tome | t | 14 | 5 | 6-7 | Library (hostile knowledge) |
| Crystal Sentinel | C | 22 | 8 | 8 | Crystal Cave (guardian) |

**Base Enemy Level Restrictions Fixed:**

| Enemy | Old Range | New Range | Notes |
|-------|-----------|-----------|-------|
| Goblin | 1-5 (default) | 1-3 | Early floors only |
| Skeleton | 1-5 (default) | 1-6 | Common undead throughout |
| Orc | 1-5 (default) | 2-5 | Mid floors |
| Wraith | 1-5 (default) | 3-8 | Mid to late |
| Troll | 1-5 (default) | 5-8 | Late floors only |
| Dragon | 1-5 (default) | **8 only** | Final floor only (was spawning on Floor 1!) |

**FLOOR_ENEMY_POOLS (Theme-First Spawning):**

| Floor | Theme | Primary Enemies (% weight) |
|-------|-------|---------------------------|
| 1 | Stone Dungeon | Goblin (55%), Skeleton (30%) |
| 2 | Sewers | Rat (45%), Plague Rat (25%) |
| 3 | Forest | Spiderling (45%), Webweaver (25%) |
| 4 | Mirror Valdris | Oathbound Guard (35%), Court Scribe (15%) |
| 5 | Ice Cavern | Ice Elemental (30%), Skeleton (20%) |
| 6 | Library | Animated Tome (30%), Necromancer (25%) |
| 7 | Volcanic | Fire Elemental (30%), Demon (20%) |
| 8 | Crystal Cave | Crystal Sentinel (37%), Dragon (8%) |

**Floor 8 Dragon Balance (Fair-Spicy):**
- Dragon weight reduced from 15% to 8%
- Max 1 dragon per floor (reroll + fallback to Crystal Sentinel)
- ~69% of runs encounter exactly 1 dragon, never more

**Zone Weight Multipliers Updated:**
- Floor 2: carrier_nests boosts Rat/Plague Rat 2x
- Floor 3: the_nursery/webbed_gardens boost Spiderling/Webweaver 2x
- Floor 4: mausoleum_district boosts Oathbound Guard 1.6x
- Floor 6: forbidden_stacks boosts Animated Tome/Necromancer 1.5x
- Floor 8: dragons_hoard boosts Dragon 1.5x

**All 8 new enemies have ENEMY_ENCOUNTER_MESSAGES:**
- Thematic first-encounter text for each enemy
- Example: "A webweaver emerges—patient, intelligent, already measuring you in silk."

**Implementation Files:**

| File | Changes |
|------|---------|
| `src/core/constants.py` | Added EnemyType entries, ENEMY_STATS, FLOOR_ENEMY_POOLS |
| `src/managers/entity_manager.py` | spawn_enemies() uses floor pools first, dragon constraint |
| `src/story/story_data.py` | ENEMY_ENCOUNTER_MESSAGES for all new enemies |

### Outdoor Floor Ceiling System

**Floor 4 (Mirror Valdris) now has inverted ceiling logic:**
- Corridors are open-air (sky visible) - outdoor pathways through ruined kingdom
- Rooms are buildings with ceilings
- Specific outdoor plazas (courtyard_squares, throne_hall_ruins) also open-air

This creates the feeling of traveling through an outdoor ruined kingdom with occasional indoor structures.

---

## v5.5.1 Changes (2026-01-11)

### Dev/Testing Cheat Commands

Hotkeys F1-F7 for easier testing:

| Key | Command | Effect |
|-----|---------|--------|
| F1 | God Mode | Toggle invincibility (damage ignored) |
| F2 | Kill All | Kill all enemies on current floor |
| F3 | Heal | Restore HP to maximum |
| F4 | Next Floor | Skip to next floor immediately |
| F5 | Reveal Map | Reveal entire floor (all tiles visible) |
| F6 | Spawn Lore | Spawn a random lore item near player |
| F7 | Show Zones | Toggle zone debug overlay (shows all room zones) |

**Implementation:**
- `src/core/commands.py` - CHEAT_* CommandType enum values
- `server/app/services/game_session.py` - `_process_cheat()` method
- `src/entities/entities.py` - God mode check in `Player.take_damage()`
- `web/src/pages/Play.tsx` - F1-F7 key handlers

### Zone Debug Overlay (F7)

Press F7 to toggle a debug panel showing all zones on the current floor:
- Lists all zones with room counts
- Highlights current player zone in green
- Useful for verifying zone assignment

**Zone Validation Results (5 seeds × 8 floors = ALL PASSED):**
- All required zones spawn on every floor
- Start zones spawn correctly
- Boss approach zones spawn (2 per floor)
- Optional zones vary with generation

### Boss Spawn Fix

Fixed missing boss spawn on floor 1:
- `start_new_game()` in `engine.py` was calling `spawn_enemies()` and `spawn_items()` but forgot `spawn_boss()`
- Added `self.entity_manager.spawn_boss(self.dungeon, self.player)` to ensure boss always spawns
- Verified: All 8 floors now spawn exactly 1 boss (40/40 test seeds pass)

### 100% Completion Verification

Verified that all collectibles spawn correctly and 100% completion is achievable:

**Completion Requirements (Sealed Page):**

| Category | Total | Weight | Verified |
|----------|-------|--------|----------|
| Floors Cleared | 8 | 25% | All spawn |
| Wardens Defeated | 8 | 25% | All spawn (1 per floor) |
| Lore Discovered | 32 | 25% | All spawn (4 per floor, 62-96% rate) |
| Artifacts Collected | 3 | 15% | All spawn (15-38% rate per floor) |
| Evidence Found | 16 | 10% | All spawn (2 per floor) |

**Spawn Verification Tests:**

| Test | Seeds | Result |
|------|-------|--------|
| Lore items | 50/floor | All 32 lore items spawn |
| Artifacts | 200/floor | All 3 artifacts spawn |
| Ghosts | 300×8 floors | All 6 ghost types spawn |
| Evidence | 100×8 floors | All 16 evidence items spawn |
| Zone evidence markers | 100×8 floors | 100% of floors have markers |
| Bosses | 40 seeds | All 8 bosses spawn (1 per floor) |

**Sealed Page Tracking:**
- 0% → 100% percentage calculation verified
- Weight formula: 25% floors + 25% wardens + 25% lore + 15% artifacts + 10% evidence
- At 100%: Shows "The page remains sealed. Something else is required."
- Incomplete: Shows "Condition: ???"

### Auto-Add Lore to Codex

Lore items (scrolls/books) now go directly to the Lore Codex on pickup instead of taking up inventory space:

| Behavior | Before | After |
|----------|--------|-------|
| Pickup | Added to inventory | Skipped, goes to Codex |
| Message | "Picked up X" | "Found: X" + "New lore added to Codex! Press [J] to read." |
| Inventory | Takes 1 slot | No slot used |
| Discovery | Manual (open inventory, select, read) | Automatic on pickup |

**Frontend Notification:**
- Golden notification bar appears at bottom of screen
- Shows: "New lore discovered: {title} - Press [J] to read"
- Pressing J opens Codex directly to the new entry
- Notification clears when Codex is closed

**Implementation:**

| File | Change |
|------|--------|
| `entity_manager.py` | Detect lore items by `lore_id`, skip inventory |
| `combat_manager.py` | Auto-call `story_manager.discover_lore()` on pickup |
| `engine.py` | Track `new_lore_discovered` for frontend notification |
| `game_session.py` | Send `new_lore` in API response (one-shot) |
| `useGameSocket.ts` | Add `new_lore` type to game state |
| `Play.tsx` | Track pending lore, show notification, pass to Codex |
| `Play.css` | Styled notification bar with slide-in animation |
| `LoreCodex.tsx` | Accept `initialEntryId` prop |
| `useCodexState.ts` | Pre-select initial entry and category |

### UI Bug Fixes

**Entity Label Clipping (3D Renderer):**
- Labels were being clipped/unreadable for long names
- Fixed with dynamic canvas sizing based on text width
- Added semi-transparent background pill for visibility
- Strong text outline stroke for contrast
- Larger sprite scale (0.8 vs 0.5) and better positioning
- Items get +0.6 offset, enemies/NPCs get +1.1 offset

**Rat Spawn Attribute Error:**
- Fixed `rat.hp` → `rat.health` in Rat King's summon_swarm ability
- Enemy class uses `health` attribute, not `hp`

---

## Completed: Zone System (Data-Driven) - All 8 Floors

**Branch:** `feature/zone-system`
**Status:** All 8 floors implemented and validated (20/20 seeds each)

### Zone System Architecture

Data-driven zone assignment with modular layout decorators:

| File | Purpose |
|------|---------|
| `zone_config.py` | FloorZoneConfig dataclass, eligibility predicates, per-floor configs |
| `zone_layouts.py` | Layout decorator registry, ZONE_LAYOUTS[(floor, zone_id)] pattern |
| `zone_validation.py` | Validation harness for testing zone assignment across seeds |
| `dungeon.py` | Config-driven _assign_zones(), enhanced get_zone_summary() |
| `entity_manager.py` | Zone-aware spawns and lore with per-floor configs |

### Adding a New Floor

1. Add `FLOOR_N_CONFIG` to `zone_config.py` with zone specs
2. Add layout handlers to `zone_layouts.py` with `@register_layout(N, "zone_id")`
3. Add spawn modifiers to `entity_manager._apply_zone_weights()`
4. Add lore config to `entity_manager._get_floorN_lore_config()`
5. Run validation: `python -c "from src.world.zone_validation import validate_floor; validate_floor(N)"`

### Implemented Floors

**Floor 1 - Stone Dungeon:**
| Zone | Rule | Special |
|------|------|---------|
| intake_hall | Start room | 0% elite |
| wardens_office | Required (center) | 100% lore |
| record_vaults | Required (center, 5x5+) | 60% lore |
| cell_blocks | 8x6+ | Interior walls, goblins x1.5 |
| guard_corridors | Elongated | Skeletons x1.4 |
| execution_chambers | 7x7+ | Skeletons x1.2 |
| boss_approach | Near boss (adaptive) | Goblins x2.0, guaranteed lore |

**Floor 2 - Sewers (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| confluence_chambers | Start room | Central water feature |
| colony_heart | Required (largest) | Debris pools, 100% lore |
| seal_drifts | Required (center, 5x5+) | 70% lore, surface-doc biased |
| carrier_nests | Required (4x4+) | Debris patches, rat bias |
| waste_channels | Elongated | DEEP_WATER lanes |
| maintenance_tunnels | Any room | Sparse decoration |
| diseased_pools | 5x5+ | Central water pool |
| boss_approach | Near boss (adaptive) | Guaranteed lore |

**Floor 3 - Forest Depths (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| root_warrens | Start room, weighted high | Chokepoint partitions |
| druid_ring | Required (center, 8x8+) | Ritual ring, 100% lore |
| nursery | Required (largest, 8x8+) | High danger, edge hazards |
| canopy_halls | 8x8+ landmark | Optional water pool |
| webbed_gardens | 6x6+ | Scattered hazards (traps) |
| digestion_chambers | 6x6+ | Central hazard pool |
| boss_approach | Near boss (adaptive) | Spider bias x2, guaranteed lore |

**Floor 4 - Mirror Valdris (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| courtyard_squares | Start room, 8x8+ | Optional fountain |
| throne_hall_ruins | Required (largest, 10x8+) | Symmetric aisle markers |
| oath_chambers | Required (center, 7x7+) | Ring geometry, 100% lore |
| seal_chambers | High-weight (5x5+) | Corner workstations, 75% lore |
| record_vaults | High-weight (5x5+) | Shelf rows, 75% lore |
| mausoleum_district | 5x5+ | Tomb row pattern, skeleton x2 |
| parade_corridors | Elongated fallback | Symmetric markers |
| boss_approach | Near boss (adaptive) | Skeleton x1.6, guaranteed lore |

**Floor 5 - Ice Cavern (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| frozen_galleries | Start room, elongated | ICE lanes, skeleton x1.5 |
| breathing_chamber | Required (largest, 10x8+) | Edge condensation |
| suspended_laboratories | Required (center, 6x6+) | ICE patches, 100% lore |
| thaw_fault | Required (5x5+) | ICE + DEEP_WATER paradox |
| ice_tombs | 6x6+ | Corner ICE patches, skeleton x1.8 |
| crystal_grottos | 7x7+ | Optional ICE ring |
| boss_approach | Near boss (adaptive) | Skeleton x1.8, guaranteed lore |

**Floor 6 - Ancient Library (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| reading_halls | Start room, 7x7+ | Open center, lower density |
| indexing_heart | Required (center, 8x8+) | Ring markers, 100% lore |
| catalog_chambers | Required (center, 6x6+) | 75% lore |
| forbidden_stacks | 6x6+ fallback | Interior wall partitions |
| marginalia_alcoves | 4x4+ | Small nooks, 60% lore |
| experiment_archives | 6x6+ | Volatile markers |
| boss_approach | Near boss (adaptive) | Skeleton x1.5, guaranteed lore |

**Floor 7 - Volcanic Depths (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| forge_halls | Start room, 7x7+ | Work lane stubs |
| crucible_heart | Required (largest, 8x8+) | Edge LAVA ring, 100% lore |
| rune_press | Required (center, 7x7+) | Frame stubs, 60% lore |
| magma_channels | Elongated | Central LAVA lane |
| ash_galleries | Any room fallback | Trap-ready (future) |
| cooling_chambers | 6x6+ | DEEP_WATER troughs |
| slag_pits | 5x5+ | Corner LAVA puddles |
| boss_approach | Near boss (adaptive) | LAVA offerings, guaranteed lore |

**Floor 8 - Crystal Cave (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| crystal_gardens | Start room/fallback, 7x7+ | Scenic landmark |
| dragons_hoard | Required (largest, 8x8+) | 100% lore, higher danger |
| oath_interface | Required (center, 7x7+) | Binding circle, 85% lore |
| vault_antechamber | High-weight (8x8+) | Threshold room, 75% lore |
| seal_chambers | 7x7+ | Ring with gap (failing seal) |
| geometry_wells | 6x6+ | Lattice nodes |
| boss_approach | Near boss (adaptive) | Scorch orbit marks, guaranteed lore |

### Zone Assignment Guarantees

- **Required zones always appear** (eligibility relaxed if needed)
- **Boss approach count is adaptive** (reduced if not enough rooms)
- **Validation harness** catches regressions across 20 seeds
- **All 8 floors validated** with 20/20 seeds passing

### Canon Alignment (v5.5.0)

All floor-to-theme-to-boss mappings now use a single source of truth:

| Floor | Theme | Boss | Biome |
|-------|-------|------|-------|
| 1 | STONE | Goblin King (K) | Stone Dungeon |
| 2 | SEWER | Rat King (r) | Sewers of Valdris |
| 3 | FOREST | Spider Queen (S) | Forest Depths |
| 4 | CRYPT | The Regent (R) | Mirror Valdris |
| 5 | ICE | Frost Giant (F) | Ice Cavern |
| 6 | LIBRARY | Arcane Keeper (A) | Ancient Library |
| 7 | VOLCANIC | Flame Lord (Φ) | Volcanic Depths |
| 8 | CRYSTAL | Dragon Emperor (E) | Crystal Cave |

**Alignment Fixes Applied:**
- `BOSS_STATS[*]['level']` now matches `LEVEL_BOSS_MAP` exactly
- Rat King symbol changed from 'K' to 'r' (avoid Goblin King collision)
- Floor 4 display name overridden to "Mirror Valdris" (uses CRYPT theme)
- `audioConfig.ts` uses biome-based track IDs mapped to canon floors
- `SceneRenderer/types.ts` theme union includes all 8 biomes
- `DungeonTheme` enum comments no longer contain level numbers

**Validation:**
- `validate_floor_canon()` checks LEVEL_THEMES, LEVEL_BOSS_MAP, BOSS_STATS levels, and intro keywords
- Run: `python -c "from src.story.lore_items import validate_floor_canon; print(validate_floor_canon())"`

### Sealed Page (Codex Entry)

A mysterious "SEALED PAGE" entry in the Lore Codex (category: 'meta') shows completion progress:

| Metric | Source |
|--------|--------|
| Overall % | Weighted: 25% floors + 25% wardens + 25% lore + 15% artifacts + 10% evidence |
| Floors Cleared | X/8 |
| Wardens Defeated | X/8 |
| Lore Discovered | X/total |
| Evidence Found | X/total |
| Artifacts Collected | X/total |
| Echoes Witnessed | count |

**Display Logic:**
- Always shows "Condition: ???"
- At 100% completion: "The page remains sealed. Something else is required."
- Hints at hidden unlock condition without revealing it

**Implementation:**
- `story_manager.get_sealed_page_entry()` calculates progress from CompletionLedger
- `game_session.py` includes sealed page in Codex response
- Frontend types: `SealedData` interface, `isSealedEntry()` type guard

### Hazard Tile Effects

Zone layouts paint hazard tiles that now have gameplay effects:

| Tile Type | Effect |
|-----------|--------|
| LAVA | 5 damage/turn + burn status |
| POISON_GAS | Applies poison effect, spreads each turn |
| DEEP_WATER | Costs 2 turns to cross (enemies get extra action), drown risk at <25% HP |
| ICE | Cosmetic only (causes_slide=False, slide mechanic deferred) |

**Implementation:**
- `dungeon._sync_tile_hazards()` converts TileType tiles to Hazard objects
- `is_walkable()` now includes hazard tiles (walkable but dangerous)
- `engine._process_hazards()` returns slow terrain flag for deep water penalty

### Hazard Fairness Guarantees

- `dungeon._ensure_hazard_fairness()` runs after hazard sync
- Clears hazards from critical positions (player, stairs)
- `_ensure_room_safe_path()` prevents >60% hazard density in rooms
- Safe lane carved through center if needed

### Zone Evidence System

Visual "tells" placed in zones to guide player toward boss and lore:

| Evidence Type | Location | Purpose |
|---------------|----------|---------|
| trail_tells | boss_approach (2-3 per room) | Blood, drag marks, residue - hints at boss |
| lore_markers | boss_approach (1 per room) | Document scraps, warning signs |
| evidence_props | key lore zones | Zone-themed objects (shackles, documents) |

**All 8 Floor Evidence Configs:**
- Floor 1 (Stone): Blood drips, shackles, key fragments
- Floor 2 (Sewers): Rat droppings, slime trails, debris
- Floor 3 (Forest): Bone fragments, webbing, egg sacs
- Floor 4 (Valdris): Blood, ash, ghostly residue, seal fragments
- Floor 5 (Ice): Ice crystals, frost marks, frozen specimens
- Floor 6 (Library): Ink drops, page scraps, arcane residue
- Floor 7 (Volcanic): Slag drips, ember marks, forged runes
- Floor 8 (Crystal): Crystal shards, gold dust, dragon scales

**Implementation:**
- `dungeon._place_zone_evidence()` places evidence post-layout
- `dungeon._get_evidence_config()` returns floor-specific evidence lists
- Evidence rendered via `renderer._render_zone_evidence()`

### Centralized Lore IDs

All lore IDs now defined in `src/story/lore_items.py`:

```python
from src.story import validate_lore_id, validate_story_data

# Validate single ID
validate_lore_id("journal_adventurer_1")

# Validate all story_data.py entries
errors = validate_story_data()
```

Benefits:
- Catches typos at import time
- Floor-indexed lookup: `FLOOR_LORE_IDS[floor]`
- Consistency check between lore_items.py and story_data.py

### Per-Room Ceiling/Skybox System

Backend sends room ceiling state in FirstPersonView:

| Field | Type | Description |
|-------|------|-------------|
| zone_id | string | Current room's zone ID (e.g., "courtyard_squares") |
| room_has_ceiling | bool | False for open-air rooms, true by default |
| room_skybox_override | string? | Biome ID for skybox palette (null = use fog color) |

**Open-air zones with biome-appropriate skies:**
- Floor 3 `canopy_halls` → forest palette (green canopy)
- Floor 4 `courtyard_squares` → crypt palette (eerie purple)
- Floor 8 `dragons_hoard` → crystal palette (mystical)

**Implementation:**
- `game_session._serialize_first_person_view()` adds ceiling fields
- `FirstPersonRenderer3D.tsx` skips ceiling geometry when `room_has_ceiling=false`
- Simple sky plane added for open-air rooms

### Boss Roster (Aligned with Lore)

| Floor | Boss | Theme |
|-------|------|-------|
| 1 | Goblin King | Stone Dungeon (prison warden) |
| 2 | Rat King | Sewers (plague carrier) |
| 3 | Spider Queen | Forest Depths (nature's curse) |
| 4 | **The Regent** | Mirror Valdris (counterfeit monarch) - see abilities below |
| 5 | Frost Giant | Ice Cavern (frozen experiment) |
| 6 | Arcane Keeper | Ancient Library (knowledge guardian) |
| 7 | Flame Lord | Volcanic Depths (forge master) |
| 8 | Dragon Emperor | Crystal Cave (dragon's hoard) |

**Note:** LICH_LORD removed from active warden rotation (no longer matches floor themes).

### The Regent Abilities

Signature abilities for Floor 4 boss, themed around "legitimacy by repetition":

| Ability | Cooldown | Effect |
|---------|----------|--------|
| Royal Decree | 5 turns | Summons 1-2 oath-bound guards from room corners |
| Summon Guard | 4 turns | Summons 1 oath-bound skeleton near the Regent |
| Counterfeit Crown | 8 turns | Flash attack: 4 damage + stun in 3 range |

**Flavor:** The Regent's decrees "rewrite reality" - guards appear as if they were always meant to be there. Messages emphasize this ("It was always thus...").

### Field Pulse System

Deterministic environmental surges that temporarily amplify zone behaviors:

**Branch:** `feature/field-pulses`

| Property | Value |
|----------|-------|
| Pulses per floor | 1-3 (deeper floors have more) |
| Trigger turns | Seeded, well-spaced (10-150) |
| Effect duration | 3-8 turns based on intensity |

**Intensity Levels:**

| Level | Multiplier | Duration | Message |
|-------|------------|----------|---------|
| Minor | 1.25x | 3 turns | "The Field stirs..." |
| Moderate | 1.5x | 5 turns | "The Field surges!" |
| Major | 2.0x | 8 turns | "THE FIELD ERUPTS!" |

**Amplification Effects:**
- Hazard damage multiplied (lava, poison gas)
- Enhanced narrative messages ("The lava SURGES and burns you...")
- Visual overlay on frontend (pulsing orange glow when active)

**Implementation:**

| File | Purpose |
|------|---------|
| `field_pulses.py` | FieldPulseManager, seeded pulse generation |
| `engine.py` | `_process_field_pulse()` tick on player actions |
| `hazards.py` | Amplification parameter in `affect_entity()` |
| `serialization.py` | Pulse state save/load |
| `game_session.py` | `field_pulse` in API response |
| `FirstPersonRenderer3D.tsx` | Visual overlay for active pulses |

**Fairness:** Pulses amplify existing hazard damage but don't spawn new hazards or break zone validation (all 8 floors pass 20/20 seeds).

### Sky-Touched Artifacts (MVP)

Rare artifacts (0-1 per floor) with powerful effects and clear costs:

**Branch:** `feature/sky-touched-artifacts`

| Artifact | Effect | Cost | Zones |
|----------|--------|------|-------|
| **Duplicate Seal** | Duplicates next consumable use | Spawns Oath-Bound Witness enemy | seal_drifts, record_vaults, seal_chambers |
| **Woundglass Shard** | Reveals path to stairs | Boosts next Field Pulse intensity | catalog_chambers, record_vaults, geometry_wells |
| **Oathstone** | Choose floor vow for rewards | Stun + penalty if broken | oath_chambers, oath_interface, throne_hall_ruins |

**Oathstone Vows:**

| Vow | Restriction | Reward |
|-----|-------------|--------|
| Vow of Abstinence | No potions this floor | +2 max HP |
| Vow of Progress | No revisiting rooms | +1 attack |
| Vow of Confrontation | Defeat boss without fleeing | Guaranteed rare loot |

**Implementation:**

| File | Purpose |
|------|---------|
| `artifacts.py` | ArtifactId, ArtifactInstance, ArtifactManager |
| `entity_manager.py` | Zone-biased spawning, pickup |
| `entities.py` | Player artifact inventory (max 2) |
| `serialization.py` | Save/load support |
| `game_session.py` | API artifact state |

**Spawn Stats (20-seed test):**
- Overall rate: ~22% per floor
- Deeper floors have higher rates (15% → 35%)
- Zone bias: 2x weight in themed zones

### Ghost Differentiation (Milestone F)

Death ghosts and victory imprints with zone-biased placement and unique behaviors:

**Death Ghosts (from players who died):**

| Type | Symbol | Behavior | Zone Bias |
|------|--------|----------|-----------|
| **Echo** | `~` | Path loop leading to lore/stairs | confluence_chambers, guard_corridors, geometry_wells |
| **Hollowed** | `H` | Hostile wandering remnant (elite enemy) | digestion_chambers, diseased_pools, slag_pits |
| **Silence** | `?` | Debuff area marking absence | oath_chambers, record_vaults, seal_chambers |

**Victory Imprints (from players who won):**

| Type | Symbol | Behavior | Zone Bias |
|------|--------|----------|-----------|
| **Beacon** | `*` | Guidance cue toward stairs | intake_hall, confluence_chambers, boss_approach |
| **Champion** | `+` | One-time combat assist (+3 temp HP) | boss_approach, the_nursery, colony_heart |
| **Archivist** | `@` | Knowledge reveal (reveals nearby tiles) | record_vaults, catalog_chambers, seal_chambers |

**Per-Floor Limits:**
- Echo: 2, Hollowed: 2, Silence: 1
- Beacon: 1, Champion: 1, Archivist: 1

**Fairness Guarantees:**
- Silence never spawns on stairs
- Echo paths always lead to meaningful destinations (lore zones or stairs)
- Hollowed converted to elite enemies (uses existing combat system)

**Implementation:**

| File | Purpose |
|------|---------|
| `ghosts.py` | GhostType, Ghost, GhostPath, GhostManager |
| `entities/__init__.py` | Ghost exports |
| `engine.py` | Ghost manager initialization, tick processing |
| `level_manager.py` | Ghost initialization on level transitions |
| `serialization.py` | Ghost state save/load |

**Validation Stats (50-seed test):**
- Spawn rate: ~49% of floors have ghosts
- Average per floor (when present): 1.18 ghosts
- Echo meaningfulness: 100% have valid paths
- Zone bias working: 85.7% of Echoes in preferred zones

### Ghost Legibility Pass

Presentation improvements to make ghosts unambiguous and epic:

**Glyph Changes (avoiding collisions):**

| Type | Old | New | Reason |
|------|-----|-----|--------|
| Echo | `~` | `ε` | Conflicts with LAVA tile |
| Silence | `?` | `Ø` | Ambiguous (unknown/tooltip) |
| Beacon | `*` | `✧` | Conflicts with decoration |
| Champion | `+` | `†` | Conflicts with DOOR_LOCKED tile |
| Archivist | `@` | `§` | Conflicts with PLAYER symbol |

**Anti-Spam Guard:**
- Each ghost type message triggers once per floor
- Tracked via `_messages_shown` set in GhostManager
- Persisted in save state

**Improved Encounter Messages:**
- Echo: Hints at destination type ("leads somewhere significant..." vs "traces a safe route...")
- Archivist: Zone-aware reveal ("Ancient records shimmer..." in lore zones, larger reveal radius)
- Champion: Clear buff message ("A surge of strength flows through you!")

**3D Renderer Entity Labels:**
- Entities now display symbol on colored circular sprite (instead of plain sphere)
- Full name floats above each entity
- Canvas-drawn text for crisp rendering at any distance

### Derived Victory Legacy (CompletionLedger)

Victory imprint type is now derived deterministically from run statistics (no RNG):

**CompletionLedger Tracking:**

| Metric | Description |
|--------|-------------|
| floors_cleared | Set of floor numbers cleared |
| wardens_defeated | Set of boss type names defeated |
| lore_found_ids | Set of lore item IDs collected |
| artifacts_collected_ids | Set of artifact IDs picked up |
| ghost_encounters | Dict of ghost type → count |
| total_kills | All enemy kills |
| elite_kills | Elite enemy kills only |
| damage_taken | Total damage received |
| potions_used | Consumable count |
| secrets_found | Set of discovered secrets |

**Legacy Derivation Rules:**

| Condition | Primary Legacy | Secondary |
|-----------|---------------|-----------|
| Low combat + Low lore | BEACON | None |
| High combat (≥20 kills) + Low lore | CHAMPION | None |
| Low combat + High lore (≥5) | ARCHIVIST | None |
| High combat + High lore (combat ≥ lore) | CHAMPION | archivist_mark |
| High combat + High lore (lore > combat) | ARCHIVIST | champion_edge |

**Secondary Flourish Effects:**
- `archivist_mark`: On ghost tick, reveals undiscovered tiles around player
- `champion_edge`: On ghost tick, grants +2 max HP (one-time)

**Ending Resolution:**
- `resolve_ending(ledger, player_alive)` returns EndingId
- Death → `DEATH_STANDARD`
- Victory (no secret) → `VICTORY_STANDARD`
- Victory + `SECRET_ENDING_ENABLED` flag → `VICTORY_SECRET` (unreachable until flag is set)

**Implementation:**

| File | Purpose |
|------|---------|
| `completion.py` | CompletionLedger, EndingId, VictoryLegacy, derive_victory_legacy(), resolve_ending() |
| `engine.py` | Ledger initialization, ghost encounter tracking |
| `combat_manager.py` | Kill tracking (regular + elite), damage tracking, warden defeats, lore/artifact pickup |
| `level_manager.py` | Floor cleared tracking |
| `serialization.py` | Ledger save/load |
| `ghosts.py` | Uses derived legacy for victory imprints, secondary flourish application |

**Validation Tests (test_completion_ledger.py):**
- Serialization determinism
- Legacy derivation determinism
- Legacy rules (low/high combat + lore)
- Hybrid tie-break (combat vs lore priority)
- Ending resolution (death/victory/secret)
- VictoryLegacyResult serialization

### Balance + UX Pass

**Dev Telemetry:**
- Victory/death telemetry logged to console with run stats
- Tracks: kills, elite_kills, lore_count, damage_taken, potions_used, total_turns
- Shows derived legacy and secondary tag at victory
- Useful for tuning COMBAT_HIGH_THRESHOLD (20) and LORE_HIGH_THRESHOLD (5)

**HUD Indicators (StatusHUD.tsx):**

| Indicator | Display | States |
|-----------|---------|--------|
| Field Pulse | Intensity label + animation | Minor (1.25x) / Moderate (1.5x) / Major (2.0x) |
| Duplicate Seal | Armed/Used status | Green glow when armed, dimmed when used |
| Oathstone Vow | Active vow + description | Purple when active, red pulse when broken |
| Woundglass Shard | Charges remaining | Shows charge count |

**Evidence Density Cap:**
- Per-room limit based on room size
- Small rooms (<30 tiles): max 2 evidence
- Medium rooms (30-60 tiles): max 3 evidence
- Large rooms (>60 tiles): max 4 evidence
- Trail tells reduced to max 2 per boss_approach room

**3D Performance Optimizations:**

| Optimization | Value | Description |
|--------------|-------|-------------|
| Label cull distance | 6 tiles | Labels not rendered beyond this |
| Sprite cull distance | 10 tiles | Entity sprites not rendered beyond this |
| Max labels | 8 | Closest entities get priority |
| Distance sorting | Yes | Entities sorted for proper priority |

Pulse overlay uses CSS-only radial gradient (GPU-accelerated, minimal overhead).

### Future Enhancements

- Add zone-specific decoration patterns
- Add new enemy types (fire elementals, wraiths, dragon fragments)
- Implement ice sliding mechanic

---

## Recently Completed: Lore Compendium

**Branch:** `feature/lore-compendium-v2`
**Commit:** `0a19be1` - docs: enhance zone specs with detailed implementation requirements

### New Lore Canon: The Skyfall Seed

Complete world lore rewrite introducing the Skyfall Seed mythos (1326 lines):

| Section | Description |
|---------|-------------|
| **Prologue: The Wound Beneath** | Reality-editing threat, no coherent survivors return |
| **The Skyfall Seed** | What Fell, The Field, narrative substitution mechanics |
| **The Counterfeit Reign** | Monarchy rewrite threat driving player motivation |
| **Dungeon Depths** | All 8 levels as Field pockets/aspects |
| **Bestiary** | Field-consistent enemy descriptions |
| **Wardens** | 8 bosses with "What It Was / What It Became" backstories |
| **Echoes & Imprints** | Ghost mechanics (death) and victory legacy types |
| **Discoverable Lore** | Contradictory historical records showing Field edits |
| **Victory & Death** | Cinematics matching new canon |
| **Terminology** | Field, Pocket, Seam, Warden, Echo, Imprint definitions |

### Key Concepts

- **The Field**: Reality-editing influence that spreads via narrative substitution
- **Pockets**: Crystallized layers of edited reality (dungeon levels)
- **Seams**: Thin corridors between pockets where Field grip is weaker
- **Wardens**: Former beings transformed into living locks sealing the Seed
- **Echoes**: Ghostly patterns left by death (Echo, Hollowed, Silence)
- **Imprints**: Victory legacies burned into reality (Beacon, Champion, Archivist)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v5.5.0

### Completed Features (v5.5.0)

| Feature | Status |
|---------|--------|
| **Canon Alignment** - All floor/theme/boss mappings consistent | ✅ |
| BOSS_STATS levels match LEVEL_BOSS_MAP | ✅ |
| Rat King symbol 'r' (no longer collides with Goblin King) | ✅ |
| Floor 4 "Mirror Valdris" display name override | ✅ |
| audioConfig.ts biome-based track mappings | ✅ |
| validate_floor_canon() with BOSS_STATS check | ✅ |
| **Sealed Page** - Completion progress in Codex | ✅ |
| 'meta' category with '???' label | ✅ |
| SealedData interface and type guards | ✅ |
| Story data evidence entries rewritten for correct biomes | ✅ |
| ICE causes_slide=False (deferred) | ✅ |

### v5.4.0 Features (Lore Codex)

| Feature | Status |
|---------|--------|
| Immersive Lore Codex system (replaces journal button) | ✅ |
| Category-based organization (History, Characters, Creatures, Locations, Artifacts, Meta) | ✅ |
| ScrollPresentation with unroll animation | ✅ |
| BookPresentation with page-turn effect | ✅ |
| CreaturePresentation with animated Canvas 2D portraits | ✅ |
| LocationPresentation with animated biome previews | ✅ |
| Bestiary auto-discovery on first combat | ✅ |
| Location auto-discovery on level visits | ✅ |
| Fantasy grimoire aesthetic (amber/parchment styling) | ✅ |
| Story manager state persistence in save/load | ✅ |

### v5.4.0 Architecture

```
web/src/components/LoreCodex/
├── components/
│   ├── CodexSidebar.tsx        # Category navigation
│   ├── CodexEntryList.tsx      # Entry list for selected category
│   ├── CodexReader.tsx         # Routes to presentation components
│   ├── ScrollPresentation.tsx  # Animated scroll unroll
│   ├── BookPresentation.tsx    # Book with page turns
│   ├── CreaturePresentation.tsx # Canvas 2D enemy portrait + stats
│   └── LocationPresentation.tsx # Biome preview + level info
├── hooks/
│   └── useCodexState.ts        # Category/entry selection state
├── utils/
│   └── phosphorText.tsx        # Character-by-character reveal
├── LoreCodex.tsx               # Main container
├── LoreCodex.scss              # All styles (~1200 lines)
├── types.ts                    # LoreEntry, CreatureEntry, LocationEntry
└── index.ts                    # Exports
```

### Creature Bestiary Features

| Feature | Description |
|---------|-------------|
| Animated portrait | Canvas 2D rendering with bob, breathe, sway animations |
| Stats grid | HP (red), ATK (orange), XP (green), Level Range |
| Boss badge | "BOSS" label + crown rendering for boss creatures |
| Abilities list | Formatted ability names for bosses |
| Resistances | Element-colored resistance tags |
| First encounter text | Italic quote from ENEMY_ENCOUNTER_MESSAGES |

### Location Codex Features

| Feature | Description |
|---------|-------------|
| Biome preview | Animated Canvas with theme-specific visuals |
| Level badge | "Level N" overlay on preview |
| Intro message | LEVEL_INTRO_MESSAGES text |
| Boss section | Guardian name + symbol if level has boss |
| Creatures list | All enemies that spawn on this level |

### Discovery System

| Trigger | Method | Data Source |
|---------|--------|-------------|
| Combat (first attack) | `story_manager.encounter_enemy()` | combat_manager.py |
| Game start | `story_manager.visit_level(1)` | engine.py |
| Level descent | `story_manager.visit_level(n)` | level_manager.py |

### Key Files (v5.4.0)

| File | Purpose |
|------|---------|
| `src/story/story_manager.py` | get_bestiary_entries(), get_location_entries() |
| `src/managers/combat_manager.py` | encounter_enemy() call on attack |
| `src/managers/level_manager.py` | visit_level() call on descent |
| `src/managers/serialization.py` | story_manager save/load |
| `server/app/services/game_session.py` | Combines all entry types for frontend |
| `web/src/hooks/useGameSocket.ts` | Extended LoreEntry types |
| `web/src/pages/Play.tsx` | LoreCodex integration (J key) |

---

## Previous Versions

### v5.3.0 Features

| Feature | Status |
|---------|--------|
| Death cutscene (5-scene cinematic sequence) | ✅ |
| Victory cutscene (3-scene cinematic sequence) | ✅ |
| Random death fate variants (Echo, Hollowed, Silence) | ✅ |
| Random victory legacy variants (Beacon, Champion, Archivist) | ✅ |
| Ghost lore panels on summary screens | ✅ |
| Death camera effect in 3D renderer | ✅ |
| Death overlays (vignette, blood curtain, eyelids) | ✅ |
| File-based cinematic SFX with procedural fallback | ✅ |
| Factory pattern for cutscene creation (useState) | ✅ |
| FX cues synced to caption line completion | ✅ |

### v5.2.0 Features

| Feature | Status |
|---------|--------|
| Modular cutscene engine architecture | ✅ |
| Retro CRT phosphor text reveal | ✅ |
| Per-character staggered ignition animation | ✅ |
| FX system (flash, shake, flicker, pressure) | ✅ |
| FX cues tied to caption line completion | ✅ |
| Scene-scoped CSS classes for per-scene styling | ✅ |
| Debug mode panel for scene iteration | ✅ |
| 7-scene intro cutscene with effects | ✅ |

### v5.1.0 Features

| Feature | Status |
|---------|--------|
| Cinematic intro with 7 narrative scenes | ✅ |
| Parallax backgrounds per scene | ✅ |
| Particle effects (stars, embers, dust, darkness) | ✅ |
| Scene transitions with solid black (no bleed) | ✅ |
| Responsive 3D/2D renderer (fills container) | ✅ |

### v5.0.0 Features

| Feature | Status |
|---------|--------|
| Dynamic LOS-based render distance | ✅ |
| Smooth movement/turn animations (2D & 3D) | ✅ |
| Map memory for explored tiles | ✅ |
| Pure tile-based 3D geometry | ✅ |
| Parallax skybox system | ✅ |

---

## Next Version: v5.5.0

| Feature | Description |
|---------|-------------|
| Database saves | Persist game state to PostgreSQL |
| Save on quit | Auto-save when quitting |
| Load saved game | Restore from database |
| Multiple slots | Multiple characters per account |
| Character/Artifact/History presentations | Remaining codex category layouts |

### Deferred

- Weather effects (rain/dripping)
- Ambient sounds
- 3D tile variants (requires world coordinates in view data)
- Victorious ghost behavior (beacon/champion/archivist AI)

---

## Quick Commands

```bash
# Terminal client
python main.py

# Web frontend
cd web && npm run dev

# Backend (Docker)
docker-compose up -d

# Type check
cd web && npx tsc --noEmit
```

---

## Documentation

See [docs/](docs/) folder:
- [FEATURES.md](docs/FEATURES.md) - Complete feature list
- [GAMEPLAY.md](docs/GAMEPLAY.md) - Controls and mechanics
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Setup and building
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Project structure
- [CHANGELOG.md](docs/CHANGELOG.md) - Version history
