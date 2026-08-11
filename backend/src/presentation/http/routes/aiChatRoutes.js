import { Router } from 'express';
import { feedback, message, overview } from '../controllers/aiChatController.js';

const router = Router();
router.get('/', overview);
router.post('/messages', message);
router.post('/feedback', feedback);
export default router;
