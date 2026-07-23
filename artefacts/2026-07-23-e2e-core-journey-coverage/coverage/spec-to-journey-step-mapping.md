# Spec-to-Journey-Step Coverage Mapping

**Story:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md (MVP Scope section)
**Verified by:** `tests/check-b2-coverage-mapping-accuracy.js` (AC3 + AC4 — parses discovery.md's MVP Scope list, parses this document, and cross-checks every cited AC reference against the real spec/test file content)
**Date:** 2026-07-23

---

## Purpose

This document lists every one of the 11 real, user-facing journey steps defined in discovery's MVP Scope (Scenario A's 7 steps, Scenario B's 4 steps) and names which spec file and Acceptance Criterion (AC) reference proves each one. Per AC4 (Acceptance Criterion 4 of this story), every row's spec file path and AC reference is cross-checked by an automated script against the real file content — this table is not asserted from memory alone.

**CI Signal column key:**
- **Automated (blocking)** — this AC's assertion currently executes and contributes real pass/fail signal to the CI-blocking gate (`scenario-a-staging-e2e` or `scenario-b-staging-e2e` job in `.github/workflows/e2e.yml`).
- **Manual-only** — this AC's spec test is `test.skip()`-ed in CI due to a real, confirmed, unfixable third-party constraint (Stripe's hCaptcha bot-detection blocking automated checkout submission — see `artefacts/2026-07-23-a2-stripe-ci-checkout-flake/decisions.md`). Verified via the story's own manual verification script only.
- **Skipped pending sub-blocker** — this AC's spec test currently `test.skip()`s in CI because of the still-open admin-credits-top-up sub-blocker (see `artefacts/2026-07-23-credits-upsert-fix/decisions.md` and this feature's own decisions.md — the underlying `credits` table upsert was fixed for the real Stripe webhook path, but `POST /api/admin/credits/adjust`'s `getValidTenantIds()` allowlist precondition still rejects a brand-new tenant with no existing `credits` row, independent of that fix). This is not a fabricated pass — it's an honest, currently-observed skip.

---

## Scenario A — New user, rough-idea/`/ideate` path (7 steps)

| # | Journey step (discovery.md MVP Scope) | Spec file | AC reference | CI Signal |
|---|----------------------------------------|-----------|---------------|-----------|
| A1 | Sign up via GitHub OAuth (mocked or stubbed test identity) **or** email/password signup. | `tests/e2e/a1-staging-auth-stub.spec.js` | AC1 (GitHub OAuth stub creates a real staging user and a valid session), AC2 (email/password signup creates a real staging user and a valid session) | Automated (blocking) |
| A2 | Select a plan using the real Stripe test-mode environment and a Stripe test card. | `tests/e2e/a2-stripe-test-mode-plan-selection.spec.js` | AC1 (successful test-mode checkout activates the tenant plan) | Manual-only |
| A3 | Create a new product, fill in product details. | `tests/e2e/a3-product-feature-ideate-canvas.spec.js` | AC1 (creating a product persists its details across a page reload) | Automated (blocking) |
| A4 | Create the first feature, choosing the "rough idea" path into `/ideate`. | `tests/e2e/a3-product-feature-ideate-canvas.spec.js` | AC2 (a rough-idea feature creation routes into `/ideate` and the session is reachable at its own URL) | Automated (blocking) |
| A5 | Verify the `/ideate` visual canvas renders and updates as the session progresses. | `tests/e2e/a3-product-feature-ideate-canvas.spec.js` | AC3 (2 ideation turns against the deterministic mock fixture render and update the canvas) | Automated (blocking) |
| A6 | Verify artefacts are saved to disk/Postgres as expected. | `tests/check-a3-ideate-artefact-disk-match.js` | AC4 (`mergeRedisSessionData` restores `/ideate`'s `canvasBlocks` after a disk round-trip, matching exactly what was rendered from the turn) | Automated (blocking — Integration test, not E2E; runs in `npm test`, not the E2E gate) |
| A7 | Close the session and resume it mid-SSE-stream — verify the restored state (canvas markers, turns, etc.) matches what was there before closing, per `wusl-s1`/`wusl-s2`. | `tests/e2e/a4-ideate-session-resume.spec.js` | AC2 & AC3 (closing the browser mid-SSE-stream and reopening the session restores canvas/turn history and continues with the restored context) | Automated (blocking) |

---

## Scenario B — Formed-idea path, full outer loop (4 steps)

| # | Journey step (discovery.md MVP Scope) | Spec file | AC reference | CI Signal |
|---|----------------------------------------|-----------|---------------|-----------|
| B1 | Using a new (or the same) user, create a feature via the "formed idea" path. | `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` | AC1 (a formed-idea feature reaches an Approved discovery on real staging) | Skipped pending sub-blocker |
| B2 | Drive a single scenario through `/discovery` → `/benefit-metric` → … → `/definition-of-ready`. | `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` | AC3 (review → test-plan → definition-of-ready reaches a visible DoR sign-off status) | Skipped pending sub-blocker |
| B3 | Verify the `/definition` story-map canvas renders correctly. | `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` | AC2 (definition writes epics/stories and the story-map canvas DOM renders them) | Skipped pending sub-blocker |
| B4 | Close the session mid-stream and resume it — verify restored state matches, per `wusl-s1`/`wusl-s2`. | `tests/check-b1-story-map-session-restore.js` | AC4 (`mergeRedisSessionData` restores `/definition`'s story-map-specific fields — `sectionDrafts`, `currentSectionIndex`, `pendingConfirmation`, `pendingSectionDraft` — on a real `/definition`-registered session) | Automated (blocking — Integration test, not E2E; runs in `npm test`, not the E2E gate) |

---

## Honest current status note (2026-07-23)

Ground-truth run performed for this story (`npx playwright test tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js --workers=1` against real `wuce-staging`): **1 passed (NFR-Security), 3 skipped (AC1, AC2, AC3)**. The skip is genuine and unresolved — it is not a flake. Root cause: the real Stripe-webhook credits path was fixed by `cuf-s1` (`adjustBalance`/`adjustBalanceWithAudit` now use `INSERT ... ON CONFLICT` atomic upserts, `src/web-ui/modules/credits.js`), but the admin-UI top-up path this E2E spec relies on (`POST /api/admin/credits/adjust`, `src/web-ui/routes/admin-credits.js`) still gates on `getValidTenantIds()` — a plain `SELECT tenant_id FROM credits` allowlist check — which rejects a brand-new E2E tenant with HTTP 400 "unknown tenantId" before `adjustBalanceWithAudit`'s own upsert is ever reached. This means B1's AC1-AC3 currently contribute **zero automated CI-blocking signal** — exactly analogous to A2's Stripe-hCaptcha situation for Scenario A, though for a different, still-open (not permanently unfixable) reason. B4's Integration test (`tests/check-b1-story-map-session-restore.js`) and NFR-Security are the only automated signal Scenario B's gate currently provides. This is recorded honestly here rather than silently assumed fixed; a dedicated follow-up bug-fix story (already recommended in this feature's `decisions.md`) to make `getValidTenantIds()` (or the route's precondition check) upsert-aware, not allowlist-only, would restore real signal to B1/B2/B3 with no further E2E spec changes needed.

---

## Total step count

11 of 11 journey steps mapped (Scenario A: 7, Scenario B: 4). Zero unmapped steps.
