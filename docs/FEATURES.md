# Features

Complete feature list organized by category and version.

---

## Core Gameplay

- **Procedural Generation**: BSP algorithm for guaranteed connected dungeons
- **8 Themed Biomes**: Stone Dungeon, Sewers, Forest, Mirror Valdris, Ice Cavern, Library, Volcanic, Crystal Cave
- **Inventory System**: 10-slot inventory with auto-pickup
- **Equipment System**: Weapons (+ATK), armor (+DEF), shields, rings, amulets
- **FOV System**: Raycasting-based field of view with fog of war
- **Combat**: Bump-to-attack with animated feedback
- **XP & Leveling**: Level up to increase HP and ATK
- **Save/Load**: Full state persistence with permadeath option

---

## Character System (v4.2.0)

### 5 Playable Races

| Race | HP | ATK | DEF | Trait |
|------|-----|-----|-----|-------|
| Human | +0 | +0 | +0 | Adaptive (+10% XP, 1 starting feat) |
| Elf | -2 | +1 | +0 | Keen Sight (+2 vision) |
| Dwarf | +4 | -1 | +2 | Poison Resist (50%) |
| Halfling | -4 | +0 | +0 | Lucky (15% dodge) |
| Orc | +6 | +2 | -1 | Rage (+50% damage below 25% HP) |

### 3 Character Classes

| Class | HP | ATK | DEF | Abilities | Passive |
|-------|-----|-----|-----|-----------|---------|
| Warrior | +5 | +1 | +1 | Power Strike, Shield Wall | +15% melee |
| Mage | -3 | -1 | +0 | Fireball, Frost Nova | 25% damage reduction |
| Rogue | +0 | +2 | -1 | Backstab, Smoke Bomb | 20% crit chance |

### 18 Feats (earned at levels 3, 5, 7, 9)

**Combat**: Mighty Blow, Weapon Master, Deadly Precision, Berserker, Life Leech, Quick Strike
**Defense**: Tough, Iron Skin, Evasion, Shield Expert, Resilient, Thorns
**Utility**: Fast Learner, Eagle Eye, Healer, Second Wind
**Special**: Survivor, Warrior Spirit, Glass Cannon

---

## Enemies

### 12 Enemy Types

| Enemy | Symbol | HP | DMG | XP | Notes |
|-------|--------|-----|-----|-----|-------|
| Goblin | g | 6 | 1 | 10 | Common |
| Skeleton | s | 8 | 2 | 15 | Basic undead |
| Orc | o | 12 | 3 | 20 | Tough warrior |
| Wraith | W | 10 | 4 | 25 | Spirit |
| Troll | T | 20 | 5 | 35 | Brute |
| Dragon | D | 50 | 10 | 100 | Rare |
| Necromancer | N | 25 | 8 | 40 | Ranged, summons (v4.0) |
| Demon | d | 45 | 16 | 60 | Aggressive (v4.0) |
| Assassin | a | 20 | 14 | 35 | Stealth (v4.0) |
| Fire Elemental | F | 30 | 12 | 45 | Burns (v4.0) |
| Ice Elemental | I | 30 | 10 | 45 | Freezes (v4.0) |
| Lightning Elemental | L | 25 | 14 | 50 | Chain attacks (v4.0) |

**Elite Enemies**: Uppercase variants (G, S, O) with 2x stats and rewards.

### 5 Bosses (v3.2.0)

| Level | Boss | HP | Abilities |
|-------|------|-----|-----------|
| 1 | Goblin King | 50 | Summon Goblins, War Cry |
| 2 | Cave Troll | 80 | Ground Slam, Regenerate |
| 3 | Lich Lord | 70 | Raise Dead, Life Drain |
| 4 | Arcane Keeper | 60 | Arcane Bolt, Teleport |
| 5 | Dragon Emperor | 150 | Fire Breath, Tail Sweep |

---

## Items & Equipment

### Consumables
- Health Potions, Strength Potions, Teleport Scrolls
- Throwing Knife, Bomb (AOE), Poison Vial (v4.0)

### Equipment Slots
- **Weapon**: Swords, axes, bows, crossbows
- **Armor**: Leather, chain, plate
- **Off-hand**: Shields (block chance)
- **Ring**: Stat bonuses
- **Amulet**: Passive effects

### Rarity Tiers
Common (white) → Uncommon (cyan) → Rare (blue) → Epic (magenta) → Legendary (yellow)

---

## Dungeon Mechanics

### Traps (v4.0.0)
| Trap | Damage | Effect |
|------|--------|--------|
| Spike | 5-10 | None |
| Fire | 3-6 | Burn |
| Poison | 2-4 | Poison |
| Arrow | 6-10 | Directional |

### Hazards (v4.0.0)
- **Lava**: 5 damage/turn + Burn
- **Ice**: Sliding movement
- **Poison Gas**: Spreads, applies Poison
- **Deep Water**: Slows, drowning risk

### Secret Doors (v4.4.0)
- 1-2 per level (starting level 2)
- Revealed with Search command (F key)
- Connect adjacent rooms

### Status Effects (v4.0.0)
| Effect | Damage | Duration |
|--------|--------|----------|
| Poison | 2/turn | 5 turns (stacks 3x) |
| Burn | 3/turn | 3 turns |
| Freeze | - | 3 turns (-50% speed) |
| Stun | - | 1 turn (skip) |

---

## First-Person Renderer (v4.1.0+)

### Visual Features
- Directional FOV based on player facing
- Perspective projection with depth fog
- 9 enemy visual styles + elite variants
- Torch lighting with flicker animation
- Wall decorations (moss, cracks, cobwebs)

### Biome Themes (v4.5.0)
8 themes with distinct palettes: Dungeon, Ice, Forest, Lava, Crypt, Sewer, Library, Crystal

### Tile Engine (v4.5.0)
- Load custom 64x64 PNG tiles
- Place in `/tiles/{biome}/`
- Falls back to biome colors

### Atmosphere (v4.4.0)
- Medieval compass HUD
- Trap rendering with animations
- Dust and fog particles

---

## Multiplayer (v3.0.0+)

### Backend Features
- User accounts with JWT authentication
- Leaderboards (global, daily, weekly)
- Ghost replay recording
- Real-time chat (global + whispers)
- Game sessions via WebSocket
- Docker deployment

### Social (v3.5.0)
- Player search and friend requests
- Online status indicators
- Spectate friends' games

### Achievements (v3.1.0)
34 achievements across 5 categories:
- **Combat**: First Blood, Monster Slayer, Dragon Slayer, etc.
- **Progression**: First Victory, Champion, Deep Delver, etc.
- **Efficiency**: Speedrunner, Untouchable (Legendary), etc.
- **Collection**: Collector, Potion Master, Hoarder
- **Special**: Welcome, Comeback, High Roller, Completionist

---

## Mobile Support (v3.4.0)

- Touch D-pad and action buttons
- Portrait/landscape layouts
- PWA installable
- Service worker caching

---

## Audio (v4.2.1)

24 procedural sounds via Web Audio API:
- Movement: footstep, bump_wall
- Combat: attack_hit, attack_miss, player_hurt, enemy_death, critical_hit
- Items: item_pickup, gold_pickup, potion_drink, scroll_use
- UI: menu_select, level_up, feat_unlock
- Environment: door_open, stairs_descend, trap_trigger
