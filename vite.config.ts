import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import svgr from 'vite-plugin-svgr'
import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { serwist } from '@serwist/vite'

const copyServiceWorkerToNitroPublic = (): Plugin => ({
  name: 'copy-service-worker-to-nitro-public',
  apply: 'build',
  closeBundle: {
    sequential: true,
    order: 'post',
    async handler() {
      const source = resolve('dist/sw.js')
      const targetDir = resolve('.output/public')
      const target = resolve(targetDir, 'sw.js')

      await mkdir(targetDir, { recursive: true })
      await copyFile(source, target)
    },
  },
})

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tanstackStart(),
    nitro({
      compressPublicAssets: {
        gzip: true,
        brotli: true,
      },
    }),
    svgr(),
    viteReact(),
    serwist({
      disable: process.env.NODE_ENV !== 'production',
      swSrc: 'src/sw.ts',
      swDest: 'sw.js',
      globDirectory: '.output/public',
      globIgnores: ['**/sw.js'],
      injectionPoint: 'self.__SW_MANIFEST',
      rollupFormat: 'iife',
    }),
    copyServiceWorkerToNitroPublic(),
  ],
})
