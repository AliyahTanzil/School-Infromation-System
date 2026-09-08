# UI contrast remediation

Date: 2026-09-08

## Problem

The final global dark-theme stylesheet loaded after the light design system. It changed the inherited document color and all form controls without establishing matching boundaries for light authentication cards or shared operational data panels. This produced light-on-light headings, dark inputs inside a white sign-in card, and low-visibility content on multiple `.page-shell` routes.

## Correction

- Authentication is now an explicit light color-scheme boundary with dark headings and labels, readable supporting text, light form controls, visible placeholders and accessible links.
- Shared operational `.page-shell` routes now receive dark design tokens for panels, tables, headings, supporting text and controls.
- White hard-coded data panels, result cards, stat cards and the student-registration modal now match their dark page shell.
- The inline identity color was replaced with a reusable semantic class.

The shared operational correction covers activation review, academic policy, AI intelligence, attendance, classes, class details, examinations, results, students, subjects, user management and the authenticated dashboard shell.

## Verification

- WCAG color-pair regression tests: 2 passed.
- Full frontend suite: 40 passed across 20 files.
- Frontend production build: passed.
- Targeted ESLint and `git diff --check`: passed.

The browser-control surface was unavailable, so no automated post-change screenshot was captured in this environment. Final visual inspection should be performed in an available browser at desktop and mobile widths before release sign-off.
