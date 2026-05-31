import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/components/flow/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/components/flow/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/dist'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    projects: [
      {
        test: {
          include: ['packages/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          environment: 'node',
          globals: true
        }
      },
      {
        test: {
          include: ['src/components/flow/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          environment: 'happy-dom',
          globals: true,
          setupFiles: ['./src/components/flow/__tests__/setup.ts']
        }
      },
      {
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
          }
        },
        test: {
          include: [
            'src/hooks/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/views/menu-management/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/views/announcement-management/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/views/notification-management/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/views/log-management/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
          ],
          environment: 'happy-dom',
          globals: true,
          setupFiles: ['./src/hooks/upload/__tests__/setup.ts']
        }
      },
      {
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
          }
        },
        test: {
          include: ['src/service/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          environment: 'node',
          globals: true
        }
      },
      {
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
          }
        },
        test: {
          include: ['src/store/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          environment: 'happy-dom',
          globals: true,
          setupFiles: ['./src/store/__tests__/setup.ts']
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
