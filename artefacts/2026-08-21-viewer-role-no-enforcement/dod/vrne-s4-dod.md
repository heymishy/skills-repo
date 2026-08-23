# Definition of Done: Wire the viewer-write-block gate to edge-case routes

**PR:** https://github.com/heymishy/skills-repo/pull/759 | **Merged:** 2026-08-23
**Story:** artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s4-edge-cases.md
**Test plan:** artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s4-test-plan.md
**DoR artefact:** artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s4-dor.md
**Assessed by:** Claude (agent) + Hamish King (Founder/Operator)
**Date:** 2026-08-23

**This is the last story in the `vrne-e1-viewer-write-blocking` epic.**

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Viewer denied creating a Client org (`POST /agency/clients/new`) | `tests/check-vrne-s4-edge-case-gate.js` (AC1 unit test) | None |
| AC2 | ✅ | Viewer denied inviting into a Client org (`POST /agency/clients/:id/invite`) | `tests/check-vrne-s4-edge-case-gate.js` (AC2 unit test) | None |
| AC3 | ✅ | Viewer denied annotating an artefact (`POST /api/artefacts/:slug/annotations`) | `tests/check-vrne-s4-edge-case-gate.js` (AC3 unit test) + real-dispatch integration test | None |
| AC4 | ✅ | `engineer`/`admin` roles proceed with no regression | `tests/check-vrne-s4-edge-case-gate.js` (AC4 tests, both roles) | None |
| AC5 | ✅ | Non-Agency-org callers still denied for the **pre-existing** org-type reason, not the new gate | `tests/check-vrne-s4-agency-org-type-regression.js` (2 tests, fake-pool + direct handler calls) | None |
| AC6 | ✅ | Denial logged with `personId`, `tenantId`, `timestamp`, `route` | `tests/check-vrne-s4-edge-case-gate.js` (AC6 unit test) + observed in integration test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

No deviations. AC5 — the story's own most important regression test, proving the new gate is additive and did not weaken the pre-existing org-type check — passed cleanly, and `agency-provisioning.js` was confirmed byte-for-byte unmodified throughout the diff.

---

## Scope Deviations

None. Diff touched only `src/web-ui/server.js`'s 3 named call sites and the two new test files. No Products/Features/Skill-session/Credits-billing routes (`vrne-s1`/`s2`/`s3` territory) were touched, and no Agency/Client org provisioning logic itself was modified beyond the additive gate.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9, plus full suite 539/539 files passing on PR #759's final CI run

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — viewer denied (create client) | ✅ | ✅ | `tests/check-vrne-s4-edge-case-gate.js` |
| AC2 — viewer denied (invite) | ✅ | ✅ | |
| AC3 — viewer denied (annotation) | ✅ | ✅ | Only route of the 3 with real-dispatch integration coverage (see NFR/Observations) |
| AC4 — engineer/admin unaffected (2 tests) | ✅ | ✅ | |
| AC5 — org-type check still fires (2 tests) | ✅ | ✅ | `tests/check-vrne-s4-agency-org-type-regression.js`, distinct test harness (fake pool) |
| AC6 — denial logged | ✅ | ✅ | |

**Gaps (tests not implemented):** None against the story's own test plan. One honestly-documented, pre-existing architectural gap (see NFR Status below) prevents real-dispatch integration coverage for 2 of the 3 routes — not a gap in this story's delivered tests, but worth flagging for future awareness.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new query pattern | ✅ | Reuses `requireNonViewer` unmodified |
| Security — closes the last enumerated gaps in the epic, including `/agency/clients/*` which was never role-gated at all, only org-type-gated | ✅ | AC1/AC2/AC3 verified; AC4/AC5 are the regression guards |
| Audit — every denial logged | ✅ | AC6 test + observed in integration test |
| Data residency, Availability, Accessibility | N/A | Same rationale as prior 3 stories |

**Pre-existing architectural gap found and documented (not introduced by this story):** `_agencyProvisioningHandlers` (`server.js`) is only wired inside `if (process.env.DATABASE_URL) {...}` — under this repo's standard `NODE_ENV=test` test harness, real router-dispatch to `/agency/clients/new`/`/agency/clients/:id/invite` hits a 503 guard before ever reaching the gate. Real-dispatch integration coverage for those 2 routes is not achievable in this harness; coverage instead comes from isolated gate tests + a grep-count check + AC5's fake-pool direct-handler tests. Fully logged in `decisions.md`'s 2026-08-23 implementation-plan RISK-ACCEPT entry, with a revisit trigger tied to any future work on `story-3-self-service-provisioning`'s own test-mode wiring.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 (Metric 1 — Viewer role actually enforces read-only access) | ✅ | 2026-08-23 | **48/48 routes now enforced — 100% of the epic's enumerated write-action set.** Products + Features/journeys (33, `vrne-s1`) + Skill sessions (11, `vrne-s2`) + Credits/billing (1, `vrne-s3`) + edge cases (3, `vrne-s4`). **Epic-wide target reached.** Signal: **on-track** (target met). |
| M2 (Metric 2 — Enumerated viewer-role write actions blocked, Tier 3 risk-reduction) | ✅ | 2026-08-23 | **0 remaining unenforced routes in the enumerated set — epic-wide target met.** |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story. **Epic-level: `vrne-e1-viewer-write-blocking` is now fully delivered** — all 4 stories DoD-complete, both Tier 1/Tier 3 metrics at target. Epic `status` set to `complete` in this DoD's state write.

---

## DoD Observations

1. **Two real, self-diagnosed bugs were caught within the inner loop itself** across this story's 4 tasks: (a) a missing `NODE_ENV=test` env-var setup block causing the integration test to fail AND hang the whole process when run outside an already-configured shell — found by directly reproducing a 2+ minute hang, root-caused, and fixed by porting the exact block already proven in `vrne-s2`/`vrne-s3`; (b) an AC1/AC2/AC3 test-labeling gap (the loop dropped AC numbers from its own console output/assertions, inconsistent with the file's own AC4/AC6 blocks) — found by a code-quality reviewer and fixed immediately. Neither reached `/verify-completion` unresolved.
2. **Two orchestrating-session review-dispatch scoping mistakes occurred and were corrected in the same session** (mirroring the same class of mistake made once during `vrne-s3`): a code-quality review of Task 2 initially flagged "AC5 has zero tests" as Critical, not recognizing Task 3 (not yet dispatched) was explicitly responsible for AC5 — corrected by re-dispatching with clarified scope. `/improve` candidate, now raised twice across two consecutive sibling stories: review-dispatch prompts for any task whose scope excludes work explicitly deferred to a later task should proactively state that boundary in the prompt itself, every time, not rely on the reviewer inferring it from the plan file.
3. **Loop-design.md metrics for this story (final measurement of the 4-story epic):** ~1.75 commits/task (7 commits / 4 tasks — 4 code + 3 checkpoints), 0 false-wait incidents (4th consecutive clean story), and — critically — only 2 full-suite runs, correctly staying within the ≤2 target for this story's size after `vrne-s3`'s own overrun the story immediately prior. This is the first story in the epic to hit every one of `loop-design.md`'s Tier-2 targets simultaneously. Full comparison across all 4 stories to be logged in `workspace/capture-log.md` alongside this DoD.
4. Full detail on all three observations is recorded in `artefacts/2026-08-21-viewer-role-no-enforcement/decisions.md` and `workspace/capture-log.md`'s 2026-08-23 entries.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire the viewer-write-block gate to edge-case routes" (vrne-s4) -- the final story in the vrne-e1-viewer-write-blocking epic.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row correctly show the epic-wide target being reached (100% / 0 remaining), with real evidence, not "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the epic-level completion claim justified -- are all 4 stories (vrne-s1 through vrne-s4) genuinely DoD-complete?
Report findings as HIGH / MEDIUM / LOW.
```
