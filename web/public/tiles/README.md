# Tile Assets

Place tile images in the appropriate biome folder. Each tile should be a **64x64 PNG** image.

## Directory Structure

```
tiles/
├── dungeon/          # Stone Dungeon theme
├── ice/              # Ice Cavern theme
├── forest/           # Forest Depths theme
├── lava/             # Volcanic Depths theme
├── crypt/            # Ancient Crypt theme
├── sewer/            # Sewer theme
├── library/          # Ancient Library theme
└── crystal/          # Crystal Cave theme
```

## Required Tile Names

Each biome folder can contain the following tile images:

| Filename | Description |
|----------|-------------|
| `floor.png` | Floor tile (repeated in perspective grid) |
| `ceiling.png` | Ceiling tile |
| `wall_front.png` | Front-facing wall (blocking the corridor) |
| `wall_left.png` | Left corridor wall (receding into distance) |
| `wall_right.png` | Right corridor wall |
| `wall_corner_left.png` | Left corner piece |
| `wall_corner_right.png` | Right corner piece |
| `door.png` | Door texture |
| `water.png` | Water/liquid tile |

## Tile Guidelines

1. **Size**: 64x64 pixels (will be scaled/stretched by the renderer)
2. **Format**: PNG with transparency support
3. **Style**: Should tile seamlessly where applicable (floor, ceiling)
4. **Lighting**: Tiles should be drawn with neutral lighting - the renderer applies depth fade and biome-specific lighting

## Example: Creating a Floor Tile

1. Create a 64x64 pixel image
2. Design a repeatable stone/dirt/ice texture
3. Save as `floor.png` in the appropriate biome folder
4. The renderer will automatically load and use it

## Fallback Behavior

If a tile image is not found, the renderer falls back to solid colors based on the biome's color palette. This means you can add tiles incrementally - start with just `floor.png` and add more later.

## Tips

- **Seamless Tiling**: For floor and ceiling tiles, ensure the edges match up when placed side-by-side
- **Perspective**: The renderer handles perspective distortion, so draw tiles as if viewed from directly above
- **Contrast**: Use subtle variations in the tile to add visual interest without being distracting
- **Theme Consistency**: Keep colors and style consistent within each biome

## Testing

Use the FirstPersonTestPage (`/first-person-test`) to preview how tiles look in different biome scenes.
