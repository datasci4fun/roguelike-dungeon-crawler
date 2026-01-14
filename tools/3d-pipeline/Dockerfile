# TripoSR 3D Generation Worker
# Heavy ML dependencies isolated from main backend

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/models

# Set work directory
WORKDIR /app

# Install system dependencies including OpenGL for moderngl
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    libgl1 \
    libglx-mesa0 \
    libegl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU version with numpy compatibility
# Using PyTorch 2.2+ which properly supports numpy
RUN pip install --no-cache-dir \
    torch==2.2.0 --index-url https://download.pytorch.org/whl/cpu

# Install TripoSR dependencies
RUN pip install --no-cache-dir \
    omegaconf==2.3.0 \
    Pillow==10.1.0 \
    einops==0.7.0 \
    transformers==4.35.0 \
    trimesh==4.0.5 \
    rembg \
    onnxruntime \
    huggingface-hub \
    "imageio[ffmpeg]" \
    xatlas==0.0.9 \
    moderngl==5.10.0 \
    scipy \
    scikit-image

# Install torchmcubes from git
RUN pip install --no-cache-dir git+https://github.com/tatsy/torchmcubes.git

# Force numpy<2 for PyTorch compatibility (must be after other installs)
RUN pip install --no-cache-dir "numpy<2"

# Create directories
RUN mkdir -p /models /jobs /concept_art /web_assets/models

# Copy TripoSR code
COPY TripoSR/ /app/TripoSR/

# Copy worker script
COPY container_worker.py /app/

# Run the worker
CMD ["python", "/app/container_worker.py", "--watch"]
