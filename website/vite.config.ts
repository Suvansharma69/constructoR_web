import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Split vendor chunks to reduce initial load time
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — rarely changes, cached by browser
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase — large library, separate chunk
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
          // Socket.io client
          'vendor-socket': ['socket.io-client'],
          // Axios
          'vendor-axios': ['axios'],
        },
      },
    },
    // Raise warning threshold since we're now properly splitting
    chunkSizeWarningLimit: 300,
  },
})
