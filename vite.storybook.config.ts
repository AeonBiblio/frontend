import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [svgr()],
})
