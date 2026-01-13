import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all interfaces for Docker
    port: 5173,
    watch: {
      // Use polling for Docker on Windows (native fs events don't work across volumes)
      usePolling: true,
      interval: 1000,  // Poll every second
    },
    hmr: {
      // HMR works on same port in Vite 5+
      // clientPort will be auto-detected from the browser
    },
  },
})
