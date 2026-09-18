# Definition of Done: Sign-Off at a Stage (Approval Record & Advance)

**PR:** https://github.com/heymishy/skills-repo/pull/902 | **Merged:** 2026-09-18 (merge commit `5281923b`)
**Story:** artefacts/new-feature-2b74a292/stories/ep2-s3.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep2-s3-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep2-s3-dor.md
**Assessed by:** Copilot
**Date:** 2026-09-19

---

## AC Coverage

- **AC1:** Sign Off click opens a modal with a reason field and Approve button
- **AC2:** Approval recorded (approverId, approvalTime, reason) and feature advances to next stage
- **AC3:** decisions.md auto-appended with date, approver, reason

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/e2e/ep2-s3-approval.spec.js` ("Sign Off button/modal visible once the stage session is done"), fresh run on merged master: 1 passed | live-verified (real browser render via Playwright) | None |
| AC2 | ✅ | `tests/check-ep2-s3-approval.js::testFullApprovalPathWritesDecisionsEntry` (integration-real-code, real dispatch through `routes/journey.js`'s router, 8/8 assertions pass) + the same E2E spec's "approving via reason + keyboard advances the stage through the real gate-confirm mechanism" — fresh runs on merged master, both pass | live-verified | Architecture: no new `feature_approvals` Postgres table was built (none exists) — the new `POST /api/journey/:journeyId/approve` endpoint records the approval via a `decisions.md` entry, then the client calls the existing, unmodified `gate-confirm` endpoint to perform the actual advance. Substance of AC2 (approver, time, reason recorded; feature advances) is fully preserved — see `decisions.md`, "DoR was built against an architecture that doesn't exist" entry, for the full reasoning. |
| AC3 | ✅ | `tests/check-ep2-s3-approval.js::testWrittenEntryUsesRealFieldNamesNotSessionPhase` + `testFullApprovalPathWritesDecisionsEntry` (integration-real-code, confirms real file write) + the E2E spec's "a real decisions.md entry with the exact reason is written" — fresh runs on merged master, both pass | live-verified | Field names: the story's own literal AC3 text named fields from a different file's schema (`workspace/capture-log.md`'s `session-phase` field) that don't exist in `decisions.md`'s real format. Implemented using `decisions.md`'s actual established schema (`title`/`Date`/`Context`/`Decision`/`Rationale`, matching `handlePostDecisions`'s real, already-shipped format) — every piece of information AC3 asks for (approver, reason, stage, timestamp) is present, just under the real field names rather than the story's invented ones. See `decisions.md` architecture-correction entry. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Both deviations above are substance-preserving corrections against real, verified architecture — not gaps in what was delivered.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list: no approval-workflow (multi-sign-off) logic, no conditional/requested-revision approvals, no email notifications were built — all three remain genuinely absent from the shipped diff.

---

## Test Plan Coverage

**Tests from plan implemented:** consolidated into 7 unit/integration test functions (`tests/check-ep2-s3-approval.js`, Parts 1–3) + 1 E2E spec (`tests/e2e/ep2-s3-approval.spec.js`) covering AC1/AC2/AC3/NFR-A11y in one real-browser run — a leaner grouping than the test plan's own per-scenario breakdown, but confirmed to cover every AC and the key NFRs (see AC Coverage and NFR Status above/below).
**Tests passing in CI:** all passing — independently re-run fresh against merged master in this session: `node tests/check-ep2-s3-approval.js` → 13/13 passed; `npx playwright test tests/e2e/ep2-s3-approval.spec.js` → 1/1 passed. Full `npm test` on merged master: 679 files run, 1 failed (`tests/check-p3.5-validate-trace.js` — pre-existing, unrelated, confirmed multiple times this session before this story merged).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `testApprovalHandlerExists` | ✅ | ✅ | Sanity/wiring check |
| `testApproveRouteDeniesViewer` | ✅ | ✅ | `vrne-s1` viewer-write-block gate, added after Task 2's code-quality review found it missing from the implementation plan |
| `testSkillsHandlerStillExported` | ✅ | ✅ | Strengthened during Task 3's code-quality review (was near-vacuous originally) |
| `testFullApprovalPathWritesDecisionsEntry` | ✅ | ✅ | Full integration path: approve → decisions.md write |
| `testEmptyReasonReturns400AndWritesNoFile` | ✅ | ✅ | Validation + no-partial-write guard |
| `testWrittenEntryUsesRealFieldNamesNotSessionPhase` | ✅ | ✅ | Confirms the real decisions.md schema is used, not the story's literal (nonexistent) field list |
| E2E: AC1/AC2/AC3/NFR-A11y combined spec | ✅ | ✅ | Real browser render, keyboard-driven approval, real gate-confirm advance, real decisions.md write — all in one live run |

**Gaps (tests not implemented):** None blocking. NFR-Perf-1 (modal ≤500ms) has no dedicated automated timing assertion — RISK-ACCEPTed (see NFR Status below), reasoned as a synchronous DOM toggle with no I/O that cannot realistically miss the budget.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Approval modal appears within 500ms of "Sign Off" click | ⚠️ RISK-ACCEPT | `decisions.md`, "Task 5 NFR-latency RISK-ACCEPT" entry — synchronous, no-network client-side DOM toggle (`approval-modal.js`'s `showModal()`); a timing assertion would only measure scheduler/CI noise, matching this feature's established treatment for identically-shaped NFRs (`ep2-s1`/`ep2-s2` precedent). Real browser visibility itself IS confirmed live via the E2E spec (AC1), just not with a dedicated latency measurement. |
| Feature advances to next stage within 2s of approval | ✅ | `decisions.md`, "final cross-task review: NFR2... added a real elapsed-time assertion" entry — a genuine elapsed-time assertion was added to the E2E spec, measured locally at ~80–90ms (20–25x margin under the 2000ms budget), empirically proven non-vacuous (a temporary +5000ms injected delay was confirmed to fail the assertion, then reverted). `live-verified`. |
| decisions.md entry is auto-generated and committed to the feature branch | ⚠️ RISK-ACCEPT | `decisions.md`, "`/verify-completion`: NFR3's 'committed to the feature branch' is not literally satisfied" entry — "auto-generated" is true and verified; "committed to the feature branch" is true only in the informal, pipeline-convention sense (durably written to disk, picked up by this repo's normal session-level `git commit`), not a literal real-time git commit triggered by the approval request. This is a pre-existing limitation shared identically by the already-shipped `handlePostDecisions` precedent (`owle.2`) — not a new gap introduced by this story. |

---

## Metric Signal

This feature's benefit-metric artefact (`artefacts/new-feature-2b74a292/benefit-metric.md`) uses directional success indicators rather than a structured Tier 1 `metrics[]` array — no `metrics` entry exists in `pipeline-state.json` for this feature to update.

| Indicator | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Sign-off and accountability ("Each stage advance records the approver's identity, timestamp, and decision context") | ✅ (baseline: 0 — no sign-off/attribution existed before this story) | Not yet measured | The mechanism now exists and is verified working end-to-end (real browser test, real decisions.md write). No real beta-user stage approval has occurred yet since this just merged — the target ("a team member's approval recorded on each stage advance") requires real usage to observe, not just the shipped mechanism. Signal: `not-yet-measured`. Evidence note: mechanism shipped and verified in this session; awaiting first real beta-user approval to observe the target directly. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 3 ACs satisfied with `live-verified` evidence (real browser + real server round trip, re-confirmed fresh against merged master in this session). Two substance-preserving deviations recorded (architecture: reuses the existing `gate-confirm` mechanism instead of building a new advance path; field names: `decisions.md`'s real schema used instead of the story's literal, nonexistent field list). One NFR (modal latency) RISK-ACCEPTed as inherently unmeasurable-with-value; one NFR (git-commit timing) RISK-ACCEPTed as matching an already-shipped precedent's identical limitation. Zero scope violations. Zero test gaps that block release.

**Follow-up actions:**
1. A small accessibility story for `#sign-off-modal` (focus trap, Escape-to-close, `aria-*` wiring) — flagged during Task 3's code-quality review as a genuine gap, deferred as out-of-scope for this story. No existing codebase convention was violated (first fixed-position dialog in `skills.js`), so this is a net-new capability to build, not a regression to fix.
2. A product/UX decision on Sign Off vs. Continue button visual grouping — flagged during Task 3's code-quality review as a design question outside engineering's authority to resolve unilaterally.
3. Two pre-existing, unrelated bugs surfaced during this story's own investigation, logged but not fixed (owner: whoever next touches the named area):
   - `s1.1`/board-advance: `/test/seed-board-journey`'s default `productId` causes `acdg-s1`'s guard to hard-block gate-confirm when `DATABASE_URL` is unset in E2E — deterministic, reproducible (`decisions.md`, "Task 5 found a pre-existing, unrelated gate-confirm bug" entry).
   - The port-3000-vs-3999 E2E assertion bug, already logged against `ep2-s1`/`ep2-s2`'s own DoD entries, confirmed present in a 3rd+ file this session (`wuce20-artefact-index-html.spec.js`, `artefact-read.spec.js`) — a short-track fix candidate, not story-specific.

---

## DoD Observations

1. **This story is this feature's third consecutive "DoR built against an architecture that doesn't exist" finding** (after `ep1-s2`/`ep1-s3`/`ep2-s1`/`ep2-s2`'s own equivalent entries) — but the largest correction of the series: most of the real advance/write mechanism already shipped in production (`handlePostGateConfirm`, `handlePostDecisions`), and the story's real job turned out to be a small additive layer, not new infrastructure. `/improve` candidate: the pattern of DoR artefacts being written against an imagined architecture rather than the real, already-shipped one has now recurred 5 times in this single feature — worth a `/definition-of-ready` or `/implementation-plan` process check specifically for "does a mechanism satisfying this AC already exist in production" before any new schema/route is proposed.
2. **A rebase conflict during this session's own PR-merge sequencing** (PR 903 merging first, advancing `master`'s `server.js` with an adjacent new static-route branch, requiring `feature/ep2-s3` to be rebased and the two routes manually merged side-by-side) is recorded here for completeness — resolved cleanly, no code or test regression, confirmed via a full fresh `npm install` + `npm test` pass on the rebased branch before the final force-push. Not a defect in either story's own delivery, a normal consequence of two features touching the same file concurrently.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep2-s3 (Sign-Off at a Stage).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
