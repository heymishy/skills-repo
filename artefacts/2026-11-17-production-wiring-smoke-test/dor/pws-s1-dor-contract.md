# Contract Proposal - A production-wiring smoke test in the unit chain

**What will be built:**
- `scripts/check-production-wiring.js` (new): pure functions `scanStubSetters(sourceTexts)` (reads `Call (set\w+)\(\)` from stub messages), `findUnwired(stubs, called, allow)` (returns missing and stale findings), and `extractRoutePatterns(serverSource)` (reads the `pathname.match(/.../)` literals from `server.js`); all exported.
- `tests/helpers/pws-boot-probe.js` (new): child-process script; sets the env, wraps the exported `set*` functions of `adapters/skills.js` and `routes/skills.js` to record calls, requires the real `server.js`, listens on an ephemeral port with a seeded test session, runs the behaviour probes and the hostile-input sweep, prints one JSON line.
- `tests/check-pws-s1-production-wiring-smoke.js` (new, T1 to T6) with the allow-list (adapter, reason, owner story) at its top.
- `artefacts/2026-11-17-production-wiring-smoke-test/decisions.md` records why each allow-list entry exists.

**What will NOT be built:**
- No change to `server.js`, `adapters/skills.js`, `routes/skills.js` or any production module; no new npm dependency; no wiring of any retired adapter; no widening to other adapter modules; no moving of the staging end-to-end. A genuine 5xx found by the sweep is recorded and decided (fix in a separate one-line change in this PR with a test, or allow-list with a follow-up story), not hidden.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (child-process boot) |
| AC2 | T2 | unit |
| AC3 | T3 | integration (real route table) |
| AC4 | T4 | integration (real route table) |
| AC5 | T5 | unit |
| AC6 | T6 | integration |

**Assumptions:** the stub messages end with `Call set<Name>()` in both source files (read at `adapters/skills.js` lines 22 to 219 and `routes/skills.js` lines 83, 137, 1557, 2895, 2980); `sessions.seedTestSession` and the `session_id` cookie work as in `tests/check-sub-s1-answer-route-retired.js`; `server.js` exports `createApp`. The exclusion list has zero test assertions against it (B1/D1): the tests touch only the three new files plus read-only reads of the production sources.

`schemaDepends: []`. **Estimated touch points:** Files: `scripts/check-production-wiring.js`, `tests/helpers/pws-boot-probe.js`, `tests/check-pws-s1-production-wiring-smoke.js` (all new), the decisions file. Services: none. APIs: none changed.
