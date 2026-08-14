# Dependency Audit Register

`npm audit --omit=dev --audit-level=high` currently reports production dependency findings. These are release blockers until reviewed and remediated:

- `xlsx` has a high-severity prototype-pollution advisory. Replace or isolate spreadsheet parsing before enabling untrusted uploads.
- `nodemailer` has multiple high-severity advisories; upgrade to a compatible fixed release or isolate mail processing before production.
- Transitive `npm`/`brace-expansion`/`ip-address` findings are present through the root npm dependency and require lockfile remediation.
- `react-router` has moderate advisories and should be upgraded within the frontend compatibility window.

Do not run `npm audit fix --force` blindly: it proposes breaking upgrades. Create a dependency upgrade branch, run the full suite, inspect lockfile changes, and verify upload/mail/route behavior before release.
