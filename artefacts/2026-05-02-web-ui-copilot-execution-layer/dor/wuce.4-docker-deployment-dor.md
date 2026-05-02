# Definition of Ready: Docker deployment and environment configuration

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.4 — Docker deployment and environment configuration
**Epic:** E1 — Walking Skeleton
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a platform operator or DevOps engineer / I want to deploy the web UI as a Docker container using docker compose / So that I can run the full walking-skeleton stack on any host…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 14 Jest + 6 Docker/shell tests in wuce.4 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Kubernetes Helm, CI/CD pipeline, HA configuration, GitHub App explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | M2 — Phase 1 stakeholder activation rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC6 each have dedicated test cases in wuce.4 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared in this story |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-004 (env vars only), ADR-012 (configurable GitHub hostname), non-root user, no secrets in image layers |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (non-root, no secrets in layers), Performance (cold start <10s), container orchestration readiness (/health), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers container non-root and secrets-out-of-layers for wuce.4 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | This story introduces no new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.4 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E1 (Walking Skeleton). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Docker deployment and environment configuration — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.4-docker-deployment.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.4-docker-deployment-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest (for env-var and startup validation tests) + Docker shell tests (docker build, docker compose up)
- Do not implement Kubernetes Helm charts, CI/CD pipelines, or HA configuration (out of scope)
- Dockerfile: multi-stage build — final image is production-only (no devDependencies, no source maps)
- Container must run as a dedicated non-root user
- No secrets in Docker build args or image layer history — all secrets via runtime env vars only
- `GITHUB_API_BASE_URL` env var must allow GHE redirect (AC3)
- `GET /health` endpoint must return 200 within 10 seconds of container start
- Missing required env var at startup must produce a descriptive error and exit non-zero (AC2)
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-004: all configuration via environment variables only
- ADR-012: `GITHUB_API_BASE_URL` env var configures the GitHub hostname for all adapter calls
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming non-root user, no secrets in image layers, and /health implementation
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.4-docker-deployment-dor-contract.md
