import { createServer } from 'node:net';

export async function findAvailablePort(start, excludedPorts = []) {
  if (!Number.isInteger(start) || start < 0 || start > 65535) {
    throw new Error('Port must be an integer between 0 and 65535.');
  }
  for (let port = start; port <= 65535; port += 1) {
    const result = await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', (error) => {
        if (error.code === 'EADDRINUSE') resolve(null);
        else reject(error);
      });
      // Match Vite's listening address; loopback-only probes can miss an
      // existing wildcard listener on Windows.
      server.listen({ port, host: '0.0.0.0', exclusive: true }, () => {
        const assigned = server.address().port;
        server.close(() => resolve(assigned));
      });
    });
    if (result !== null) {
      if (!excludedPorts.includes(result)) return result;
      if (port === 0) port = result;
    }
  }
  throw new Error('No available port found.');
}
