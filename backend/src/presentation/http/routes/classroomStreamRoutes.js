import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/classroomStreamController.js';
import {
  streamParamsSchema,
  announcementSchema,
  postSchema,
  commentSchema,
} from '../../../application/validators/classroomStreamValidators.js';

const router = Router();
router.use(authenticate, teacherContext);
router.get('/:classroomId', validate(streamParamsSchema), controller.list);
router.post('/:classroomId/announcements', validate(announcementSchema), controller.announce);
router.post('/:classroomId/posts', validate(postSchema), controller.post);
router.post('/posts/:postId/comments', validate(commentSchema), controller.comment);
export default router;
