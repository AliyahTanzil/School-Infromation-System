import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import schoolContext from '../../../middleware/auth/schoolContext.js';
import * as controller from '../controllers/classroomStreamController.js';

const router = Router();
router.use(authenticate, schoolContext);
router.get('/:classroomId', controller.list);
router.post('/:classroomId/announcements', controller.announce);
router.post('/:classroomId/posts', controller.post);
router.post('/posts/:postId/comments', controller.comment);
export default router;
