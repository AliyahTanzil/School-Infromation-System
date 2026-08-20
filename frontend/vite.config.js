/* global process */
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const backendPortFile = resolve(process.cwd(), '../backend/.sais-port');

function resolveBackendTarget() {
  const configuredUrl = globalThis.process?.env?.VITE_API_URL || globalThis.process?.env?.VITE_BACKEND_URL;
  if (configuredUrl && !/localhost|127\.0\.0\.1/.test(configuredUrl)) {
    return configuredUrl.replace(/\/$/, '');
  }

  // Vercel/v0 previews must never follow the local dynamic-port file.
  if (globalThis.process?.env?.VERCEL || globalThis.process?.env?.V0_RUNTIME_URL) {
    return 'https://saisbackend.vercel.app';
  }

  try {
    const port = Number(readFileSync(backendPortFile, 'utf8').trim());
    if (Number.isInteger(port) && port > 0) return `http://localhost:${port}`;
  } catch {
    // The backend can start after Vite; use the conventional fallback below.
  }
  return 'http://localhost:4000';
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
