# 3D Asset Pipeline

Generate 3D models from concept art images using AI (TripoSR).

## Overview

This pipeline uses [TripoSR](https://github.com/VAST-AI-Research/TripoSR), an open-source (MIT license) AI model by Stability AI and Tripo AI that generates 3D meshes from single images in seconds.

## Features

- **Image to 3D**: Generate 3D models from any concept art
- **Textured Output**: Bake textures onto meshes
- **CPU Support**: Works without GPU (slower, ~2 min per model)
- **Multiple Formats**: OBJ output, convertible to GLB for Three.js

## Setup

```bash
# Already installed in TripoSR/.venv
# To reinstall:
cd tools/3d-pipeline/TripoSR
python -m venv .venv
.venv/Scripts/python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m pip install "rembg[cpu]" gradio git+https://github.com/tatsy/torchmcubes.git
```

## Usage

### Quick Generate

```bash
python tools/3d-pipeline/generate_asset.py path/to/concept_art.png --name goblin
```

### Options

```
--output DIR        Output directory (default: web/public/assets/models)
--name NAME         Name for output files (e.g., 'goblin' -> goblin.obj)
--texture-res N     Texture resolution: 256, 512, 1024, 2048 (default: 1024)
--device DEVICE     cpu or cuda (default: cpu)
```

### Direct TripoSR Usage

```bash
cd tools/3d-pipeline/TripoSR
.venv/Scripts/python run.py examples/robot.png --output-dir output/ --bake-texture
```

## Converting to GLB for Three.js

### Option 1: trimesh (Python)

```bash
pip install trimesh[easy]
python -c "import trimesh; m=trimesh.load('mesh.obj'); m.export('mesh.glb')"
```

### Option 2: Blender (recommended for quality)

1. Import OBJ in Blender
2. Apply texture material
3. Export as GLB (File > Export > glTF 2.0)

## Performance

| Hardware | Time per Model | Notes |
|----------|---------------|-------|
| CPU (Intel i7) | ~90 seconds | Works without GPU |
| NVIDIA GPU (6GB+) | ~0.5 seconds | Requires CUDA |

## Best Practices for Input Images

1. **Clear subject**: Single object on clean background
2. **Good lighting**: Even, diffuse lighting works best
3. **Multiple angles**: If available, use front-facing view
4. **Resolution**: 512x512 to 1024x1024 recommended

## Limitations

- Image-to-3D only (no text-to-3D)
- Single objects work best (not scenes)
- CPU mode is slow but functional
- May need manual cleanup in Blender for game-ready assets

## License

TripoSR is MIT licensed. Assets you generate are yours to use.
