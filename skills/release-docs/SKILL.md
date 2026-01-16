---
name: release-docs
description: Ensures all documentation and frontend pages are updated when preparing a PR or release. Updates CHANGELOG, STATE, README, About page stats, roadmap, and more.
---

# Release Documentation Checklist

## Purpose

This skill ensures all documentation and frontend pages are updated when preparing a PR or release. Run this after completing a feature branch before merging.

## Trigger Phrases

- "update release docs"
- "release checklist"
- "prepare for release"
- "/release-docs"

---

## Pre-Release Checklist

### 1. Backend Documentation

| File | Action | Command/Notes |
|------|--------|---------------|
| `docs/CHANGELOG.md` | Add version entry | New section at top with Added/Changed/Fixed/Technical |
| `docs/FEATURES.md` | Add new features | Document major gameplay/system additions |
| `STATE.md` | Update status | Current version, recent changes, what's next |
| `README.md` | Update version | Header version number for major releases |
| `NEXT_SESSION.md` | Update handoff | What was shipped, what's next |
| `FUTURE_TODO.md` | Mark completed | Check off any completed TODO items |

### 2. Frontend Data Files

| File | Action | Command |
|------|--------|---------|
| `web/src/data/changelogData.ts` | Regenerate | `python scripts/generate_changelog.py` |
| `web/src/data/roadmapData.ts` | Update items | Mark completed, add new items, update target versions |

### 3. Frontend Pages (Stats/Versions)

| File | Fields to Check |
|------|-----------------|
| `web/src/pages/Home.tsx` | Footer version (line ~262) |
| `web/src/pages/About.tsx` | PROJECT_STATS array, TECH_STACK, AI_MODELS contributions |
| `web/src/pages/Presentation/slideData.ts` | Stats (lines, components, time), feature lists |

---

## Procedure

### Step 1: Gather Current Stats

Run these commands to get accurate numbers:

```bash
# Lines of code
find . -name "*.py" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v __pycache__ | grep -v .venv | xargs wc -l | tail -1

# React components
find ./web/src/components -name "*.tsx" | grep -v node_modules | wc -l

# Python modules
find ./src ./server -name "*.py" | grep -v __pycache__ | wc -l

# Merged PRs
gh pr list --state merged --limit 100 | wc -l

# Commits
git log --oneline --since="2025-12-30" | wc -l

# Audio files
find . -name "*.mp3" -o -name "*.wav" -o -name "*.ogg" | grep -v node_modules | wc -l

# 3D models
find . -name "*.glb" -o -name "*.gltf" | grep -v node_modules | wc -l
```

### Step 2: Update Documentation Files

1. **docs/CHANGELOG.md** - Add new version section:
```markdown
## [X.Y.Z] - YYYY-MM-DD - Title

### Added
- Feature descriptions

### Changed
- Modification descriptions

### Technical
- Implementation details
```

2. **STATE.md** - Update header and add recent changes section

3. **NEXT_SESSION.md** - Rewrite for current state

4. **FUTURE_TODO.md** - Mark any completed items with ✅

### Step 3: Regenerate Frontend Data

```bash
python scripts/generate_changelog.py
```

### Step 4: Update Frontend Pages

Check and update version numbers in:
- `Home.tsx` line ~262: `<p className="footer-version">vX.Y</p>`
- `About.tsx` PROJECT_STATS array (~line 99)
- `Presentation/slideData.ts` stats objects

### Step 5: Update Roadmap

In `web/src/data/roadmapData.ts`:
- Add completed items with `status: 'completed'`
- Update `targetVersion` for planned items if needed
- Add new planned items if applicable

---

## Version Number Guidelines

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fixes only | Patch (X.Y.Z+1) | 6.12.0 → 6.12.1 |
| New features | Minor (X.Y+1.0) | 6.12.0 → 6.13.0 |
| Breaking changes | Major (X+1.0.0) | 6.12.0 → 7.0.0 |

---

## Post-Merge Actions

After merging to develop:

1. **Sync master**: `git checkout master && git merge develop && git push`
2. **Create tag**: `git tag -a vX.Y.Z -m "message" && git push origin vX.Y.Z`
3. **Create release**: `gh release create vX.Y.Z --title "..." --notes "..."`

---

## Files Quick Reference

```
Documentation:
├── docs/CHANGELOG.md          # Version history (source of truth)
├── docs/FEATURES.md           # Feature documentation
├── STATE.md                   # Current project state
├── README.md                  # Project overview
├── NEXT_SESSION.md            # Session handoff notes
└── FUTURE_TODO.md             # Upcoming work items

Frontend Data:
├── web/src/data/changelogData.ts   # Auto-generated from CHANGELOG.md
└── web/src/data/roadmapData.ts     # Roadmap items and status

Frontend Pages:
├── web/src/pages/Home.tsx                    # Footer version
├── web/src/pages/About.tsx                   # Stats and credits
└── web/src/pages/Presentation/slideData.ts   # Presentation stats
```

---

## Example Commit Messages

```
docs: update documentation for vX.Y.Z

docs: add [feature] to CHANGELOG and FEATURES

docs: update About page stats for vX.Y.Z

docs: regenerate changelogData.ts from CHANGELOG.md

docs: update roadmap with completed items from PR #XX
```
