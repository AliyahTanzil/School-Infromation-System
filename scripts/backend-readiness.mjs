export const DEFAULT_BACKEND_START_TIMEOUT = 60000;

export function backendStartTimeout(value = DEFAULT_BACKEND_START_TIMEOUT) {
  const timeout = Number(value);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error('BACKEND_START_TIMEOUT must be a positive number of milliseconds.');
  }
  return timeout;
}

export async function waitForBackend(
  isReady,
  {
    timeoutMs = DEFAULT_BACKEND_START_TIMEOUT,
    hasExited = () => false,
    now = () => performance.now(),
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {}
) {
  const deadline = now() + backendStartTimeout(timeoutMs);
  while (now() < deadline) {
    if (hasExited()) throw new Error('Backend process exited before becoming ready.');
    if (await isReady()) return true;
    const remaining = deadline - now();
    if (remaining > 0) await sleep(Math.min(250, remaining));
  }
  return false;
}
