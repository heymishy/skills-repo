## Implementation Plan: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s3-test-plan.md

## File map

```
Create:
  scripts/lib/make-fixture-usage-check.js                   — shared factory (AC4)
  tests/check-tfhc-s3-skills-fixture-usage-check.js          — new regression-fixture pair wiring for skills.js (AC4)
  tests/helpers/products-fixture.js                          — products.js walking-skeleton fixture (AC2)
  tests/check-products-fixture-self-test.js                  — self-test for the fixture (AC2)
  scripts/check-products-fixture-usage.js                    — new structural check for products.js (AC3)
  tests/check-fhff-s3-products-fixture-usage-check.js         — regression-fixture pair for the new check (AC3)
  tests/fixtures/fhff-s3-products-hand-rolled.js              — hand-rolled example fixture (AC3)
  tests/fixtures/fhff-s3-products-shared-fixture-usage.js      — compliant example fixture (AC3)

Modify:
  scripts/check-journey-fixture-usage.js      — rewritten to delegate to the shared factory, same exports (AC4)
  scripts/check-journeys-fixture-usage.js     — rewritten to delegate to the shared factory, same exports (AC4, AC5)
  scripts/check-skills-fixture-usage.js       — rewritten to delegate to the shared factory, same exports (AC4)
  tests/check-dsa-s2-product-dashboard-wiring.js   — migrated to use products-fixture.js (AC2 proof-of-pattern)
  tests/check-ep1-s1-journey-create.js             — migrated to journeys-fixture.js (AC1)
  tests/check-ep1-s2-journey-stage-create.js       — migrated to journeys-fixture.js (AC1)
  tests/check-cnsf-s1-canvas-node-token-styling.js — migrated to journeys-fixture.js (AC1)
  tests/check-ep4-s1-journey-list.js               — migrated to journeys-fixture.js (AC1)
```

## Task 1: DRY-extract the 3 fixture-usage-check scripts into a shared factory (AC4, AC5)

- Read all 3 existing scripts (`check-journey-fixture-usage.js`, `check-journeys-fixture-usage.js`, `check-skills-fixture-usage.js`) — already confirmed identical in shape except: (a) the route/fixture require-path patterns, (b) `check-journeys-fixture-usage.js` alone has the extra ad-hoc-inline-session-literal detection (`AD_HOC_REQ_DECLARATION_PATTERN`/`SESSION_KEY_PATTERN`/`AD_HOC_SESSION_WINDOW` = 300/`hasAdHocSessionLiteral`), and (c) the pass/fail message text per route name.
- Create `scripts/lib/make-fixture-usage-check.js` exporting `makeFixtureUsageCheck(config)`, where `config` = `{ routeRequirePattern, fixtureRequirePattern, fixtureModuleLabel, detectAdHocSessionLiteral (bool, default false), scriptLabel }`. Returns `{ scanFileForHandRolledFixture, runCli }`. The ad-hoc-session-literal logic is copied verbatim from `check-journeys-fixture-usage.js` (same 300-char window) — no behaviour change, per the story's Out of Scope.
- Rewrite each of the 3 existing scripts to a thin wrapper: call `makeFixtureUsageCheck()` with its own route/fixture patterns and `detectAdHocSessionLiteral: true` only for the journeys config, then `module.exports = { scanFileForHandRolledFixture }` (**same export name, unchanged** — `tests/check-tsir-s3-journey-fixture-usage-check.js` and `tests/check-tfhc-s7-journeys-fixture-usage-check.js` both `require()` this exact named export directly) and a `if (require.main === module) runCli(process.argv[2])` CLI entry point producing the same message format as before.
- Create `tests/check-tfhc-s3-skills-fixture-usage-check.js`, mirroring `check-tfhc-s7-journeys-fixture-usage-check.js`'s shape (same 4 tests: flags hand-rolled, passes shared-fixture-usage, mutation-test toggle, `/review` SKILL.md wiring check — adjust the last one to check for `check-skills-fixture-usage.js`'s own existing review-skill reference if present, or skip it if `/review` doesn't separately categorize skills.js findings, confirmed by reading `skills/review/SKILL.md` first). Wire it to the two fixtures that already exist but were never used: `tests/fixtures/tfhc-s3-hand-rolled-mockreq.js` and `tests/fixtures/tfhc-s3-shared-fixture-usage.js`.
- Run `node tests/check-tsir-s3-journey-fixture-usage-check.js` and `node tests/check-tfhc-s7-journeys-fixture-usage-check.js` — both must still pass with identical verdicts (AC4a). Run the new `tests/check-tfhc-s3-skills-fixture-usage-check.js` (AC4b). Run `node tests/check-tsir-s1-shared-journey-fixture.js`, `node tests/check-journey-fixture-self-test.js`, `node tests/check-journeys-fixture-self-test.js`, `node tests/check-skills-fixture-self-test.js` as a sanity sweep (unrelated self-tests, must be unaffected).

## Task 2: `products.js` walking skeleton + 1 proof-of-pattern migration (AC2, AC3)

- Grounded in a direct read of `src/web-ui/routes/products.js`'s own `req.session.*` reads (already confirmed: `tenantId`, `login`, `accessToken`, `userId`, `plan`, `impersonation` — no `role`, `csrfToken`, or `userId` conflicts). Create `tests/helpers/products-fixture.js` exporting `productsFixture(overrides)` (same `Object.assign` merge shape as `journeysFixture`/`journeyFixture`, default session = `{ tenantId: 'org-1', login: 'alice', accessToken: 'tok-alice', userId: '1', plan: null, impersonation: null }`) and `productsFixtureRes()` (writeHead/end-based, matching the dominant 91-occurrence `res.writeHead`/`res.end` convention already confirmed in `products.js`, same `_get()` introspection shape as `journeyFixtureRes`).
- Create `tests/check-products-fixture-self-test.js` (field coverage, fresh-object-per-call, overrides-merge — same 3 checks as every prior fixture self-test in this lineage).
- Create `scripts/check-products-fixture-usage.js` using Task 1's `makeFixtureUsageCheck()` factory with `detectAdHocSessionLiteral: true` (products.js's own real tests use inline session literals, same pattern as journeys.js, confirmed via `tests/check-dsa-s2-product-dashboard-wiring.js`'s own hand-rolled `req`/`makeRes()`).
- Create the mutation-test pair: `tests/fixtures/fhff-s3-products-hand-rolled.js` (requires `routes/products`, hand-rolled `mockReq`) and `tests/fixtures/fhff-s3-products-shared-fixture-usage.js` (requires `routes/products`, uses `productsFixture()`). Create `tests/check-fhff-s3-products-fixture-usage-check.js` wiring both through `scanFileForHandRolledFixture`, same shape as the other 3 regression-fixture test files.
- Migrate `tests/check-dsa-s2-product-dashboard-wiring.js`'s own `req`/`makeRes()` (lines 44-47, 75-76) to `productsFixture()`/`productsFixtureRes()` — preserve every field value exactly (`userId: 42, login: 'pending-tester', tenantId: null, accessToken: 'tok'` via `overrides.session`). Run the file directly before and after; the pass count must be identical (3/3).

## Task 3: Migrate 4 more `journeys.js`-touching files to the shared fixture (AC1)

- Candidates confirmed hand-rolled via `node scripts/check-journeys-fixture-usage.js <file>` (all FAIL today): `tests/check-ep1-s1-journey-create.js`, `tests/check-ep1-s2-journey-stage-create.js`, `tests/check-cnsf-s1-canvas-node-token-styling.js`, `tests/check-ep4-s1-journey-list.js` — chosen as the 4 smallest of the 30 remaining candidates (145–220 lines), consistent with this story's own Complexity Rating 1 / lowest-risk framing.
- For each file: replace every inline `{ session: { tenantId: '...', ... }, ... }` literal with `journeysFixture({ session: { ... }, ... })`, keeping every non-`tenantId` session field (e.g. `csrfToken`) in `overrides.session` and omitting `tenantId` only when its value is the fixture's own default (`'org-1'`) — pass it explicitly in `overrides.session` when a file uses a different value (e.g. `'org-A'`/`'org-B'` spoofing-test cases). Add `const { journeysFixture } = require('../tests/helpers/journeys-fixture')` (or relative equivalent) once per file.
- Run each file directly before and after migration; the pass count must be byte-identical (same assertions, same order). Re-run `node scripts/check-journeys-fixture-usage.js <file>` after each migration — all 4 must now PASS (confirming the migration actually removed the hand-rolled pattern, not just added an unused import).

## Out of scope (unchanged from story)

- Full `journeys.js` retrofit beyond this 4-file batch.
- `products.js`'s full retrofit beyond the 1 proof-of-pattern migration.
- Promoting any structural check to a `/definition-of-ready` hard block.
- Any behaviour change to the 3 scripts' own detection logic beyond what's needed to share it.
