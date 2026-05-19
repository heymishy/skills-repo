# Definition of Ready: Trace side-trip (owle.3)

**Story reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.3-trace-side-trip.md
**Test plan reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.3-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.3-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- `GET /api/journey/:id/trace` handler: reads `featureSlug` from the journey session; scans the `artefacts/<featureSlug>/` directory for the presence of required pipeline artefact types (discovery.md, stories/, test-plans/, dor/); returns `{ status: "passed" | "has-findings" | "failed", findings: [{type, path, message}] }`.
- Logic: a missing `discovery.md` → HAS-FINDINGS; missing `stories/` → HAS-FINDINGS; missing `test-plans/` → HAS-FINDINGS; missing `dor/` → HAS-FINDINGS; empty artefact directory → HAS-FINDINGS; all present → PASSED. No results → PASSED.
- Stage-controls: `traceAvailable: true` at ALL stages.
- Wire `GET /api/journey/:id/trace` in `server.js`.

**What will NOT be built:**
- Running `scripts/validate-trace.sh` (shell script execution blocked in web UI context).
- Writing trace results to disk.
- Deep content validation of artefact files (presence-only check).
- Real-time polling or SSE updates — single-shot response per request.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — returns trace status | T1: GET /trace, assert response has { status, findings } | Unit |
| AC2 — PASSED when all present | T2: inject feature dir with all required artefacts, assert status:passed | Integration |
| AC3 — HAS-FINDINGS when missing | T3: inject feature dir missing stories/, assert status:has-findings + finding entry | Integration |
| AC4 — empty dir → HAS-FINDINGS | T4: inject empty feature dir, assert status:has-findings | Integration |
| AC5 — results replace on re-click | T5: call GET /trace twice, assert second response is fresh (no caching) | Unit |
| AC6 — feature slug path-guarded | T6: featureSlug with `../..` chars, assert 400 | Security |
| AC7 — findings contain path + message | T7: GET /trace with missing artefact, assert findings[0].path and findings[0].message populated | Unit |

**Assumptions:**
- `featureSlug` is stored on the journey session (set at creation).
- The artefact directory structure is `artefacts/<featureSlug>/`.
- `featureSlug` has been sanitised at journey creation time — but this handler adds its own guard.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add `handleGetTrace` handler and `traceAvailable` in stage-controls
- `src/web-ui/server.js` — wire GET route

---

## Contract Review

✅ **Contract review passed** — display-only (no writes). Path guard on featureSlug prevents directory escape. No shell execution. Results are computed fresh on each request (no stale cache risk).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator at any pipeline stage**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 7 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T7 cover all ACs |
| H4 | Out-of-scope populated | ✅ PASS | Shell script, disk writes, deep validation, SSE excluded |
| H5 | Benefit linkage | ✅ PASS | "Traceability completeness visibility" named |
| H6 | Complexity rated | ✅ PASS | Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 7 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7 code deps only. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | No shell execution, path guard on featureSlug, no disk writes |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-perf-trace, NFR-sec-pathtraversal-owle |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile presence | ✅ PASS | artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md exists |
| H-GOV | Approved By | ✅ PASS | Hamis — Platform operator / product owner — 2026-05-07 |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (N/A) | No new injectable adapters |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-perf-trace, NFR-sec-pathtraversal-owle in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Low
**Rationale:** Read-only handler with no writes. Well-scoped presence check. Path guard is the only security concern.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Trace side-trip — artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.3-trace-side-trip.md
Test plan: artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.3-test-plan.md

Goal:
Make every test in tests/check-owle3-trace-side-trip.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Add handleGetTrace to src/web-ui/routes/journey.js. Wire GET /api/journey/:id/trace in server.js.
- featureSlug from journey session ONLY — never from request params or body.
- Path guard (AC6): path.resolve(repoRoot, 'artefacts', featureSlug) must start with repoRoot + path.sep. Return 400 if not.
- NO shell execution (no child_process). Pure Node.js fs.existsSync / fs.readdirSync checks only.
- NO disk writes. This is a read-only handler.
- Results format: { status: "passed" | "has-findings" | "failed", findings: [{type, path, message}] }
- Empty artefact directory → has-findings (not an error).
- Required checks: discovery.md, stories/ directory, test-plans/ directory, dor/ directory.
- Results are NOT cached — compute fresh on every request (AC5).
- For test isolation, export setRepoRoot(fn) from journey.js.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
