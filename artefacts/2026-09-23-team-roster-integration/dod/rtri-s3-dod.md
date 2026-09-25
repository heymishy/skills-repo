# Definition of Done: Render a real member list on /team/members

**PR:** https://github.com/heymishy/skills-repo/pull/923 | **Merged:** 2026-09-25 (commit `beb46977`)
**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s3.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: rendered HTML contains a row per real member, showing identity + role | ✅ | `testAC1RendersRowPerRealMember` — real `listTeamMembers` called server-side, response parsed via jsdom, asserts exactly 2 `<li>` rows with correct identity+role text | `unit` (jsdom DOM assertion) + `integration-real-code` (real, unmodified `listTeamMembers` from `rtri-s1`) | Visual/layout confirmation in a real browser RISK-ACCEPTed — Chrome unavailable at `/verify-completion` and re-checked again at this DoD (still not connected, 4th consecutive occurrence for this feature this session). See decisions.md, 2026-09-26. |
| AC2: zero-member tenant shows an explicit empty state | ✅ | `testAC2ShowsExplicitEmptyStateForZeroMembers` — asserts the literal "No team members yet" text, the add-teammate form still renders, and zero `<li>` rows | `unit` | Same live-visual RISK-ACCEPT as AC1 |
| AC3: newly-added member appears on the very next render — live data, not stale | ✅ | `testAC3NewlyAddedMemberAppearsOnNextRenderNoStaleSnapshot` — calls `handleGetTeamMembers` twice against the same pool/handlers instance with a real, unmocked `addOrUpdateTeammate` write in between; first call asserts the empty state, second asserts the new member + role, and the empty-state text is gone | `integration-real-code` (real write path, real read path, no caching layer to bypass) | None — this AC is a data-freshness claim, fully provable without a live browser |
| AC4: tenant isolation — another tenant's members never appear | ✅ | `testAC4NeverIncludesAnotherTenantsMembers` — seeds a second tenant's member, asserts both substring absence AND an exact `items.length === 1` row count (strengthened during Task 2's code-quality review — see Scope Deviations) | `unit` + `integration-real-code` (real tenant-scoped JOIN query) | None — a data-scoping claim, not a visual one |
| AC5: HTML-significant characters escaped via `escHtml()` (MC-SEC-01) | ✅ | `testAC5IdentityWithHtmlCharsIsEscaped` — payload deliberately includes `<`, `>`, `&`, and `"` (strengthened during Task 2's review from an initial `<`/`>`-only payload); asserts the exact `escHtml()`-encoded output and confirms zero real `<img>` elements via jsdom parse | `unit` (DOM-structure assertion — the AC's own text specifies a test verifies this, not a live render) | None |

**Verification strength summary:** 5 unit, 3 integration-real-code (some ACs have both). Every AC has strong automated evidence, including a genuinely adversarial AC5 test (exercising all 5 HTML-significant characters `escHtml()` handles, not just the two that "look sufficient") and AC3's real before/after live-data proof. The consistent gap across AC1/AC2 (and, more weakly, AC4/AC5's visual rendering) is real-browser confirmation — not a correctness gap, a rendering-confirmation gap, RISK-ACCEPTed per CLAUDE.md's B2 rule (see NFR Status and Follow-up actions).

---

## Scope Deviations

None beyond process-discipline notes already logged. Confirmed independently by the final cross-task reviewer (dispatched before merge, reviewed the full diff `56bdbd5c..bb79365c` against all 5 ACs, grepped for any reference to `handleAddTeammate`/`team-invitations.js`/`client-invitations.js` — zero matches) and by this session's own `git log --oneline` walk of the story's 4 commits (3 tasks + 1 review-driven fix), all of which trace to the plan or a logged decisions.md finding. The one in-flight correction — Task 2's code-quality reviewer finding AC5's initial payload under-exercised `escHtml()`'s `&`/`"` handling and AC4's assertion was substring-only rather than an exact row-count check — was fixed in a follow-up commit and re-reviewed to approval before Task 3 began. This strengthened the shipped tests beyond the plan's own original spec, not a scope violation.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 planned
**Tests passing in CI:** 5 / 5 implemented (confirmed locally throughout `/subagent-execution`, by `/verify-completion`'s fresh full-suite run — 702 files, 0 unexpected failures — and by the merged PR's own CI: "PR Checks / Lint, typecheck, test, build" completed SUCCESS)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: row per real member, identity + role (unit) | ✅ | ✅ | |
| AC2: explicit empty state, form still renders (unit) | ✅ | ✅ | |
| AC4: tenant isolation, exact row count (unit) | ✅ | ✅ | strengthened during review |
| AC5: HTML-significant chars fully escaped (unit) | ✅ | ✅ | strengthened during review |
| AC3: live-data proof, real write + two reads (integration) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Route/handler E2E coverage check:** this diff touches `src/web-ui/routes/team-management.js` (a route/handler file), so `/verify-completion`'s mandatory check applied. 4 pre-existing `tests/*.js` files call `handleGetTeamMembers` directly (`check-pncg-s1-nav-coverage-functional.js`, `check-pncg-s1-nav-coverage-structural.js`, `check-sec-perf-s3-team-members-csrf.js`, `check-tmss-s1-shared-shell-migration.js`) — all confirmed passing with no regression, both at `/verify-completion` and by the final cross-task reviewer. Zero `tests/e2e/*.spec.js` files reference `/team/members` or `handleGetTeamMembers` — this predates the story (no E2E coverage existed for this route before either), so it is not a gap this story introduces.

**Additional CI evidence beyond this story's own suite:** the merged PR's CI also ran "Scenario A E2E (staging)" and "Scenario B E2E (staging)" — pre-existing, generic core-journey Playwright specs against real `wuce-staging.fly.dev` — both SUCCESS. General regression confidence (the app's existing golden paths still work post-merge); does not specifically exercise this story's new member-list/empty-state UI, so it does not substitute for the RISK-ACCEPTed live-visual check below.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ⚠️ | Test plan designates "manual timing during live validation" / "Live Chrome check on staging" as the measurement method for this story's added query (matching `rtri-s1`/`rtri-s2`'s own established pattern). That live check could not be performed — Chrome was unavailable at `/verify-completion` and remained unavailable when re-checked at this DoD (4th consecutive occurrence this session for this feature). No reason to expect a real issue (a single additional indexed JOIN, same shape as `rtri-s1`'s own already-measured query), but the designated measurement itself has not run. RISK-ACCEPT logged in decisions.md, 2026-09-26. |
| Security | ✅ | `testAC5IdentityWithHtmlCharsIsEscaped` (MC-SEC-01) directly proves safe escaping via the real `escHtml()`; tenant-scoping NFR satisfied by design — this story consumes `rtri-s1`'s already tenant-scoped `listTeamMembers` unmodified, introducing no new data-exposure surface |
| Accessibility | ⚠️ | Story NFR requires real, semantic markup (`<ul>`/`<li>`, not `<div>`-as-row) — confirmed by code reading (the shipped `handleGetTeamMembers` builds a real `<ul><li>` list). The test plan's own designated verification for this NFR is a live check at DoD (no automated axe-scan configured in this repo) — not performed, same Chrome-unavailable cause as Performance above. Structural correctness is confirmed; live rendering/screen-reader confirmation is not. RISK-ACCEPT logged in decisions.md, 2026-09-26. |
| Audit | ✅ N/A | No new write/mutation path introduced; this story is read-only, per story NFR section |

**Layout gap audit:** This story's test plan flagged the Performance and Accessibility NFRs above as requiring a live Chrome check at DoD from the outset (not a post-hoc discovery). A RISK-ACCEPT was recorded — at `/verify-completion`, immediately upon discovering Chrome remained unavailable (the same unresolved cause already tracked for `rtri-s2`/`rtri-s4` in this feature), and reconfirmed at this DoD rather than assumed unchanged. `layoutGapsAtMerge: true`, `layoutGapsRiskAccepted: true`.

---

## Metric Signal

| Metric | Measurement-ready? | Signal | Evidence note |
|--------|--------------------|--------|----------------|
| m1: Real pod membership | Not yet | `not-yet-measured` | Unaffected by this story — unchanged since `rtri-s2`'s own DoD; still awaiting a real pod-creation event through the shipped `rtri-s2` consumer. |
| m2: /team/members shows a real list | Not yet | `not-yet-measured` | This story ships the actual consumer (`/team/members` now renders `listTeamMembers`'s real output instead of just the add-teammate form). But no real production tenant has yet had this page viewed and confirmed to show a real, non-empty (or explicitly-empty) list since merge — measurement requires observing that in production, which has not yet happened (no live browser session performed this session, no time has passed in production since merge). `rtri-s3` is added to `contributingStories` for this metric — it is the consumer, not merely upstream infrastructure. |

`contributingStories` for m2 is updated from `["rtri-s1"]` to `["rtri-s1", "rtri-s3"]` — the first time this metric has had a genuine shipped consumer. Both feature metrics (m1, m2) now have real, shipped consumers as of this story's merge (`rtri-s2` for m1, `rtri-s3` for m2) — the `real-team-roster` epic's own infrastructure-to-consumer arc is complete; both baselines (0%, 0) remain unmeasured pending real post-deployment usage events, tracked as the epic's own closing follow-up.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 5 ACs are satisfied by strong automated evidence, including two deliberately strengthened adversarial tests (AC5's full-character-set escaping payload, AC4's exact row-count assertion) that exceed the plan's own original spec following a genuine code-quality-review catch. The deviations are a single consistent class — live-browser visual/timing confirmation blocked by Chrome's continued unavailability this session (now 4 consecutive occurrences across `rtri-s2`, `rtri-s4`, and twice for `rtri-s3`) — properly RISK-ACCEPTed rather than silently skipped, not a correctness gap in the shipped code.

**Follow-up actions:**
1. Next session with Chrome available: perform ONE consolidated real-browser session on `wuce-staging.fly.dev` covering all three still-open rtri-* live-check items together (already tracked in `workspace/state.json` `pendingActions`): `rtri-s4`'s real live-login re-check, `rtri-s2`'s pod-manager.html picker visual/keyboard check, and `rtri-s3`'s `/team/members` list/empty-state visual check plus its Performance/Accessibility NFR measurements. All four share the identical Chrome-unavailable root cause and can close together in one session.
2. Once a real tenant admin views `/team/members` in production after this merge, re-visit m2's signal — this is the first point since `rtri-s1` shipped that the metric has a real, observable path to move off its 0-member baseline.
3. This is the last story in the `real-team-roster` epic — no further stories remain. Consider closing the epic formally (epic `status` already recomputes to `complete` in `pipeline-state.json` once all 3 stories' tasks are committed) once this DoD write lands, and consider whether `/metric-review` or a similar retrospective pass on m1/m2 is warranted once real production usage data exists.

---

## DoD Observations

1. **The epic-nested `pipeline-state.json` merge-conflict pattern reproduced a third time, confirming it as structural rather than incidental.** `rtri-s1` (1 conflict), `rtri-s2` (1 conflict), `rtri-s3` (1 conflict) — three of the four stories in this feature hit the identical conflict shape (this branch's own progressed stage vs. master's independently-advanced snapshot of the same story), while only `rtri-s4` (deliberately never writing to its own branch's pipeline-state.json at all) avoided it entirely. Each time, the resolution was identical and mechanical: keep the branch's own strictly-newer story state. This is strong enough, repeated evidence that `rtri-s4`'s pattern (never write pipeline-state.json on the feature branch for epic-nested stories, only ever to master) is the correct one to adopt as the DEFAULT going forward for this feature shape, not a one-off optimization — an `/improve` candidate worth naming explicitly, since this session's own mid-story course-correction (switching from `rtri-s2`'s dual-track pattern to `rtri-s4`'s master-only pattern partway through `rtri-s3`) still left one conflict from the one commit made before that correction (`/implementation-plan`'s own state write, committed on the branch before the switch).
2. **The live-browser-check gap for this story was known and accepted from the moment its test plan was authored** (2026-09-24), not a late-DoD-time discovery — the same clean pattern already established for `rtri-s2`. By this story's own DoD, the underlying Chrome-unavailable cause has now been confirmed unresolved across 4 separate checks spanning `rtri-s2`, `rtri-s4`, and `rtri-s3` (twice) — worth flagging to the operator as a standing environment gap, not treating each RISK-ACCEPT as an independent, surprising event.
3. **Task 2's code-quality review catching a real test-strength gap (not just style) is a positive confirmation of the two-stage review discipline's value** — a substring-only tenant-isolation check and an under-exercised XSS payload are exactly the kind of "technically passes, doesn't really prove the claim" defect that a spec-compliance-only review pass could miss (spec compliance for AC4/AC5 only asks "does a test exist that exercises this," not "is this test's assertion strong enough to actually catch a regression"). Worth reinforcing as a standing example when explaining why code-quality review is a separate, non-optional pass.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render a real member list on /team/members" (rtri-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
