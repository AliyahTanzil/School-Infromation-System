FROM node:20.17.0-alpine3.20 AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY backend/prisma ./backend/prisma
RUN npm ci --workspace=backend --ignore-scripts

COPY backend ./backend
RUN npx prisma generate --schema backend/prisma/schema.prisma \
  && npm run build -w backend \
  && npm prune --workspace=backend --omit=dev --ignore-scripts

FROM node:20.17.0-alpine3.20 AS runtime

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# The canonical liveness route has no database dependency.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node --input-type=module -e "fetch('http://127.0.0.1:3000/api/v1/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Run the compiled canonical entry point without shipping backend source files.
CMD ["node", "backend/dist/main.js"]
