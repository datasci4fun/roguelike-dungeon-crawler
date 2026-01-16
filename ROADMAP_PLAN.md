# Public Roadmap Page - Implementation Plan

**Branch:** `feature/roadmap-page`
**Scope:** Data structure, frontend page, integration with existing atmospheric components
**Goal:** Public-facing roadmap displaying prioritized future upgrades with color coding

---

## Executive Summary

Create a `/roadmap` page that displays a comprehensive, ranked list of future development items. The page will:
1. Use existing `AtmosphericPage` components for visual consistency
2. Display items organized by priority tier with color coding
3. Show progress indicators and status badges
4. Be publicly accessible (no auth required)

---

## Part 1: Roadmap Data Structure

### 1.1 Priority Tiers & Color Coding

| Tier | Color | CSS Variable | Meaning |
|------|-------|--------------|---------|
| **Critical** | Red | `--roadmap-critical: #ef4444` | Bugs, broken features, blockers |
| **High** | Orange | `--roadmap-high: #f97316` | Missing core functionality |
| **Medium** | Yellow | `--roadmap-medium: #eab308` | Polish, enhancements |
| **Low** | Green | `--roadmap-low: #22c55e` | Nice-to-haves, future ideas |
| **Research** | Purple | `--roadmap-research: #a855f7` | Investigation needed |

### 1.2 Status Badges

| Status | Badge Color | Icon |
|--------|-------------|------|
| `planned` | Gray | Circle outline |
| `in-progress` | Blue | Spinning loader |
| `completed` | Green | Checkmark |
| `blocked` | Red | X mark |
| `deferred` | Dim gray | Pause icon |

### 1.3 Category Tags

| Category | Description |
|----------|-------------|
| `gameplay` | Core game mechanics |
| `content` | New enemies, items, floors |
| `backend` | Server, database, API |
| `frontend` | UI, UX, components |
| `3d` | Three.js rendering |
| `audio` | Sound effects, music |
| `lore` | Story, codex, narrative |
| `multiplayer` | Ghosts, leaderboards, chat |
| `infrastructure` | Build, deploy, testing |
| `accessibility` | A11y improvements |

### 1.4 Data File Structure

**Path:** `web/src/data/roadmapData.ts`

```typescript
export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'research';
  status: 'planned' | 'in-progress' | 'completed' | 'blocked' | 'deferred';
  category: string[];
  effort: 'small' | 'medium' | 'large' | 'epic';
  targetVersion?: string;
  dependencies?: string[];
  details?: string[];
}

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // Items listed below
];
```

---

## Part 2: Comprehensive Roadmap Items

### 2.1 Critical Priority (Red)

| ID | Title | Category | Effort | Description |
|----|-------|----------|--------|-------------|
| `crit-01` | Fix Missing Enum Values | backend | small | Add missing `CandidateType.SELF` and `KitingPhase.RETREAT` to prevent runtime errors |
| `crit-02` | Ghost Victory Behaviors | backend, multiplayer | medium | Implement Beacon/Champion/Archivist ghost behaviors (UI promises them) |

### 2.2 High Priority (Orange)

| ID | Title | Category | Effort | Description |
|----|-------|----------|--------|-------------|
| `high-01` | Database Save System | backend | large | Persist game state to PostgreSQL with multiple save slots |
| `high-02` | Complete STEALTH AI | backend, gameplay | medium | Finish stealth enemy behavior (ambush, concealment) |
| `high-03` | Complete ELEMENTAL AI | backend, gameplay | medium | Finish elemental enemy behavior (resistance cycling) |
| `high-04` | Missing Artifacts | content, lore | medium | Implement 2 remaining artifacts (5 in lore, 3 in code) |
| `high-05` | Field Pulse Micro-Events | gameplay, lore | medium | Add 1 micro-event per floor during pulse windows |
| `high-06` | Error Boundaries | frontend | small | Add React error boundaries for graceful failure handling |

### 2.3 Medium Priority (Yellow)

| ID | Title | Category | Effort | Description |
|----|-------|----------|--------|-------------|
| `med-01` | Micro-Event Codex Evidence | lore, gameplay | small | Each micro-event unlocks 1 codex entry |
| `med-02` | Extra Enemy Variety | content | medium | Add 1 "spice" enemy per floor at low spawn weight |
| `med-03` | Battle System Polish | gameplay, 3d | medium | Additional ability effects, arena templates, boss phases |
| `med-04` | Performance Optimization | frontend, 3d | medium | Canvas texture caching, reduce re-renders |
| `med-05` | Keyboard Navigation | accessibility, frontend | small | Full keyboard support for menus/inventory |
| `med-06` | Screen Reader Labels | accessibility, frontend | small | ARIA labels for game elements |
| `med-07` | Secret Ending Hooks | gameplay, lore | medium | Track conditions for secret ending (not revealed) |
| `med-08` | Boss Documentation Sync | infrastructure | small | Update docs to match actual boss roster |

### 2.4 Low Priority (Green)

| ID | Title | Category | Effort | Description |
|----|-------|----------|--------|-------------|
| `low-01` | ICE Slide Mechanic | gameplay | medium | Floor 5 ice lanes cause sliding (fairness-tested) |
| `low-02` | Floor Diorama 3D | frontend, 3d | large | Three.js cross-section visualization for Home page |
| `low-03` | Character Preview 3D | frontend, 3d | medium | 3D character preview in creation screen |
| `low-04` | Achievement System | gameplay, multiplayer | large | Track and display player achievements |
| `low-05` | Daily Challenges | gameplay, multiplayer | large | Seeded daily runs with leaderboard |
| `low-06` | Spectator Mode | multiplayer | large | Watch other players' runs in real-time |

### 2.5 Research Priority (Purple)

| ID | Title | Category | Effort | Description |
|----|-------|----------|--------|-------------|
| `res-01` | 3D Asset Pipeline | 3d, infrastructure | epic | CLI workflow for AI-generated 3D models (Meshy/Tripo/Rodin) |
| `res-02` | Mobile Performance | frontend, infrastructure | large | Profile and optimize for mobile devices |
| `res-03` | WebGPU Migration | 3d | epic | Future-proof 3D rendering with WebGPU |
| `res-04` | Procedural Music | audio | large | Generate music that responds to gameplay |

---

## Part 3: Frontend Page Design

### 3.1 Route & Navigation

- **Route:** `/roadmap`
- **Add to navbar** alongside Features, About
- **No auth required** - publicly accessible

### 3.2 Page Structure

```tsx
<AtmosphericPage
  backgroundType="underground"
  particles={{ type: 'dust', count: 15, speed: 'slow', opacity: 0.2 }}
  crt={true}
  crtIntensity="light"
>
  <div className="roadmap-page">
    <PhosphorHeader
      title="DEVELOPMENT ROADMAP"
      subtitle="The path ahead..."
    />

    <RoadmapFilters />      {/* Filter by priority, category, status */}
    <RoadmapStats />        {/* Summary counts */}
    <RoadmapTimeline />     {/* Main content */}
    <RoadmapLegend />       {/* Color/status key */}
  </div>
</AtmosphericPage>
```

### 3.3 Component: RoadmapFilters

```tsx
interface FilterState {
  priorities: string[];    // Multi-select
  categories: string[];    // Multi-select
  statuses: string[];      // Multi-select
  searchQuery: string;     // Text search
}
```

- Chip/tag style filter buttons
- "Show All" / "Reset" option
- Persist filter state in URL params for sharing

### 3.4 Component: RoadmapStats

Quick summary bar showing:
- Total items by priority
- Completion percentage
- Items in progress

```
[ Critical: 2 ] [ High: 6 ] [ Medium: 8 ] [ Low: 6 ] [ Research: 4 ]
Progress: 0/26 completed (0%)
```

### 3.5 Component: RoadmapTimeline

Main content area displaying items grouped by priority tier:

```
╔══════════════════════════════════════════════════════════════╗
║ ● CRITICAL                                              2 items ║
╠══════════════════════════════════════════════════════════════╣
║ ┌────────────────────────────────────────────────────────┐ ║
║ │ [PLANNED] Fix Missing Enum Values                      │ ║
║ │ backend · small effort                                 │ ║
║ │ Add missing CandidateType.SELF and KitingPhase...     │ ║
║ └────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════╝
```

Each item card shows:
1. Status badge (left)
2. Title (bold)
3. Category tags (pills)
4. Effort indicator
5. Description (expandable for details)
6. Dependencies (if any)

### 3.6 Component: RoadmapLegend

Footer explaining color codes and status icons.

### 3.7 Styling

**Path:** `web/src/pages/Roadmap.css`

- Use existing atmospheric variables from `atmosphere.css`
- Add roadmap-specific color variables
- Terminal/retro card styling consistent with other pages
- Responsive: stack cards on mobile

---

## Part 4: Implementation Order

### Phase 1: Data & Types

| Task | Files |
|------|-------|
| Create roadmap data types | `web/src/data/roadmapData.ts` |
| Populate all roadmap items | `web/src/data/roadmapData.ts` |
| Add CSS variables for priority colors | `web/src/styles/atmosphere.css` |

### Phase 2: Core Components

| Task | Files |
|------|-------|
| Create RoadmapCard component | `web/src/components/RoadmapCard/RoadmapCard.tsx` |
| Create RoadmapFilters component | `web/src/components/RoadmapFilters/RoadmapFilters.tsx` |
| Create RoadmapStats component | `web/src/components/RoadmapStats/RoadmapStats.tsx` |
| Create RoadmapLegend component | `web/src/components/RoadmapLegend/RoadmapLegend.tsx` |

### Phase 3: Page Assembly

| Task | Files |
|------|-------|
| Create Roadmap page | `web/src/pages/Roadmap.tsx` |
| Create Roadmap styles | `web/src/pages/Roadmap.css` |
| Add route to App.tsx | `web/src/App.tsx` |
| Add navbar link | `web/src/components/NavBar/NavBar.tsx` |

### Phase 4: Polish

| Task | Files |
|------|-------|
| URL param persistence for filters | `web/src/pages/Roadmap.tsx` |
| Expand/collapse item details | `web/src/components/RoadmapCard/RoadmapCard.tsx` |
| Smooth animations | `web/src/pages/Roadmap.css` |

---

## Part 5: File Summary

### New Files

| Path | Purpose |
|------|---------|
| `web/src/data/roadmapData.ts` | Roadmap items and types |
| `web/src/pages/Roadmap.tsx` | Main roadmap page |
| `web/src/pages/Roadmap.css` | Page styles |
| `web/src/components/RoadmapCard/RoadmapCard.tsx` | Individual item card |
| `web/src/components/RoadmapCard/RoadmapCard.css` | Card styles |
| `web/src/components/RoadmapCard/index.ts` | Export |
| `web/src/components/RoadmapFilters/RoadmapFilters.tsx` | Filter controls |
| `web/src/components/RoadmapFilters/RoadmapFilters.css` | Filter styles |
| `web/src/components/RoadmapFilters/index.ts` | Export |
| `web/src/components/RoadmapStats/RoadmapStats.tsx` | Summary stats |
| `web/src/components/RoadmapStats/index.ts` | Export |
| `web/src/components/RoadmapLegend/RoadmapLegend.tsx` | Legend component |
| `web/src/components/RoadmapLegend/index.ts` | Export |

### Modified Files

| Path | Changes |
|------|---------|
| `web/src/App.tsx` | Add `/roadmap` route |
| `web/src/components/NavBar/NavBar.tsx` | Add Roadmap link |
| `web/src/styles/atmosphere.css` | Add roadmap color variables |

---

## Part 6: Verification

### Visual Testing

1. Navigate to `/roadmap` - page loads with atmospheric effects
2. All 26 items display correctly in priority groups
3. Color coding matches priority tier
4. Status badges render correctly
5. Category tags display as pills
6. Filter buttons work (single and multi-select)
7. Search filters items by title/description
8. Stats bar updates when filters change

### Responsive Testing

1. Desktop: Multi-column card layout
2. Tablet: 2-column layout
3. Mobile: Single column, filters collapse to dropdown

### URL Persistence

1. Apply filters → URL updates with params
2. Refresh page → filters restored from URL
3. Share URL → recipient sees same filtered view

### Integration Testing

1. Navigate Home → Roadmap via navbar
2. Atmospheric effects consistent with other pages
3. No performance degradation from particle effects

---

## Part 7: Future Enhancements (Not in Initial Scope)

- Admin interface to update item status
- GitHub integration to auto-update from issues/PRs
- Progress history/changelog
- Upvoting/community input
- Estimated completion dates (if desired)

---

## Part 8: v7.X Development Roadmap

This section tracks the planned v7.X feature releases building on the v7.0 Immersive Exploration System.

### v7.0 Foundation (COMPLETE)

The v7.0 release established:
- Interactive tile system (switch, lever, mural, inscription, pressure plate, hidden door)
- PuzzleManager with state tracking
- TileVisual system (elevation, slopes, set pieces)
- LorePopup component for discovery display
- Interaction sound effects
- Puzzle completion achievements (PUZZLE_SOLVER, PUZZLE_MASTER)
- Environmental clues on all 8 floors

---

### v7.1: Expanded Puzzle Content

**Goal:** Add exploration puzzles to all 8 floors (currently limited placement)

| Floor | Zone | Puzzle Type | Mechanic |
|-------|------|-------------|----------|
| 1 | wardens_office | Switch Sequence | Activate 2 switches in order to open armory |
| 2 | seal_drifts | Pressure Plate | Stand on correct plates to lower water gate |
| 3 | webbed_gardens | Sequential Cut | Cut through web walls in correct order |
| 4 | oath_chambers | Mirror Switches | Flip switches matching mirror reflection |
| 5 | frozen_galleries | Ice Slide Puzzle | Slide across ice to reach pressure plates |
| 6 | catalog_chambers | Inscription Riddle | Answer riddle to unlock forbidden stacks |
| 7 | forge_halls | Lever Sequence | Pull levers in heat-resistant order |
| 8 | geometry_wells | Crystal Alignment | Rotate crystals to focus light beam |

**Effort:** Medium
**Priority:** High
**Dependencies:** v7.0 complete

---

### v7.2: First-Person Raycasting & Click Interaction

**Goal:** Enable mouse-click interaction with walls in first-person view

**Features:**
- Port raycasting from BattleRenderer3D to FirstPersonRenderer3D
- Click on interactive walls to trigger INTERACT command
- Hover highlight for interactive elements
- "Press E to interact" prompt when facing interactive tiles
- Support for both mouse-click and keyboard interaction

**Technical:**
- Add `interactiveWallsRef` to track clickable meshes
- Implement `handleClick` with THREE.Raycaster
- Tag wall meshes with `userData.interactive` during generation
- Connect to existing INTERACT command in engine

**Effort:** Medium
**Priority:** High
**Dependencies:** v7.0 complete

---

### v7.3: Enhanced Set Pieces & 3D Props

**Goal:** Add dramatic 3D elements to key locations

| Set Piece | Location | Description |
|-----------|----------|-------------|
| Dungeon Entrance Doors | Floor 1 start | Massive iron-bound doors behind player at spawn |
| Warden's Throne | wardens_office | Broken throne with lore mural above |
| Seal Stone | seal_drifts | Ancient carved stone with glowing runes |
| Great Web | webbed_gardens | Massive spider web spanning ceiling |
| Mirror of Valdris | oath_chambers | Ornate mirror showing distorted reflection |
| Frozen Waterfall | frozen_galleries | Ice cascade with trapped souls visible |
| Forbidden Stacks | catalog_chambers | Towering bookshelves with floating books |
| The Crucible | forge_halls | Massive forge with molten metal |
| Crystal Nexus | geometry_wells | Central crystal formation |

**Technical:**
- Create GLTF models or procedural Three.js groups
- Add `SetPiece` data structure to dungeon
- Render set pieces in FirstPersonRenderer3D
- Add examine interactions for lore

**Effort:** Large
**Priority:** Medium
**Dependencies:** v7.2

---

### v7.4: Secret Room System

**Goal:** Hidden areas rewarding thorough exploration

**Features:**
- Secret rooms accessible only through hidden doors
- Require puzzle completion or specific actions to reveal
- Contain bonus loot, lore, or shortcuts
- Track discovery in CompletionLedger

| Floor | Secret | Access Method |
|-------|--------|---------------|
| 1 | Guard's Cache | Find hidden switch behind pillar |
| 3 | Druid's Sanctuary | Solve web puzzle to reveal passage |
| 5 | Frozen Treasury | Ice slide to reach hidden alcove |
| 6 | Archivist's Study | Answer inscription riddle correctly |
| 8 | True Vault | Complete all floor puzzles |

**Effort:** Medium
**Priority:** Medium
**Dependencies:** v7.1

---

### v7.5: Environmental Storytelling Expansion

**Goal:** Deepen lore through environmental details

**Features:**
- More mural types with unique art per zone
- Environmental clue chains (find multiple clues for full story)
- NPC corpses with journals/notes
- Evidence items that link to codex entries
- Zone-specific visual storytelling elements

**Content:**
- 3-5 murals per floor (24-40 total)
- Environmental clue chains per biome
- 8 journal entries from fallen adventurers
- Cross-floor story threads

**Effort:** Large
**Priority:** Low
**Dependencies:** v7.0 complete

---

### v7.6: Puzzle-Environment Integration

**Goal:** Puzzles affect the environment dynamically

**Features:**
- Solving puzzles changes dungeon layout (doors open, bridges extend)
- Environmental hazards toggled by puzzle state
- Multi-room puzzles spanning connected areas
- Puzzle solutions visible in 3D (levers move, crystals light up)

**Examples:**
- Floor 2: Draining water reveals hidden path
- Floor 5: Melting ice creates new routes
- Floor 7: Cooling lava forms walkable bridges
- Floor 8: Crystal alignment reveals boss weakness

**Effort:** Large
**Priority:** Low
**Dependencies:** v7.3, v7.4

---

### v7.X Priority Summary

| Version | Title | Priority | Effort | Status |
|---------|-------|----------|--------|--------|
| v7.0 | Immersive Exploration System | - | Epic | **COMPLETE** |
| v7.1 | Expanded Puzzle Content | High | Medium | Planned |
| v7.2 | First-Person Raycasting | High | Medium | Planned |
| v7.3 | Enhanced Set Pieces | Medium | Large | Planned |
| v7.4 | Secret Room System | Medium | Medium | Planned |
| v7.5 | Environmental Storytelling | Low | Large | Planned |
| v7.6 | Puzzle-Environment Integration | Low | Large | Planned |

---

### Content Pass Items (from FUTURE_TODO.md)

These items are tracked in the main roadmap tables above:

| Original TODO | Roadmap ID | Status |
|---------------|------------|--------|
| Field Pulse Micro-Events | `high-05` | Planned |
| Micro-Event Codex Evidence | `med-01` | Planned |
| Extra Thematic Enemies | `med-02` | Planned |
| ICE Slide Mechanic | `low-01` | **COMPLETE** (v6.5.1) |
| Secret Ending Hooks | `med-07` | Planned |

---

*Last updated: 2026-01-16*
