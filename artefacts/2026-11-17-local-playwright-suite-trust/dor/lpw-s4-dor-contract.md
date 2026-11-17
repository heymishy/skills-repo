# Contract Proposal - The four pod browser specs run against a seeded team roster and join the browser suite

**What will be built:**
- `POST /test/seed-team-member` in `src/web-ui/server.js`: test-mode only (the same inline `NODE_ENV === 'test'` guard as the sibling `/test/seed-*` routes), validates the identity, and inserts a person, a person identity and a team membership into the fake test database for the e2e session's tenant, once per identity.
- The four specs (`ep1-s1-pod-creation`, `ep1-s2-product-default-pod`, `ep1-s3-feature-pod-inheritance`, `ep4-s1-multi-pod-assign`): seed the members they need, select them by the seeded names.
- `tests/e2e/capability-matrix.json`: the four specs leave quarantine; at least one joins the core lane.
- `tests/check-lpw-s4-seed-team-member.js` (T1a to T5) and a Definition of Done.

**What will NOT be built:**
- No change to the pod manager page, the roster query, the team routes or any module under `src/web-ui/public/`, `src/web-ui/modules/` or `src/web-ui/routes/`; no new npm dependency; no change to the real add-teammate flow.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1a, T1b, T1c against the real test server | integration |
| AC2 | T2a, T2b, T2c | integration + source check |
| AC3 | the four specs, alone and in core order, twice | E2E |
| AC4 | T4a, T4b | unit |
| AC5 | T5 | unit |

**Assumptions:** the fake test database answers `INSERT INTO people / team_memberships / person_identities` and the roster join (read in `src/web-ui/adapters/fake-test-db.js`, lines 670 to 763); the e2e session's tenant id is `e2e-tester`; the roster shows the identity string as the display name, so seeding the identities `Hamish` and `Susan` satisfies the specs' `hasText` selectors.

`schemaDepends: []`. **Estimated touch points:** Files: about 9 (server.js, four specs, the matrix, one test, artefacts). Services: none.

**Exclusion list check (B1/D1):** the excluded paths (`src/web-ui/public/`, `modules/`, `routes/`) have no test assertion against them other than T5, which asserts they are unchanged.
