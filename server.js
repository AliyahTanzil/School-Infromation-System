import http from 'node:http';
import os from 'node:os';

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', hostname: os.hostname() }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('SAIS container is running.');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`SAIS server listening on port ${port}`);
});
