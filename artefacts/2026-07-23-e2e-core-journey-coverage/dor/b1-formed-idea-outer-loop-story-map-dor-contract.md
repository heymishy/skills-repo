## Contract Proposal — Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE

**What will be built:**
- A Playwright spec (`tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js`) that reuses A1's auth fixture, creates its own minimal product/tenant context independently of A3 (per the review-resolved Dependencies), and drives a formed-idea feature through `/discovery` → `/benefit-metric` → `/definition` → `/review` → `/test-plan` → `/definition-of-ready`, asserting the story-map canvas and DoR status along the way.
- An Integration test reading the resumed `/definition` session's story-map-specific field (distinct from A4's `canvasBlocks`) directly via the session-state API.

**What will NOT be built:**
- Any coding/inner-loop or DoD stages — this scenario stops at DoR sign-off.
- Multiple story-map layouts or epic/story count variations — one representative scenario only.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | E2E: drive `/discovery` to Approved, assert via API/UI | E2E |
| AC2 | E2E: drive `/benefit-metric`→`/definition`, assert story-map canvas renders | E2E |
| AC3 | E2E: drive `/review`→`/test-plan`→`/definition-of-ready`, assert DoR status field | E2E |
| AC4 | Integration: close mid-SSE, reopen, assert story-map-specific field restored | Integration |

**Assumptions:**
- This spec is fully independent of A3's spec file — it provisions its own product/tenant context, so it can run standalone with no run-order coupling (resolved at /review, [1-M1]).
- The six skill-session stages this story drives (`/discovery` through `/definition-of-ready`) are each a distinct session with artefact handoff, per ADR-022/ADR-023 — the spec must not assume a single persistent session.

**Estimated touch points:**
Files: `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js`, `tests/check-b1-story-map-session-restore.js`
Services: `wuce-staging`
APIs: `/discovery`, `/benefit-metric`, `/definition`, `/review`, `/test-plan`, `/definition-of-ready` skill-session endpoints (existing), `GET /api/journey/:id` (ADR-024 contract)
