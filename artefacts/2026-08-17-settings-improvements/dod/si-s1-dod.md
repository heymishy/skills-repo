# Definition of Done: Relocate the theme toggle into Settings

**PR:** https://github.com/heymishy/skills-repo/pull/749 | **Merged:** 2026-08-17
**Story:** artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
**Test plan:** artefacts/2026-08-17-settings-improvements/test-plans/si-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-17-settings-improvements/dor/si-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: toggle visible in Profile tab panel | ✅ | `rendersThemeToggleInProfileTab` in `check-si-s1-theme-toggle-relocation.js` | Automated test, re-run fresh on current master 2026-08-17 | None |
| AC2: click flips `data-theme` via existing `swToggleTheme()`, same `localStorage` key | ✅ | `themeToggleClickFlipsDataThemeAndLocalStorage` | Automated test, re-run fresh 2026-08-17 | None |
| AC3: toggle exists in exactly one location, not also in topbar | ✅ | `themeToggleExistsInExactlyOneLocation` | Automated test, re-run fresh 2026-08-17 | None |
| AC4: click fires a new PostHog event | ✅ | `themeToggleClickFiresPostHogEvent` | Automated test, re-run fresh 2026-08-17 | See Scope Deviations — implemented via a new server route, not in the original DoR contract's touch-point list |

6/6 tests re-run fresh on current master (post-merge, post-si-s2-merge). Two adjacent regression suites also re-run clean: `check-nia-s1-nav-icon-affordance.js` (4/4 — asserts the toggle's relocation doesn't break the sign-out-icon-affordance story's own assertions) and `check-c2-billing-tab.js` (11/11 — confirms si-s1's merge conflict resolution against si-s2 didn't regress the Billing tab).

Live-verified on `wuce-staging.fly.dev` 2026-08-17 (Chrome, signed in via GitHub OAuth): the relocated theme toggle ("Appearance" section) is visibly present and functional on the Profile tab.

---

## Scope Deviations

**One documented, reasoned deviation:** AC4 (PostHog click-rate capture) required a new `POST /settings/theme-toggle-clicked` route in `server.js`, which the DoR contract's "Estimated touch points" explicitly listed as "Services: none. APIs: none." The coding agent flagged this as an ambiguity rather than silently implementing it or silently skipping AC4 — logged in `decisions.md` (2026-08-17, ARCH) with the reasoning: every existing `_posthog.capture()` call site in this codebase fires inside a server-side handler already reached by a network call the client makes for its own primary purpose; the theme toggle's instant, no-reload click has no such existing call, so satisfying AC4 with the real, testable, server-side capture convention (rather than adding a new client-side PostHog script tag, which the NFR profile explicitly prohibits) required a small new route. This is a reasoned resolution of a genuine DoR-contract/AC conflict, not an unauthorized scope expansion.

**Second deviation, arising from concurrent delivery:** si-s1's branch was created before si-s2 merged, and both stories independently modified `settings.js`'s `renderProfileTab`/`handleGetSettings` and `server.js`'s route table. GitHub reported PR #749 as `CONFLICTING` after si-s2 merged. Resolved by merging `origin/master` into si-s1's branch and combining both features' additions (kept both new routes, both new UI sections, deduped one redundant `require('../modules/posthog-server')` import) — verified via a fresh local test run of both si-s1's and si-s2's own test suites (6/6 and 10/10) before pushing the resolved merge. `git show --stat` on the final merge commit confirms exactly the expected files were touched, no unrelated changes.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5 (plus 1 bonus server-wiring test not in the original plan)
**Tests passing in CI:** 6/6

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (toggle in Profile tab) | ✅ | ✅ | |
| AC2 (click flips theme, localStorage) | ✅ | ✅ | |
| AC3 (exactly one location) | ✅ | ✅ | |
| AC4 (PostHog event) | ✅ | ✅ | |
| NFR (accessibility attributes retained) | ✅ | ✅ | |
| Bonus: server.js wiring | ✅ (not in original plan) | ✅ | Added during implementation to directly assert the new route registration, beyond what the plan required |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no measurable page-load impact | ✅ | Relocation reuses existing markup/logic; AC4's new capture call is a fire-and-forget `fetch()`, not a new page-load-blocking dependency |
| Security: none identified | ✅ | No user-supplied content involved |
| Accessibility: `aria-label`/`:focus-visible` retained | ✅ | NFR test `themeToggleRetainsAccessibilityAttributes`, re-run fresh, passing |
| Audit: none identified | ✅ | Not applicable — low-sensitivity UI relocation |

---

## Metric Signal

**Theme toggle relocation — no usage regression (m2)**
Signal: not-yet-measured
Evidence note: The benefit-metric artefact called for a 2-week baseline capture window on the topbar toggle's click rate before relocating it — that baseline was not captured before this story shipped (the story moved straight to relocation). This is a genuine gap in the metric's own measurement design, not a delivery defect: the new click event now fires correctly (AC4, tested), so post-relocation data collection starts from merge, but there is no pre-relocation baseline to compare it against. Flagged as a DoD Observation below.
Date measured: null

**Original beta-reported friction resolved (m3)**
Signal: not-yet-measured
Evidence note: This metric requires all 3 stories in this feature (si-s1, si-s2, si-s3) plus a follow-up confirmation from the reporting beta user. si-s1 alone (theme relocation) is one of the 3 asks; si-s2 is merged; si-s3 is still open (AC3 pending operator manual review). Cannot be measured until all 3 land and the beta-user follow-up happens.
Date measured: null

`contributingStories` for m2 and m3 updated to include `si-s1` (see State update below) — these arrays were empty since `/definition`, a gap now corrected.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: Hamish King] No pre-relocation baseline exists for the theme-toggle click-rate metric (m2) — the 20%-of-baseline target cannot be evaluated. Consider whether m2's target needs revising to an absolute floor (e.g. "non-zero and stable click rate over first 2 weeks post-relocation") instead, since the comparative baseline this metric was designed around no longer exists.
- [Owner: Hamish King] Confirm the AC4 server-route deviation (see Scope Deviations) is acceptable as a permanent pattern, or note it for `/improve` as a case where DoR contracts should more explicitly anticipate analytics-capture touch points.

---

## DoD Observations

1. **Direct, traceable delivery**: story → review (1 run, clean) → test-plan → DoR (all hard blocks pass) → implementation → merge, all within one session, with one real DoR-contract/AC conflict caught and resolved transparently by the coding agent (logged, not silently implemented or silently skipped) rather than left for a human to discover later.
2. **Real merge-conflict resolution, correctly handled**: si-s1 and si-s2 both modified the same shared functions concurrently. This was caught (GitHub's `CONFLICTING` status), root-caused correctly (two features adding non-overlapping-in-intent-but-overlapping-in-location code), and resolved by union (keep both), verified by running BOTH stories' test suites locally before pushing — not just checking for the absence of conflict markers. **/improve candidate**: this repo's own established pattern for `pipeline-state.json`/`decisions.md` merge conflicts (union-of-both-sides) extends naturally to real application-code conflicts between concurrently-dispatched sibling stories in the same epic; worth naming as an explicit pattern in `architecture-guardrails.md`'s Approved Patterns if this recurs.
3. **A real metric-design gap surfaced at DoD, not before**: m2's target ("within 20% of pre-relocation baseline") assumed a baseline-capture step that never actually happened before this story shipped. This wasn't caught at `/benefit-metric`, `/definition`, or `/review` — only became visible now that there's no baseline to measure against. **/improve candidate**: `/benefit-metric` or `/definition`'s scope-accumulator step could check whether a metric's own stated measurement method (e.g. "2-week baseline capture window before X") is actually schedulable given the story sequencing, and flag it if the baseline-dependent story ships before the baseline window could have run.
4. **`contributingStories` arrays were left empty since `/definition`** despite the skill's own instruction to populate them once story slugs are known — a real, if minor, process gap corrected at DoD time rather than left indefinitely empty.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for si-s1 (theme toggle relocation).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
