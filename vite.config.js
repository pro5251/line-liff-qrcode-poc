import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Use relative base so the build works on GitHub Pages project sites
// (https://user.github.io/repo/) as well as custom domains / local preview.
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    host: true,
    port: 5173
  }
})
