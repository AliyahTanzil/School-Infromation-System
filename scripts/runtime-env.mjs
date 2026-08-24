import fs from 'node:fs';

export const RUNTIME_VSCODE = 'vscode';
export const RUNTIME_V0 = 'v0';

export function detectRuntime() {
  if (process.env.SAIS_RUNTIME) return process.env.SAIS_RUNTIME;
  if (process.env.VERCEL || process.env.V0 || fs.existsSync('/vercel/share')) {
    return RUNTIME_V0;
  }
  return RUNTIME_VSCODE;
}

export function isV0Runtime() {
  return detectRuntime() === RUNTIME_V0;
}

export function isLocalRuntime() {
  return detectRuntime() === RUNTIME_VSCODE;
}
