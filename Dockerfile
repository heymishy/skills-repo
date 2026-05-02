# syntax=docker/dockerfile:1

# ────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# Installs all dependencies (including devDependencies) and copies source.
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install all dependencies (including dev) for the build stage
RUN npm ci --include=dev

# Copy source code
COPY src/ ./src/

# ────────────────────────────────────────────────────────────────────────────
# Stage 2 — production
# Copies only production runtime from builder; runs as non-root user.
# Final image size: no devDependencies, no test files, no source maps.
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as dedicated non-root user (ADR constraint: container non-root)
# node:alpine already includes a 'node' user (uid 1000)
USER node

WORKDIR /app

# Copy package files
COPY --chown=node:node package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy application source from builder
COPY --chown=node:node --from=builder /app/src ./src/

# Expose application port
EXPOSE 3000

# Health check — verify /health endpoint is reachable
# Container orchestration platforms (Kubernetes, ECS, etc.) use this probe
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "src/web-ui/server.js"]
