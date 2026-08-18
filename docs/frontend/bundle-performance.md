# Frontend bundle performance

The application shell now lazy-loads dashboard and workspace modules through React route boundaries. Authentication and landing surfaces remain available through the same router, while feature modules are fetched only when their route renders.

Verification uses the production Vite build and checks that the previous monolithic chunk warning is absent. Remaining warnings must be treated as regressions if a future feature reintroduces a large eager import.
