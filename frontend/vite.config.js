/* global process */
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const backendPortFile = resolve(process.cwd(), '../backend/.sais-port');

function isV0Environment() {
  return Boolean(globalThis.process?.env?.VERCEL || globalThis.process?.env?.V0 || existsSync('/vercel/share'));
}

function resolveBackendTarget() {
  const configuredUrl = globalThis.process?.env?.VITE_API_URL || globalThis.process?.env?.VITE_BACKEND_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  if (isV0Environment()) {
    try {
      const port = Number(readFileSync(backendPortFile, 'utf8').trim());
      if (Number.isFinite(port) && port > 0) return `http://127.0.0.1:${port}`;
    } catch {
      // Backend startup may still be creating the coordination file.
    }
  }

  return 'http://127.0.0.1:3000';
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
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
