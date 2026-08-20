export default async function handler(req, res) {
  try {
    const { default: app } = await import('../src/app.js');
    return app(req, res);
  } catch (error) {
    console.error('[sais-backend] function bootstrap failed', error);
    return res.status(500).json({
      error: 'Backend function failed to initialize',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
