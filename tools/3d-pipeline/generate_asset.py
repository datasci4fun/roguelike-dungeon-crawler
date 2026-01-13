#!/usr/bin/env python3
"""
3D Asset Generator for Roguelike Dungeon Crawler

Generates 3D models from concept art images using TripoSR.
Outputs GLB files ready for Three.js integration.

Usage:
    python generate_asset.py input_image.png --output assets/models/
    python generate_asset.py input_image.png --name goblin --texture-res 512

Requirements:
    - TripoSR installed in tools/3d-pipeline/TripoSR
    - Activate venv: tools/3d-pipeline/TripoSR/.venv/Scripts/activate
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
TRIPOSR_DIR = SCRIPT_DIR / "TripoSR"
VENV_PYTHON = TRIPOSR_DIR / ".venv" / "Scripts" / "python.exe"
RUN_SCRIPT = TRIPOSR_DIR / "run.py"
DEFAULT_OUTPUT = Path("web/public/assets/models")


def check_environment():
    """Verify TripoSR is properly installed."""
    if not VENV_PYTHON.exists():
        print(f"Error: TripoSR venv not found at {VENV_PYTHON}")
        print("Run: cd tools/3d-pipeline/TripoSR && python -m venv .venv")
        sys.exit(1)

    if not RUN_SCRIPT.exists():
        print(f"Error: TripoSR run.py not found at {RUN_SCRIPT}")
        sys.exit(1)


def generate_model(
    input_image: Path,
    output_dir: Path,
    name: str = None,
    texture_resolution: int = 1024,
    device: str = "cpu"
):
    """Generate a 3D model from an input image."""

    check_environment()

    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build command
    cmd = [
        str(VENV_PYTHON),
        str(RUN_SCRIPT),
        str(input_image),
        "--output-dir", str(output_dir),
        "--device", device,
        "--bake-texture",
        "--texture-resolution", str(texture_resolution),
    ]

    print(f"Generating 3D model from: {input_image}")
    print(f"Output directory: {output_dir}")
    print(f"Texture resolution: {texture_resolution}px")
    print(f"Device: {device}")
    print("-" * 50)

    # Run TripoSR
    result = subprocess.run(cmd, cwd=TRIPOSR_DIR)

    if result.returncode != 0:
        print("Error: Model generation failed")
        sys.exit(1)

    # Find generated files (TripoSR outputs to numbered subdirs)
    subdirs = sorted([d for d in output_dir.iterdir() if d.is_dir()])
    if not subdirs:
        print("Error: No output generated")
        sys.exit(1)

    latest_output = subdirs[-1]
    mesh_file = latest_output / "mesh.obj"
    texture_file = latest_output / "texture.png"

    if not mesh_file.exists():
        print(f"Error: mesh.obj not found in {latest_output}")
        sys.exit(1)

    # Rename output if name provided
    if name:
        final_mesh = output_dir / f"{name}.obj"
        final_texture = output_dir / f"{name}_texture.png"

        mesh_file.rename(final_mesh)
        if texture_file.exists():
            texture_file.rename(final_texture)

        # Clean up temp directory
        (latest_output / "input.png").unlink(missing_ok=True)
        latest_output.rmdir()

        print(f"\nGenerated: {final_mesh}")
        if final_texture.exists():
            print(f"Texture: {final_texture}")
    else:
        print(f"\nGenerated: {mesh_file}")
        if texture_file.exists():
            print(f"Texture: {texture_file}")

    print("\nTo convert to GLB for Three.js, use Blender or trimesh:")
    print("  pip install trimesh[easy]")
    print("  python -c \"import trimesh; m=trimesh.load('mesh.obj'); m.export('mesh.glb')\"")


def main():
    parser = argparse.ArgumentParser(
        description="Generate 3D models from concept art using TripoSR"
    )
    parser.add_argument(
        "input_image",
        type=Path,
        help="Path to input image (PNG, JPG)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output directory (default: {DEFAULT_OUTPUT})"
    )
    parser.add_argument(
        "--name",
        type=str,
        default=None,
        help="Name for output files (e.g., 'goblin' -> goblin.obj)"
    )
    parser.add_argument(
        "--texture-res",
        type=int,
        default=1024,
        choices=[256, 512, 1024, 2048],
        help="Texture resolution in pixels (default: 1024)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cpu",
        choices=["cpu", "cuda"],
        help="Device to run on (default: cpu)"
    )

    args = parser.parse_args()

    if not args.input_image.exists():
        print(f"Error: Input image not found: {args.input_image}")
        sys.exit(1)

    generate_model(
        input_image=args.input_image,
        output_dir=args.output,
        name=args.name,
        texture_resolution=args.texture_res,
        device=args.device,
    )


if __name__ == "__main__":
    main()
