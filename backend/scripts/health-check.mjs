import process from 'node:process';

const baseUrl = process.env.HEALTHCHECK_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
const endpoints = ['/api/v1/health/live', '/api/v1/health/ready', '/api/v1/health/database'];

for (const endpoint of endpoints) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, { signal: controller.signal });
    const body = await response.json().catch(() => null);
    console.log(JSON.stringify({ endpoint, status: response.status, body }));
    if (!response.ok && endpoint !== '/api/health/live') process.exitCode = 1;
  } catch (error) {
    console.error(
      JSON.stringify({ endpoint, error: error instanceof Error ? error.message : 'request failed' })
    );
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}
