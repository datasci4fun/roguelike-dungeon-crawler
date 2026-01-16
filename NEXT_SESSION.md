# Next Session - D&D Stats & Dice System

## Session Date: 2026-01-16

## Completed This Session

### D&D-Style Stats & Dice System (PR #74)

Implemented full D&D-style ability scores and dice rolling mechanics:

| Component | Description | Status |
|-----------|-------------|--------|
| **Dice Roller** | Core dice module with LUCK influence | Complete |
| **Ability Scores** | STR, DEX, CON, LUCK system | Complete |
| **D&D Combat** | Attack rolls vs AC, damage dice, saves | Complete |
| **Database Models** | Race/class modifiers, weapons | Complete |
| **Seed Data** | Updated races, classes, new weapons | Complete |
| **3D Dice** | Animated CSS 3D dice (d4-d20) | Complete |
| **StatRoller** | Character creation dice UI | Complete |
| **DiceRollHUD** | Battle dice display overlay | Complete |

### Backend (Python)

**New Files:**
- `src/core/dice.py` - Core dice rolling with LUCK influence
  - `roll_die()`, `roll_dice()`, `roll_notation()`, `roll_d20()`
  - LUCK: chance to roll twice and take higher/lower
- `src/entities/ability_scores.py` - Ability score system
  - `AbilityScores` dataclass (str, dex, con, luck)
  - Race/class modifier constants and application
- `src/combat/dnd_combat.py` - D&D combat resolution
  - `AttackRoll`, `DamageRoll`, `SavingThrow` dataclasses
  - `make_attack_roll()` - 1d20 + modifier vs AC
  - `make_damage_roll()` - weapon dice + modifier
  - `resolve_attack()` - full combat resolution

**Modified Files:**
- `src/entities/entity/player.py` - Added ability scores, armor_class, modifiers

### Database Models

**Updated `server/app/models/game_constants.py`:**
- **Race**: base_str/dex/con/luck, str/dex/con/luck_modifier
- **PlayerClass**: str/dex/con/luck_modifier, hit_die, primary_stat, armor_proficiency
- **Enemy**: armor_class, attack_bonus, damage_dice, str/dex/con_score
- **Weapon** (new): weapon_id, damage_dice, damage_type, stat_used, is_ranged, properties

### Seed Data

**`data/seeds/races.json`** - All 5 races with ability scores:
| Race | Base Stats | Modifiers |
|------|------------|-----------|
| Human | 10/10/10/10 | +0/+0/+0/+2 LUCK |
| Elf | 8/12/8/10 | -1 STR/+2 DEX |
| Dwarf | 12/8/12/8 | +1 STR/+2 CON/-1 LUCK |
| Halfling | 6/14/10/12 | -2 STR/+2 DEX/+2 LUCK |
| Orc | 14/8/12/6 | +2 STR/+1 CON/-1 LUCK |

**`data/seeds/classes.json`** - All 4 classes with hit dice:
| Class | Hit Die | Primary | Modifiers |
|-------|---------|---------|-----------|
| Warrior | d10 | STR | +2 STR/+1 CON |
| Mage | d6 | DEX | -1 STR/+1 DEX/+2 LUCK |
| Rogue | d8 | DEX | +2 DEX/+1 LUCK |
| Cleric | d8 | CON | +2 CON/+1 LUCK |

**`data/seeds/weapons.json`** (new) - 16 weapons with D&D damage:
- Melee: fist (1d4), dagger (1d4), shortsword (1d6), longsword (1d8), greatsword (2d6), etc.
- Ranged: shortbow (1d6), longbow (1d8), crossbow (1d8), throwing knife (1d4)

### Frontend (React/TypeScript)

**New Components:**
- `web/src/components/Dice3D/` - 3D animated dice with CSS transforms
  - Supports d4, d6, d8, d10, d12, d20
  - Rolling animation, LUCK glow effect
- `web/src/components/DiceRollHUD/` - Combat dice overlay
  - Queue system for multiple rolls
  - Shows attack vs AC, damage, critical/fumble
- `web/src/components/StatRoller/` - Character creation roller
  - Interactive 3d6 rolling per stat
  - Race/class modifier preview
  - "Roll All" and "Accept" buttons

**Modified Files:**
- `web/src/pages/CharacterCreation.tsx` - Added stat rolling modal
- `web/src/pages/Play.tsx` - Integrated DiceRollHUD, DICE_ROLL event processing
- `web/src/types/index.ts` - Added AbilityScores, DiceRollEvent types

---

## Current State

### Stat Calculation Flow
1. Roll 3d6 for each stat (3-18 base)
2. Add race base adjustment (race_base - 10)
3. Apply race modifier
4. Apply class modifier
5. Final stat used for combat modifiers

### Combat Flow (Ready for Integration)
1. Attack: 1d20 + DEX modifier vs target AC
2. Hit: Roll weapon damage dice + STR modifier
3. Critical (nat 20): Double damage dice
4. Fumble (nat 1): Auto-miss
5. LUCK influences reroll chances

### Component Hierarchy Update
```
Play.tsx
└── scene-wrapper
    ├── BattleRenderer3D
    ├── BattleHUD
    ├── DiceRollHUD (top-right) - NEW
    └── ...other overlays
```

---

## Next Tasks

### Backend Integration Required
1. **Emit DICE_ROLL Events** - Combat system needs to emit events for dice HUD
2. **Use D&D Combat Module** - Replace probability combat with dice rolls
3. **Database Migration** - Create Alembic migration for new columns
4. **Seed Data Sync** - Run seed sync to update database

### Potential Improvements
1. **Saving Throws** - Integrate with traps and hazards
2. **Weapon Equipment** - Use weapon damage dice from inventory
3. **Enemy Combat** - Use enemy armor_class and damage_dice
4. **Skill Checks** - Add ability-based skill checks

---

## Quick Start

```bash
# Using docker-compose (recommended)
docker-compose up -d

# Or manually:
# Start backend server
cd server && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

# Start frontend dev server
cd web && npm run dev
```

---

## Git Status

Branch: `develop`

Recent merges:
- PR #74 - D&D-style ability scores and dice rolling system
- PR #73 - UI Migration (StatsHUD, GameMessagesPanel, Minimap, etc.)
