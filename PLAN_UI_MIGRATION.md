# UI Migration Plan: Terminal to 3D First-Person View

## Overview

This plan outlines the migration of all terminal UI elements into the 3D first-person view, enabling the eventual removal of the left-side terminal panel. The goal is to create a modern, immersive UI while maintaining the classic roguelike feel.

---

## Current State

### Terminal Components to Migrate
| Component | Current Location | Target Location |
|-----------|------------------|-----------------|
| Minimap | Terminal panel (5x5 grid) | Bottom-right of 3D view |
| Messages | Terminal bottom area | Bottom-left chat panel |
| Message Log | Full-screen terminal | Tab in chat panel |
| Help Screen | Full-screen terminal | Modal window in 3D view |
| Quit Menu | X key → immediate quit | Modal menu with save option |
| Stats (HP, ATK, DEF, etc.) | Terminal header | Top-left HUD in 3D view |

### Data Sources Already Available
- `gameState.first_person_view.top_down_window` - 11x11 tile grid
- `gameState.messages` - Array of recent messages
- `gameState.player` - All stats (health, attack, defense, level, xp, kills)
- `gameState.dungeon` - Level info, dimensions

---

## Implementation Plan

### Phase 1: Minimap Component

**Goal**: Create a stylized minimap in the bottom-right corner showing explored areas, player position, enemies, and items.

#### Component: `Minimap.tsx`
**Location**: `web/src/components/Minimap/`

**Features**:
- 11x11 or configurable grid based on `top_down_window` data
- Tile rendering:
  - `#` walls → dark gray squares
  - `.` floor → light squares (explored)
  - `@` player → bright green/gold marker
  - Enemy symbols → red dots
  - Item symbols → yellow dots
  - `>` stairs → blue marker
  - `+` doors → brown lines
  - Fog of war for unexplored areas
- Compass rose or facing indicator
- Border with dungeon level label
- Collapsible/expandable toggle (M key or click)
- Smooth CSS transitions for player movement

**Styling**:
- Semi-transparent dark background
- Pixel-art aesthetic with crisp edges
- Glow effects for player and important markers
- Traditional RPG parchment border option

**Data Requirements**:
```typescript
interface MinimapProps {
  tiles: string[][];           // from top_down_window
  playerFacing: { dx: number; dy: number };
  dungeonLevel: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
}
```

**Implementation Steps**:
1. Create `Minimap.tsx` component
2. Create `Minimap.css` with positioning and tile styles
3. Parse `top_down_window` to identify tile types
4. Render tiles as colored divs or canvas
5. Add player marker with facing indicator
6. Add entity markers (enemies, items)
7. Add collapse/expand functionality
8. Integrate into `Play.tsx` inside scene-wrapper

---

### Phase 2: Chat Panel (Messages Interface)

**Goal**: Create an MMO-style tabbed chat interface in the bottom-left showing messages, combat log, and system notifications.

#### Component: `ChatPanel.tsx`
**Location**: `web/src/components/ChatPanel/`

**Features**:
- Tabbed interface:
  - **All** - All messages combined
  - **Combat** - Damage dealt/received, kills
  - **Loot** - Item pickups, discoveries
  - **System** - Level ups, achievements, game events
- Scrollable message history (last 50-100 messages)
- Auto-scroll to newest with manual scroll lock
- Message timestamps (optional)
- Color-coded messages by type:
  - Red: damage, attacks
  - Green: healing, buffs
  - Yellow: level ups, achievements
  - Cyan: item pickups
  - White: general messages
- Resize handle to adjust height
- Collapse to single line (show latest message only)
- Filter toggle per tab

**Styling**:
- Semi-transparent dark panel
- Tab bar at top with active indicator
- Scrollbar styled to match theme
- Message fade-in animation
- Unread indicator on inactive tabs

**Data Requirements**:
```typescript
interface ChatPanelProps {
  messages: string[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  maxMessages?: number;
}

// Message categorization helper
function categorizeMessage(msg: string): 'combat' | 'loot' | 'system' | 'general';
```

**Implementation Steps**:
1. Create `ChatPanel.tsx` with tab state management
2. Create `ChatPanel.css` with panel and tab styles
3. Implement message categorization logic
4. Add scrollable message container with auto-scroll
5. Implement tab filtering
6. Add collapse/expand functionality
7. Add resize handle (optional)
8. Integrate into `Play.tsx` inside scene-wrapper

---

### Phase 3: Help Window

**Goal**: Create a modal help window similar to CharacterWindow with organized keybindings and game instructions.

#### Component: `HelpWindow.tsx`
**Location**: `web/src/components/HelpWindow/`

**Features**:
- Modal overlay (like CharacterWindow)
- Tabbed sections:
  - **Movement** - WASD, QE turning, arrow keys
  - **Actions** - Stairs, search, items
  - **Screens** - Inventory, Character, Journal, etc.
  - **Combat** - Battle controls, abilities
  - **Tips** - Gameplay hints
- Keyboard shortcut display with `<kbd>` styling
- Searchable (optional)
- Close on ESC or ? key

**Content Structure**:
```
MOVEMENT
  W / ↑     Move forward
  S / ↓     Move backward
  A / ←     Strafe left
  D / →     Strafe right
  Q         Turn left
  E         Turn right

ACTIONS
  >         Descend stairs
  F / X     Search for secrets
  1-3       Use quick slot item
  Space     Wait one turn

SCREENS
  I         Inventory
  C         Character info
  J         Lore Codex
  M         Toggle minimap
  ?         This help screen
  ESC       Close current screen

COMBAT
  Click     Select target/move
  1-4       Use ability
  Space     End turn
  R         Flee battle
```

**Styling**:
- Match CharacterWindow aesthetic (parchment/traditional RPG)
- Two-column layout for keybindings
- Section headers with decorative dividers
- Hover states on keybindings

**Implementation Steps**:
1. Create `HelpWindow.tsx` component
2. Create `HelpWindow.css` matching CharacterWindow style
3. Define help content as structured data
4. Implement tabbed navigation
5. Add keyboard handling (ESC, ?)
6. Integrate into `Play.tsx` inside scene-wrapper
7. Update existing ? key handler to show new window

---

### Phase 4: Quit Menu with Save

**Goal**: Replace immediate quit with a menu offering save, load, settings, and quit options.

#### Component: `GameMenu.tsx`
**Location**: `web/src/components/GameMenu/`

**Features**:
- Modal menu overlay
- Options:
  - **Resume** - Close menu, return to game
  - **Save Game** - Save current progress (with slot selection or auto-save)
  - **Load Game** - Load saved game (if saves exist)
  - **Settings** - Audio, display options (future)
  - **Help** - Open help window
  - **Quit to Title** - Return to title screen
  - **Quit Game** - Exit application
- Keyboard navigation (arrow keys, enter)
- ESC to close (resume)
- Confirmation dialogs for destructive actions

**Save System Requirements**:
- Backend endpoint: `POST /api/game/save`
- Backend endpoint: `GET /api/game/saves` (list saves)
- Backend endpoint: `POST /api/game/load/{save_id}`
- Save data includes:
  - Player stats and position
  - Dungeon state (level, explored tiles)
  - Inventory and equipment
  - Message history (optional)
  - Turn count
  - Timestamp

**Styling**:
- Dark overlay with centered menu panel
- Large, clear buttons with hover states
- Icon for each option
- Disabled state for unavailable options

**Implementation Steps**:
1. Create `GameMenu.tsx` component
2. Create `GameMenu.css` with menu styles
3. Add menu state to `Play.tsx`
4. Update X key handler to open menu instead of quit
5. Implement save/load WebSocket messages
6. Add backend save/load endpoints (separate task)
7. Add confirmation dialogs
8. Integrate into `Play.tsx` inside scene-wrapper

---

### Phase 5: Stats HUD

**Goal**: Display player vital statistics in the top-left corner of the 3D view.

#### Component: `StatsHUD.tsx`
**Location**: `web/src/components/StatsHUD/`

**Features**:
- Compact display showing:
  - **Level**: Player level with class icon
  - **HP Bar**: Current/max with color gradient
  - **XP Bar**: Progress to next level
  - **ATK**: Attack stat with sword icon
  - **DEF**: Defense stat with shield icon
  - **Kills**: Kill counter with skull icon
- Animated bar transitions
- Low health warning effects (pulse, color change)
- Compact/expanded toggle

**Layout Options**:
```
Option A: Vertical Stack (recommended)
┌─────────────────┐
│ Lv.5 Warrior    │
│ ████████░░ 80/100 HP │
│ ██████░░░░ 450/800 XP │
│ ⚔ 15  🛡 8  💀 23 │
└─────────────────┘

Option B: Horizontal Bar
┌──────────────────────────────────────┐
│ Lv.5 │ HP: 80/100 │ XP: 450/800 │ ⚔15 🛡8 💀23 │
└──────────────────────────────────────┘
```

**Styling**:
- Semi-transparent background
- Health bar: Green → Yellow → Red gradient based on %
- XP bar: Blue/purple gradient
- Glow effects for level-up ready state
- Pulse animation when HP is critical (<25%)

**Data Requirements**:
```typescript
interface StatsHUDProps {
  player: {
    level: number;
    health: number;
    max_health: number;
    xp: number;
    xp_to_level: number;
    attack: number;
    defense: number;
    kills: number;
    class?: { name: string };
  };
  isCompact?: boolean;
}
```

**Implementation Steps**:
1. Create `StatsHUD.tsx` component
2. Create `StatsHUD.css` with bar and stat styles
3. Implement HP/XP bar with gradient fills
4. Add low health warning effects
5. Add level-up ready indicator
6. Add compact toggle
7. Integrate into `Play.tsx` inside scene-wrapper

---

### Phase 6: Terminal Removal

**Goal**: Add option to hide the terminal panel once all UI is migrated.

**Features**:
- Toggle in game settings or view controls
- Terminal hidden by default for new 3D experience
- Option to show terminal for debugging/nostalgia
- Layout adjusts when terminal hidden (3D view expands)

**Implementation Steps**:
1. Add `showTerminal` state to Play.tsx
2. Add toggle control in view settings
3. Adjust CSS grid layout when terminal hidden
4. Ensure all terminal functionality is available in 3D UI
5. Test complete gameplay loop without terminal

---

## Component Hierarchy

```
Play.tsx
└── scene-wrapper (position: relative)
    ├── FirstPersonRenderer3D / BattleRenderer3D
    ├── StatsHUD (top-left, position: absolute)
    ├── CharacterHUD (existing, top-right area)
    ├── StatusHUD (existing)
    ├── Minimap (bottom-right, position: absolute)
    ├── ChatPanel (bottom-left, position: absolute)
    ├── CharacterWindow (modal, centered)
    ├── LoreCodex (modal, centered)
    ├── HelpWindow (modal, centered)
    ├── GameMenu (modal, centered)
    └── TransitionCurtain / Cutscenes
```

---

## File Structure

```
web/src/components/
├── Minimap/
│   ├── Minimap.tsx
│   ├── Minimap.css
│   └── index.ts
├── ChatPanel/
│   ├── ChatPanel.tsx
│   ├── ChatPanel.css
│   └── index.ts
├── HelpWindow/
│   ├── HelpWindow.tsx
│   ├── HelpWindow.css
│   └── index.ts
├── GameMenu/
│   ├── GameMenu.tsx
│   ├── GameMenu.css
│   └── index.ts
├── StatsHUD/
│   ├── StatsHUD.tsx
│   ├── StatsHUD.css
│   └── index.ts
```

---

## Implementation Order

1. **StatsHUD** - Quick win, immediately useful
2. **ChatPanel** - Core gameplay feedback
3. **Minimap** - Navigation essential
4. **HelpWindow** - User onboarding
5. **GameMenu** - Save system (backend work needed)
6. **Terminal Toggle** - Final cleanup

---

## Backend Requirements

### Save/Load System (Phase 4)

**New Endpoints**:
```python
# server/app/api/game_routes.py

POST /api/game/save
  - Serializes current game state
  - Stores in database with user_id and timestamp
  - Returns save_id

GET /api/game/saves
  - Returns list of saves for current user
  - Includes metadata: timestamp, dungeon_level, player_level

POST /api/game/load/{save_id}
  - Loads saved game state
  - Restores engine state
  - Returns game_state

DELETE /api/game/saves/{save_id}
  - Deletes a save slot
```

**WebSocket Messages**:
```typescript
// Save game
{ action: 'save_game', slot?: number }

// Load game
{ action: 'load_game', save_id: string }

// Response
{ type: 'save_complete', save_id: string, timestamp: string }
{ type: 'load_complete' }
{ type: 'save_error', message: string }
```

---

## Testing Checklist

### Per Component
- [ ] Renders correctly in scene-wrapper
- [ ] Positioned correctly (doesn't overlap other UI)
- [ ] Responsive to window resize
- [ ] Keyboard shortcuts work
- [ ] Click interactions work
- [ ] Animations smooth
- [ ] Matches visual theme

### Integration
- [ ] All components visible simultaneously
- [ ] No z-index conflicts
- [ ] Performance acceptable (60fps)
- [ ] Works in battle mode
- [ ] Works in exploration mode
- [ ] Transitions smooth between modes

### Full Playthrough
- [ ] Complete game without terminal
- [ ] All actions accessible via 3D UI
- [ ] Save/load works correctly
- [ ] Help accessible at all times
- [ ] Messages visible during gameplay

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Performance impact from multiple overlays | Use CSS transforms, minimize re-renders |
| UI clutter in small viewports | Collapsible components, responsive design |
| Save system complexity | Start with single auto-save slot |
| Breaking existing functionality | Keep terminal available as fallback |

---

## Success Criteria

1. Player can complete full game without terminal visible
2. All stats, messages, and navigation available in 3D view
3. Save/load functional with at least one save slot
4. Help accessible via ? key
5. Quit menu provides safe exit with save option
6. UI feels cohesive with existing 3D aesthetic
7. No performance degradation
