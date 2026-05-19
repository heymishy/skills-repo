# Definition of Ready: Non-happy path navigation (wsm.3)

**Story reference:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.3-non-happy-path.md
**Test plan reference:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.3-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.3-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-session-management/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- Journey GET response extended to include a `breadcrumb` array: each entry has `{ stage, status: "completed" | "active" | "pending" | "needs-review", navigable: boolean }`. Completed stages are navigable; future stages are not.
- `GET /api/journey/:id/stages/:stageName` endpoint: returns the turns and state for a prior completed stage (read-only view). Returns 404 for stages not yet completed.
- `POST /api/journey/:id/stages/:stageName/recommit` endpoint: owner only; validates that the target stage is a prior completed stage; sets all downstream stages to `status: "needs-review"` in the breadcrumb; writes a `{ type: "session-boundary", label: "Previous session" }` entry into the turns array for the current active stage; persists via wsm.1 session store; returns 200.
- Recommit confirmation guard: if the request body does not include `{ confirmed: true }`, return 400 with message "Confirm required before recommit."
- `needs-review` flags persisted to disk via wsm.1 session store write.
- `needs-review` cleared ONLY for the re-committed stage itself when it advances to the next stage (not for other downstream stages).
- "Previous session" boundary marker: a `{ type: "session-boundary", label: "— Previous session —" }` entry injected by the server into the active stage's turns array when restoring from disk.

**What will NOT be built:**
- Client-side breadcrumb rendering (server-side data only).
- Bulk clearing of `needs-review` flags.
- Editing turn content.
- Stage deletion.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — breadcrumb navigable flags | T1: GET journey with 2 completed stages, assert breadcrumb navigable:true for completed, false for pending | Integration |
| AC2 — prior stage turns viewable | T2: GET /stages/:stageName for completed stage, assert turns returned | Integration |
| AC3 — recommit sets needs-review | T3: POST /recommit confirmed:true on prior stage, assert downstream stages have needs-review | Integration |
| AC4 — cancel no-op | T4: POST /recommit without confirmed:true, assert 400 and no state change | Integration |
| AC5 — session boundary marker | T5: restore journey from disk (server restart), assert session-boundary entry in active turns | Integration |
| AC6 — needs-review persisted | T7: recommit + server restart, assert needs-review still set | Integration |
| AC7 — needs-review cleared on re-advance | T8: recommit stage, advance it again, assert its own needs-review cleared (downstream still set) | Integration |

**Assumptions:**
- **Depends on wsm.1** — needs-review flags persisted via the session store adapter.
- Stage names match the existing `journey.currentStage` field values (e.g. 'discovery', 'benefit-metric', etc.).
- The breadcrumb data is computed from `journey.completedStages` on every GET — not stored as a separate field.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — extend GET response with breadcrumb, add GET stages/:stageName, POST stages/:stageName/recommit
- `src/web-ui/server.js` — wire new endpoints

---

## Contract Review

✅ **Contract review passed** — recommit confirmation guard prevents accidental overwrites. `needs-review` propagation is explicit (downstream stages only, cleared on re-advance of the specific stage). Session boundary marker is injected at restore time (not stored, to avoid confusion with actual turns). Depends on wsm.1; this dependency is declared.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator navigating a live delivery journey**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 7 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T5, T7, T8 cover all 7 ACs |
| H4 | Out-of-scope populated | ✅ PASS | Client rendering, bulk clear, turn editing, stage deletion excluded |
| H5 | Benefit linkage | ✅ PASS | "Stage back-navigation and recovery completeness" named |
| H6 | Complexity rated | ✅ PASS | Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 7 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7, wsm.1 are code deps. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | Recommit confirmation guard, downstream-only needs-review, session-boundary at restore time |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-consistency-needs-review |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling; no PII |
| H-NFR-profile | NFR profile presence | ✅ PASS | artefacts/2026-05-07-web-ui-session-management/nfr-profile.md exists |
| H-GOV | Approved By | ✅ PASS | Hamis — Platform operator / product owner — 2026-05-07 |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (N/A) | No new injectable adapters; uses wsm.1's sessionStore adapter |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-consistency-needs-review in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | Session-boundary injection timing (restore vs startup) confirmed: at startup restore, not at session creation — acknowledged | Hamis |

---

## Oversight Level

**Oversight:** High
**Rationale:** Depends on wsm.1. Introduces stage back-navigation and mutation of prior completed stages. The `needs-review` flag propagation must be correct — incorrect propagation would give a misleading delivery picture.

🔴 **High oversight** — sign-off: Hamis (sole operator and product owner).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes — requires wsm.1 to be merged and on master first
Story: Non-happy path navigation — artefacts/2026-05-07-web-ui-session-management/stories/wsm.3-non-happy-path.md
Test plan: artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.3-test-plan.md

Goal:
Make every test in tests/check-wsm3-non-happy-path.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Dependencies:
- wsm.1 must be merged before implementing wsm.3. If session-store.js does not exist, stop and add a PR comment.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Extend GET /api/journey/:id response with breadcrumb array: [{ stage, status, navigable }]. Compute from journey.completedStages on every GET.
- Add GET /api/journey/:id/stages/:stageName: returns { turns, state } for completed stages. 404 for non-completed stages.
- Add POST /api/journey/:id/stages/:stageName/recommit: requires { confirmed: true } in body (400 if absent). Sets status:'needs-review' on all stages after the target in the journey. Calls _sessionStore.write after state update.
- Session-boundary marker: { type: 'session-boundary', label: '— Previous session —' } is injected into the CURRENT active stage's turns array AT STARTUP RESTORE TIME (in the server.js startup restore loop). It is NOT stored in the session file — it is injected transiently after loading.
- needs-review cleared: when a stage with needs-review:true advances to the next stage (via gate-confirm), clear needs-review for THAT stage only. Downstream stages retain their needs-review flag.
- Architecture: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named approver
**Signed off by:** Hamis — Platform operator / product owner — 2026-05-08
