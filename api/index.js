import { createApp } from '../backend/dist/app.js';

const app = createApp();

export default function handler(req, res) {
  // Vercel invokes this function for /api/* while Express owns the /api prefix.
  return app(req, res);
}

export { app };
