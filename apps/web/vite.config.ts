import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bandie/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@bandie/data': path.resolve(__dirname, '../../packages/data/src'),
      '@bandie/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
