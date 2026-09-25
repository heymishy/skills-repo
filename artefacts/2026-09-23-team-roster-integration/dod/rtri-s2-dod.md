# Definition of Done: Wire pod-manager.html's member picker to the real roster

**PR:** https://github.com/heymishy/skills-repo/pull/922 | **Merged:** 2026-09-25 (commit `c2d660b0`)
**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: "Available" roster shows real members, no pod-role chip until assigned | ✅ | `testAC1RealIdentitiesNoRoleChip` — real fetched identities rendered, no role chip present | `unit` (jsdom DOM assertion) | Visual/layout confirmation in a real browser RISK-ACCEPTed — Chrome unavailable both at `/verify-completion` and again re-checked at this DoD (still not connected). See decisions.md, 2026-09-25. |
| AC2: Real identity + selected pod role land in `pod_members` | ✅ | `testAC2SavesRealIdentitiesAndSelectedRoles` — dispatches the real, unmodified `handlePostPodsCreate` and inspects the fake pool's `pod_members` rows directly; deliberately proves the selector's value (not the roster response's `role`) is what's written | `integration-real-code` (real handler, real write path, direct row inspection — equivalent to "direct query" per AC text) | None — this AC is a data-correctness claim, not a visual one; no live browser needed to verify it |
| AC3: Zero-member tenant renders an empty roster, not an error/fake names | ✅ | `testAC3ZeroMembersEmptyNoError` | `unit` (jsdom DOM assertion) | Same live-visual RISK-ACCEPT as AC1 |
| AC4: Real members flow through unchanged to `feature_collaborators` via `ep4-s1` | ✅ | `testAC4FlowsIntoFeatureCollaboratorsUnchanged` — calls `ep4-s1`'s real, unmodified `populateFeatureCollaboratorsFromPods` directly; `git diff --stat` across the full story diff confirms zero lines changed in `feature-collaborator-store.js` or `pod-assignment-store.js` | `integration-real-code` | None |
| AC5: Search still works with real identities; role-tabs hidden for "Available", never throws | ✅ | `testAC5RoleTabsHiddenNoThrow`, `testAC5SearchFiltersRealIdentities` | `unit` + `integration-real-code` | Same live-visual RISK-ACCEPT as AC1 for the "hidden" visual outcome specifically |
| AC6: Real identity strings rendered via safe DOM construction (MC-SEC-01) | ✅ | `testAC6PayloadIdentityNeverInterpretedAsMarkup` — deliberately malicious `<img src=x onerror=alert(1)>` payload asserted to produce zero injected elements | `unit` (DOM-structure assertion — the AC's own text specifies a test verifies this, not a live render) | None |
| AC7: Pod-role selector presented at add-time; selected value (never the roster response's role) is written | ✅ | `testAC7SelectorConfirmedValueUsedNotRosterRole` (adversarially seeds `role: 'admin'` in the roster fixture and asserts the written `role_id` is the selector's own value, not `'admin'`), `testAC7CancelDoesNotAddMember` | `unit` | Live visual confirmation that the `<select>` actually renders/is usable at a normal viewport, and the native-control keyboard-accessibility pass called for in the NFR profile, are both RISK-ACCEPTed — see NFR Status below |

**Verification strength summary:** 7 unit, 4 integration-real-code (some ACs have evidence in both classes). Every AC has automated evidence proving the underlying logic is correct, including two deliberately adversarial tests (AC6's XSS payload, AC7's role-vocabulary mismatch). The one consistent gap across AC1/AC3/AC5/AC7 is real-browser visual confirmation — not a correctness gap, a rendering-confirmation gap, RISK-ACCEPTed per CLAUDE.md's B2 rule (see NFR Status and Follow-up actions).

---

## Scope Deviations

None. Confirmed independently by the final cross-task reviewer (dispatched before merge, reviewed the full diff `99ca996f..d3b83cf2` against all 7 ACs) and by this session's own `git log --oneline` walk of the 7 story commits — every commit traces to a task in the implementation plan or a decisions.md-logged finding. Two notable in-flight corrections are recorded in decisions.md rather than being silent: an unauthorized `renderTeam()` change was caught and reverted before any reviewer saw it, and a genuine bug in this session's own AC7 cancel-test assertion was found and fixed (both are process-discipline notes, not scope deviations in the shipped code).

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 planned
**Tests passing in CI:** 9 / 9 implemented (confirmed locally throughout `/subagent-execution`, by `/verify-completion`'s fresh full-suite run — 701 files, 0 unexpected failures — and by the merged PR's own CI: "PR Checks / Lint, typecheck, test, build" completed SUCCESS)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: real identities rendered, no role chip (unit) | ✅ | ✅ | |
| AC1/AC5: role-tabs hidden, no throw (unit) | ✅ | ✅ | |
| AC3: zero-member roster empty, no error (unit) | ✅ | ✅ | |
| AC6: XSS payload never interpreted as markup (unit) | ✅ | ✅ | |
| AC7: selector's own value written, not roster's role (unit) | ✅ | ✅ | |
| AC7: cancel does not add member (unit) | ✅ | ✅ | |
| AC2: save writes real identities + selected roles (integration) | ✅ | ✅ | |
| AC4: flows into feature_collaborators unchanged (integration) | ✅ | ✅ | |
| AC5: search filters real identities (integration) | ✅ | ✅ | |

**Gaps (tests not implemented):** None. The one test-plan-identified gap at authoring time (AC5's exact role-tab-filter treatment not pinned down) was closed during `/implementation-plan` — role-tabs are hidden, and `testAC5RoleTabsHiddenNoThrow` asserts that specific treatment.

**Route/handler E2E coverage check:** N/A — the diff touches only `pod-manager.html` (a static client-served page) and its own test file; no `src/web-ui/routes/` file was added, wired, or modified.

**Additional CI evidence beyond this story's own suite:** the merged PR's CI also ran "Scenario A E2E (staging)" and "Scenario B E2E (staging)" — pre-existing, generic core-journey Playwright specs against real `wuce-staging.fly.dev` — both SUCCESS. These are general regression confidence (the app's existing golden paths still work post-merge); they do not specifically exercise this story's new roster-fetch/role-selector UI, so they do not substitute for the RISK-ACCEPTed live-visual check below.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ⚠️ | Test plan designates "manual timing during live validation" / "Live Chrome check on staging" as the measurement method for this specific story (unlike `rtri-s1`'s comparable NFR, which used an established RISK-ACCEPT pattern from the start). That live check could not be performed — Chrome was unavailable at `/verify-completion` and remained unavailable when re-checked at this DoD. No reason to expect a real issue (the fetch is a single indexed query, same shape as `rtri-s1`'s own already-measured endpoint), but the designated measurement itself has not run. RISK-ACCEPT logged in decisions.md, 2026-09-25. |
| Security | ✅ | `testAC6PayloadIdentityNeverInterpretedAsMarkup` (MC-SEC-01) directly proves safe DOM construction; tenant-scoping NFR is satisfied by design — this story consumes `rtri-s1`'s already tenant-scoped endpoint unmodified, introducing no new data-exposure surface (confirmed by `git diff --stat`: no route/handler file touched) |
| Accessibility | ⚠️ | Story NFR requires a native, labelled `<select>` (not a custom widget) — confirmed by code reading (`showRoleSelector` builds a real `<label for=...><select id=...>`). The test plan's own designated verification for this NFR is a live keyboard-only pass in a real browser at DoD — not performed, same Chrome-unavailable cause as Performance above. Structural correctness is confirmed; live keyboard-operability is not. RISK-ACCEPT logged in decisions.md, 2026-09-25. |
| Audit | ✅ N/A | No new write/mutation path introduced; pod creation's own existing (unaudited) behaviour is unchanged, per story NFR section |

**Layout gap audit:** This story's test plan flagged the Performance and Accessibility NFRs above as requiring a live Chrome check at DoD from the outset (not a post-hoc discovery). A RISK-ACCEPT was recorded — at `/verify-completion`, immediately upon discovering Chrome was unavailable, rather than pre-emptively before coding started, since the live-check requirement was already known and accepted as a planned DoD-time step. `layoutGapsAtMerge: true`, `layoutGapsRiskAccepted: true`.

---

## Metric Signal

| Metric | Measurement-ready? | Signal | Evidence note |
|--------|--------------------|--------|----------------|
| m1: Real pod membership | Not yet | `not-yet-measured` | This story ships the actual consumer (`pod-manager.html`'s picker now writes real identities to `pod_members` on save) — the data-completeness blocker `rtri-s1`/`rtri-s4` removed is now exercised by real code. But no real pod has yet been created through this shipped feature in a live tenant since merge — measurement requires observing real `pod_members` rows created after this release, which has not yet happened (no live browser session performed this session, and no time has passed in production since merge). `rtri-s2` is added to `contributingStories` for this metric — it is the consumer, not merely upstream infrastructure. |
| m2: /team/members shows a real list | Not yet | `not-yet-measured` | Unaffected by this story — `rtri-s2` is `pod-manager.html`'s picker, not the `/team/members` page. `rtri-s3` remains the sole consumer for this metric; `contributingStories` unchanged. |

`contributingStories` for m1 is updated from `["rtri-s1"]` to `["rtri-s1", "rtri-s2"]` — the first time this metric has had a genuine shipped consumer, not just upstream infrastructure. Baseline (0%) remains unmeasured pending a real post-deployment pod-creation event, which is also what the Follow-up actions below will close.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 7 ACs are satisfied by strong, in some cases deliberately adversarial, automated evidence. The deviations are a single consistent class — live-browser visual/keyboard confirmation blocked by Chrome's unavailability this session — properly RISK-ACCEPTed rather than silently skipped, not a correctness gap in the shipped code.

**Follow-up actions:**
1. Next session with Chrome available: perform the real live-visual check on `wuce-staging.fly.dev` deferred by this session's RISK-ACCEPT (decisions.md, 2026-09-25) — open "Create Pod", confirm the real roster renders correctly, add a member and confirm the pod-role `<select>` is visible/usable and keyboard-operable, confirm role-tabs are genuinely hidden (not just `display:none` in markup but actually absent from the rendered layout). This single check closes both the Performance NFR's live-timing measurement (observe no perceptible delay) and the Accessibility NFR's keyboard-operability pass, alongside the AC1/AC3/AC5/AC7 visual confirmations. Already tracked in `workspace/state.json` `pendingActions` (2026-09-25 entry).
2. Once a real pod is created through this shipped feature in production, re-visit m1's signal — this is the first point since `rtri-s1` shipped that the metric has a real, observable path to move off its 0% baseline.
3. `rtri-s3` (`/team/members` real list rendering) remains the last story in the `real-team-roster` epic — starting it makes m2 genuinely measurable for the first time.

---

## DoD Observations

1. **This story's own bookkeeping surfaced a real instance of the epic-nested `pipeline-state.json` merge-conflict pattern** — unlike `rtri-s4` (zero conflicts, no state ever written on that branch), `rtri-s2`'s branch accumulated its own local state writes (`/subagent-execution`'s per-task writes, `/verify-completion`, `/branch-complete`) while master independently advanced the same story's bookkeeping via direct-to-master writes from the same session working in a different checkout. The PR sat with zero CI dispatch (`mergeStateStatus: CONFLICTING`) until this was found and resolved by merging `origin/master` into the branch and keeping the branch's strictly-newer story state. Confirms the B2 rule's own warning is not theoretical — it reproduced within a single session, not just across sessions.
2. **The live-browser-check gap for this story was known and accepted, not discovered late** — the test plan named "Live Chrome check on staging" as the designated measurement method for two NFRs from the moment it was authored (2026-09-24), before Chrome's unavailability was known. This is a cleaner instance of the RISK-ACCEPT pattern than `rtri-s4`'s (where the gap was a late-DoD-time discovery) — the gap was pre-identified, and the RISK-ACCEPT simply confirms it could not be closed this session as originally intended.
3. **The two in-session test-authoring bugs caught during `/subagent-execution`** (the AC7 cancel-test's wrong `count===0` expectation, and Task 3's DOM-sequencing assumption) were both this session's own plan-authoring defects, not implementer errors — both were caught by reading real diffs directly rather than trusting subagent self-reports, and both are fully resolved with no residue in the final shipped code (independently confirmed by the final cross-task reviewer). Reinforces this session's established discipline: independent verification catches errors in the verifier's own prior work, not only in what it's reviewing.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire pod-manager.html's member picker to the real roster" (rtri-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
