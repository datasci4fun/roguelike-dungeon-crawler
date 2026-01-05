# Project State Checkpoint

**Last Updated:** 2026-01-04
**Branch:** master
**Version:** v4.2.2 (Turn Commands)

---

## Demo Account

For quick testing without registration:

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5176/login |

The demo account is auto-created on server startup. Click **"Try Demo"** on the login page for one-click access.

---

## Current Status

**Turn Commands & First-Person View Fixes** - Added Q/E turn controls and fixed open room rendering.

### Turn Commands (Complete)

| Component | Status |
|-----------|--------|
| TURN_LEFT/TURN_RIGHT commands in engine | ✅ Done |
| Q/E key bindings in GameTerminal | ✅ Done |
| Turn costs a turn (enemies act) | ✅ Done |
| Facing direction message feedback | ✅ Done |
| Updated controls display (X for quit) | ✅ Done |
| Fixed corridor detection for open rooms | ✅ Done |

### New Controls

| Key | Action |
|-----|--------|
| Q | Turn left (counterclockwise) |
| E | Turn right (clockwise) |
| X | Quit game (was Q) |

### First-Person View Fixes

- Fixed corridor detection algorithm that caused blank rendering in open rooms
- Default to floor tiles instead of walls when tile data is missing
- Properly detect walls on left/right edges for correct side wall rendering

### Files Modified

| File | Changes |
|------|---------|
| src/core/commands.py | Added TURN_LEFT, TURN_RIGHT to CommandType |
| src/core/engine.py | Added _handle_turn(), TURN_COMMANDS handling |
| web/src/components/GameTerminal.tsx | Q→TURN_LEFT, E→TURN_RIGHT, X→QUIT |
| web/src/components/SceneRenderer/FirstPersonRenderer.tsx | Fixed corridor detection |

---

**Sound Effects System added** - Procedural audio using Web Audio API for game feedback.

### Sound Effects System (Complete)

| Component | Status |
|-----------|--------|
| SFX config with 24 sound definitions | ✅ Done |
| Web Audio API procedural generation | ✅ Done |
| ADSR envelope shaping | ✅ Done |
| Game event triggers (useSfxGameEvents) | ✅ Done |
| Volume control integration | ✅ Done |
| Test button in VolumeControls | ✅ Done |

### Sound Effect Categories

| Category | Sounds |
|----------|--------|
| **Movement** | footstep, bump_wall |
| **Combat** | attack_hit, attack_miss, player_hurt, enemy_death, critical_hit |
| **Items** | item_pickup, gold_pickup, potion_drink, scroll_use, equip_weapon, equip_armor |
| **UI** | menu_select, menu_confirm, menu_back, level_up, feat_unlock |
| **Environment** | door_open, stairs_descend, trap_trigger |
| **Abilities** | ability_ready, ability_use, ability_fail |

### Sound Effects Files

```
web/src/
├── config/
│   └── sfxConfig.ts          (250 lines - sound definitions)
└── hooks/
    ├── useSoundEffect.ts     (140 lines - Web Audio API hook)
    └── useSfxGameEvents.ts   (131 lines - automatic triggers)
```

---

**Character Creation & Feat System released as v4.2.0** - Full RPG character customization with races, classes, abilities, and feats.

### Character Creation System (Complete)

| Component | Status |
|-----------|--------|
| 5 Races with unique traits | ✅ Done |
| 3 Classes with abilities | ✅ Done |
| Race + Class stat calculations | ✅ Done |
| CharacterCreation page UI | ✅ Done |
| CharacterHUD component | ✅ Done |
| Backend race/class support | ✅ Done |

### The 5 Races

| Race | HP | ATK | DEF | Trait | Trait Effect |
|------|-----|-----|-----|-------|--------------|
| Human | +0 | +0 | +0 | Adaptive | +10% XP gain, +1 starting feat |
| Elf | -2 | +1 | +0 | Keen Sight | +2 vision range |
| Dwarf | +4 | -1 | +2 | Poison Resist | 50% poison resistance |
| Halfling | -4 | +0 | +0 | Lucky | 15% dodge chance |
| Orc | +6 | +2 | -1 | Rage | +50% damage below 25% HP |

### The 3 Classes

| Class | HP | ATK | DEF | Active Abilities | Passive |
|-------|-----|-----|-----|------------------|---------|
| Warrior | +5 | +1 | +1 | Power Strike, Shield Wall | Combat Mastery (+15% melee) |
| Mage | -3 | -1 | +0 | Fireball, Frost Nova | Mana Shield (25% damage reduction) |
| Rogue | +0 | +2 | -1 | Backstab, Smoke Bomb | Critical Strike (20% crit chance) |

### Feat System (Complete)

| Component | Status |
|-----------|--------|
| 18 feats across 4 categories | ✅ Done |
| Feat selection at levels 3, 5, 7, 9 | ✅ Done |
| Human starting feat choice | ✅ Done |
| FeatSelector modal UI | ✅ Done |
| Combat integration (damage, crit, life steal, thorns) | ✅ Done |
| Potion healing bonus | ✅ Done |

### The 18 Feats

| Category | Feat | Effect |
|----------|------|--------|
| **Combat** | Mighty Blow | +2 Attack damage |
| | Weapon Master | +15% damage with all attacks |
| | Deadly Precision | +10% critical hit chance |
| | Berserker | +25% damage, -1 Defense |
| | Life Leech | Heal 10% of damage dealt |
| | Quick Strike | Always attack before enemies |
| **Defense** | Tough | +5 Maximum HP |
| | Iron Skin | +2 Defense |
| | Evasion | +8% dodge chance |
| | Shield Expert | +15% block chance with shields |
| | Resilient | Take 10% less damage from all sources |
| | Thorns | Reflect 25% of melee damage back |
| **Utility** | Fast Learner | +20% XP gain |
| | Eagle Eye | +1 vision range |
| | Healer | Potions heal 50% more |
| | Second Wind | +3 HP on level up |
| **Special** | Survivor | +3 HP, +1 Defense, +5% dodge |
| | Warrior Spirit | +1 Attack, +1 Defense, +2 HP |
| | Glass Cannon | +3 Attack, -3 HP |

### Character Creation Files

```
src/entities/
├── feats.py              (233 lines - feat definitions)
├── player_abilities.py   (148 lines - class abilities)
└── entities.py           (updated with race/class/feats)

web/src/
├── components/
│   ├── CharacterHUD.tsx     (168 lines - race/class display)
│   ├── CharacterHUD.css     (188 lines)
│   ├── FeatSelector.tsx     (81 lines - feat selection modal)
│   └── FeatSelector.css     (156 lines)
├── pages/
│   ├── CharacterCreation.tsx (212 lines)
│   └── CharacterCreation.css (315 lines)
└── data/
    └── characterData.ts     (160 lines - race/class definitions)
```

### Backend Changes for Character Creation

| File | Changes |
|------|---------|
| src/core/constants.py | Race, PlayerClass enums, RACE_STATS, CLASS_STATS |
| src/core/commands.py | SELECT_FEAT command type |
| src/entities/entities.py | Player race/class/feats, feat bonus methods |
| src/entities/combat.py | Feat damage multiplier, life steal, thorns |
| src/managers/combat_manager.py | Thorns handling, feat block bonus |
| src/items/items.py | Healer feat bonus for potions |
| server/app/services/game_session.py | Race/class config, feat serialization |
| server/app/api/game.py | Race/class in new_game action |

---

**Scene Renderer merged to develop** - First-person 3D dungeon view with directional FOV.

### Scene Renderer Feature (Complete - In Develop)

| Component | Status |
|-----------|--------|
| Directional FOV system (player facing) | ✅ Done |
| Perspective projection utilities | ✅ Done |
| Corridor wall rendering | ✅ Done |
| Floor/ceiling with depth | ✅ Done |
| Front wall rendering with doors | ✅ Done |
| Enemy rendering (9 types, elite variants) | ✅ Done |
| Item rendering (potions, scrolls, weapons, gold) | ✅ Done |
| Torch lighting with flickering | ✅ Done |
| Distance fog effect | ✅ Done |
| Entity animations (breathing, bobbing) | ✅ Done |
| Demo page for testing | ✅ Done |
| Integration with Play page | ✅ Done |
| Modular refactor (walls/, entities/) | ✅ Done |

### Scene Renderer Files

```
web/src/components/SceneRenderer/
├── FirstPersonRenderer.tsx   (292 lines - main component)
├── projection.ts             (62 lines - perspective math)
├── colors.ts                 (53 lines - color palette)
├── walls/
│   ├── index.ts
│   ├── drawCorridorWall.ts   (92 lines)
│   ├── drawFloorCeiling.ts   (151 lines)
│   └── drawFrontWall.ts      (143 lines)
├── entities/
│   ├── index.ts
│   ├── drawEnemy.ts          (307 lines)
│   ├── drawItem.ts           (348 lines)
│   └── entityColors.ts       (86 lines)
└── index.ts
```

### Backend Changes for Scene Renderer

| File | Changes |
|------|---------|
| src/entities/entities.py | Added `facing` direction to Player |
| src/world/fov.py | Added `get_tiles_in_front()` for directional FOV |
| src/managers/combat_manager.py | Updates player facing on move/attack |
| server/app/services/game_session.py | Serializes first-person view data |

### New Routes

| Route | Purpose |
|-------|---------|
| /first-person-demo | Test first-person renderer without backend |
| /scene-demo | Test top-down scene renderer |
| /play-scene | Alternative play page with scene renderer |

### Play Page Integration

The `/play` page now includes a toggleable first-person view alongside the terminal. The checkbox "First-Person View" shows/hides the 3D renderer.

---

**v4.0.0 adds Expanded Gameplay** with new enemy types, dungeon mechanics, status effects, and new equipment.

### v4.0.0 Expanded Gameplay (Complete)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Core infrastructure (new enums, stats) | ✅ Done |
| 2 | Status effects system | ✅ Done |
| 3 | New enemy types with AI behaviors | ✅ Done |
| 4 | Traps and hazards | ✅ Done |
| 5 | New item types | ✅ Done |
| 6 | Combat integration | ✅ Done |
| 7 | Dungeon integration | ✅ Done |
| 8 | UI updates | ✅ Done |
| 9 | Balance and testing | ✅ Done |
| 10 | Release | ✅ Done |

### New Enemy Types (6)

| Enemy | HP | ATK | DEF | XP | Min Level | AI Type | Abilities |
|-------|-----|-----|-----|-----|-----------|---------|-----------|
| Necromancer | 25 | 8 | 3 | 40 | 3 | Ranged Kite | raise_skeleton, dark_bolt |
| Demon | 45 | 16 | 6 | 60 | 4 | Aggressive | fire_strike |
| Assassin | 20 | 14 | 2 | 35 | 2 | Stealth | backstab, vanish |
| Fire Elemental | 30 | 12 | 4 | 45 | 3 | Elemental | fire_bolt |
| Ice Elemental | 30 | 10 | 5 | 45 | 3 | Elemental | ice_shard |
| Lightning Elemental | 25 | 14 | 3 | 50 | 4 | Elemental | chain_lightning |

### Status Effects

| Effect | Damage | Duration | Stacking |
|--------|--------|----------|----------|
| Poison | 2/turn | 5 turns | Intensity (max 3x) |
| Burn | 3/turn | 3 turns | Refresh duration |
| Freeze | 0 | 3 turns | No stack, -50% move |
| Stun | 0 | 1 turn | No stack, skip turn |

### Traps (4 types)

| Trap | Damage | Effect | Cooldown |
|------|--------|--------|----------|
| Spike | 5-10 | None | 3 turns |
| Fire | 3-6 | Burn | 5 turns |
| Poison | 2-4 | Poison | 4 turns |
| Arrow | 6-10 | None | 2 turns |

### Environmental Hazards (4 types)

| Hazard | Effect | Behavior |
|--------|--------|----------|
| Lava | 5 damage/turn + Burn | Static |
| Ice | Causes sliding | Static |
| Poison Gas | Poison effect | Spreads over time |
| Deep Water | Slows movement, drowning risk | Static |

### New Item Types

| Type | Slot | Examples |
|------|------|----------|
| Shield | Off-hand | Wooden, Iron, Tower Shield |
| Ring | Ring | Ring of Strength, Defense, Speed |
| Amulet | Amulet | Amulet of Health, Resistance, Vision |
| Ranged Weapon | Weapon | Shortbow, Longbow, Crossbow |
| Throwable | Consumable | Throwing Knife, Bomb, Poison Vial |
| Key | Consumable | Bronze, Silver, Gold Key |

### Files Created

| File | Purpose |
|------|---------|
| src/entities/status_effects.py | Status effect system |
| src/entities/ai_behaviors.py | Enemy AI dispatch |
| src/world/traps.py | Trap mechanics |
| src/world/hazards.py | Environmental hazards |

### Files Modified

| File | Changes |
|------|---------|
| src/core/constants.py | New enums, enemy stats, trap/hazard stats |
| src/entities/entities.py | Entity status effects, enemy AI properties |
| src/entities/abilities.py | 8 new abilities |
| src/world/dungeon.py | Trap/hazard generation |
| src/items/items.py | 6 new item classes |
| src/managers/combat_manager.py | Shield blocking, status effects, AI |
| src/managers/entity_manager.py | Level-filtered enemy spawning |
| src/managers/level_manager.py | Trap/hazard generation on level change |
| src/core/engine.py | Trap/hazard processing in game loop |
| src/core/game.py | Pass traps/hazards to renderer |
| src/ui/renderer.py | Trap/hazard/status effect rendering |

---

## Previous Releases

The roguelike dungeon crawler now has a **complete multiplayer stack**: backend server with WebSocket game sessions, real-time chat, leaderboards, and ghost replays, plus a **full React web frontend** with xterm.js game terminal.

**v3.1.0 adds Player Profiles and an Achievements system** with 20 achievements across 5 categories (combat, progression, efficiency, collection, special) and 4 rarity tiers.

**v3.2.0 adds Boss Monsters** with 5 unique bosses (one per level), 10 special abilities, and guaranteed loot drops.

**v3.3.0 adds Spectator Mode, Boss Achievements, and Legendary Items.**

**v3.4.0 adds Mobile Support** with touch controls, responsive layout, and PWA installability.

**v3.5.0 adds Friends & Social** with player search, friend requests, and 10 new achievements plus visual polish.

### v3.5.0 Friends & Social (Complete)

| Component | Status |
|-----------|--------|
| Friendship database model | ✅ Done |
| Friend service (search, requests, list) | ✅ Done |
| Friend schemas (Pydantic) | ✅ Done |
| Friends API endpoints | ✅ Done |
| Register router in main.py | ✅ Done |
| Frontend types (Friend, FriendRequest, etc.) | ✅ Done |
| friendsApi in api.ts | ✅ Done |
| Friends.tsx page (3 tabs) | ✅ Done |
| Friends route and nav link | ✅ Done |
| 10 new achievements | ✅ Done |
| Terminal animation polish | ✅ Done |
| Documentation updates | ✅ Done |
| Git merge and tag | ✅ Done |

### New Achievements in v3.5.0

| Achievement | Category | Rarity | Condition |
|-------------|----------|--------|-----------|
| Social Butterfly | Special | Common | Add first friend |
| Popular | Special | Rare | Have 10 friends |
| Explorer | Progression | Common | Visit all 5 dungeon levels |
| Treasure Hunter | Collection | Rare | Collect 100+ gold in one run |
| Survivor | Efficiency | Rare | Win with <5 HP |
| Pacifist | Efficiency | Epic | Win with 5 or fewer kills |
| One Shot | Combat | Rare | Deal 50+ damage in single hit |
| Genocide | Combat | Epic | Kill 50+ enemies in one run |
| Speed Demon | Efficiency | Epic | Win in <300 turns |
| Completionist | Special | Legendary | Unlock all other achievements |

### Visual Polish in v3.5.0

| Effect | Trigger | Duration |
|--------|---------|----------|
| Gold flash | Level up | 800ms |
| Green flash | XP gain | 400ms |
| Red flash | Damage taken | 300ms |
| Red pulse | HP below 20% | Continuous |
| Green glow | Victory screen | Continuous |

### v3.4.0 Mobile Support (Complete)

| Component | Status |
|-----------|--------|
| TouchControls component (D-pad + action buttons) | ✅ Done |
| UI mode-aware controls (game, inventory, dialog) | ✅ Done |
| Portrait/landscape orientation support | ✅ Done |
| Mobile chat toggle with unread badge | ✅ Done |
| Mobile chat modal overlay | ✅ Done |
| Responsive CSS breakpoints (pointer: coarse) | ✅ Done |
| GameTerminal touch-action/orientation handling | ✅ Done |
| PWA manifest | ✅ Done |
| App icon (SVG placeholder) | ✅ Done |
| Service worker for asset caching | ✅ Done |
| iOS PWA meta tags | ✅ Done |

### v3.3.0 Spectator Mode (Complete)

| Component | Status |
|-----------|--------|
| GameSession spectator tracking | ✅ Done |
| GameSessionManager spectator methods | ✅ Done |
| GET /api/game/active endpoint | ✅ Done |
| WebSocket /ws/spectate/{session_id} | ✅ Done |
| State broadcasting to spectators | ✅ Done |
| Spectate page (active games list) | ✅ Done |
| GameTerminal spectator mode | ✅ Done |

### v3.3.0 Boss Achievements (Complete)

| Achievement | Rarity | Points | Condition |
|-------------|--------|--------|-----------|
| Boss Slayer | Common | 15 | Defeat your first boss |
| Kingslayer | Rare | 25 | Defeat the Goblin King |
| Dragon Emperor Slain | Epic | 100 | Defeat the Dragon Emperor |
| Dungeon Master | Legendary | 200 | Defeat all 5 bosses in one run |

### v3.3.0 Legendary Items (Complete)

| Item | Type | Bonus | Drop Source |
|------|------|-------|-------------|
| Dragon Slayer | Weapon | +8 ATK | Dragon Emperor |
| Dragon Scale Armor | Armor | +8 DEF | Dragon Emperor |

### v3.2.0 Boss Monster System (Complete)

| Component | Status |
|-----------|--------|
| BossType enum and BOSS_STATS config | ✅ Done |
| Boss ability system (10 abilities) | ✅ Done |
| Enemy class boss extension | ✅ Done |
| Boss spawning in level manager | ✅ Done |
| Combat integration (boss turns, abilities) | ✅ Done |
| Boss loot drops (guaranteed) | ✅ Done |
| Boss health bar in UI panel | ✅ Done |
| Boss-specific message coloring | ✅ Done |
| Boss tutorial hint | ✅ Done |
| Boss achievements | ✅ Done |

### The 5 Bosses

| Level | Boss | HP | DMG | XP | Abilities |
|-------|------|-----|-----|-----|-----------|
| 1 | Goblin King | 50 | 5 | 200 | Summon Goblins, War Cry |
| 2 | Cave Troll | 80 | 8 | 300 | Ground Slam, Regenerate |
| 3 | Lich Lord | 70 | 10 | 400 | Raise Dead, Life Drain |
| 4 | Arcane Keeper | 60 | 12 | 500 | Arcane Bolt, Teleport |
| 5 | Dragon Emperor | 150 | 15 | 1000 | Fire Breath, Tail Sweep |

### Boss Abilities

| Ability | Type | Cooldown | Effect |
|---------|------|----------|--------|
| Summon Goblins | Summon | 5 turns | Spawns 2-3 goblin minions |
| War Cry | Buff | 8 turns | +50% damage for 3 turns |
| Ground Slam | AOE | 4 turns | 8 damage in range 2 |
| Regenerate | Buff | Passive | Heals 5 HP when below 50% |
| Raise Dead | Summon | 6 turns | Spawns 2 skeleton minions |
| Life Drain | Special | 3 turns | 6 damage, heals boss |
| Arcane Bolt | Ranged | 2 turns | 8 damage, range 5 |
| Teleport | Special | 5 turns | Relocates boss randomly |
| Fire Breath | AOE | 4 turns | 12 damage, range 3 |
| Tail Sweep | AOE | 3 turns | 10 damage to adjacent |

### Boss Loot Drops

| Boss | Guaranteed Drops |
|------|-----------------|
| Goblin King | Iron Sword, Chain Mail |
| Cave Troll | Battle Axe, Strength Potion x2 |
| Lich Lord | Plate Armor, Health Potion x2 |
| Arcane Keeper | Teleport Scroll x2, Strength Potion |
| Dragon Emperor | Battle Axe (Dragon Slayer), Plate Armor (Dragon Scale) |

### v3.1.0 Player Profiles & Achievements (Complete)

| Component | Status |
|-----------|--------|
| UserAchievement database model | ✅ Done |
| Achievement definitions (20 achievements) | ✅ Done |
| Alembic migration infrastructure | ✅ Done |
| Achievement service (check & award) | ✅ Done |
| Profile service (stats aggregation) | ✅ Done |
| Achievements API endpoints | ✅ Done |
| Profile API endpoints | ✅ Done |
| Frontend types & API client | ✅ Done |
| Profile page (stats, games, achievements) | ✅ Done |
| Achievements page (categories, filtering) | ✅ Done |
| Achievement toast notifications | ✅ Done |

### v3.0.0 Web Frontend (Complete)

| Component | Status |
|-----------|--------|
| React + TypeScript + Vite scaffold | ✅ Done |
| Routing (Home, Login, Register, Play, Leaderboard, Ghosts) | ✅ Done |
| AuthContext + JWT token management | ✅ Done |
| API client (auth, leaderboard, ghost, chat) | ✅ Done |
| xterm.js Game Terminal | ✅ Done |
| WebSocket game connection | ✅ Done |
| Keyboard input mapping | ✅ Done |
| Game state rendering | ✅ Done |
| Real-time Chat UI | ✅ Done |
| Ghost Replay Viewer | ✅ Done |

### v3.0.0 Backend (Complete)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Docker + Backend Foundation | ✅ Done |
| 2 | JWT Authentication | ✅ Done |
| 3 | WebSocket Game Sessions | ✅ Done |
| 4 | Leaderboards | ✅ Done |
| 5 | Ghost Replay System | ✅ Done |
| 6 | Real-time Chat | ✅ Done |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Frontend (web/)                          │
│              React 19 + xterm.js + WebSocket                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ GameTerminal│  │  ChatPanel  │  │ GhostReplay │              │
│  │  (xterm.js) │  │  (realtime) │  │   Viewer    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Auth Pages  │  │ Leaderboard │  │   Ghosts    │              │
│  │ Login/Reg   │  │   Rankings  │  │    List     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     FastAPI Backend (server/)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Auth API   │  │  Game API   │  │  Chat API   │              │
│  │  (JWT)      │  │  (WebSocket)│  │  (WebSocket)│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ Leaderboard │  │  Ghost API  │                               │
│  │    API      │  │             │                               │
│  └─────────────┘  └─────────────┘                               │
│                          │                                       │
│              ┌───────────▼───────────┐                          │
│              │    GameEngine (pure)   │                          │
│              │    No curses deps      │                          │
│              └───────────────────────┘                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                         Data Layer                               │
│         PostgreSQL (users, games, chat) + Redis (sessions)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Changed (v3.1.0)

### Achievement System
- `server/app/config/achievements.py` - 20 achievement definitions
  - Categories: combat, progression, efficiency, collection, special
  - Rarities: common (5), rare (9), epic (5), legendary (1)
  - Point values: common=10, rare=25, epic=50, legendary=100
- `server/app/models/user_achievement.py` - UserAchievement model
- `server/app/services/achievement_service.py` - Achievement checking & awarding
- `server/app/schemas/achievement.py` - Pydantic schemas
- `server/app/api/achievements.py` - REST endpoints

### Profile System
- `server/app/services/profile_service.py` - Profile stats aggregation
- `server/app/schemas/profile.py` - Profile response schemas
- `server/app/api/profile.py` - Profile REST endpoints

### Alembic Migrations
- `server/alembic/` - Migration infrastructure
- Initial migration for user_achievements table

### Frontend Pages
- `web/src/pages/Profile.tsx` - User profile page
  - Stats grid (games, wins, kills, score)
  - Achievement showcase (top 3 unlocked)
  - Recent game history
  - Routes: `/profile` and `/profile/:userId`
- `web/src/pages/Achievements.tsx` - Achievement browser
  - Category filter tabs
  - Rarity-colored cards
  - Progress stats (unlocked, points, percentage)
  - Locked/unlocked display

### API Client Updates
- `web/src/services/api.ts` - Added profileApi and achievementsApi
- `web/src/types/index.ts` - Added achievement and profile types

### Achievement List (20 total)
| Category | Achievement | Rarity |
|----------|-------------|--------|
| Combat | First Blood (kill first enemy) | Common |
| Combat | Monster Slayer (100 kills) | Rare |
| Combat | Dragon Slayer (kill dragon) | Epic |
| Combat | Overkill (500+ damage/run) | Rare |
| Combat | Elite Hunter (10 elites) | Rare |
| Progression | First Victory (win game) | Rare |
| Progression | Champion (10 wins) | Epic |
| Progression | Deep Delver (reach level 5) | Rare |
| Progression | Max Level (player level 10) | Rare |
| Progression | Dedicated (50 games) | Rare |
| Efficiency | Speedrunner (<500 turns win) | Epic |
| Efficiency | Untouchable (no damage win) | Legendary |
| Efficiency | No Potions (win w/o potions) | Epic |
| Efficiency | Flawless Level (clear undamaged) | Rare |
| Collection | Collector (50 items/run) | Rare |
| Collection | Potion Master (50 potions) | Rare |
| Collection | Hoarder (500 items total) | Epic |
| Special | Welcome (play first game) | Common |
| Special | Comeback (win <10% HP) | Epic |
| Special | High Roller (50k+ score) | Epic |

---

## What Changed (v3.0.0)

### Web Frontend Scaffold
- `web/` - React 19 + TypeScript + Vite
- `web/src/pages/` - Home, Login, Register, Play, Leaderboard, Ghosts
- `web/src/contexts/AuthContext.tsx` - JWT auth state management
- `web/src/services/api.ts` - Full API client for all endpoints
- `web/src/types/index.ts` - TypeScript interfaces

### xterm.js Game Terminal
- `web/src/components/GameTerminal.tsx` - xterm.js game renderer
  - ANSI color rendering for dungeon, enemies, items
  - Viewport rendering around player position
  - Stats bar (HP, ATK, DEF, XP, kills)
  - Message log with color-coded messages
  - Death and victory screens
  - Inventory and dialog UI modes
- `web/src/hooks/useGameSocket.ts` - WebSocket connection hook
  - Connection lifecycle management
  - Game state type definitions
  - Command sending (new_game, command, quit)

### Real-time Chat UI
- `web/src/components/ChatPanel.tsx` - Chat panel component
  - Real-time message display
  - Online users list
  - Click-to-whisper functionality
  - System messages (join/leave)
  - Collapsible panel design
- `web/src/hooks/useChatSocket.ts` - Chat WebSocket hook
  - Global and whisper message support
  - Online user tracking
  - Connection management

### Ghost Replay Viewer
- `web/src/components/GhostReplayViewer.tsx` - Replay viewer
  - Playback controls (play, pause, step, speed)
  - Timeline scrubber
  - Mini-map with player trail
  - Frame-by-frame stats display
  - Combat damage indicators
  - Keyboard shortcuts

---

## Web Frontend Structure

```
web/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx              # App entry point
    ├── App.tsx               # Router setup
    ├── components/
    │   ├── Layout.tsx        # Page layout with nav
    │   ├── GameTerminal.tsx  # xterm.js game renderer
    │   ├── ChatPanel.tsx     # Real-time chat
    │   └── GhostReplayViewer.tsx  # Replay viewer
    ├── contexts/
    │   └── AuthContext.tsx   # JWT auth state
    ├── hooks/
    │   ├── useGameSocket.ts  # Game WebSocket hook
    │   └── useChatSocket.ts  # Chat WebSocket hook
    ├── pages/
    │   ├── Home.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── Play.tsx          # Game + Chat page
    │   ├── Leaderboard.tsx
    │   └── Ghosts.tsx        # Ghost list + viewer
    ├── services/
    │   └── api.ts            # REST + WebSocket client
    └── types/
        └── index.ts          # TypeScript interfaces
```

---

## Keyboard Controls

### Game Terminal (Web)
| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| Q | Turn left |
| E | Turn right |
| I | Open inventory |
| C | Character screen |
| M | Message log |
| ? | Help screen |
| 1-3 | Quick use items |
| > | Descend stairs |
| X | Quit game |
| E/Enter | Use/equip (in inventory) |
| D | Drop (in inventory) |
| Y/N | Dialog confirm/cancel |

### Ghost Replay Viewer
| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← / → | Step back/forward |
| Home / End | Jump to start/end |
| Esc | Close viewer |

---

## Quick Reference

### Running Web Frontend (Development)
```bash
cd web
npm install
npm run dev
```
Access at `http://localhost:5173`

### Running Server (Development)
```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API at `http://localhost:8000`

### Running Terminal Client (Single Player)
```bash
python main.py
```

### Running with Docker (Full Stack)
```bash
docker-compose up -d
```

### Build Web Frontend
```bash
cd web
npm run build
```

---

## Testing Checklist (v3.0.0)

### Backend
- [x] Server starts with `uvicorn app.main:app`
- [x] Health check returns 200
- [x] User registration works
- [x] JWT login returns token
- [x] Game WebSocket connects with valid token
- [x] New game creates session
- [x] Commands update game state
- [x] Game state serializes correctly
- [x] Leaderboard records game results
- [x] Ghost data records during gameplay
- [x] Ghost API returns replay data
- [x] Chat WebSocket connects
- [x] Chat messages broadcast to all users
- [x] Whispers reach only recipient
- [x] Rate limiting works on chat

### Frontend
- [x] Web app builds without errors
- [x] Login/Register pages work
- [x] Play page connects to WebSocket
- [x] New game starts correctly
- [x] Movement commands work
- [x] Game state renders in terminal
- [x] Inventory screen works
- [x] Death/victory screens display
- [x] Leaderboard page loads data
- [x] Ghosts page loads data
- [x] Chat UI works
- [x] Whisper messages work
- [x] Ghost replay playback works
- [x] Playback controls function correctly

---

## Version History

- **v1.0.0** - Core gameplay + inventory system
- **v1.1.0** - XP/leveling system
- **v1.2.0** - Elite enemies + FOV + save/load
- **v2.0.0** - Complete visual overhaul (4 phases)
- **v2.1.0** - Architecture refactor + equipment + UI screens
- **v2.2.0** - UX improvements + story system + auto-save
- **v2.2.1** - Bug fixes for lore items and victory screen
- **v3.0.0-backend** - Complete multiplayer backend (6 phases)
- **v3.0.0** - Full stack with React web frontend
- **v3.1.0** - Player profiles & achievements system
- **v3.2.0** - Boss monster system (5 bosses, 10 abilities)
- **v3.3.0** - Spectator mode, boss achievements, legendary items
- **v3.4.0** - Mobile support with touch controls and PWA
- **v3.5.0** - Friends system, 10 new achievements, visual polish
- **v4.0.0** - Expanded gameplay (6 enemies, traps, hazards, status effects)
- **v4.1.0** - Scene renderer (first-person 3D view, directional FOV)
- **v4.2.0** - Character creation (5 races, 3 classes, 18 feats) + demo account
- **v4.2.1** - Sound effects system (24 procedural sounds via Web Audio API)
- **v4.2.2** - Turn commands (Q/E to rotate facing) & first-person view fixes

---

## What's Next

### Immediate Tasks
- ✅ v3.3.0 tagged and released
- ✅ README.md updated for v3.3.0
- ✅ Terminal client verified working
- ✅ v3.4.0 mobile support implemented
- ✅ Merged to develop and master
- ✅ Tagged v3.4.0 release
- ✅ README.md updated for v3.4.0
- ✅ Mobile tested and verified
- ✅ v3.5.0 friends system implemented
- ✅ 10 new achievements added
- ✅ Visual animation polish added
- ✅ Merged to develop and master
- ✅ Tagged v3.5.0 release
- ✅ v4.0.0 expanded gameplay (enemies, traps, hazards)
- ✅ v4.1.0 scene renderer (first-person 3D view)
- ✅ Character creation system (5 races, 3 classes)
- ✅ Feat system (18 feats, level-up choices)
- ✅ Sound effects system (24 procedural sounds)
- ✅ Turn commands (Q/E to rotate in place)
- ✅ First-person view fix for open rooms

### Future Enhancements

**Gameplay:**
- ~~More enemy types (Necromancer, Demon)~~ ✅ Done in v4.0.0
- ~~Boss encounters~~ ✅ Done in v3.2.0
- ~~Legendary items~~ ✅ Done in v3.3.0
- ~~More achievements~~ ✅ Done in v3.5.0 (34 total)
- ~~Character classes~~ ✅ Done (Warrior, Mage, Rogue)
- ~~Race selection~~ ✅ Done (Human, Elf, Dwarf, Halfling, Orc)
- ~~Feat/perk system~~ ✅ Done (18 feats)
- Seasonal achievements
- Skill trees

**Multiplayer:**
- ~~Spectator mode~~ ✅ Done in v3.3.0
- ~~Player search/friends~~ ✅ Done in v3.5.0
- Guilds/clans
- Tournaments

**Visual:**
- ~~First-person 3D renderer~~ ✅ Done (Scene Renderer)
- ~~Mobile responsiveness improvements~~ ✅ Done in v3.4.0
- ~~Better animations~~ ✅ Done in v3.5.0
- ~~Sound effects~~ ✅ Done (24 procedural sounds via Web Audio API)
- Localization

---

## Known Issues

**None currently identified.**
