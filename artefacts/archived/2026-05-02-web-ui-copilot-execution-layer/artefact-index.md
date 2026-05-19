# Artefact Index — Web UI Copilot Execution Layer (WUCE)

**Feature slug:** `2026-05-02-web-ui-copilot-execution-layer`
**Status:** In delivery — wuce.1–17 DoD-complete (85/88 ACs); wuce.18–25 DoR-ready (HTML frontend layer, 8 stories pending implementation)
**Delivery period:** 2026-05-02 → ongoing
**Porting note:** This file is the single entry point for reading or porting the full artefact chain to another framework. Read this first, then follow the links to individual files as needed.

---

## Feature-level artefacts

| File | Purpose |
|------|---------|
| [discovery.md](discovery.md) | Approved discovery — problem, scope, MVP items, constraints |
| [benefit-metric.md](benefit-metric.md) | Active benefit metrics (P1, P3, P4, P5, M2) with targets and baselines |
| [nfr-profile.md](nfr-profile.md) | Feature-level NFR profile (security, performance, data classification) |
| [decisions.md](decisions.md) | Running decisions log + ADR references (ADR-009, ADR-012, ADR-004, ADR-018) |
| [dod/feature-dod.md](dod/feature-dod.md) | Definition of Done — 85/88 ACs, 3 deviations documented |

---

## Epics

| Epic | Title | Stories |
|------|-------|---------|
| [wuce-e1](epics/wuce-e1-walking-skeleton.md) | Walking skeleton | wuce.1–4 |
| [wuce-e2](epics/wuce-e2-phase1-full-surface.md) | Phase 1 full surface | wuce.5–8 |
| [wuce-e3](epics/wuce-e3-phase2-execution-engine.md) | Phase 2 execution engine | wuce.9–12 |
| [wuce-e4](epics/wuce-e4-phase2-guided-ui.md) | Phase 2 guided UI | wuce.13–17 |
| [wuce-e5](epics/wuce-e5-html-shell-core-views.md) | HTML shell and core views | wuce.18–22 |
| [wuce-e6](epics/wuce-e6-skill-launcher-html-form.md) | Skill launcher HTML form | wuce.23–25 |

---

## Spikes

| File | Subject |
|------|---------|
| [spike-copilot-cli-noninteractive-brief.md](spikes/spike-copilot-cli-noninteractive-brief.md) | Question: can Copilot CLI be driven non-interactively? |
| [spike-copilot-cli-noninteractive-outcome.md](spikes/spike-copilot-cli-noninteractive-outcome.md) | Outcome: DEFER — CLI not suitable; question-loop HTTP API used instead |

---

## Stories — full artefact chain per story

Each row links: story → test plan → review → DoR → DoR contract → implementation plan → verification script.

### E1 — Walking skeleton (wuce.1–4)

| ID | Title | Story | Test plan | Review | DoR | Contract | Plan | Verification |
|----|-------|-------|-----------|--------|-----|----------|------|--------------|
| wuce.1 | GitHub OAuth flow | [story](stories/wuce.1-github-oauth-flow.md) | [test plan](test-plans/wuce.1-github-oauth-flow-test-plan.md) | [review](review/wuce.1-github-oauth-flow-review-1.md) | [dor](dor/wuce.1-github-oauth-flow-dor.md) | [contract](dor/wuce.1-github-oauth-flow-dor-contract.md) | [plan](plans/wuce.1-github-oauth-flow-plan.md) | [verification](verification-scripts/wuce.1-github-oauth-flow-verification.md) |
| wuce.2 | Read and render pipeline artefacts | [story](stories/wuce.2-read-render-artefact.md) | [test plan](test-plans/wuce.2-read-render-artefact-test-plan.md) | [review](review/wuce.2-read-render-artefact-review-1.md) | [dor](dor/wuce.2-read-render-artefact-dor.md) | [contract](dor/wuce.2-read-render-artefact-dor-contract.md) | [plan](plans/wuce.2-read-render-artefact-plan.md) | [verification](verification-scripts/wuce.2-read-render-artefact-verification.md) |
| wuce.3 | Attributed sign-off on pipeline artefacts | [story](stories/wuce.3-attributed-signoff.md) | [test plan](test-plans/wuce.3-attributed-signoff-test-plan.md) | [review](review/wuce.3-attributed-signoff-review-1.md) | [dor](dor/wuce.3-attributed-signoff-dor.md) | [contract](dor/wuce.3-attributed-signoff-dor-contract.md) | [plan](plans/wuce.3-attributed-signoff-plan.md) | [verification](verification-scripts/wuce.3-attributed-signoff-verification.md) |
| wuce.4 | Docker deployment and environment configuration | [story](stories/wuce.4-docker-deployment.md) | [test plan](test-plans/wuce.4-docker-deployment-test-plan.md) | [review](review/wuce.4-docker-deployment-review-1.md) | [dor](dor/wuce.4-docker-deployment-dor.md) | [contract](dor/wuce.4-docker-deployment-dor-contract.md) | [plan](plans/wuce.4-docker-deployment-plan.md) | [verification](verification-scripts/wuce.4-docker-deployment-verification.md) |

### E2 — Phase 1 full surface (wuce.5–8)

| ID | Title | Story | Test plan | Review | DoR | Contract | Plan | Verification |
|----|-------|-------|-----------|--------|-----|----------|------|--------------|
| wuce.5 | Personalised action queue | [story](stories/wuce.5-action-queue.md) | [test plan](test-plans/wuce.5-action-queue-test-plan.md) | [review](review/wuce.5-action-queue-review-1.md) | [dor](dor/wuce.5-action-queue-dor.md) | [contract](dor/wuce.5-action-queue-dor-contract.md) | [plan](plans/wuce.5-action-queue-plan.md) | [verification](verification-scripts/wuce.5-action-queue-verification.md) |
| wuce.6 | Multi-feature navigation and artefact browser | [story](stories/wuce.6-feature-navigation.md) | [test plan](test-plans/wuce.6-feature-navigation-test-plan.md) | [review](review/wuce.6-feature-navigation-review-1.md) | [dor](dor/wuce.6-feature-navigation-dor.md) | [contract](dor/wuce.6-feature-navigation-dor-contract.md) | [plan](plans/wuce.6-feature-navigation-plan.md) | [verification](verification-scripts/wuce.6-feature-navigation-verification.md) |
| wuce.7 | Programme manager pipeline status view | [story](stories/wuce.7-programme-status-view.md) | [test plan](test-plans/wuce.7-programme-status-view-test-plan.md) | [review](review/wuce.7-programme-status-view-review-1.md) | [dor](dor/wuce.7-programme-status-view-dor.md) | [contract](dor/wuce.7-programme-status-view-dor-contract.md) | [plan](plans/wuce.7-programme-status-view-plan.md) | [verification](verification-scripts/wuce.7-programme-status-view-verification.md) |
| wuce.8 | Annotation and comment on artefact sections | [story](stories/wuce.8-annotation.md) | [test plan](test-plans/wuce.8-annotation-test-plan.md) | [review](review/wuce.8-annotation-review-1.md) | [dor](dor/wuce.8-annotation-dor.md) | [contract](dor/wuce.8-annotation-dor-contract.md) | [plan](plans/wuce.8-annotation-plan.md) | [verification](verification-scripts/wuce.8-annotation-verification.md) |

### E3 — Phase 2 execution engine (wuce.9–12)

| ID | Title | Story | Test plan | Review | DoR | Contract | Plan | Verification |
|----|-------|-------|-----------|--------|-----|----------|------|--------------|
| wuce.9 | CLI subprocess invocation | [story](stories/wuce.9-cli-subprocess-invocation.md) | [test plan](test-plans/wuce.9-cli-subprocess-invocation-test-plan.md) | [review](review/wuce.9-cli-subprocess-invocation-review-1.md) | [dor](dor/wuce.9-cli-subprocess-dor.md) | [contract](dor/wuce.9-cli-subprocess-dor-contract.md) | [plan](plans/wuce.9-cli-subprocess-plan.md) | [verification](verification-scripts/wuce.9-cli-subprocess-invocation-verification.md) |
| wuce.10 | Session isolation | [story](stories/wuce.10-session-isolation.md) | [test plan](test-plans/wuce.10-session-isolation-test-plan.md) | [review](review/wuce.10-session-isolation-review-1.md) | [dor](dor/wuce.10-session-isolation-dor.md) | [contract](dor/wuce.10-session-isolation-dor-contract.md) | [plan](plans/wuce.10-session-isolation-plan.md) | [verification](verification-scripts/wuce.10-session-isolation-verification.md) |
| wuce.11 | Skill discovery | [story](stories/wuce.11-skill-discovery.md) | [test plan](test-plans/wuce.11-skill-discovery-test-plan.md) | [review](review/wuce.11-skill-discovery-review-1.md) | [dor](dor/wuce.11-skill-discovery-dor.md) | [contract](dor/wuce.11-skill-discovery-dor-contract.md) | [plan](plans/wuce.11-skill-discovery-plan.md) | [verification](verification-scripts/wuce.11-skill-discovery-verification.md) |
| wuce.12 | BYOK config | [story](stories/wuce.12-byok-config.md) | [test plan](test-plans/wuce.12-byok-config-test-plan.md) | [review](review/wuce.12-byok-config-review-1.md) | [dor](dor/wuce.12-byok-config-dor.md) | [contract](dor/wuce.12-byok-config-dor-contract.md) | [plan](plans/wuce.12-byok-config-plan.md) | [verification](verification-scripts/wuce.12-byok-config-verification.md) |

### E4 — Phase 2 guided UI (wuce.13–17)

| ID | Title | Story | Test plan | Review | DoR | Contract | Plan | Verification |
|----|-------|-------|-----------|--------|-----|----------|------|--------------|
| wuce.13 | Skill launcher | [story](stories/wuce.13-skill-launcher.md) | [test plan](test-plans/wuce.13-skill-launcher-test-plan.md) | [review](review/wuce.13-skill-launcher-review-1.md) | [dor](dor/wuce.13-skill-launcher-dor.md) | [contract](dor/wuce.13-skill-launcher-dor-contract.md) | [plan](plans/wuce.13-skill-launcher-plan.md) | [verification](verification-scripts/wuce.13-skill-launcher-verification.md) |
| wuce.14 | Artefact preview | [story](stories/wuce.14-artefact-preview.md) | [test plan](test-plans/wuce.14-artefact-preview-test-plan.md) | [review](review/wuce.14-artefact-preview-review-1.md) | [dor](dor/wuce.14-artefact-preview-dor.md) | [contract](dor/wuce.14-artefact-preview-dor-contract.md) | [plan](plans/wuce.14-artefact-preview-plan.md) | [verification](verification-scripts/wuce.14-artefact-preview-verification.md) |
| wuce.15 | Artefact writeback | [story](stories/wuce.15-artefact-writeback.md) | [test plan](test-plans/wuce.15-artefact-writeback-test-plan.md) | [review](review/wuce.15-artefact-writeback-review-1.md) | [dor](dor/wuce.15-artefact-writeback-dor.md) | [contract](dor/wuce.15-artefact-writeback-dor-contract.md) | [plan](plans/wuce.15-artefact-writeback-plan.md) | [verification](verification-scripts/wuce.15-artefact-writeback-verification.md) |
| wuce.16 | Session persistence | [story](stories/wuce.16-session-persistence.md) | [test plan](test-plans/wuce.16-session-persistence-test-plan.md) | [review](review/wuce.16-session-persistence-review-2.md) | [dor](dor/wuce.16-session-persistence-dor.md) | [contract](dor/wuce.16-session-persistence-dor-contract.md) | [plan](plans/wuce.16-session-persistence-plan.md) | [verification](verification-scripts/wuce.16-session-persistence-verification.md) |
| wuce.17 | Playwright E2E test infrastructure | [story](stories/wuce.17-playwright-e2e-infrastructure.md) | [test plan](test-plans/wuce.17-playwright-e2e-infrastructure-test-plan.md) | [review](review/wuce.17-playwright-e2e-infrastructure-review-1.md) | [dor](dor/wuce.17-playwright-e2e-infrastructure-dor.md) | [contract](dor/wuce.17-playwright-e2e-infrastructure-dor-contract.md) | — | [verification](verification-scripts/wuce.17-playwright-e2e-infrastructure-verification.md) |

### E5 — HTML shell and core views (wuce.18–22)

| ID | Title | Story | Test plan | Review | DoR | Contract | Verification |
|----|-------|-------|-----------|--------|-----|----------|--------------|
| wuce.18 | HTML shell and navigation | [story](stories/wuce.18-html-shell-navigation.md) | [test plan](test-plans/wuce.18-html-shell-navigation-test-plan.md) | [review](review/wuce.18-html-shell-navigation-review-1.md) | [dor](dor/wuce.18-html-shell-navigation-dor.md) | [contract](dor/wuce.18-html-shell-navigation-dor-contract.md) | [verification](verification-scripts/wuce.18-html-shell-navigation-verification.md) |
| wuce.19 | Feature list HTML view | [story](stories/wuce.19-feature-list-html-view.md) | [test plan](test-plans/wuce.19-feature-list-html-view-test-plan.md) | [review](review/wuce.19-feature-list-html-view-review-1.md) | [dor](dor/wuce.19-feature-list-html-view-dor.md) | [contract](dor/wuce.19-feature-list-html-view-dor-contract.md) | [verification](verification-scripts/wuce.19-feature-list-html-view-verification.md) |
| wuce.20 | Feature artefact index HTML view | [story](stories/wuce.20-artefact-index-html-view.md) | [test plan](test-plans/wuce.20-artefact-index-html-view-test-plan.md) | [review](review/wuce.20-artefact-index-html-view-review-1.md) | [dor](dor/wuce.20-artefact-index-html-view-dor.md) | [contract](dor/wuce.20-artefact-index-html-view-dor-contract.md) | [verification](verification-scripts/wuce.20-artefact-index-html-view-verification.md) |
| wuce.21 | Action queue HTML view | [story](stories/wuce.21-action-queue-html-view.md) | [test plan](test-plans/wuce.21-action-queue-html-view-test-plan.md) | [review](review/wuce.21-action-queue-html-view-review-1.md) | [dor](dor/wuce.21-action-queue-html-view-dor.md) | [contract](dor/wuce.21-action-queue-html-view-dor-contract.md) | [verification](verification-scripts/wuce.21-action-queue-html-view-verification.md) |
| wuce.22 | Status board HTML view | [story](stories/wuce.22-status-board-html-view.md) | [test plan](test-plans/wuce.22-status-board-html-view-test-plan.md) | [review](review/wuce.22-status-board-html-view-review-1.md) | [dor](dor/wuce.22-status-board-html-view-dor.md) | [contract](dor/wuce.22-status-board-html-view-dor-contract.md) | [verification](verification-scripts/wuce.22-status-board-html-view-verification.md) |

### E6 — Skill launcher HTML form (wuce.23–25)

| ID | Title | Story | Test plan | Review | DoR | Contract | Verification |
|----|-------|-------|-----------|--------|-----|----------|--------------|
| wuce.23 | Skill launcher landing and session start | [story](stories/wuce.23-skill-launcher-landing.md) | [test plan](test-plans/wuce.23-skill-launcher-landing-test-plan.md) | [review](review/wuce.23-skill-launcher-landing-review-1.md) | [dor](dor/wuce.23-skill-launcher-landing-dor.md) | [contract](dor/wuce.23-skill-launcher-landing-dor-contract.md) | [verification](verification-scripts/wuce.23-skill-launcher-landing-verification.md) |
| wuce.24 | Guided question form | [story](stories/wuce.24-guided-question-form.md) | [test plan](test-plans/wuce.24-guided-question-form-test-plan.md) | [review](review/wuce.24-guided-question-form-review-1.md) | [dor](dor/wuce.24-guided-question-form-dor.md) | [contract](dor/wuce.24-guided-question-form-dor-contract.md) | [verification](verification-scripts/wuce.24-guided-question-form-verification.md) |
| wuce.25 | Session commit and result view | [story](stories/wuce.25-session-commit-result.md) | [test plan](test-plans/wuce.25-session-commit-result-test-plan.md) | [review](review/wuce.25-session-commit-result-review-1.md) | [dor](dor/wuce.25-session-commit-result-dor.md) | [contract](dor/wuce.25-session-commit-result-dor-contract.md) | [verification](verification-scripts/wuce.25-session-commit-result-verification.md) |

---

## Key implementation files (src/)

| File | Purpose |
|------|---------|
| `src/web-ui/server.js` | HTTP entry point — no Express, raw `http.createServer` |
| `src/web-ui/routes/auth.js` | GitHub OAuth flow, auth guard middleware |
| `src/web-ui/routes/artefact.js` | GET /artefact/:slug/:type — fetch + render artefact |
| `src/web-ui/routes/features.js` | GET /features, GET /features/:slug — feature + artefact list |
| `src/web-ui/routes/dashboard.js` | GET /api/actions — action queue |
| `src/web-ui/routes/sign-off.js` | POST /sign-off — attributed sign-off write |
| `src/web-ui/routes/annotation.js` | POST /api/artefacts/:path/annotations |
| `src/web-ui/routes/status.js` | GET /status, GET /status/export |
| `src/web-ui/routes/health.js` | GET /health — unauthenticated health check |
| `src/web-ui/adapters/` | ADR-012 adapter modules (fetcher, feature-list, artefact-list, action-queue, pipeline-status, annotation-writer, sign-off-writer) |
| `src/web-ui/middleware/session.js` | In-memory session store |
| `src/web-ui/middleware/rate-limiter.js` | Per-user rate limiter (10 req/user/min) |
| `src/web-ui/utils/markdown-renderer.js` | XSS-safe markdown → HTML renderer |
| `src/web-ui/utils/status-board.js` | Status board derivation logic |
| `src/web-ui/utils/annotation-utils.js` | Annotation sanitisation, build, parse |
| `src/web-ui/config/validate-env.js` | Startup env validation (fails fast) |
| `src/web-ui/utils/html-shell.js` | `renderShell({title, bodyContent, user})` + `escHtml()` — canonical XSS function (wuce.18) |
| `src/web-ui/utils/artefact-labels.js` | Static map: internal type id → human-readable label (wuce.20) |
| `src/web-ui/routes/skills.js` | GET /skills, POST session start, GET question, POST answer, GET commit-preview, POST commit, GET result (wuce.23–25) |

## Key test files

| File | Story | Assertions |
|------|-------|-----------|
| `tests/check-wuce1-oauth-flow.js` | wuce.1 | 43 |
| `tests/check-wuce2-read-render-artefact.js` | wuce.2 | 54 |
| `tests/check-wuce3-attributed-signoff.js` | wuce.3 | 51 |
| `tests/check-wuce4-docker-deployment.js` | wuce.4 | 14 |
| `tests/check-wuce5-action-queue.js` | wuce.5 | 46 |
| `tests/check-wuce6-feature-navigation.js` | wuce.6 | 70 |
| `tests/check-wuce7-programme-status-view.js` | wuce.7 | 49 |
| `tests/check-wuce8-annotation.js` | wuce.8 | 24 |
| `tests/check-wuce17-e2e-infra.js` | wuce.17 | 22 |
| `tests/e2e/smoke.spec.js` | wuce.17 | 2 passing, 20 skipped stubs |
| `tests/check-wuce18-html-shell.js` | wuce.18 | TBD (DoR-ready, not yet implemented) |
| `tests/check-wuce19-feature-list-html.js` | wuce.19 | TBD |
| `tests/check-wuce20-artefact-index-html.js` | wuce.20 | TBD |
| `tests/check-wuce21-action-queue-html.js` | wuce.21 | TBD |
| `tests/check-wuce22-status-board-html.js` | wuce.22 | TBD |
| `tests/check-wuce23-skill-launcher-landing.js` | wuce.23 | TBD |
| `tests/check-wuce24-guided-question-form.js` | wuce.24 | TBD |
| `tests/check-wuce25-session-commit-result.js` | wuce.25 | TBD |
| `tests/e2e/wuce18-keyboard-nav.spec.ts` | wuce.18 AC5 | Playwright — keyboard focus styling (layout-dependent) |

---

## ADRs recorded during delivery

| ADR | Decision |
|-----|---------|
| ADR-004 | `WUCE_REPOSITORIES` env var as sole repo config source |
| ADR-009 | Auth/read/write handlers in separate route modules |
| ADR-012 | Adapter pattern — all GitHub API calls via injectable adapters |
| ADR-018 | Playwright as sole E2E framework; `tests/e2e/` only; `devDependency` |

All ADRs are in `.github/architecture-guardrails.md`.

---

## Cross-references

- **Pipeline-state write safety fix** (concurrent inner-loop fan-out overwrite): `artefacts/2026-05-03-pipeline-state-write-safety/fix-note.md` — triggered by wuce.2–8 and wuce.12 showing stale `prStatus: none` after merge
- **HTML frontend layer (E5/E6)**: wuce.18–25 DoR-ready as of 2026-05-03 — awaiting implementation dispatch. E5 (wuce.18–22) covers renderShell, HTML views for features/actions/status. E6 (wuce.23–25) covers skill launcher form, question-loop, commit preview and result page.
