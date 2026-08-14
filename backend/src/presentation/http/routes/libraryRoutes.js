import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import { books, loans, overview } from '../controllers/libraryController.js';

const router = Router();
router.use(authenticate);
router.get('/:libraryId/overview', overview);
router.get('/:libraryId/books', books);
router.get('/:libraryId/loans', loans);
export default router;
