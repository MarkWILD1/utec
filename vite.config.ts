import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

// GitHub Pages sirve el sitio en https://<user>.github.io/<repo>/
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/utec/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        jovenes: resolve(root, 'jovenes.html'),
        jovenesMotivacional: resolve(root, 'jovenes_motivacional.html'),
      },
    },
  },
}))
