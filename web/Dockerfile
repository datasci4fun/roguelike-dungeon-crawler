# Roguelike Online - Frontend Dockerfile (Development)
# Runs Vite dev server with hot module reloading

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy source (will be overridden by volume mount in dev)
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server
# --host exposes to all interfaces (required for Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
