## Definition of Ready: fjcv-s2 — Fix-forward: credits-guard blocks fjcv-s1's ideate-first E2E path on real staging

**Story:** artefacts/2026-08-10-full-journey-core-flow-e2e/stories/fjcv-s2-credits-guard-e2e-bypass.md
**Test plan:** artefacts/2026-08-10-full-journey-core-flow-e2e/test-plans/fjcv-s2-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- Modified: `src/web-ui/middleware/credits-guard.js` — double-gate e2e bypass (tenant prefix + secret header).
- Modified: `tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js` — `submitTurn()` now sends the bypass header.
- New: `tests/check-rapp-s1-credits-guard-e2e-bypass.js`.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/modules/credits.js` — the balance/adjustment logic itself is correct and unchanged; this story only adds an upstream bypass condition in the guard.
- `ftcg-s1`'s free-tier grant amount (`CREDITS_FREE_TIER_GRANT`) — real-user allocation is unchanged, per the story's own Out of Scope section.
- `bri-s3.2`'s own E2E spec — never observed to hit this failure (7 turns, under the 10-credit ceiling); not touched.

### Architecture Constraints

No new architectural decision — reuses the already-established, already-audited double-gate staging-only bypass pattern (`dss-s1`, `serlb-s1`, `nis-s1`, `bjs-s1`) applied to a new guard. No ADR required; the security rationale is fully captured in the story's own Architecture Constraints and NFR sections.

### Human oversight

**Medium** — touches a security-sensitive credit-enforcement guard. The explicit negative-case ACs (AC2–AC5) exist specifically to make the bypass's narrowness independently verifiable, not just asserted.

### Coding Agent Instructions

1. `src/web-ui/middleware/credits-guard.js` — already implemented: `_creditsGuardBypassRequested(req, tenantId)` checked immediately after the existing admin bypass, before the real balance check.
2. `tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js` — already updated: `submitTurn()` sends `headers: testEndpointBypassHeaders()`.
3. `tests/check-rapp-s1-credits-guard-e2e-bypass.js` — already written and passing (11/11).
4. Regression already run and green: `check-lab-s3.3-credit-enforcement.js` (36/36), `fjcv-s1`'s own spec locally (3/3).
5. Post-merge: confirm the next `staging-deploy.yml` run's `smoke-test` job passes `fjcv-s1`'s ideate-first test without a 402 — this story's own real completion criterion (mirrors `sedf-s1`'s "verify on the next deploy" pattern).

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (none — middleware/backend logic only)

**PROCEED: Yes**
