import { defineConfig } from 'vite'
import { viteSingleFile } from "vite-plugin-singlefile"
import viteCompression from 'vite-plugin-compression'
import PurgeIcons from 'vite-plugin-purge-icons'

import { resolve } from 'path'

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, 'dist')

export default defineConfig({
  root,
  plugins: [
    PurgeIcons({}),
  ],//viteSingleFile()],//,viteCompression()],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        settings: resolve(root, 'settings', 'index.html')
      }
    }
  },
  //publicDir: "public",
  server: {
    host: true, // expose on the LAN, not just localhost - needed to test from a phone
    hmr:
      { overlay: false },
    proxy: {
      "/api/settings": "http://localhost:8787"
    }
  },
  assetsInclude: [],
  esbuild: {
    minify: true,
    minifySyntax: true
  }
})