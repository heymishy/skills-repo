# Definition of Done: Make the "Continue to next stage" action persistently reachable regardless of scroll position

**PR:** [#857](https://github.com/heymishy/skills-repo/pull/857) | **Merged:** 2026-09-10 (merge commit `fe4f7594`)
**Story:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s2-persistent-next-stage-action.md
**Test plan:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s2-test-plan.md
**DoR artefact:** artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s2-dor.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Gate stays visible when scrolled up: scrolling to top of a 30-turn session, `.sw-journey-gate` remains within the viewport's visible bounding box | Playwright E2E: "AC1: journey gate stays sticky at the bottom when scrolled up through history" | None |
| AC2 | ✅ | Submit behaviour unchanged: form still targets `/api/journey/:journeyId/gate-confirm`, CSRF field and button text unchanged | `tests/check-wnl-s2-journey-gate-sticky.js`: "gate-confirm-form-unchanged" | None |
| AC3 | ✅ | Short session — control not misplaced: gate renders in normal end-of-content position when content is shorter than viewport height | Playwright E2E: "AC3: short session — control not misplaced" | None |
| AC4 | ✅ | Sub-step affordance unaffected: `sw-gate-substeps` content, `swLaunchClarify`/`swToggleEstimate` wiring all unchanged | `tests/check-wnl-s2-journey-gate-sticky.js`: "substep-affordance-markup-unaffected" | None |
| AC5 | ✅ | No dead zone over other content: sticky control's height/z-index does not permanently obscure other interactive elements | Playwright E2E: "AC5: sticky control doesn't create a dead zone" | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged diff touches only the `.sw-journey-gate` div's `style` attribute (adds `position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500`) plus a `NODE_ENV=test`-gated seed endpoint for the new E2E spec. No redesign of the gate control's visual style or button copy, no other page element made sticky, no collapsed/minimized state added — all confirmed out of scope in the story and absent from the merged diff.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (declared in test-plan.md: 2 integration + 3 E2E)
**Tests passing in CI:** 6 / 6 (unit suite implemented 3 test cases covering the 2 named integration groups plus AC1/AC3/AC5 structural assertions; all pass, plus 3/3 Playwright E2E)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| gate-confirm-form-unchanged | ✅ | ✅ | `tests/check-wnl-s2-journey-gate-sticky.js` |
| substep-affordance-markup-unaffected | ✅ | ✅ | `tests/check-wnl-s2-journey-gate-sticky.js` |
| AC1: gate stays sticky when scrolled up | ✅ | ✅ | `tests/e2e/wnl-s2-journey-gate-sticky.spec.js`, real scroll-position behaviour |
| AC3: short session — control not misplaced | ✅ | ✅ | `tests/e2e/wnl-s2-journey-gate-sticky.spec.js` |
| AC5: sticky control doesn't create a dead zone | ✅ | ✅ | `tests/e2e/wnl-s2-journey-gate-sticky.spec.js` |

**Gaps (tests not implemented):** None.

**Coverage gap audit (CSS-layout-dependent AC classification, B2):** AC1/AC3/AC5 are CSS-layout-dependent (scroll behaviour, positioning, dead-zone check). Classified at DoR time as **Automated visual regression test** — Playwright E2E in `tests/e2e/wnl-s2-journey-gate-sticky.spec.js`, named in the DoR contract. Confirmed executed and passing pre-merge (3/3) and re-confirmed passing against merged master.

**Mandatory route/handler E2E coverage check (verify-completion):** Grepped all `tests/e2e/*.spec.js` for the literal string `sw-journey-gate` — only this story's own new spec references it; the six other chat-page E2E specs assert nothing about this div, so the CSS-only change carries no cross-spec risk (RISK-ACCEPT logged in `decisions.md`, 2026-09-10). `tests/check-lsbm-s1-live-substep-injection.js` (the one suite with a documented literal-string dependency on `.sw-journey-gate`) re-confirmed passing on merged master: 12/12.

**Post-merge live Chrome verification found a real gap, not a confirmation (backfilled 2026-09-11 — see DoD Observation #3):** Live verification on `wuce-staging.fly.dev` found that the sticky fix above is genuinely correct for the path it tests (a page reload of an already-done session), but a **second, separate code path** — `showCommitLink()` in `skills.js`, the client-side function that renders the same gate control when a turn completes *live* — never received the fix. `/journey/:slug/resume`, the actual link every operator clicks from the journey list, always creates a fresh session and fires its turn live, so the majority of real usage hit the unfixed path. Neither this story's E2E spec nor its unit suite exercised that second path (the E2E spec seeds an already-done session directly). This gap was fixed separately as `jgls-s1` (artefacts/2026-09-11-journey-gate-live-completion-sticky-gap), merged and live-verified 2026-09-10. This DoD's own AC1/AC3/AC5 rows above remain accurate for what they actually tested — the gap was in test *coverage*, not in a false claim within this artefact.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new-request overhead (Performance) | ✅ | CSS-only positioning change, no new JS, no new requests |
| Security (existing CSRF-protected form reused unchanged) | ✅ | AC2 confirms form submit target/CSRF field unchanged |
| Accessibility (keyboard focus order not broken, no element hidden behind sticky control) | ✅ | AC5; standard `<form>`/`<button>` reused unchanged |
| Data residency / Compliance | ✅ Not applicable | No new data storage or movement |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Next-stage-action findability | ✅ (target: 0 "couldn't find next stage" incidents across 4 weeks post-ship; baseline: 1 confirmed incident 2026-08-31) | Not yet — requires a 4-week post-ship observation window with no incident-tracking automation | Signal: `not-yet-measured`. Evidence note: feature just shipped (merged 2026-09-10); the 4-week no-incident observation window has not elapsed. |

**Recorded in pipeline-state.json:** `metrics[1].signal = "not-yet-measured"`, `evidence = "wnl-s2 shipped 2026-09-10; 4-week no-incident observation window not yet elapsed"`, `lastMeasured = null`. `contributingStories` for `m2` updated to include `wnl-s2`.

---

## Outcome

**COMPLETE WITH DEVIATIONS** (updated 2026-09-11 — see Test Plan Coverage's live-verification note and DoD Observation #3)

All 5 written ACs were satisfied for the path they actually described and tested. The deviation is a test-plan coverage gap, not a false AC claim: neither the E2E spec nor the unit suite exercised the client-side `showCommitLink()` rendering path, which turned out to be the majority real-usage path (`/journey/:slug/resume`). That gap let a real defect through undetected by this story's own (passing) test suite.

**Follow-up actions:**
1. ~~Fix `showCommitLink()`'s missing sticky positioning~~ — done, `jgls-s1` (merged and live-verified 2026-09-10).
2. Revisit M2's signal at the 4-week mark post-ship (~2026-10-08) — no automated incident tracking exists for this metric, so this requires a manual operator check-in. The 4-week window should arguably restart from `jgls-s1`'s own deploy date, not this story's, since the fix wasn't actually complete until then.

---

## DoD Observations

1. This story's own branch (`feature/wnl-s2`) went through two separate merge-conflict resolutions against master post-implementation, each time because master's own copy of `pipeline-state.json` had independently advanced (once from `wnl-s1`/`wnl-s3`'s post-merge bookkeeping corrections, once from `wnl-s1`/`wnl-s3` actually merging while this PR was still open) — both times auto-resolved cleanly by taking master's copy in full (confirmed via diff review each time that master's version was a strict superset, no content loss). No functional risk, but worth noting as a real friction point in the cdg.6 epic-nested-story pattern when 3 sibling stories in the same epic ship in parallel.
2. No NFR gaps or guardrail entries were absent at delivery time.
3. **Backfilled 2026-09-11:** a repo-wide stocktake of DoD verification methods found that this story's own DoD had never recorded its post-merge live Chrome verification — which is a more consequential omission than the equivalent gap in `wnl-s1`/`wnl-s3`/`jasb-s1`'s own DoDs, because this one actually *found a real defect* (see Test Plan Coverage section above) rather than confirming success. Had this been written back into the artefact at the time, the connection between `wnl-s2` and its own follow-up fix (`jgls-s1`) would have been traceable from this document alone, not only from conversation history. Logged as a process gap at `/improve`, with this specific case as the sharpest illustration of why it matters: a DoD that omits a failed live check, then gets silently followed by a separate fix story, reads — to a future person opening only this file — as if the story shipped clean the first time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Make the Continue to next stage action persistently reachable regardless of scroll position" (wnl-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
