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

# Copy runtime data directories (SKILL.md files and product context)
COPY --chown=node:node skills/ ./skills/
COPY --chown=node:node product/ ./product/

# Copy the mock-LLM-gateway fixture set only (not the whole tests/ tree —
# see .dockerignore and artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/
# decisions.md). mock-llm-gateway.js's FIXTURE_DIR resolves to this exact
# path at runtime; the gateway itself only activates when
# MOCK_LLM_GATEWAY=true or NODE_ENV=test, and never in NODE_ENV=production.
COPY --chown=node:node tests/e2e/fixtures/llm-gateway/ ./tests/e2e/fixtures/llm-gateway/

# Expose application port
EXPOSE 3000

# Health check — verify /health endpoint is reachable
# Container orchestration platforms (Kubernetes, ECS, etc.) use this probe
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "src/web-ui/server.js"]
