# Git Workflow Guide

This project uses a simplified Git Flow branching strategy for organized development.

## Branch Structure

### Main Branches

- **`master`**: Production-ready code. Only merge from `develop` when ready for release.
- **`develop`**: Main development branch. All feature branches are created from and merged back into this branch.

### Supporting Branches

- **Feature branches**: For new features or enhancements
- **Bugfix branches**: For fixing bugs in `develop`
- **Hotfix branches**: For urgent fixes to `master`

## Common Workflows

### Starting a New Feature

```bash
# Make sure you're on develop and it's up to date
git checkout develop
git pull origin develop

# Create a new feature branch
git checkout -b feature/your-feature-name

# Work on your feature, make commits
git add .
git commit -m "Add feature description"

# Push your feature branch
git push -u origin feature/your-feature-name
```

### Completing a Feature

```bash
# Make sure your feature branch is up to date with develop
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git merge develop

# If there are conflicts, resolve them

# Push final changes
git push origin feature/your-feature-name

# Merge into develop (or create a Pull Request on GitHub)
git checkout develop
git merge feature/your-feature-name
git push origin develop

# Delete the feature branch (optional)
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### Making a Release

```bash
# When develop is ready for release
git checkout master
git merge develop
git push origin master

# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Hotfix (Urgent Production Fix)

```bash
# Create hotfix from master
git checkout master
git checkout -b hotfix/fix-description

# Make your fix
git add .
git commit -m "Fix critical bug"

# Merge into both master and develop
git checkout master
git merge hotfix/fix-description
git push origin master

git checkout develop
git merge hotfix/fix-description
git push origin develop

# Delete hotfix branch
git branch -d hotfix/fix-description
```

## Branch Naming Conventions

- **Feature**: `feature/add-inventory-system`
- **Bugfix**: `bugfix/fix-enemy-spawn`
- **Hotfix**: `hotfix/fix-crash-on-startup`
- **Experimental**: `experimental/new-algorithm`

## Best Practices

1. **Always work on a feature branch**, never directly on `master` or `develop`
2. **Keep commits focused**: One logical change per commit
3. **Write descriptive commit messages**
4. **Pull before you push**: Always pull latest changes before pushing
5. **Keep feature branches short-lived**: Merge back to develop frequently
6. **Use Pull Requests on GitHub**: For code review and discussion

## Quick Reference

```bash
# Create feature branch
git checkout develop
git checkout -b feature/my-feature

# Regular commits
git add .
git commit -m "Descriptive message"
git push origin feature/my-feature

# Merge back to develop
git checkout develop
git pull origin develop
git merge feature/my-feature
git push origin develop

# Check current branch
git branch

# See all branches
git branch -a

# Switch branches
git checkout branch-name
```

## Example Feature Development

Let's say you want to add an inventory system:

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/add-inventory-system

# 3. Make changes and commit as you go
# ... edit files ...
git add src/inventory.py
git commit -m "Add basic inventory class"

# ... edit more files ...
git add src/game.py src/entities.py
git commit -m "Integrate inventory with player entity"

# ... add tests ...
git add tests/test_inventory.py
git commit -m "Add inventory unit tests"

# 4. Push your work
git push -u origin feature/add-inventory-system

# 5. When ready, merge to develop
git checkout develop
git pull origin develop
git merge feature/add-inventory-system
git push origin develop

# 6. Clean up
git branch -d feature/add-inventory-system
git push origin --delete feature/add-inventory-system
```

## Current Branch Status

You are currently on: **`develop`**

This is where all new development should happen!
