# Definition of Ready: Clarify side-trip (owle.1)

**Story reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.1-clarify-side-trip.md
**Test plan reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.1-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.1-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- `GET /api/journey/:id/stage-controls` extended to include `clarifyAvailable: true` when `journey.currentStage === 'discovery'`.
- `POST /api/journey/:id/side-trip/clarify` handler: reads `artefacts/<featureSlug>/discovery.md` from disk, validates path is within repoRoot, creates a new skill session for the `/clarify` skill with the discovery content injected as the first context block, sets `session.parentJourneyId` to the journey ID (server-side only), returns `{ sideTripSessionId }`.
- `DELETE /api/journey/:id/side-trip` handler: marks the side-trip session as closed; does not modify the parent journey.
- Page-reload handling: `GET /api/journey/:id` excludes side-trip state from the journey response; any orphaned side-trip sessions with a `parentJourneyId` pointing to a non-existent journey are ignored.

**What will NOT be built:**
- Auto-merging /clarify output back into discovery.md.
- Making /clarify available at stages other than discovery.
- Background-job execution of /clarify — interactive chat only.
- Any changes to the /clarify SKILL.md file.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — button visible at discovery | T1: GET stage-controls, assert clarifyAvailable:true | Unit |
| AC2 — context pre-loaded | T2: POST side-trip, assert sideTripSessionId + discovery content in context | Integration |
| AC3 — parent state isolated | T3: assert journey turnCount/stage unchanged after side-trip turn | Unit |
| AC4 — return restores journey | T4: DELETE side-trip, GET journey, assert prior state intact | Integration |
| AC5 — button absent at other stages | T1: GET stage-controls at benefit-metric stage, assert clarifyAvailable:false | Unit |
| AC6 — page reload abandons cleanly | T6: GET journey without side-trip id, assert discovery stage returned, no error | Integration |

**Assumptions:**
- The /clarify skill is registered in the skills registry (accessible as a normal session skill).
- The existing `registerHtmlSession` function from ougl.1 is available and accepts a system-prompt extension for context injection.
- `parentJourneyId` is stored in the session object but never serialised to the client.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add side-trip handlers
- `src/web-ui/server.js` — wire POST and DELETE side-trip routes
- `src/web-ui/routes/skills.js` — read for session creation (no modification)

---

## Contract Review

✅ **Contract review passed** — path traversal guard covers discovery.md read. `parentJourneyId` is server-side only. Stage isolation maintained by not sharing the session reference with the parent journey.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator working through a discovery stage**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 6 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T6 cover all 6 ACs |
| H4 | Out-of-scope populated | ✅ PASS | Auto-merge, other stages, background job, SKILL.md changes excluded |
| H5 | Benefit linkage | ✅ PASS | "Outer loop task completion rate via web UI" named |
| H6 | Complexity rated | ✅ PASS | Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 6 ACs covered by T1–T6 |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7 are code deps only. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | Path traversal, D37, `parentJourneyId` server-side, ADR-019 referenced |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-perf-sidetripopen, NFR-sec-pathtraversal-owle |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile presence | ✅ PASS | artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md exists |
| H-GOV | Approved By | ✅ PASS | Hamis — Platform operator / product owner — 2026-05-07 |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (N/A) | No new injectable adapters introduced in this story |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-sec-pathtraversal-owle, NFR-perf-sidetripopen in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps in test plan reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Medium (new cross-session linking pattern — `parentJourneyId`)
**Rationale:** Side-trip session isolation is a new pattern. Session state must not bleed between the parent journey and the side-trip.

⚠️ **Medium oversight** — solo repo: operator (Hamis) self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Clarify side-trip — artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.1-clarify-side-trip.md
Test plan: artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.1-test-plan.md

Goal:
Make every test in tests/check-owle1-clarify-side-trip.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Add side-trip handlers to src/web-ui/routes/journey.js. Wire in server.js.
- CRITICAL — parentJourneyId is stored in the side-trip session server-side ONLY. Never expose it in API responses.
- Path traversal guard on discovery.md read: path.resolve(repoRoot, featureSlug + '/discovery.md') must start with repoRoot. Return HTTP 400 if not.
- The clarifyAvailable flag is derived server-side from journey.currentStage === 'discovery'. Never from client input.
- Stage isolation: the parent journey's stage, turnCount, and artefactPath must be unchanged after any side-trip operation (T3 asserts this).
- Page reload (AC6): GET /api/journey/:id must not include side-trip state in the response. Side-trip sessions with a parentJourneyId pointing to a non-existent journey must not throw.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Self-confirm (solo repo)
**Signed off by:** Hamis — 2026-05-08
