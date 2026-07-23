## Contract Proposal — Drive product + first-feature creation via rough-idea/ideate, assert canvas and artefact persistence

**What will be built:**
- A Playwright spec (`tests/e2e/a3-product-feature-ideate-canvas.spec.js`) that reuses A1/A2's auth+plan fixtures, then drives: product creation form submit → page reload assertion, feature creation via "rough idea" → `/ideate` session, 2 ideation turns with a bounded 3-attempt retry per turn for canvas-marker emission.
- An Integration test reading the `/ideate` session's saved artefact directly from disk/Postgres (via the existing read API, per this repo's disk-canonicity convention) and comparing it to the rendered canvas content.

**What will NOT be built:**
- Any change to the `/ideate` skill's own canvas-marker-emission instruction (SKILL.md) — this story only observes existing behaviour.
- Drag-reorder, manual card editing, or multi-product/multi-feature test coverage — explicitly out of scope.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | E2E: create product, reload page, assert persisted details | E2E |
| AC2 | E2E: create feature via rough-idea, assert `/ideate` session reachable at its own URL | E2E |
| AC3 | E2E with bounded retry: assert canvas renders/updates if markers emitted; manual scenario is the acknowledged fallback if not | E2E (+ manual gap) |
| AC4 | Integration: read disk artefact, compare to rendered canvas content | Integration |

**Assumptions:**
- The `/ideate` skill session on staging runs with `MOCK_LLM_GATEWAY=true` (revised 2026-07-23 — see decisions.md ARCH entry; this corrects an earlier draft of this story that incorrectly called the real model, contradicting discovery's own constraint to never call real Anthropic APIs from E2E). A mock fixture is configured to always include a canvas marker, making AC3 fully deterministic.
- The test tenant's credits are topped up via the existing `POST /api/admin/credits/adjust` admin endpoint in test setup (staging-only, `e2e-test-` tagged tenant) — "no free tier" (SCOPE-002) is a deliberate product decision this story does not attempt to reverse.

**Estimated touch points:**
Files: `tests/e2e/a3-product-feature-ideate-canvas.spec.js`, `tests/check-a3-ideate-artefact-disk-match.js`
Services: `wuce-staging`
APIs: product/feature creation endpoints (existing), `/ideate` session endpoints (existing), artefact read API (existing)
