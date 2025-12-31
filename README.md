# Roguelike Dungeon Crawler

A terminal-based roguelike game with procedural dungeon generation, exploration, and combat.

## Features

- **Procedural Generation**: Each dungeon is randomly generated using Binary Space Partitioning (BSP)
- **Multiple Levels**: Descend through 5 dungeon levels, each with unique layouts
- **Exploration**: Navigate through rooms and corridors with stairs connecting levels
- **Combat**: Bump-to-attack combat system with enemies that chase you
- **ASCII Graphics**: Classic roguelike terminal rendering

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## How to Play

Run the game:
```bash
python main.py
```

### Controls

- **Arrow Keys** or **WASD**: Move your character (@)
- **Q**: Quit game

### Gameplay

- Explore the procedurally generated dungeon
- Find the stairs down (>) to descend to deeper levels
- Enemies (E) will chase you when you get close
- Walk into enemies to attack them
- Reach level 5 to win the game!
- The game ends when your health reaches 0

### Stats

- **Level**: Current dungeon level (1-5)
- **HP**: Your current health
- **ATK**: Your attack damage
- **Kills**: Number of enemies defeated
- **Pos**: Your current position (for exploration tracking)

## Technical Details

- **Language**: Python 3.7+
- **UI**: curses library for terminal rendering
- **Generation Algorithm**: Binary Space Partitioning for guaranteed connected dungeons
- **Architecture**: Clean separation between game logic, rendering, and entities
