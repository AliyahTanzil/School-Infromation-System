# Step 26 error classification

## Confirmed backend issue

The active TypeScript server was mounting health routes but not the existing legacy authentication router. Requests to `/api/auth/*` and `/api/v1/auth/*` therefore failed before reaching registration, login, refresh, or logout handlers.

## Remediation

The active foundation app now mounts the existing auth router at both paths. Auth cookies use `/api` as their path so they are sent to either mount.

## Not a confirmed root cause

The React/Vite browser errors and Vercel preview noise were not treated as authentication failures. No secrets or token values were logged while reproducing the issue.

## Verification

The focused route-mount regression test asserts both auth mounts are non-404 and return structured error envelopes for an invalid refresh request.
