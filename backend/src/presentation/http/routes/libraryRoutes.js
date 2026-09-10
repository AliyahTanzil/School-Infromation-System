import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/libraryController.js';
import {
  bookCreateSchema,
  bookQuerySchema,
  copyCreateSchema,
  libraryCreateSchema,
  libraryParamsSchema,
  loanCreateSchema,
  loanParamsSchema,
} from '../../../application/validators/libraryValidators.js';
const router = Router();
const admin = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN');
export function libraryAdmin(req, res, next) {
  if (req.user?.platformRole === 'OWNER') return next();
  return admin(req, res, next);
}
router.use(authenticate, teacherContext, libraryAdmin);
router.post('/', validate(libraryCreateSchema), controller.createLibrary);
router.get('/:libraryId/overview', validate(libraryParamsSchema), controller.overview);
router.get('/:libraryId/books', validate(bookQuerySchema), controller.books);
router.post('/:libraryId/books', validate(bookCreateSchema), controller.addBook);
router.post('/:libraryId/books/:bookId/copies', validate(copyCreateSchema), controller.addCopy);
router.get('/:libraryId/loans', validate(libraryParamsSchema), controller.loans);
router.post('/:libraryId/loans', validate(loanCreateSchema), controller.borrow);
router.post('/:libraryId/loans/:loanId/return', validate(loanParamsSchema), controller.returnLoan);
export default router;
