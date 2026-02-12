import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            lib: {
              entry: 'electron/main.ts',
              formats: ['cjs'],
              fileName: () => 'main.cjs',
            },
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['sqlite3'],
              plugins: [
                {
                  name: 'ignore-dynamic-requires',
                  resolveDynamicImport() {
                    return null;
                  },
                },
              ],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
              fileName: () => 'preload.cjs',
            },
            outDir: 'dist-electron',
          },
        },
      },
      renderer: {},
    }),
  ],
  // 解决 ES 模块中缺少 __filename 和 __dirname 的问题
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
