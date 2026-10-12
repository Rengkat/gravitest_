# ── Build stage ──────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# System Chromium + the shared libs Puppeteer's bundled Chromium needs at
# runtime. We install the OS package and point Puppeteer at it via
# PUPPETEER_EXECUTABLE_PATH (also set below) rather than letting
# `puppeteer` download its own copy — smaller image, and avoids the
# download failing in restricted network environments (Railway/Render/Fly
# build containers sometimes block it).
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 5000

# Run pending migrations against the COMPILED datasource (no ts-node in the
# runtime image — that's a devDependency, deliberately not installed here),
# then start. Split into two commands so a failed migration fails the
# deploy loudly instead of the app silently starting against a stale schema.
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/config/typeorm.datasource.js && node dist/main"]
