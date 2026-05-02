## Story: Self-hosted deployment support (Docker + environment-variable config injection)

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e1-walking-skeleton.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **platform operator or DevOps engineer**,
I want to run the web UI as a Docker container with all configuration supplied via environment variables,
So that the application can be deployed to any container platform (on-premises, cloud, or developer laptop) without bespoke install scripts, without committing secrets to the repository, and without modifying application code.

## Benefit Linkage

**Metric moved:** M2 — Phase 1 stakeholder activation rate
**How:** Enterprise teams will not activate on a service that cannot be run inside their network boundary or deployed using their standard container pipeline; Docker + env-var config is the minimum-viable deployment story for organisational adoption.

## Architecture Constraints

- ADR-004: all runtime configuration (GitHub OAuth client ID/secret, session secret, allowed repo list, GitHub Enterprise Server hostname if applicable) must be read from environment variables — no config values hardcoded in application code or Dockerfile
- ADR-012: the GitHub hostname used for OAuth and API calls must be configurable (default `github.com`; override via `GITHUB_API_BASE_URL` env var) to support GitHub Enterprise Server deployments
- Mandatory security constraint: secrets (OAuth client secret, session secret) must only be passed via environment variables — never via build args, never written to Docker image layers
- Mandatory security constraint: the container must not run as root — use a dedicated non-root user in the Dockerfile
- No database seeding or external service calls at container startup — startup must succeed with env vars only

## Dependencies

- **Upstream:** wuce.1, wuce.2, wuce.3 (deployment story wraps the completed skeleton)
- **Downstream:** None within the walking skeleton epic; wuce.5 onwards inherit this deployment foundation

## Acceptance Criteria

**AC1:** Given a `Dockerfile` and `docker-compose.yml` are present in the repository root, When `docker compose up` is run with the required environment variables set (see `docker-compose.yml` env block), Then the application starts, the OAuth callback URL resolves correctly, and a health-check endpoint (`GET /health`) returns 200 with `{"status": "ok"}`.

**AC2:** Given the container is started without a required environment variable (e.g. `GITHUB_CLIENT_SECRET` is absent), When the application attempts to start, Then it logs a clear startup error naming the missing variable and exits with a non-zero code — it does not start in a partially configured state.

**AC3:** Given the environment variable `GITHUB_API_BASE_URL` is set to a GitHub Enterprise Server URL, When a user authenticates, Then the OAuth authorisation and token exchange requests are made against the configured URL, not against `github.com`.

**AC4:** Given the container is inspected after build (`docker inspect`), When the image layers are examined, Then no secret values (OAuth client secret, session secret) appear in any layer's environment or command history.

**AC5:** Given the container is running, When `docker exec <container> whoami` is executed, Then the result is not `root` — the application runs as a dedicated non-root user.

**AC6:** Given the Dockerfile uses a multi-stage build, When the final image is produced, Then the final stage contains only production runtime dependencies — no dev dependencies, build tools, or source files not required at runtime — and the final image size is documented in the build output.

**AC7 (deployment guidance):** Given the application is deployed to a container platform that supports replica configuration, When the deployment manifest is provided, Then it specifies a minimum replica count of 1 (no scale-to-zero) to prevent cold starts from affecting authenticated users, with a note that this is a recommended default which operators may override based on cost/availability trade-off.

## Out of Scope

- Kubernetes Helm chart, Terraform module, or cloud-provider-specific deployment templates — acceptable as post-launch additions; Docker + docker-compose is the scope of this story
- CI/CD pipeline configuration for automated image builds — out of scope for the web UI feature
- High-availability or load-balanced deployment configuration — post-MVP
- GitHub App authentication model (as opposed to GitHub OAuth App) — post-MVP; phase 1 uses OAuth App

## NFRs

- **Security:** Container does not run as root. No secrets in image layers. All config via env vars only.
- **Performance:** Container cold start to health-check 200 in under 10 seconds on standard hardware.
- **Accessibility:** Not applicable (deployment infrastructure story).
- **Audit:** Container startup logs include application version, configured GitHub hostname, and whether Enterprise Server mode is active (no secret values logged).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
