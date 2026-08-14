import { performance } from 'node:perf_hooks';

const state = {
  startedAt: new Date().toISOString(),
  requests: 0,
  errors: 0,
  totalDurationMs: 0,
  byStatus: Object.create(null),
};

export function recordRequest({ status, durationMs }) {
  state.requests += 1;
  state.totalDurationMs += durationMs;
  const key = String(status);
  state.byStatus[key] = (state.byStatus[key] ?? 0) + 1;
  if (status >= 500) state.errors += 1;
}

export function snapshotMetrics() {
  return {
    ...state,
    byStatus: { ...state.byStatus },
    averageDurationMs: state.requests
      ? Math.round((state.totalDurationMs / state.requests) * 100) / 100
      : 0,
  };
}

export function measureNow() {
  return performance.now();
}

export function resetMetrics() {
  state.requests = 0;
  state.errors = 0;
  state.totalDurationMs = 0;
  state.byStatus = Object.create(null);
}

export default { recordRequest, snapshotMetrics, measureNow, resetMetrics };
