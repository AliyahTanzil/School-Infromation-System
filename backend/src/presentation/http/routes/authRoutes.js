import { Router } from 'express';
import authController from '../controllers/authController.js';
import authenticate from '../../../middleware/auth/authenticate.js';
import validate from '../../../middleware/validation/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../../../application/validators/authValidators.js';
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} from '../../../middleware/auth/rateLimiters.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);
router.post(
  '/verify-email',
  passwordResetLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail
);
router.post(
  '/resend-verification',
  passwordResetLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);
router.get('/me', authenticate, authController.me);
router.get('/sessions', authenticate, authController.listSessions);
router.delete('/sessions/:id', authenticate, authController.revokeSession);

export default router;
