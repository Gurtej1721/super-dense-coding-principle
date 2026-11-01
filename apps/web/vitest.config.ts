import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@quantum/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
      '@quantum/core': path.resolve(__dirname, '../../packages/quantum-core/src')
    }
  }
});
