# Definition of Done: Web UI gate-confirm CLI validation integration

**PR:** https://github.com/heymishy/skills-repo/pull/356 | **Merged:** 2026-05-24
**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.4.md
**Test plan:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.4-test-plan.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.4-dor.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1: "validate stub called before pipelineStateWriter stub on DoR gate-confirm" — PASS. Both stubs called exactly once; validate call index recorded as lower than pipelineStateWriter. | Automated test `check-cdg4-gate-confirm-validation.js` T1 |  None |
| AC2 | ✅ | T2: "validate returns exitCode 3 → 422 response, pipelineStateWriter not called" — PASS. IT2: real validate + failing fixture → 422, pipelineStateWriter not called — PASS. | Automated tests T2 + IT2 | None |
| AC3 | ✅ | T3: "validate returns exitCode 0 → success path, pipelineStateWriter called" — PASS. IT1: real validate + passing DoR fixture → pipelineStateWriter called, not 422 — PASS. | Automated tests T3 + IT1 | None |
| AC4 | ✅ | T4: "traversal artefactPath → 400, validate not called" — PASS. NFR-SEC-1: "deep traversal variant also returns 400, validate not called" — PASS. Both variants tested. | Automated tests T4 + NFR-SEC-1 | None |
| AC5 | ✅ | T5: "setValidate is exported as a function from journey.js" — PASS. Production wiring verified in `server.js`: `setValidate(require('../enforcement/cli-outer-loop').validate)`. | Automated test T5 + code review of server.js | None |
| AC6 | ✅ | T6: "default validate stub (no setValidate) throws D37 message → 500 response" — PASS. Default stub message: "Adapter not wired: validate. Call setValidate() with cli-outer-loop.validate before use." | Automated test T6 | None |
| AC7 | ✅ | T7: "non-DoR stage (review) does not call validate" — PASS. All pre-existing gate-confirm tests continue to pass (npm test exit 0). | Automated test T7 + full npm test suite | None |
| AC8 | ✅ | `npm test` exit 0. `tests/check-cdg4-gate-confirm-validation.js` appended to test chain in `package.json`. 10/10 tests pass. | npm test — Exit: 0 | None |

**All 8 ACs satisfied. No deviations.**

---

## Scope Deviations

None. The PR modified exactly `src/web-ui/routes/journey.js` (handler + injectable adapter), `src/web-ui/server.js` (production wiring), `tests/check-cdg4-gate-confirm-validation.js` (test file), and `package.json` (test chain entry). No trace emission, no non-DoR gate validation, no frontend changes, no `skills advance` CLI changes — all four items listed as out-of-scope were not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — validate called before pipelineStateWriter | ✅ | ✅ | Call-order recorded via stub indices |
| T2 — exitCode non-zero → 422, no state write | ✅ | ✅ | pipelineStateWriter stub never called |
| T3 — exitCode 0 → 200, state written | ✅ | ✅ | pipelineStateWriter stub called once |
| T4 — path traversal → 400, validate not called | ✅ | ✅ | Standard traversal variant |
| T5 — setValidate export exists | ✅ | ✅ | |
| T6 — default stub throws D37 message | ✅ | ✅ | Module cache cleared between tests |
| T7 — non-DoR stage does not call validate | ✅ | ✅ | No regression to existing gate-confirm behaviour |
| IT1 — real validate + passing fixture → success | ✅ | ✅ | Integration test using real cli-outer-loop.validate |
| IT2 — real validate + failing fixture → 422 | ✅ | ✅ | Synthetic invalid artefact |
| NFR-SEC-1 — deep traversal variant → 400 | ✅ | ✅ | `path.join(repoRoot, '../../../etc/passwd')` variant |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Path traversal guard (OWASP A01:2021) | ✅ | T4 and NFR-SEC-1 both pass. `handlePostGateConfirm` resolves `dorArtefactPath` via `path.resolve()` and asserts `startsWith(repoRoot + path.sep)` before calling `_validate()`. Returns 400 if check fails. Raw path value not logged. |
| D37 — injectable adapter stub MUST throw | ✅ | T6 passes. Default stub throws "Adapter not wired: validate. Call setValidate() with cli-outer-loop.validate before use." — does not return empty/null. |
| D37 — production wiring mandatory | ✅ | `server.js` wires `setValidate(require('../enforcement/cli-outer-loop').validate)`. Verified by code review. |
| ADR-023 disk canonicity — write-artefact → validate → write-state | ✅ | Artefact disk write (`artefact_saved_to_disk` event in test output) precedes validate call; `_pipelineStateWriter()` called only after `exitCode: 0`. Order enforced by implementation, confirmed by T1 ordering test. |
| No frontend changes | ✅ | No CSS, HTML, or client-side JS files modified in PR #356. |
| Input sanitisation — session-scoped dorArtefactPath only | ✅ | `dorArtefactPath` read from `req.session`. No request body or query param path injection possible. |
| Performance — no SLA regression | ✅ | Validation is infrequent human action. No latency measurement required per DoR. |

**CSS-layout-dependent gaps at merge:** None (`hasLayoutDependentGaps: false`).

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M2 — Gate bypass incident rate | on-track | cdg.4 makes gate bypass structurally impossible through the web UI `definition-of-ready` path. The bypass rate for this path is now 0 by construction — `_pipelineStateWriter()` cannot be called unless `_validate()` returns `exitCode: 0`. Baseline not yet established (requires cdg.5 trace emission for counting), but the enforcement mechanism is live. | 2026-05-24 |
| M1 — Regulated story composite pipeline fidelity score | not-yet-measured | No real regulated story sessions run yet. cdg.4 does not directly move M1 — it enables the enforcement path that M1 will be measured against. | null |
| M3 — Gate logic unit test fixtures | on-track | 10 new tests added in cdg.4; prior state: 34 assertions (M3 target: 33, already met). cdg.4 tests are in a separate test file verifying the web UI integration layer — complementary to, not replacing, cdg.2 fixtures. | 2026-05-24 |
| M4 — Schema violation rate on CLI-written writes | not-yet-measured | cdg.4 is the web UI integration layer. Schema violation rate measurement requires live cli-outer-loop runs. | null |
| T3M1 — Gate enforcement auditability | not-yet-measured | Requires cdg.5 trace emission to be complete before a compliance reviewer can follow the validate → trace chain. | null |

---

## Definition of Done: COMPLETE ✅

ACs satisfied: 8/8
Deviations: None
Test gaps: None
Scope violations: None

Next: cdg.5 (Chain-hash trace emission on gate-confirm) is the next story in the epic. Its DoR is signed-off. Ready to dispatch.
