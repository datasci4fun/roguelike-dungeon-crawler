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

| ID | Title | Category | Effort | Status | Description |
|----|-------|----------|--------|--------|-------------|
| ~~`crit-01`~~ | ~~Fix Missing Enum Values~~ | backend | small | **REMOVED** | Not actually needed - kiting system works without these enums |
| ~~`crit-02`~~ | ~~Ghost Victory Behaviors~~ | backend, multiplayer | medium | **COMPLETE** | Beacon/Champion/Archivist fully implemented in `src/entities/ghosts/` |

**No open critical items.**

### 2.2 High Priority (Orange)

| ID | Title | Category | Effort | Status | Description |
|----|-------|----------|--------|--------|-------------|
| ~~`high-01`~~ | ~~Database Save System~~ | backend | large | **COMPLETE** | 3-slot save system in `server/app/models/game_save.py` |
| `high-02` | Complete STEALTH AI | backend, gameplay | medium | **PARTIAL** | Framework exists, needs specialized ambush/concealment tactics |
| `high-03` | Complete ELEMENTAL AI | backend, gameplay | medium | **PARTIAL** | Integrated with kiting, needs resistance cycling logic |
| ~~`high-04`~~ | ~~Missing Artifacts~~ | content, lore | medium | **COMPLETE** | All 5 artifacts in `src/items/artifacts.py` |
| ~~`high-05`~~ | ~~Field Pulse Micro-Events~~ | gameplay, lore | medium | **COMPLETE** | Full system in `src/world/micro_events_data.py` |
| `high-06` | Error Boundaries | frontend | small | Planned | Add React error boundaries for graceful failure handling |

### 2.3 Medium Priority (Yellow)

| ID | Title | Category | Effort | Status | Description |
|----|-------|----------|--------|--------|-------------|
| `med-01` | Micro-Event Codex Evidence | lore, gameplay | small | **PARTIAL** | `evidence_id` field exists, codex integration incomplete |
| ~~`med-02`~~ | ~~Extra Enemy Variety~~ | content | medium | **COMPLETE** | 8 spice enemies added (SHADE, BILE_LURKER, THORNLING, etc.) |
| `med-03` | Battle System Polish | gameplay, 3d | medium | **PARTIAL** | Arena templates done, more ability effects possible |
| `med-04` | Performance Optimization | frontend, 3d | medium | Planned | Canvas texture caching, reduce re-renders |
| `med-05` | Keyboard Navigation | accessibility, frontend | small | Planned | Full keyboard support for menus/inventory |
| `med-06` | Screen Reader Labels | accessibility, frontend | small | Planned | ARIA labels for game elements |
| `med-07` | Secret Ending Hooks | gameplay, lore | medium | Planned | Track conditions for secret ending (not revealed) |
| `med-08` | Boss Documentation Sync | infrastructure | small | Planned | Update docs to match actual boss roster |

### 2.4 Low Priority (Green)

| ID | Title | Category | Effort | Status | Description |
|----|-------|----------|--------|--------|-------------|
| ~~`low-01`~~ | ~~ICE Slide Mechanic~~ | gameplay | medium | **COMPLETE** | Implemented in `src/world/hazards.py` (v6.5.1) |
| ~~`low-02`~~ | ~~Floor Diorama 3D~~ | frontend, 3d | large | **COMPLETE** | `web/src/components/FloorDiorama3D/` with 8 floors |
| ~~`low-03`~~ | ~~Character Preview 3D~~ | frontend, 3d | medium | **COMPLETE** | `web/src/components/CharacterPreview3D/` with race/class rendering |
| ~~`low-04`~~ | ~~Achievement System~~ | gameplay, multiplayer | large | **COMPLETE** | Full backend in `server/app/services/achievement_service.py` |
| ~~`low-05`~~ | ~~Daily Challenges~~ | gameplay, multiplayer | large | **COMPLETE** | `server/app/services/daily_service.py` with seeded runs |
| `low-06` | Spectator Mode | multiplayer | large | **PARTIAL** | Ghost replays exist, real-time spectating not implemented |

### 2.5 Research Priority (Purple)

| ID | Title | Category | Effort | Status | Description |
|----|-------|----------|--------|--------|-------------|
| ~~`res-01`~~ | ~~3D Asset Pipeline~~ | 3d, infrastructure | epic | **COMPLETE** | TripoSR worker in `tools/3d-pipeline/`, job queue API |
| `res-02` | Mobile Performance | frontend, infrastructure | large | **PARTIAL** | Responsive layout exists, no profiling/optimization done |
| `res-03` | WebGPU Migration | 3d | epic | Planned | Future-proof 3D rendering with WebGPU |
| `res-04` | Procedural Music | audio | large | Planned | Generate music that responds to gameplay |

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
[ Critical: 0 ] [ High: 2 ] [ Medium: 6 ] [ Low: 1 ] [ Research: 2 ]
Progress: 15/26 completed (58%) | 6 partial
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

**Status:** PARTIAL (2/8 floors have puzzles)
**Goal:** Add exploration puzzles to all 8 floors

| Floor | Zone | Puzzle Type | Mechanic | Status |
|-------|------|-------------|----------|--------|
| 1 | wardens_office | Switch Sequence | Activate 2 switches in order to open armory | **DONE** |
| 2 | seal_drifts | Pressure Plate | Stand on correct plates to lower water gate | Planned |
| 3 | webbed_gardens | Sequential Cut | Cut through web walls in correct order | Planned |
| 4 | oath_chambers | Mirror Switches | Flip switches matching mirror reflection | Planned |
| 5 | frozen_galleries | Ice Slide Puzzle | Slide across ice to reach pressure plates | **DONE** |
| 6 | catalog_chambers | Inscription Riddle | Answer riddle to unlock forbidden stacks | Planned |
| 7 | forge_halls | Lever Sequence | Pull levers in heat-resistant order | Planned |
| 8 | geometry_wells | Crystal Alignment | Rotate crystals to focus light beam | Planned |

**Effort:** Medium
**Priority:** High
**Dependencies:** v7.0 complete

---

### v7.2: First-Person Raycasting & Click Interaction

**Status:** COMPLETE
**Goal:** Enable mouse-click interaction with walls in first-person view

**Implemented Features:**
- ✅ Raycasting in `FirstPersonRenderer3D.tsx` (line 1297+)
- ✅ Click on interactive walls triggers INTERACT command
- ✅ Hover highlight with cursor feedback
- ✅ Interactive wall tagging via `InteractiveWallUserData`
- ✅ Mouse-click and keyboard interaction support

**Technical (Completed):**
- ✅ `interactiveWallsRef` tracks clickable meshes
- ✅ `handleClick` with `THREE.Raycaster`
- ✅ Wall meshes tagged with `userData.interactive`
- ✅ Connected to INTERACT command in engine

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
| v7.1 | Expanded Puzzle Content | High | Medium | **PARTIAL** (2/8 floors) |
| v7.2 | First-Person Raycasting | High | Medium | **COMPLETE** |
| v7.3 | Enhanced Set Pieces | Medium | Large | **PARTIAL** (framework exists) |
| v7.4 | Secret Room System | Medium | Medium | Planned |
| v7.5 | Environmental Storytelling | Low | Large | **PARTIAL** (murals/inscriptions done) |
| v7.6 | Puzzle-Environment Integration | Low | Large | Planned |

---

### Content Pass Items (from FUTURE_TODO.md)

These items are tracked in the main roadmap tables above:

| Original TODO | Roadmap ID | Status |
|---------------|------------|--------|
| Field Pulse Micro-Events | `high-05` | **COMPLETE** |
| Micro-Event Codex Evidence | `med-01` | **PARTIAL** |
| Extra Thematic Enemies | `med-02` | **COMPLETE** |
| ICE Slide Mechanic | `low-01` | **COMPLETE** (v6.5.1) |
| Secret Ending Hooks | `med-07` | Planned |

---

*Last updated: 2026-01-17*
