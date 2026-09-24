# Definition of Done: Expose the real team roster as a read API

**PR:** https://github.com/heymishy/skills-repo/pull/920 | **Merged:** 2026-09-24
**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s1.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-09-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: real entries returned | ✅ | `testAC1ReturnsRealEntries` | `unit` + `integration-real-code` (also re-verified against the real `fake-test-db.js` production path by the wiring-completeness test) | None |
| AC2: unresolvable silently omitted | ✅ | `testAC2SilentlyOmitsUnresolvable` | `unit` | None |
| AC3: tenant isolation | ✅ | `testAC3TenantIsolation` | `unit` | None |
| AC4: endpoint returns matching JSON | ✅ | `testAC4EndpointReturnsMatchingJson` | `integration-real-code` (direct handler dispatch against a real fake pool, asserted against the read function's own real output) | Response envelope is `{ members: [...] }`, not a bare array — AC4's literal text is satisfied because the read function's own output is the bare array; the envelope is an endpoint-level shape decision matching `GET /api/pods`'s `{ pods: [...] }` convention (logged in `decisions.md`, 2026-09-24) |
| AC5: unauthenticated rejection | ✅ | `testAC5UnauthenticatedRequestRejected` | `integration-real-code` (dispatched through the real `router()` export from `server.js`, exercising the real, unmodified `authGuard`) | None |

**Verification strength summary:** 3 unit, 5 integration-real-code (some ACs have both). No AC in this story makes a browser-observable or third-party-system claim — it is a pure internal read API — so the UI-evidence gate and the external-real-world-effect escalation in Step 2 do not apply; `integration-real-code` evidence against the real router/real query shape is the correct and sufficient tier for every AC here.

---

## Scope Deviations

None. Confirmed by `/verify-completion`'s own scope check (7 commits, all traced to branch-setup/plan/4 tasks/one artefact-accuracy fix) and by the final cross-task reviewer's explicit "anything extra" check.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 5 planned (1 additional test — `fake-test-db.js` wiring completeness — added during `/implementation-plan` when a 4th touch point was found; not in the original test-plan estimate, but strictly additive, not a gap)
**Tests passing in CI:** 6 / 6 implemented (confirmed both by direct local runs throughout `/subagent-execution` and by `/verify-completion`'s fresh full-suite run)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit | ✅ | ✅ | |
| AC2 unit | ✅ | ✅ | |
| AC3 unit | ✅ | ✅ | |
| AC4 integration | ✅ | ✅ | |
| AC5 integration | ✅ | ✅ | Dispatches through the real router, not a mock |
| Wiring completeness (not AC-numbered) | ✅ | ✅ | Proves `fake-test-db.js`'s new branch, not covered by the original 5-test plan |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (well under 1s) | ✅ | Matches this app's own established RISK-ACCEPT pattern for comparably-shaped synchronous NFRs (`nfr-profile.md`) — a single indexed JOIN over two small tables, no dedicated timing assertion; not yet live-timed since no consumer (rtri-s2/rtri-s3) exercises it live yet |
| Security — no new auth mechanism | ✅ | AC5's own test directly proves `authGuard` is reused unmodified via real router dispatch |
| Accessibility | ✅ N/A | Pure JSON API, no rendered UI (per story NFR section) |
| Audit | ✅ N/A | Read-only, no new write/mutation (per story NFR section) |

---

## Metric Signal

Both feature metrics list `rtri-s1` as a genuine contributing story (the shared read path both `rtri-s2` and `rtri-s3` depend on) — `contributingStories` in `pipeline-state.json` was empty for both at `/definition` time and is corrected here to include `rtri-s1`.

**Measurement-ready gate:** not yet, for both metrics — neither has a consumer shipped yet.

| Metric | Measurement-ready? | Signal | Evidence note |
|--------|--------------------|--------|----------------|
| m1: Real pod membership | Not yet | `not-yet-measured` | Infrastructure-only story — no UI wired to create a pod with real members yet; `rtri-s2` (pod-manager.html picker) is the consumer that will make this measurable |
| m2: /team/members shows a real list | Not yet | `not-yet-measured` | Infrastructure-only story — no UI wired to render the real list yet; `rtri-s3` (/team/members page) is the consumer that will make this measurable |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- None blocking. `rtri-s2` and `rtri-s3` remain to be built before either metric can move — already tracked as the epic's next 2 stories, not a gap in this story's own delivery.

---

## DoD Observations

1. **Artefact-chain citation defect, caught and fixed pre-merge:** the DoR contract (`dor/rtri-s1-dor-contract.md`) cited a `decisions.md` entry for the AC4 envelope-wording clarification that didn't actually exist until the final cross-task reviewer caught it during `/subagent-execution`. Backfilled before merge (commit `b0f05503`). `/improve` candidate: `/definition-of-ready`'s Step 3 (Contract review) could add a check that any `decisions.md` citation inside a Contract Proposal is verified to actually exist at DoR sign-off time, rather than only being caught later by a downstream reviewer.
2. **`pipeline-state.json` epic-nested merge conflict, as anticipated and avoided by design:** per this feature's `epics[].stories[]` shape, `pipeline-state.json` was deliberately never written on `feature/rtri-s1` itself throughout the inner loop — every state checkpoint (branch-setup, implementation-plan, subagent-execution, verify-completion, branch-complete) was written directly to `master`. When the PR merged and `master` was pulled locally, this produced exactly one real conflict in `pipeline-state.json` (an add/add on the same story block) — resolved by keeping the accumulated master-side state (which was always the complete, current version) over the stale DoR-stage snapshot the PR branch itself carried. This confirms the epic-nested bookkeeping rule (CLAUDE.md) worked as intended: the conflict was contained to one predictable, easily-resolved block rather than silently losing data.
3. **Subagent background-wait failure recurred twice** during `/subagent-execution` (Task 2's spec reviewer, and this story's final cross-task reviewer) despite the skill's own mandatory verbatim warning present at every dispatch. Both required a manual corrective re-dispatch. `/improve` candidate: this failure mode is already documented in `subagent-execution/SKILL.md` as recurring across multiple prior stories (wugs-s8, vrne-s1, rcfc-s1) — worth escalating beyond a prompt-text warning if it keeps recurring at this rate.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Expose the real team roster as a read API" (rtri-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
