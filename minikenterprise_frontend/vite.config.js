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
    hmr:
      { overlay: false }
  },
  assetsInclude: [],
  esbuild: {
    minify: true,
    minifySyntax: true
  }
})