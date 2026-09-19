# Definition of Done: Restyle the Dashboard to Match DESIGN.md

**PR:** https://github.com/heymishy/skills-repo/pull/905 | **Merged:** 2026-09-19 (merge commit `4b2d0c5a`)
**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s2-dor.md (re-signed 2026-09-19 for the CRITICAL re-target)
**Assessed by:** Copilot
**Date:** 2026-09-19

---

## AC Coverage

- **AC1:** Dark-mode computed CSS custom-property values match `DESIGN.md`'s dark token table exactly
- **AC2:** Light-mode computed CSS custom-property values match `DESIGN.md`'s light token table exactly
- **AC3:** Real dashboard layout matches `DESIGN.md`'s "Dashboard/app shell" pattern for a has-products session
- **AC4:** No existing functional behavior regresses (zero-products onboarding, `?view=board` kanban route, navigation, account nav)
- **AC5:** "Waiting on you" shows real pending sign-off items via `getPendingActions`, not placeholder content
- **AC6:** "Run a skill" shows the real, static skill catalog with working session-start links
- **AC7:** Real in-progress session count and "Recent sessions" from real journey data, honest empty states
- **AC8:** Zero-products onboarding CTA preserved unchanged

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/e2e/dsa-s2-dashboard-restyle.spec.js` dark-mode token test, fresh run on merged master (`4b2d0c5a`): 8/8 file passed; also confirmed via a real live browser session against merged master today (dark mode toggled, rendered content matched the token palette visually, no unstyled elements) | live-verified | None |
| AC2 | ✅ | Same spec's light-mode token test, fresh run: passed as part of the 8/8; light mode also visually confirmed in the same live browser session (screenshot) | live-verified | None |
| AC3 | ✅ | Same spec's layout test, fresh run; live browser session today confirmed sidebar, greeting, "Run a skill" grid, and "Waiting on you"/"Recent sessions" columns all render and align correctly for a has-products session with real product `dsa-s2 DoD check` | live-verified | AC3's own wording says "224px sidebar"/"max-width 1080px content" — the real, current CSS values are 220px/1040px. Test asserts the real values deliberately. RISK-ACCEPTed at delivery time — see `decisions.md`. |
| AC4 | ✅ | `tests/e2e/psh-s4-dashboard-layout.spec.js` + `tests/e2e/b1-nav-toggle.spec.js`, fresh run on merged master: 3/3 passed. 79 pre-existing Node check-scripts touching `routes/products.js`/`handleGetDashboard`/`_renderProductDashboard`: 79/79 passed (run during `/verify-completion`). Live browser session today additionally confirmed the zero-products onboarding path renders correctly on merged master (unchanged CTA copy/behavior) | live-verified | None |
| AC5 | ✅ | Same E2E spec's pending-actions test, fresh run; live browser session today: seeded one real pending item via `/test/seed-pending-action` and confirmed it rendered as "Sign off discovery — dsa-s2-dod-check · 2d ago" in the "Waiting on you" column, with the "1 things waiting" greeting count matching | live-verified | None |
| AC6 | ✅ | Same spec's skill-catalog test, fresh run; live browser session today confirmed all 6 real skill cards (Discovery, Definition, Test plan, Implementation plan, Definition of ready, Review) render with real name/description/estimate and a working `Start →` link | live-verified | None |
| AC7 | ✅ | Same spec's two journey-data tests (populated + empty state), fresh run; live browser session today: seeded a real completed journey stage via `/test/seed-approval-journey`, confirmed "2 in-progress sessions" and a real "Recent sessions" entry ("discovery — dsa-s2-dod-journey · today · done") rendered, not a placeholder | live-verified | None |
| AC8 | ✅ | Same spec's zero-products test, fresh run; live browser session today confirmed the "No products yet" / "Create your first product →" CTA renders unchanged on a genuinely zero-product tenant, with none of the new mock content present | live-verified | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. The one deviation recorded (AC3's wording-vs-real-value gap) is an operator-reviewed RISK-ACCEPT, not an unrecorded gap.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list: no other of the 3 remaining real screens were touched (landing/skill-session chat have their own stories; artefact viewer was `dsa-s1`); the stale/dead nav links tracked in `web-ui-experience-redesign` Epic B were not touched; the `design.system` DoR governance mechanism (`dsa-s5`) was not built; `renderShell`'s sidebar was not rebuilt; no new "reviewed"/richer status taxonomy was added beyond "done"; `getPendingActions`'s cross-tenant/cross-repo filtering logic itself was not modified (only test seams were added around it); the static skills catalog was not made dynamically configurable; `routes/dashboard.js`'s dead route-wiring (`handleDashboard`, the `renderDashboard({...})` call site, `_DASHBOARD_SKILLS_CATALOG`'s original definition) was left untouched — only its 3 reusable data-wiring functions were exported for reuse, not the dead route itself; no other function in `routes/products.js` was touched; the zero-products onboarding CTA's copy/styling/behavior is unchanged beyond the shared max-width wrapper needed for AC3's layout consistency.

---

## Test Plan Coverage

**Tests from plan implemented:** 22 real assertions across the dsa-s2-specific suite (the test plan's own tracked total of 18 was set before Task 3's E2E suite reached its final 8-scenario shape; no coverage was dropped, the real count is higher, mirroring `dsa-s1`'s own DoD precedent of reporting the real total rather than forcing it to match a stale planning-time figure).
**Tests passing in CI:** all passing — independently re-run fresh against merged master (`4b2d0c5a`) in this session:
- `node tests/check-dsa-s2-dashboard-wiring.js` → 4/4 pass
- `node tests/check-dsa-s2-pending-actions-mapping.js` → 2/2 pass
- `node tests/check-dsa-s2-journey-derivation.js` → 5/5 pass
- `node tests/check-dsa-s2-product-dashboard-wiring.js` → 3/3 pass
- `NODE_ENV=test npx playwright test tests/e2e/dsa-s2-dashboard-restyle.spec.js` → 8/8 pass
- `NODE_ENV=test npx playwright test tests/e2e/psh-s4-dashboard-layout.spec.js tests/e2e/b1-nav-toggle.spec.js` → 3/3 pass
- Full `npm test` on merged master: 683 files, 2 failed — `tests/check-p3.5-validate-trace.js` (already-documented pre-existing failure, confirmed again this session: `validate-trace.ps1 --ci` exits 1 in this environment, unrelated to dsa-s2) and `tests/check-pcr-s1-test-runner.js` (passes standalone — `node tests/check-pcr-s1-test-runner.js` → 14/14 OK — confirmed as orchestrator-level test-order flakiness, not a real failure; `dsa-s2`'s merge commit touches zero files related to `pcr-s1`, and CI's own "Lint, typecheck, test, build" job, which runs this same suite, passed on PR #905)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Pending-actions mapping unit tests (AC5) | ✅ | ✅ | |
| Journey-derivation unit tests (AC7) | ✅ | ✅ | Includes the `_formatCompletedAgo` 24h-boundary test, empirically proven non-vacuous during Task 2's own delivery |
| Dashboard-wiring integration tests (AC3/AC6) | ✅ | ✅ | |
| Product-dashboard-wiring integration test (AC5/AC7, real data through the real route) | ✅ | ✅ | Empirically proven non-vacuous: reverted to Task 1's placeholder code, confirmed the test fails with the expected assertion message, restored |
| E2E suite (AC1-AC3, AC5-AC8) | ✅ | ✅ | AC4 deliberately excluded from this file per the story's own wording — covered by re-running pre-existing specs instead |

**Gaps (tests not implemented):** None blocking.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no measurable page-load regression on the real, live `/dashboard` route | ⚠️ Not independently measured | The real `getPendingActions`/`listJourneys` calls this story adds are additive load on an already-real-user-facing route (confirmed via code read, not a load test). No before/after page-load timing was captured, live or synthetic. This is `integration-real-code`-level evidence for a claim that is actually about a real-world effect (page load time) — per this skill's own verification-strength rule, not sufficient to mark ✅ outright. **Follow-up Action:** a post-deployment page-load smoke check (e.g. browser DevTools Network tab timing, or a synthetic Lighthouse run) against the real, deployed `/dashboard` route. |
| Security: tenant-filter correctness preserved when the journey-tenant filter was ported to `products.js` | ✅ | `!(j.tenantId && j.tenantId !== tenantId)` confirmed byte-exact (not the earlier-caught strict-`===` bug) in Task 2's own code-quality review, verified against real in-memory `journey-store.js` fixtures (same-tenant / other-tenant / untagged-legacy combinations) — `integration-real-code`, real unmocked store logic exercised directly |
| Accessibility: WCAG 2.1 AA — no regression to existing accessibility properties | ⚠️ Deviation found, not a regression this story caused, but a real newly-surfaced gap | Live browser inspection today (and direct read of `src/web-ui/views/dashboard-view.js`) found the "Waiting on you" and "Recent sessions" list items (`.sw-list-main` divs, with a decorative `→` arrow suggesting clickability) are plain, non-interactive `<div>`s — no `<a href>`, no `tabindex`, no keyboard focus target at all, despite the visual affordance. This markup is unchanged from `dashboard.js`'s original `renderDashboard` template (dsa-s2 did not modify it — only wired real data around it), so it is not a regression this story introduced. It IS, however, now live on the platform's primary landing page for real users for the first time (this exact markup was previously dead code, since `routes/dashboard.js` was never actually dispatched to). **Follow-up Action:** wrap `.sw-list-main`/its parent `<li>` in a real `<a>` (or add `role="link"`/`tabindex="0"` + a keydown handler) for both "Waiting on you" and "Recent sessions" items, matching the real keyboard-accessibility bar already established elsewhere in this same feature (e.g. `renderFleetPanel`'s own real `<a>`-element cards, confirmed via this repo's own `check-pipeline-viz*` test suite). |
| Audit: none identified | ✅ N/A | Story's own NFR section states "None identified" — confirmed, no audit-logging requirement applies to a read-only dashboard render |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1: Visual consistency across the 4 real screens (target 4/4) | ✅ (baseline: 0 of 4) | Not yet — 2 of 4 screens (artefact viewer via `dsa-s1`, dashboard via `dsa-s2`) now match `DESIGN.md`'s token values; `dsa-s3`/`dsa-s4` (landing, skill-session) still need to ship before the 4/4 target is reachable. Signal: `not-yet-measured`. Evidence note: dsa-s2 (dashboard) merged and verified this session; 2 of 4 screens remain. |
| m3: Beta user feedback on visual quality | ❌ (baseline: not yet established) | Not yet — no beta user has seen the restyled dashboard yet (just merged). Signal: `not-yet-measured`. Evidence note: screen shipped and verified in this session; awaiting real beta-user exposure and feedback. |

m2 (design.system DoR gate) has no contribution from this story — it belongs to `dsa-s5`, not yet delivered. `dsa-s2` added to both m1's and m3's `contributingStories` arrays (state update below).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 8 ACs satisfied with `live-verified` evidence — every AC was confirmed via a fresh, real E2E/Playwright run against merged master in this session, plus a real manual live-browser session against merged master today (both light and dark mode; zero-products and has-products branches; real seeded pending-action and journey data, not placeholders) — closing the residual live-browser-check gap that was RISK-ACCEPTed at `/verify-completion` time (the Claude-in-Chrome extension was disconnected then; it reconnected before this DoD run). Two deviations recorded: AC3's wording-vs-real-CSS-value gap (already RISK-ACCEPTed pre-merge) and a newly-surfaced (not newly-introduced) keyboard-accessibility gap on the "Waiting on you"/"Recent sessions" list items, inherited unchanged from dead code that is now live for the first time. Zero scope violations. Zero blocking test gaps. Two non-blocking, unrelated local test-run observations recorded above (a documented pre-existing `validate-trace.ps1` failure, and one orchestrator-level flake that passes standalone and is unrelated to this story's diff).

**Follow-up actions:**
1. A post-deployment page-load smoke check against the real, deployed `/dashboard` route (Performance NFR) — no owner assigned, recommended before or shortly after this ships to real beta users.
2. Make the "Waiting on you"/"Recent sessions" list items real keyboard-focusable links (Accessibility NFR gap) — candidate fix: wrap in `<a>` or add `role="link"`/`tabindex`, matching this repo's own `renderFleetPanel` precedent. No owner assigned; recommended as a short-track follow-up story.
3. `dsa-s3`/`dsa-s4` still need their own `/implementation-plan` + `/subagent-execution` passes to reach m1's 4/4 target.
4. (Carried from `dsa-s1`'s own DoD, unaddressed by this story, still open): a new story for the mock's full multi-reviewer sign-off roster and threaded comments; a short-track fix for `bcf-s1`'s dark-mode WCAG AA contrast gap.
5. Product-design question raised by the operator during this DoD (not story-blocking, a genuine open question for a future story): is it practical for the "Run a skill" launcher to offer a blank "Start →" for skills that require existing context to operate on (`/review`, `/definition-of-ready`, `/implementation-plan`, `/reverse-engineer` — which needs a target repo) the same way it does for entry-point skills (`/discovery`, `/ideate`)? Candidate direction: split the static catalog into "start fresh" vs. "resume on X" categories, with the latter reached from a story/feature's own context rather than a blank dashboard tile. The catalog itself (`_DASHBOARD_SKILLS_CATALOG`) was explicitly out of scope for `dsa-s2` (restyle only) — this is a new product-scoping question for a future story, not a defect in what shipped.

---

## DoD Observations

1. **The live browser render check closed a real, meaningful evidence gap.** `/verify-completion` had RISK-ACCEPTed the final-integrated-state live check due to a mid-session browser-extension disconnect; this DoD run reconnected and performed it for real, against merged master, with real seeded data (not the placeholder `0`/`[]` values Task 1 shipped with). This both confirmed the AC evidence at full `live-verified` strength and surfaced the keyboard-accessibility gap recorded above — a gap that no automated test in this story's own suite was written to catch, since none of them assert on interactivity/focusability of the list items, only their text content. `/improve` candidate: consider whether this repo's own E2E convention should include at least one keyboard-navigation assertion per new interactive-looking list/card component, not just content-presence assertions.
2. **A pre-existing, unrelated bug was discovered and fixed as a prerequisite to this story's own merge**, not as part of its own scope: `.github/pipeline-state.json`'s `2026-09-18-new` feature entry (a leaked `@mocked` E2E test fixture) was missing 3 schema-required fields, failing trace-validation CI on every open PR against master — not just this one. Fixed via a dedicated PR (#906, merged first), then merged into `feature/dsa-s2` to unblock its own CI. Recorded here since it happened during this story's own delivery window and materially affected its path to merge, though it is not a `dsa-s2` defect.
3. **This story's own mid-delivery CRITICAL re-target** (the entire original implementation target, `routes/dashboard.js`, was confirmed dead code — see `decisions.md`'s dedicated entry) is the dominant fact of this story's delivery history and is not re-litigated here; this DoD assesses only the final, re-targeted, merged implementation against the story's current (re-amended) ACs.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for dsa-s2 (Restyle the Dashboard to Match DESIGN.md).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
