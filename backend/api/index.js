export default async function handler(req, res) {
  try {
    const { createApp } = await import('../dist/app.js');
    const app = createApp();
    return app(req, res);
  } catch (error) {
    console.error('[sais-backend] function bootstrap failed', error);
    return res.status(500).json({ error: 'Backend function failed to initialize' });
  }
}
