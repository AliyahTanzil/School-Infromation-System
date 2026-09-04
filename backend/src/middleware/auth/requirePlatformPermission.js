import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default function requirePlatformPermission() {
  return () => {
    throw new AuthorizationError(
      'Platform access is not available in single-school mode',
      'PLATFORM_ACCESS_DISABLED'
    );
  };
}
