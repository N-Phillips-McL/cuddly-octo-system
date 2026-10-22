import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the build works under the GitHub Pages repository sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
})
