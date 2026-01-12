# Gameplay Guide

How to play the Roguelike Dungeon Crawler.

---

## Controls

### Movement & Actions

| Key | Action |
|-----|--------|
| **WASD** or **Arrow Keys** | Move (relative to facing) |
| **Q** | Turn left |
| **E** | Turn right |
| **F** | Search for secrets |
| **>** | Descend stairs |
| **X** | Save and quit |

### UI Screens

| Key | Screen |
|-----|--------|
| **I** | Inventory |
| **C** | Character stats |
| **M** | Message log |
| **?** | Help |
| **1-3** | Quick-use items |

### Inventory Controls

| Key | Action |
|-----|--------|
| **Arrow Keys** | Navigate items |
| **E** or **Enter** | Equip/use item |
| **D** | Drop item |
| **I/Q/ESC** | Close |

### Dialog Controls

| Key | Action |
|-----|--------|
| **Y** | Confirm |
| **N** | Cancel |

### Battle Controls (Tactical Mode)

| Key | Action |
|-----|--------|
| **WASD** or **Arrow Keys** | Move in arena |
| **1-4** | Use class ability |
| **Space** or **Enter** | Wait (skip turn) |
| **ESC** | Attempt to flee |

### Ghost Replay Viewer

| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **←/→** | Step back/forward |
| **Home/End** | Jump to start/end |
| **ESC** | Close |

### Mobile Touch Controls

- **D-Pad** (left): Movement
- **Action Buttons** (right): I, >, 1/2/3, Q
- Controls adapt to current screen

---

## Gameplay Basics

### Objective
Descend through 5 dungeon levels and defeat the Dragon Emperor to win.

### Movement
- Move into enemies to attack
- Move into items to pick up
- Stand on **>** and press **>** to descend

### Combat (Tactical Battle Mode)
- **Enemy encounters**: Walking into an enemy triggers a tactical battle arena
- **Instanced arenas**: Combat takes place in 9x7 tactical grids with hazards
- **Turn-based**: Move, attack, or use abilities each turn
- **Reinforcements**: Additional enemies may spawn from arena edges
- Watch your HP - death is permanent!

### Leveling
- Gain XP by killing enemies
- Level up: +10 max HP, +1 ATK
- Choose feats at levels 3, 5, 7, 9

---

## Symbols Legend

### Entities
| Symbol | Meaning |
|--------|---------|
| **@** | Player |
| **g/G** | Goblin / Elite |
| **s/S** | Skeleton / Elite |
| **o/O** | Orc / Elite |
| **W** | Wraith |
| **T** | Troll |
| **D** | Dragon |
| **K** | Goblin King (Boss) |

### Terrain
| Symbol | Meaning |
|--------|---------|
| **#** | Wall |
| **.** | Floor |
| **+** | Door |
| **>** | Stairs down |
| **<** | Stairs up |
| **≈** | Water |
| **~** | Hazard |
| **^** | Trap |

### Items
| Symbol | Meaning |
|--------|---------|
| **!** | Potion |
| **?** | Scroll |
| **)** | Weapon |
| **]** | Armor |
| **$** | Gold |

---

## Status Effects

| Effect | Icon | Duration | Result |
|--------|------|----------|--------|
| Poison | Green | 5 turns | 2 damage/turn |
| Burn | Red | 3 turns | 3 damage/turn |
| Freeze | Blue | 3 turns | -50% speed |
| Stun | Yellow | 1 turn | Skip turn |

---

## Tips

1. **Explore carefully** - Use F to search for secret doors
2. **Manage inventory** - Keep health potions for emergencies
3. **Watch depth** - Enemies get harder on lower levels
4. **Use terrain** - Doorways create chokepoints
5. **Level up** - Grinding early levels makes later ones easier
6. **Boss prep** - Stock up before entering boss rooms
7. **Turn to look** - Use Q/E to check your surroundings

---

## First-Person View

The 3D view shows what's ahead based on your facing direction:

- **Walls** fade into fog with distance
- **Torches** provide light pools
- **Compass** at top shows direction
- **Enemies** appear in the corridor
- **Items** glow on the floor

Toggle between terminal and 3D view on the Play page.

---

## Tactical Battle Mode

When you encounter an enemy, combat transitions to a 3D tactical arena rendered with Three.js.

### Battle Flow
1. **Engagement**: Walk into an enemy to trigger battle
2. **Arena Setup**: 9x7 grid with biome-specific hazards (lava, ice, water, poison)
3. **Turn-Based Combat**: Move, attack with abilities (1-4), or wait
4. **Reinforcements**: Watch the countdown - more enemies arrive over time
5. **Victory**: Clear all enemies to return to exploration with loot/XP
6. **Flee**: Press ESC to attempt escape (costs a turn, pushes you back)

### Class Abilities
Each class has 4 abilities with cooldowns:
- **Warrior**: Power Strike, Shield Wall, Charge
- **Mage**: Fireball, Frost Nova, Blink
- **Rogue**: Backstab, Smoke Bomb, Dash
- **Cleric**: Heal, Smite, Sanctuary

### Visual Features
- Smooth entity movement transitions
- Floating damage numbers
- Hazard tile highlighting
- Health bar overlays on entities
- Reinforcement entry edge indicators
