import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Keep OAuth callback and the frontend on the same predictable local port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
