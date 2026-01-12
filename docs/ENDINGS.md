# Endings & Cutscene System

Documentation of existing ending flows, cutscene routing, and integration points.

---

## Overview

The game has three cutscene sequences and multiple ending states:

| Cutscene | Trigger | Scenes | Variants |
|----------|---------|--------|----------|
| Intro | Game start | 7 | None |
| Game Over | Player death | 5 | 3 fate types |
| Victory | Floor 8 boss defeated | 3 | 3 legacy types |

---

## Ending Types (EndingId)

Defined in `src/story/completion.py`:

| EndingId | Trigger | Cutscene |
|----------|---------|----------|
| `DEATH_STANDARD` | Player HP reaches 0 | Game Over |
| `VICTORY_STANDARD` | Defeat floor 8 boss | Victory |
| `VICTORY_SECRET` | (Placeholder) 100% + secret criteria | Victory (modified) |

### Secret Ending Status

`VICTORY_SECRET` is currently **unreachable**. Requirements:
- `secrets_found` must contain `"SECRET_ENDING_ENABLED"`
- This flag is never set in current code
- Reserved for future content

---

## Cutscene Structures

### Intro Cutscene (7 Scenes)

Location: `web/src/cutscenes/intro/`

| Scene | ID | Content |
|-------|-----|---------|
| 0 | Title | Title screen with game logo |
| 1 | Kingdom | "A kingdom once stood..." |
| 2 | Darkness | "Then darkness came..." |
| 3 | Underground | "Deep beneath the earth..." |
| 4 | Centuries | "Centuries passed..." |
| 5 | Present | "Now, in the present day..." |
| 6 | You | "You descend into the depths..." |

**Trigger:** New game start, after character creation
**Exit:** Exploration mode (floor 1)

---

### Game Over Cutscene (5 Scenes)

Location: `web/src/cutscenes/game_over/`

| Scene | ID | Content |
|-------|-----|---------|
| 0 | Fall | Camera slump effect (transparent BG for 3D death cam) |
| 1 | YouDied | "YOU DIED" text reveal |
| 2 | AbyssClaims | "The abyss claims another..." |
| 3 | Fate | Fate-specific text (variant) |
| 4 | Prompt | Continue/quit options |

**Fate Variants (Scene 3):**

| Fate | Ghost Type | Description |
|------|------------|-------------|
| Echo | ECHO | "Your path loops endlessly..." |
| Hollowed | HOLLOWED | "Your rage lingers, hollow..." |
| Silence | SILENCE | "Your absence echoes..." |

Fate is randomly selected per death and locked for that run.

**Trigger:** `game_state === 'DEAD'`
**Exit:** Title screen or new game

---

### Victory Cutscene (3 Scenes)

Location: `web/src/cutscenes/victory/`

| Scene | ID | Content |
|-------|-----|---------|
| 0 | Seal | "The final seal breaks..." |
| 1 | World | "Light returns to the world..." |
| 2 | Legend | Legacy-specific text (variant) |

**Legacy Variants (Scene 2):**

| Legacy | Ghost Type | Description |
|--------|------------|-------------|
| Beacon | BEACON | "A light for those who follow..." |
| Champion | CHAMPION | "Your strength inspires..." |
| Archivist | ARCHIVIST | "Your knowledge persists..." |

Legacy is derived from `CompletionLedger` statistics (not random):
- High kills + low lore → CHAMPION
- Low kills + high lore → ARCHIVIST
- Low both → BEACON

**Trigger:** `game_state === 'VICTORY'`
**Exit:** Title screen with stats

---

## Transition Routing

### Current Flow (v6.0)

```
┌─────────────────────────────────────────────────────────────┐
│                        EXPLORATION                           │
│                                                             │
│  ┌──────────┐    bump enemy    ┌──────────┐                │
│  │ Movement │ ───────────────► │  BATTLE  │                │
│  └──────────┘                  └──────────┘                │
│       │                              │                      │
│       │                    ┌─────────┴─────────┐           │
│       │                    ▼                   ▼           │
│       │              ┌──────────┐       ┌──────────┐       │
│       │              │ Victory  │       │  Defeat  │       │
│       │              └──────────┘       └──────────┘       │
│       │                    │                   │           │
│       │                    ▼                   │           │
│       │         ┌──────────────────┐          │           │
│       │         │ Return to        │          │           │
│       │         │ Exploration      │          │           │
│       │         └──────────────────┘          │           │
│       │                    │                   │           │
│       │         Floor 8    │                   │           │
│       │         boss?      │                   │           │
│       │                    ▼                   │           │
│       │              ┌──────────┐              │           │
│       │              │ VICTORY  │              │           │
│       │              │ CUTSCENE │              │           │
│       │              └──────────┘              │           │
│       │                                        │           │
│       │ HP = 0                                 │           │
│       ▼                                        ▼           │
│  ┌──────────────────────────────────────────────────┐     │
│  │              GAME OVER CUTSCENE                   │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Transition Points (v6.1 Integration)

| Transition | Current State | v6.1 Target |
|------------|---------------|-------------|
| Exploration → Battle | Instant overlay swap | Fade + letterbox + SFX |
| Battle → Exploration (win) | Instant return | Fade + victory sting |
| Battle → Death cutscene | Instant | Already has camera effect |
| Battle → Victory cutscene | Instant | Fade + triumph fanfare |
| Cutscene → Exploration | Instant | Fade out |

---

## Key Files

### Backend (Python)

| File | Purpose |
|------|---------|
| `src/story/completion.py` | EndingId enum, resolve_ending(), VictoryLegacy derivation |
| `src/core/game.py` | Game state transitions (PLAYING, DEAD, VICTORY) |
| `src/combat/battle_manager.py` | Battle outcome determination |

### Frontend (TypeScript/React)

| File | Purpose |
|------|---------|
| `web/src/pages/Play.tsx` | Mode routing (exploration, battle, cutscenes) |
| `web/src/components/GameOverCutscene.tsx` | Death cutscene wrapper |
| `web/src/components/VictoryCutscene.tsx` | Victory cutscene wrapper |
| `web/src/cutscenes/engine/` | Cutscene player engine |
| `web/src/cutscenes/game_over/` | Death scenes + fate variants |
| `web/src/cutscenes/victory/` | Victory scenes + legacy variants |

---

## Cutscene Engine Architecture

```
web/src/cutscenes/
├── engine/
│   ├── CutscenePlayer.tsx    # Main player component
│   ├── types.ts              # CutsceneConfig, SceneConfig types
│   ├── hooks/
│   │   ├── useCutsceneTimeline.ts  # Scene progression
│   │   └── useFxBus.ts             # Effects coordination
│   ├── layers/
│   │   ├── SceneBackground.tsx     # Parallax backgrounds
│   │   ├── ParticlesLayer.tsx      # Particle effects
│   │   ├── FxLayer.tsx             # Flash/shake/flicker
│   │   └── CrtLayer.tsx            # CRT scanline overlay
│   ├── text/
│   │   └── RetroCaption.tsx        # Phosphor text reveal
│   └── ui/
│       └── CutsceneHUD.tsx         # Skip button, progress
├── intro/                    # 7-scene intro
├── game_over/               # 5-scene death (with fate variants)
└── victory/                 # 3-scene victory (with legacy variants)
```

---

## Factory Functions

Cutscenes are created via factory functions that lock variant selection:

```typescript
// web/src/cutscenes/game_over/index.ts
export function createGameOverCutscene(fate: DeathFate): CutsceneConfig

// web/src/cutscenes/victory/index.ts
export function createVictoryCutscene(legacy: VictoryLegacy): CutsceneConfig
```

Variants are determined:
- **Death fate:** Random selection at death time
- **Victory legacy:** Derived from CompletionLedger (deterministic)

---

## Secret Ending Hooks (v6.4)

Reserved integration points for future secret ending:

| Hook | Location | Status |
|------|----------|--------|
| `SECRET_ENDING_ENABLED` flag | `completion.py` | Defined, never set |
| `secrets_found` set | `CompletionLedger` | Exists, no IDs defined |
| Secret ending check | `resolve_ending()` | Logic exists, unreachable |
| Secret cutscene variant | (not created) | Needs new scene config |

### Adding Secret Ending Later

1. Define secret criteria in `completion.py`
2. Set `secrets_found.add("SECRET_ENDING_ENABLED")` when criteria met
3. Create `web/src/cutscenes/victory/scenes/03_Secret/` with new scene
4. Update `createVictoryCutscene()` to handle secret variant
5. No structural changes needed to routing

---

## v6.1 Transition Requirements

### Input Lock During Transitions

```typescript
// Pseudo-code for transition state
interface TransitionState {
  active: boolean;
  type: 'fade_in' | 'fade_out' | 'letterbox';
  duration: number;
  onComplete: () => void;
}

// During transition:
// - Ignore all keyboard/mouse input
// - Show transition overlay
// - Play appropriate SFX
```

### Transition Timing

| Transition | Duration | Effect |
|------------|----------|--------|
| To battle | 500ms | Fade to black + letterbox |
| From battle (win) | 400ms | Fade from black |
| From battle (lose) | 0ms | Death camera handles it |
| To victory cutscene | 600ms | Fade + fanfare |

### No-Flicker Requirement

Overlays must be layered correctly:
```
z-index: 100 - Exploration UI
z-index: 150 - Battle overlay
z-index: 200 - Transition overlay
z-index: 250 - Cutscene overlay
```

Only one content layer visible at a time; transition overlay handles crossfade.
