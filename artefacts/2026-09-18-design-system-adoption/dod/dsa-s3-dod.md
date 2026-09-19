# Definition of Done: Restyle the Landing Page to Match DESIGN.md

**PR:** https://github.com/heymishy/skills-repo/pull/908 | **Merged:** 2026-09-19 (merge commit `a829dcce`)
**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s3-dor.md (re-signed 2026-09-19 for the AC5 mobile-responsiveness amendment)
**Assessed by:** Copilot
**Date:** 2026-09-19

---

## AC Coverage

- **AC1:** Dark-mode computed CSS custom-property values match `DESIGN.md`'s dark token table exactly
- **AC2:** Light-mode computed CSS custom-property values match `DESIGN.md`'s light token table exactly
- **AC3:** Landing page layout matches `DESIGN.md`'s "Marketing/landing" pattern (centered hero, full-bleed sections, mock structure)
- **AC4:** No existing functional behavior regresses
- **AC5 (new, FEATURE-WIDE mobile-responsiveness requirement):** Real mobile-viewport check — no horizontal overflow at 375px/390px, single-column hero/copy, screenshot frames scale rather than clip

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/e2e/dsa-s3-landing-restyle.spec.js` dark-mode token test, fresh run on merged master (`a829dcce`): 15/15 file passed | live-verified | None |
| AC2 | ✅ | Same spec's light-mode token test, fresh run: passed as part of the 15/15 | live-verified | None |
| AC3 | ✅ | Same spec's layout test, fresh run; structural assertions (centered 900px hero, 1120px full-bleed sections, 2-up hero-card grid) | live-verified | The mock's "Product in action" browser-chrome/screenshot section is deliberately omitted — it depends on demo assets (`sc-for`/`image-slot`) this codebase has no real equivalent for. Documented explicitly in the implementer's own commit message and the spec file's header comment, not a silent gap. RISK-ACCEPTed at delivery time — see `decisions.md`. |
| AC4 | ✅ | 9 pre-existing Node check-scripts + 5 pre-existing E2E spec files (`lphf-s1` through `s5`, 10 test cases), fresh run on merged master: all pass. Plus a real, post-merge regression found and fixed: `a3-product-feature-ideate-canvas.spec.js`'s AC1 (a `@real-staging`-only spec from a different, already-shipped feature) broke because `dsa-s2`'s own dashboard restyle removed the product name from `<main>` — this surfaced only in CI's real-staging job (invisible to any local verification, per `ADR-018`), was traced to its true root cause (not dismissed as flakiness), and fixed by pointing the assertion at the sidebar instead. Confirmed fixed via a clean re-run of "Scenario A E2E (staging)" against the corrected code, post-merge to master and re-merged into this story's branch before its own merge. | live-verified | None remaining — the one regression found was fixed and independently re-confirmed via real CI before this story's own merge. |
| AC5 | ✅ | Same spec's two mobile-viewport tests (375px/390px), fresh run: passed. Real overflow bugs were found and fixed empirically during implementation (a long SHA-256 hash forcing overflow, header actions not fitting at 320px) — not just claimed clean. | live-verified | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. The one deviation recorded (AC3's "Product in action" section omission) is an operator-reviewable, explicitly-documented scope decision permitted by the plan itself, not an unrecorded gap.

---

## Scope Deviations

None beyond the story's own already-amended scope (AC5 was added mid-delivery for the FEATURE-WIDE mobile-responsiveness requirement, amended and re-reviewed before implementation began — not a post-hoc deviation). Confirmed against the story's Out of Scope list: no other of the 3 remaining real screens were touched; marketing copy was not rewritten (only its visual presentation); the `design.system` DoR governance mechanism (`dsa-s5`) was not built. One file beyond the plan's original 2-file Task 1 scope was touched — `src/web-ui/routes/public.js` — a narrow, one-line fix for the real PostHog click-tracking regression the restyle introduced (see AC4 evidence above and `decisions.md`), not unrelated scope creep. A second, post-merge fix touched a file belonging to an entirely different, already-completed feature (`tests/e2e/a3-product-feature-ideate-canvas.spec.js`, from `2026-07-23-e2e-core-journey-coverage`) — logged in this feature's own `decisions.md` since the root cause was `dsa-s2`'s own restyle, with full traceability to why a file outside this feature's own scope needed a fix.

---

## Test Plan Coverage

**Tests from plan implemented:** 7/7 planned (5 new E2E scenarios in `dsa-s3-landing-restyle.spec.js` + the corrected 9-Node/5-E2E AC4 regression-suite reference) — plus 1 additional regression test added during Task 1's own code-quality review remediation (the PostHog selector-scoping assertion in `check-rpiw-s1-real-route-posthog-wiring.js`), and 1 further fix (not a new test, a corrected assertion) in the post-merge `a3` regression fix.
**Tests passing in CI:** all passing — independently re-run fresh against merged master (`a829dcce`) in this session:
- 9 Node check-scripts (`check-lab-s1.2-landing-page.js`, `check-lphf-s1` through `s5`, `check-ccrh-s1-real-instruction-hash.js`, `check-lccf-s1-fail-open-learnings-count.js`, `check-rpiw-s1-real-route-posthog-wiring.js`) → all pass
- `NODE_ENV=test npx playwright test` on `lphf-s1` through `s5` + `dsa-s3-landing-restyle.spec.js` → 15/15 passed
- Full `npm test` on merged master (run multiple times during delivery): only the 1 already-documented pre-existing failure (`tests/check-p3.5-validate-trace.js`); one transient flake (`check-pcr-s1-test-runner.js`) seen once, confirmed non-reproducing on a clean re-run and passing standalone
- Real CI "Scenario A E2E (staging)" and "Scenario B E2E (staging)": both pass on the final, merged state — confirmed directly via `gh pr checks`, not assumed

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Token-value checks (AC1/AC2) | ✅ | ✅ | Confirms exact hex values in both real CSS blocks (`:root`, `[data-theme="dark"]`), copied byte-exact from `html-shell.js` |
| Layout structure test (AC3) | ✅ | ✅ | Centered hero, full-bleed sections, 2-up grid |
| Mobile-viewport tests (AC5) | ✅ | ✅ | 375px/390px, real `document.body.scrollWidth` measurement, grid-collapse assertions |
| Pre-existing regression suite (AC4) | ✅ | ✅ | 9 Node + 10 E2E, corrected reference from an original wrong citation caught before implementation began |
| PostHog selector-scoping regression test | ✅ | ✅ | Added during Task 1's own code-quality remediation, empirically proven non-vacuous (reverted → red, restored → green) |
| `a3` sidebar-selector fix (post-merge) | ✅ | ✅ | Not a new test — a corrected assertion in an existing, different feature's test file, empirically proven non-vacuous (old selector confirmed to fail, new selector confirmed to pass, both against real current code) |

**Gaps (tests not implemented):** None blocking.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no measurable page-load regression | ⚠️ Not independently measured | Same class of gap as `dsa-s2`'s own DoD: no before/after page-load timing was captured, live or synthetic, for this restyle. `integration-real-code`-level evidence only for a claim that's actually about a real-world effect (page load time). **Follow-up Action:** a post-deployment page-load smoke check against the real, deployed `/` route. |
| Security: none identified | ✅ N/A | Story's own NFR section states "None identified" — confirmed, this is a static-content restyle with no new data flows |
| Accessibility: WCAG 2.1 AA — no regression to existing accessibility properties | ⚠️ Deviation found, elevated priority (not a regression this story caused independently, but a real gap now on a higher-stakes page) | `decisions.md`'s two Task 1/Task 2 entries: `.btn--primary` (the new hero/header CTAs) renders white text on `--accent` at a measured, independently-recomputed 3.68:1 contrast ratio in dark mode — below the WCAG AA 4.5:1 floor. Inherited via the shared `--accent` token from `dsa-s1`'s own already-RISK-ACCEPTed occurrence, but elevated in priority here since this is the platform's real, unauthenticated, first-impression, sign-up-conversion page — a materially higher-consequence surface. Not fixed in this story (a shared design-system token change requires its own story per `architecture-guardrails.md`, out of scope for `dsa-s3`). A `workspace/state.json` pendingActions entry recommends a near-term, prioritized fast-follow story. |
| Audit: none identified | ✅ N/A | Story's own NFR section states "None identified" — confirmed |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1: Visual consistency across the 4 real screens (target 4/4) | ✅ (baseline: 0 of 4) | Not yet — 3 of 4 screens (artefact viewer via `dsa-s1`, dashboard via `dsa-s2`, landing via `dsa-s3`) now match `DESIGN.md`'s token values; `dsa-s4` (skill-session chat) still needs to ship before the 4/4 target is reachable. Signal: `not-yet-measured`. Evidence note: dsa-s3 (landing) merged and verified this session; 1 of 4 screens remains. |
| m3: Beta user feedback on visual quality | ❌ (baseline: not yet established) | Not yet — no beta user has seen the restyled landing page yet (just merged). Signal: `not-yet-measured`. Evidence note: screen shipped and verified in this session; awaiting real beta-user exposure and feedback. |

m2 (design.system DoR gate) has no contribution from this story — it belongs to `dsa-s5`, not yet delivered.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 5 ACs satisfied with `live-verified` evidence — every AC confirmed via a fresh, real E2E/Playwright run against merged master in this session, and AC4 additionally via a real, independently-confirmed CI re-run of a genuine post-merge regression fix. Two deviations recorded: AC3's deliberately-omitted "Product in action" mock section (an operator-reviewable, explicitly-documented scope decision, not a silent gap) and the inherited, elevated-priority WCAG AA contrast gap on the new CTAs (same shared-token issue as `dsa-s1`, now flagged with higher urgency given this page's stakes). Zero scope violations beyond the story's own already-amended, already-reviewed scope, plus one narrow, fully-traced, necessary fix outside this feature's own file scope (the `a3` test fix, rooted in `dsa-s2`'s own restyle). Zero blocking test gaps.

**Follow-up actions:**
1. A post-deployment page-load smoke check against the real, deployed `/` route (Performance NFR) — no owner assigned.
2. A near-term, prioritized fast-follow story to fix `.btn--primary`'s dark-mode contrast specifically (Accessibility NFR gap, elevated priority given the page's stakes) — recommended sooner than the general `--accent` token review implied by `dsa-s1`'s own lower-urgency occurrence. No owner assigned.
3. `dsa-s4` still needs its own `/implementation-plan` + `/subagent-execution` pass to reach m1's 4/4 target.
4. (Carried from `dsa-s1`/`dsa-s2`'s own DoDs, unaddressed by this story, still open): the multi-reviewer sign-off roster/threaded comments story; the `bcf-s1` dark-mode contrast fix; the dashboard keyboard-accessibility gap on "Waiting on you"/"Recent sessions" list items; the dashboard performance smoke check.
5. **New this story**: the planned `dsa-s6` (mobile-responsiveness fix for `dsa-s1`'s artefact viewer + `dsa-s2`'s dashboard, per the FEATURE-WIDE decision logged 2026-09-19) has not yet been created as a real story artefact — still a decisions.md-level commitment, not yet scheduled through discovery/definition.
6. **New this story**: an `/improve` candidate — a repo-wide sweep for other `@real-staging`-tagged specs that might assert against markup this feature's restyles (`dsa-s1`/`dsa-s2`/`dsa-s3`) changed, to catch any other latent instances of the same test-tier-invisibility gap (`@real-staging` specs are excluded from local verification by design) before they surface as further one-off CI failures.

---

## DoD Observations

1. **A real, post-merge regression was found and fixed as a direct result of not accepting a failing CI check as "probably flakiness."** The operator explicitly asked to investigate and fix the failing `Scenario A E2E (staging)` check rather than accept it — this led to tracing a genuine functional regression (`dsa-s2`'s dashboard restyle silently broke a completely different, already-shipped feature's own E2E test) that had already been misdiagnosed as pre-existing staging flakiness once before, on the unrelated bookkeeping-only PR #907. `/improve` candidate: this is a concrete instance where "the test is `@real-staging` and failed before, so it's probably flaky" was the WRONG default assumption — worth citing as a counter-example the next time a real-staging-only test fails on a PR whose diff seems unrelated at first glance, especially if the failing test touches UI surface any recently-merged story restyled.
2. **The `@real-staging` test-tier's invisibility to local verification is a structural gap, not a one-off.** `ADR-018` deliberately excludes these specs from the local `npm test` chain (they need a real deployed environment, real signups, etc.) — but that same design choice means NO amount of local rigor during a story's own delivery, however thorough, can catch a regression against one of these specs until CI runs post-merge. This is the second time in this same feature (`dsa-s2` → `a3`) that a real-staging-only spec caught something local verification structurally could not. Recorded as Follow-up Action 6 above.
3. **The live browser render check was attempted 4 separate times across this story's delivery** (Task 1, Task 2, `/verify-completion`, and this DoD) — the Claude-in-Chrome extension remained disconnected every time. All 4 attempts are documented in `decisions.md`/this DoD with consistent, non-repetitive RISK-ACCEPT reasoning, backed by genuinely strong automated evidence (real computed-style assertions, real layout structure checks, real viewport-overflow measurements) each time. `/improve` candidate: if this extension-disconnect pattern continues recurring across sessions, it may be worth a dedicated investigation into the root cause (a stale auth token, a Chrome update, a session-boundary issue) rather than treating each occurrence as an independent, unexplained one-off.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for dsa-s3 (Restyle the Landing Page to Match DESIGN.md).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
