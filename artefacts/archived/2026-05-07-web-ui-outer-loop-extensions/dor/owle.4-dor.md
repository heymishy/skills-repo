# Definition of Ready: Estimate side-trip (owle.4)

**Story reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.4-estimate-side-trip.md
**Test plan reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.4-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.4-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- `POST /api/journey/:id/estimate` handler: accepts `{ pass, focusHours, complexity, scopeStability, notes? }` body; validates required fields (`pass` ∈ {E1,E2}, `focusHours` numeric, `complexity` ∈ {1,2,3}, `scopeStability` ∈ {Stable,Unstable}); derives feature slug and date server-side; appends a new row to `workspace/estimation-norms.md` (creates with table header if absent); returns 201.
- Stage-controls: `estimateAvailable: true` ONLY when `journey.currentStage === 'discovery'` or `journey.currentStage === 'definition'`.
- Wire `POST /api/journey/:id/estimate` in `server.js`.

**What will NOT be built:**
- Deduplication of E1/E2 estimates for the same feature.
- Editing or deleting existing estimation rows.
- Accepting the target file path from the client.
- Making the estimate form available at non-discovery/non-definition stages.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — button at discovery and definition | T1: stage-controls at discovery + definition, assert estimateAvailable:true | Unit |
| AC2 — button absent at other stages | T2: stage-controls at review stage, assert estimateAvailable:false | Unit |
| AC3 — appends to estimation-norms.md | T3: POST valid body, read file, assert row appended | Integration |
| AC4 — creates file with header if absent | T4: POST to journey with no prior estimation-norms.md, assert file created | Integration |
| AC5 — required field validation | T5: POST missing focusHours, assert 400; POST with pass:E3, assert 400 | Unit |
| AC6 — feature and date from server | T6: POST body with featureSlug:fake, assert saved row uses real journey featureSlug | Security |

**Assumptions:**
- `workspace/estimation-norms.md` is relative to repoRoot (hardcoded path, not from client).
- `featureSlug` is available on the journey session.
- The date is derived server-side from `new Date().toISOString().slice(0,10)`.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add `handlePostEstimate` and `estimateAvailable` in stage-controls
- `src/web-ui/server.js` — wire POST route

---

## Contract Review

✅ **Contract review passed** — target file is hardcoded server-side (`workspace/estimation-norms.md`); no path traversal risk. Validation runs before write. Date and featureSlug are server-side only.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator at the discovery or definition stage**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 6 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T6 cover all 6 ACs |
| H4 | Out-of-scope populated | ✅ PASS | Deduplication, editing, client-supplied path, non-scoped stages excluded |
| H5 | Benefit linkage | ✅ PASS | "Estimation accuracy improvement" named |
| H6 | Complexity rated | ✅ PASS | Complexity 1, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 6 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7 code deps only. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | Hardcoded target path, server-side date + featureSlug, validate before write |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-sec-serverside-slug |
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
| W1 | NFRs identified | ✅ | NFR-sec-serverside-slug in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Low
**Rationale:** Simple append handler with a hardcoded target path. No injection risk.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Estimate side-trip — artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.4-estimate-side-trip.md
Test plan: artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.4-test-plan.md

Goal:
Make every test in tests/check-owle4-estimate-side-trip.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Add handlePostEstimate to src/web-ui/routes/journey.js. Wire POST /api/journey/:id/estimate in server.js.
- Target file: path.join(repoRoot, 'workspace', 'estimation-norms.md') — HARDCODED. Never derived from client input.
- Required fields: pass (must be 'E1' or 'E2'), focusHours (numeric), complexity (must be 1, 2, or 3), scopeStability (must be 'Stable' or 'Unstable'). Return 400 if any are missing or invalid.
- Feature slug and date are derived server-side from the journey session and new Date().toISOString().slice(0,10).
- Table format: | date | feature | pass | focusHours | complexity | scopeStability | notes |
- estimateAvailable flag in stage-controls: true ONLY when currentStage === 'discovery' OR currentStage === 'definition'. False at all other stages.
- For test isolation, export setRepoRoot(fn) from journey.js.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
