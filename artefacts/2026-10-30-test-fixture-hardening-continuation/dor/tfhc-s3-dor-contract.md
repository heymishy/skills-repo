## Contract Proposal — Extract a shared mockReq/mockRes fixture module for skills.js tests

**What will be built:**
- `tests/helpers/skills-fixture.js` — new factory module (`skillsFixture(overrides)`) returning a `mockReq` with a default `session` shape grounded in `skills.js`'s real `req.session` reads (`tenantId`, `accessToken`, `userId`, `login`, `role`).
- `tests/check-skills-fixture-self-test.js` — new dedicated self-test asserting the fixture's default shape and overrides-merge behaviour.
- `scripts/check-skills-fixture-usage.js` — new structural check (same shape as `scripts/check-journey-fixture-usage.js`), flagging a hand-rolled `mockReq` on any `skills.js`-touching test file.
- Migration edit to `tests/check-dic1-story-cards.js` — the single proof-of-pattern migration target, replacing its hand-rolled `mockReq`/`mockRes` (lines 169-179) with `skillsFixture(...)`.
- Edit to `skills/review/SKILL.md` — adds a new "Category G: skills.js fixture hygiene" section, mirroring Category F's existing wording for `check-journey-fixture-usage.js`.

**What will NOT be built:**
- Migration of the other 11 hand-rolled `skills.js` files beyond this 1 proof-of-pattern migration — fast-follow, per the story's own Out of Scope section.
- Promotion of the new check to a `/definition-of-ready` hard block — trigger-based, not in scope.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test — default session shape has all 5 real fields | unit |
| AC2 | Unit test — self-test asserts shape + overrides-merge | unit |
| AC3 | Integration test — migrated `check-dic1-story-cards.js` passes unchanged | integration |
| AC4 | Unit test — check flags hand-rolled file, passes migrated file | unit |
| AC5 | Integration test — `/review`'s own SKILL.md text names the new category | integration |

**Assumptions:**
- `skills.js`'s real `req.session` field set (`tenantId`, `accessToken`, `userId`, `login`, `role`) is stable for the duration of this story — independently confirmed via `grep -n "req\.session\." src/web-ui/routes/skills.js`, not copy-pasted trust of `journey.js`'s own fixture.
- `tests/check-dic1-story-cards.js` is a representative proof-of-pattern target — confirmed via direct read (lines 169-179) that it hand-rolls exactly the pattern the new check is meant to flag.

**Estimated touch points:**
Files: `tests/helpers/skills-fixture.js` (new), `tests/check-skills-fixture-self-test.js` (new), `scripts/check-skills-fixture-usage.js` (new), `tests/fixtures/tfhc-s3-hand-rolled-mockreq.js` (new), `tests/fixtures/tfhc-s3-shared-fixture-usage.js` (new), `tests/check-dic1-story-cards.js` (modified), `skills/review/SKILL.md` (modified)
Services: None
APIs: None

**schemaDepends:** Not applicable — Dependencies block states "None"; no upstream story referenced.
