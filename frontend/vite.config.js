/* global process */
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const backendPortFile = resolve(process.cwd(), '../backend/.sais-port');

function resolveBackendTarget() {
  try {
    const port = Number(readFileSync(backendPortFile, 'utf8').trim());
    return `http://localhost:${port}`;
  } catch {
    return globalThis.process?.env?.VITE_BACKEND_URL || 'http://localhost:3000';
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    alias: {
      react: resolve(process.cwd(), '../node_modules/react'),
      'react-dom': resolve(process.cwd(), '../node_modules/react-dom'),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    // The orchestrator supplies a reserved port; standalone Vite uses an
    // operating-system-selected port instead of competing for a fixed port.
    port: Number(globalThis.process?.env?.FRONTEND_PORT || 0),
    strictPort: false,
    // Proxy /api calls to the backend during development so CORS is avoided locally.
    proxy: {
      '/api': {
        target: resolveBackendTarget(),
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
