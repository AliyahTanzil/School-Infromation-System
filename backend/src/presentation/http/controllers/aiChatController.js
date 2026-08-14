import {
  answerQuestion,
  chatDemo,
  submitFeedback,
} from '../../../application/services/aiChatService.js';

export async function overview(req, res) {
  return res.json({ success: true, data: chatDemo });
}

export async function message(req, res) {
  const data = answerQuestion({
    tenantId: req.user?.tenantId || 'demo-tenant',
    userId: req.user?.id || 'demo-user',
    input: req.body?.input,
  });
  return res.json({ success: true, data });
}

export async function feedback(req, res) {
  return res.status(201).json({
    success: true,
    data: submitFeedback({
      tenantId: req.user?.tenantId || 'demo-tenant',
      userId: req.user?.id || 'demo-user',
      rating: req.body?.rating,
    }),
  });
}
