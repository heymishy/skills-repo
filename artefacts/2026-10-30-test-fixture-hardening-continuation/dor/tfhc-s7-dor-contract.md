## Contract Proposal — Extract a shared mockReq/mockRes fixture module for journeys.js tests

**What will be built:**
- `tests/helpers/journeys-fixture.js` (new) — exports `journeysFixture(overrides)` and `journeysFixtureRes()`. Default session shape: `{ tenantId: '<non-empty default>' }` only — grounded directly in `journeys.js`'s real `req.session.*` reads (confirmed via `grep -n "req\.session\." src/web-ui/routes/journeys.js`: exactly one field, across 13 handler sites). `csrfToken` deliberately excluded from the default, matching `journey-fixture.js`'s own precedent (CSRF middleware reads it separately; it is not a `journeys.js`-own session read).
- `tests/check-journeys-fixture-self-test.js` (new) — re-derives `journeys.js`'s real session fields from source at test-run time (same technique `tfhc-s3`'s self-test introduced), asserts the fixture's default covers every field found, and asserts `overrides` merges additively without discarding other defaults.
- `tests/check-ep3-s2-journey-health.js` (modified) — its one inline `{ session: { tenantId: 't1' }, params: { id: 'j1' } }` literal replaced with `journeysFixture({ params: { id: 'j1' } })`.
- `scripts/check-journeys-fixture-usage.js` (new) — structural check mirroring `check-journey-fixture-usage.js`/`check-skills-fixture-usage.js`, with the detection regex broadened per `tfhc-s5`'s own spike finding to also match `(?:const|var|let)\s+req\s*=\s*\{[^}]*session\s*:` ad-hoc inline literals, not just a named `mockReq` factory.
- `tests/fixtures/tfhc-s7-hand-rolled-mockreq.js`, `tests/fixtures/tfhc-s7-shared-fixture-usage.js` (new) — AC4 test-data fixtures, mirroring the `tsir-s3`/`tfhc-s3` precedent pair exactly.
- `skills/review/SKILL.md` (modified) — new "### Category H: journeys.js fixture hygiene" section, mirroring Category G's exact structure. Category count/letter-range updated at BOTH locations it appears (Step 1 announcement line and the `rssp-s1` operational instruction) — this two-location requirement is explicit in AC5, directly addressing the exact defect `tfhc-s3` shipped and a code-quality review caught (one location updated, the other missed).

**What will NOT be built:**
- Migration of any of the other 29 hand-rolled `journeys.js` files beyond the 1 proof-of-pattern migration — fast-follow per the story's own Out of Scope section.
- `products.js`'s own fixture work — a separate, lower-priority fast-follow per `tfhc-s5`'s spike.
- Promoting the new check to a `/definition-of-ready` hard block.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test asserting `journeysFixture()`'s default session shape | unit |
| AC2 | Unit tests in `check-journeys-fixture-self-test.js` (source re-derivation + overrides merge) | unit |
| AC3 | Integration test comparing `check-ep3-s2-journey-health.js`'s pass count before/after migration | integration |
| AC4 | Unit tests running the structural check against 2 fixture files (hand-rolled, compliant) | unit |
| AC5 | Integration test grepping `skills/review/SKILL.md` for both category-count locations | integration |

**Assumptions:**
- `journeys.js`'s real session-field shape (`tenantId` only) is stable and will not diverge from `journey.js`'s/`skills.js`'s own 5-field shape in a way that requires reconciliation — confirmed independently by direct source grep during this contract's own preparation, not solely inherited from `tfhc-s5`'s spike.
- `tests/check-ep3-s2-journey-health.js`'s current 6/0 passing baseline is the correct pre-migration reference point (confirmed fresh, 2026-10-31).

**Estimated touch points:**
Files: `tests/helpers/journeys-fixture.js`, `tests/check-journeys-fixture-self-test.js`, `tests/check-ep3-s2-journey-health.js`, `scripts/check-journeys-fixture-usage.js`, `tests/fixtures/tfhc-s7-hand-rolled-mockreq.js`, `tests/fixtures/tfhc-s7-shared-fixture-usage.js`, `skills/review/SKILL.md`
Services: None
APIs: None
