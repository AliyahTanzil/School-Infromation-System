FROM node:20.17.0-alpine3.20

WORKDIR /app

# Copy workspace manifests first so Docker cache is reused when only source changes.
# Both root and backend package files are needed for npm workspaces to resolve deps.
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --omit=dev --workspace=backend

COPY . .

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Route is mounted at /api, so the probe must call /api/live (liveness — no DB dependency).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node --input-type=module -e "fetch('http://127.0.0.1:3000/api/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Run the backend entry point directly — root package.json has no start script.
CMD ["node", "backend/src/main.js"]
