# Mobile3 UI contract

Mobile3 establishes the authenticated shell for SAIS mobile. Each backend-derived role receives a separate dashboard route, while the backend remains authoritative for permissions and tenant scope.

The dashboard cards are intentionally module foundations: they communicate available operational areas without inventing data or APIs. Mobile4 can connect these cards to real module endpoints, notification feeds, profile data, search, and offline synchronization.

The visual system uses paper, white, ink, muted, blue, sky, and line tokens from `constants/theme.ts`, with accessible headers, buttons, readable body copy, safe-area layout, and dark-mode follow-up reserved for the native system theme implementation.
