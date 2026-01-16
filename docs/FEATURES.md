# Features

Complete feature list organized by category and version.

---

## Core Gameplay

- **Procedural Generation**: BSP algorithm for guaranteed connected dungeons
- **8 Themed Biomes**: Stone Dungeon, Sewers, Forest, Mirror Valdris, Ice Cavern, Library, Volcanic, Crystal Cave
- **Inventory System**: 10-slot inventory with auto-pickup
- **Equipment System**: Weapons (+ATK), armor (+DEF), shields, rings, amulets
- **FOV System**: Raycasting-based field of view with fog of war
- **Dual Combat Modes**: Exploration is grid-based; combat is instanced tactical arenas (v6.0)
- **XP & Leveling**: Level up to increase HP and ATK
- **Save/Load**: Full state persistence with permadeath option

---

## Tactical Battle Mode (v6.0.0)

**Exploration is grid-based; combat is instanced tactical arenas.**

### Battle Flow
1. Enemy encounter triggers transition to 9x7 tactical arena
2. Arena template selected based on biome (hazard placement varies)
3. Player and enemies placed; reinforcement queue generated
4. Turn-based combat with movement and abilities
5. Victory: enemies cleared, loot/XP applied, return to exploration
6. Flee: player pushed back, enemy remains, ledger tracks escape

### Determinism
Same seed produces identical results:
- Arena layout and tile placement
- Reinforcement queue (enemy type, arrival turn, elite status)
- Entity spawn positions

### Arena Templates
| Biome | Hazards | Notes |
|-------|---------|-------|
| Stone | None | Basic template |
| Sewer | Water pools | Movement penalty |
| Forest | Tree obstacles | Line-of-sight blockers |
| Crypt | Tombstones | Cover positions |
| Ice | Ice patches | Slide mechanic |
| Volcanic | Lava lanes | Damage tiles |
| Library | Bookshelf walls | Maze-like |
| Crystal | Crystal formations | Reflective |

### Class Ability Kits

| Class | Ability 1 | Ability 2 | Ability 3 | Ability 4 |
|-------|-----------|-----------|-----------|-----------|
| Warrior | Basic Attack | Power Strike (1.5x, 4cd) | Shield Wall (2x def, 3cd) | Charge (2 tiles + stun, 5cd) |
| Mage | Basic Attack | Fireball (AOE 3 dmg, 4cd) | Frost Nova (freeze adj, 5cd) | Blink (teleport 3, 4cd) |
| Rogue | Basic Attack | Backstab (2x if behind, 3cd) | Smoke Bomb (invis 2t, 5cd) | Dash (move 2, 2cd) |
| Cleric | Basic Attack | Heal (10 HP, 4cd) | Smite (1.5x undead, 3cd) | Sanctuary (immune 1t, 6cd) |

### Reinforcement System
- Enemies spawn from arena edges over time
- Countdown visible in battle UI
- Field pulse accelerates arrival:
  - Minor (1.25x amp): 0.9x arrival time
  - Moderate (1.5x amp): 0.8x arrival time
  - Major (2.0x amp): 0.7x arrival time
- Elite spawns possible on deeper floors

### Battle Artifacts
| Artifact | Effect in Battle |
|----------|------------------|
| Duplicate Seal | Duplicates consumable effects |
| Woundglass Shard | Reveals safe tiles and reinforcement ETAs |
| Oathstone | Vow enforcement continues |

### Ghost Battle Effects
| Ghost Type | Battle Effect |
|------------|---------------|
| Champion | +3 temporary HP at battle start |
| Archivist | Reveals safe tiles at battle start |
| Beacon | Points player away from reinforcement entry |

### Web Controls
- **WASD / Arrow Keys**: Move in arena
- **1-4**: Use class abilities
- **Space / Enter**: Wait turn
- **Escape**: Attempt to flee

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

### Exploration View
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

## Three.js Battle Renderer (v6.3.0+)

### 3D Tactical Arena
- WebGL-powered arena view via Three.js
- Isometric camera angle for tactical overview
- Tile-based floor with hazard coloring (lava, ice, poison, water)
- Entity meshes with animated health bar overlays

### Battle HUD
- React overlay on Three.js canvas
- Reinforcement countdown panel
- Ability buttons with cooldown indicators
- Turn indicator and action feedback

### Visual Polish (v6.3.1)
- Smooth movement transitions (200ms slide animations)
- Floating damage numbers (rise and fade)
- Color-coded feedback (red damage, green healing)

### Arena Lighting
- Ambient and directional lights
- Hazard tile glow effects
- Dynamic shadows for entities

---

## D&D Combat System (v6.10.0+)

### Ability Scores
Four core abilities affect combat and skill checks:

| Ability | Abbr | Combat Effect |
|---------|------|---------------|
| Strength | STR | Melee attack/damage modifier |
| Dexterity | DEX | Ranged attack/damage, initiative, finesse weapons, AC bonus |
| Constitution | CON | Hit points, saving throws vs poison/disease |
| Luck | LUCK | Chance to reroll dice and take better result |

### Race Base Stats & Modifiers (v6.10.0)

| Race | Base Stats | Modifiers |
|------|------------|-----------|
| Human | 10/10/10/10 | +2 LUCK |
| Elf | 8/12/8/10 | -1 STR, +2 DEX |
| Dwarf | 12/8/12/8 | +1 STR, +2 CON, -1 LUCK |
| Halfling | 6/14/10/12 | -2 STR, +2 DEX, +2 LUCK |
| Orc | 14/8/12/6 | +2 STR, +1 CON, -1 LUCK |

### Class Modifiers (v6.10.0)

| Class | Hit Die | Primary | Modifiers |
|-------|---------|---------|-----------|
| Warrior | d10 | STR | +2 STR, +1 CON |
| Mage | d6 | DEX | -1 STR, +1 DEX, +2 LUCK |
| Rogue | d8 | DEX | +2 DEX, +1 LUCK |
| Cleric | d8 | CON | +2 CON, +1 LUCK |

### Attack Rolls (v6.10.0)
1. Roll 1d20 + attack modifier
2. Compare to target's Armor Class (AC)
3. Total ≥ AC = hit
4. Natural 20 = critical hit (double damage dice)
5. Natural 1 = automatic miss

### Proficiency Bonus (v6.12.0)
Level-based bonus added to attacks:
- Level 1-4: +2
- Level 5-8: +3
- Level 9-12: +4
- Level 13-16: +5
- Level 17-20: +6

Formula: `2 + (level - 1) // 4`

### Damage Rolls (v6.11.0)
- Weapon dice + ability modifier
- Critical hits double the dice (not modifier)
- **Finesse weapons** (daggers): Use DEX instead of STR

### Weapon Damage Dice (v6.11.0)

| Weapon | Dice | Stat |
|--------|------|------|
| Dagger | 1d4 | DEX |
| Short Sword | 1d6 | STR |
| Sword | 1d8 | STR |
| Axe | 1d10 | STR |
| Dragon Slayer | 2d8 | STR |

### Saving Throws
Roll 1d20 + ability modifier vs Difficulty Class (DC):

**Traps (v6.11.0)**
- DEX save vs trap detection DC
- Success = half damage

**Status Effects (v6.12.0)**
| Effect | Save | DC |
|--------|------|-----|
| Poison | CON | 12 |
| Burn | CON | 10 |
| Freeze | CON | 12 |
| Stun | CON | 14 |

**Hazards (v6.12.0)**
| Hazard | Save | DC | On Success |
|--------|------|-----|------------|
| Lava | DEX | 15 | Half damage |
| Ice | DEX | 10 | Prevent slide |
| Poison Gas | CON | 12 | Prevent poison |
| Deep Water | CON | 10 | Prevent drowning check |

### Initiative (v6.12.0)
Turn order determined by d20 + DEX modifier:
- Higher initiative acts first
- Elite/boss enemies get initiative bonuses

### LUCK System (v6.10.0)
LUCK score affects dice rolling:
- Higher LUCK = chance to roll twice and take better result
- Lower LUCK = chance to roll twice and take worse result
- Normalized as: `(LUCK - 10) / 20.0`

### Dice HUD (v6.10.0)
3D animated dice display in battle overlay:
- Attack rolls: d20 vs AC
- Damage rolls: weapon dice
- Saving throws: d20 vs DC
- Initiative rolls: d20 + DEX
- Shows critical hits, fumbles, success/failure

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
