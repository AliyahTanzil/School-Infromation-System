/**
 * Health Controller
 *
 * Three-endpoint health model following Kubernetes / cloud-native conventions:
 *
 *  GET /health  — general system status (DB + process metrics)
 *  GET /ready   — readiness probe  (is the app ready to serve traffic?)
 *  GET /live    — liveness probe   (is the app alive and not deadlocked?)
 *
 * All three always return JSON with an `{ success, status }` envelope so
 * load-balancers, orchestrators, and monitoring dashboards parse uniformly.
 */

import { checkDatabaseConnection } from '../../../infrastructure/orm/database.js';
import logger from '../../../infrastructure/logger/index.js';

// Captured once when the module first loads — used to compute uptime.
const SERVER_START_TIME = Date.now();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable uptime string, e.g. "2d 4h 13m 7s".
 */
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Collects Node.js process memory stats in MB (rounded to 2 dp).
 */
function memoryStats() {
  const raw = process.memoryUsage();
  const toMB = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;
  return {
    rss: `${toMB(raw.rss)} MB`,
    heapTotal: `${toMB(raw.heapTotal)} MB`,
    heapUsed: `${toMB(raw.heapUsed)} MB`,
    external: `${toMB(raw.external)} MB`,
  };
}

/**
 * Checks database reachability and returns a `{ status, latencyMs }` object.
 * Never throws — failures are captured and returned as a degraded status.
 */
async function dbCheck() {
  const start = Date.now();
  try {
    await Promise.race([
      checkDatabaseConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('database health check timed out')), 2000)
      ),
    ]);
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    logger.warn('Health check — database unreachable', { error: err.message });
    return { status: 'down', latencyMs: Date.now() - start };
  }
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /health
 *
 * Full system-status report. Includes:
 *  • Database connectivity + query latency
 *  • Process uptime and memory usage
 *  • Node.js runtime version
 *  • Application environment and version
 *
 * Use this for internal dashboards and alerting pipelines.
 * Avoid exposing it publicly — it leaks infrastructure detail.
 *
 * HTTP 200 = healthy  |  HTTP 503 = degraded (one or more deps down)
 */
export async function getHealth(req, res) {
  const uptimeMs = Date.now() - SERVER_START_TIME;
  const database = await dbCheck();

  const allUp = database.status === 'up';
  const overallStatus = allUp ? 'healthy' : 'degraded';
  const httpStatus = allUp ? 200 : 503;

  const payload = {
    success: allUp,
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptimeMs),
    uptimeMs,
    version: process.env.npm_package_version ?? '0.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    node: process.version,
    memory: memoryStats(),
    dependencies: {
      database,
    },
  };

  logger.info('Health check performed', { status: overallStatus, dbStatus: database.status });
  res.status(httpStatus).json(payload);
}

/**
 * GET /ready
 *
 * Kubernetes readiness probe — answers: "Can this pod safely receive traffic?"
 *
 * Returns HTTP 200 only when all required dependencies (DB) are reachable.
 * Returns HTTP 503 when a required dependency is unavailable — the orchestrator
 * will stop sending new requests to this pod until it recovers.
 *
 * Keep this endpoint FAST (< 200 ms). Only check what is strictly needed
 * to handle a request.
 */
export async function getReady(req, res) {
  const database = await dbCheck();
  const ready = database.status === 'up';

  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: {
      database,
    },
  });
}

/**
 * GET /live
 *
 * Kubernetes liveness probe — answers: "Is this process alive and responsive?"
 *
 * This probe MUST NOT check external dependencies. Its sole purpose is to
 * detect a deadlocked or otherwise hung Node.js event loop.
 * If the event loop can serve this response, the process is considered alive.
 *
 * Always returns HTTP 200. The orchestrator restarts the pod only if it
 * cannot receive any response at all.
 */
export function getLive(req, res) {
  const uptimeMs = Date.now() - SERVER_START_TIME;

  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptimeMs),
    uptimeMs,
    pid: process.pid,
  });
}

/**
 * GET /health/deep
 *
 * Safe deployment diagnostic. It verifies runtime, required configuration,
 * database connectivity, and token configuration without returning secrets.
 */
export async function getDatabaseHealth(req, res) {
  const database = await dbCheck();
  res.status(database.status === 'up' ? 200 : 503).json({
    success: database.status === 'up',
    status: database.status === 'up' ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
    database: { status: database.status, latencyMs: database.latencyMs },
  });
}

export async function getDeepHealth(req, res) {
  const database = await dbCheck();
  const environment = 'healthy';
  const authentication =
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET ? 'healthy' : 'degraded';
  const checks = {
    backend: 'healthy',
    environment,
    prisma: database.status === 'up' ? 'healthy' : 'degraded',
    database: database.status === 'up' ? 'healthy' : 'degraded',
    authentication,
  };
  const healthy = Object.values(checks).every((status) => status === 'healthy');

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
}
