# Definition of Done: Tag short-track features as reactive work in the consolidated features view

**PR:** https://github.com/heymishy/skills-repo/pull/1070 | **Merged:** 2026-11-11 (merge commit c9583adbb)
**Story:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s2-tag-short-track-as-reactive.md
**Test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s2-tag-short-track-as-reactive-test-plan.md
**DoR artefact:** artefacts/2026-11-08-unified-reactive-proactive-visibility/dor/urpv-s2-tag-short-track-as-reactive-dor.md
**Assessed by:** Claude (against merged code on master at d0a3ad048, which contains merge commit c9583adbb)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against synthetic fixtures or mocked dependencies; `integration-real-code` = exercises real, unmocked production source (the real `computeTaxonomyRollup`, `mergeFeatureSources` and the real renderer) but not a live deployed environment; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. No AC here has live or production evidence.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Acceptance Criterion 1: `computeTaxonomyRollup` carries each feature's real `track` onto every emitted item, defaulting to "standard" only when the field is genuinely absent). Three tests pass on merged master: "carries a feature's real track value through to the emitted item (ungrouped)", "carries track through for epic-nested story items too", and "defaults track to standard only when the key is genuinely absent, not when present-but-falsy". Confirmed in the diff: `_resolveTrack` uses `hasOwnProperty`, so a present-but-falsy value is passed through unchanged. Strength: `integration-real-code` (real `product-rollup.js`, synthetic `pipeline-state.json` fixtures). | Automated test `check-urpv-s2-tag-short-track-as-reactive` | None. The claim is pure data pass-through, which the tests exercise faithfully. |
| AC2 | ✅ | AC2 (Acceptance Criterion 2: on a `feature_slug` overlap, `mergeFeatureSources` takes `track` from the taxonomy source). Test "mergeFeatureSources resolves track from the taxonomy source on overlap, consistent with name/epicName" passes. The diff adds `track: item.track` in the taxonomy-sourced merge path. Strength: `integration-real-code`. | Automated test `check-urpv-s2-tag-short-track-as-reactive` | None |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: a `track: "short"` item shows a visible "Reactive" text label in both the By Module and By Phase tab views). Test "rendered item shows a Reactive text label in both By Module and By Phase tab views" passes, plus the NFR test "Reactive tag has a non-empty text node and uses a DESIGN.md var(--token) colour, never a hardcoded hex value". The diff adds a `data-urpv-track="reactive"` span with the text "Reactive" in `_renderPvcItemRow`. Strength: `integration-real-code`, asserting that the label text is present in the generated HTML string. UI-evidence gate: this AC is browser-observable and has no real browser check and no Playwright spec. The gate is satisfied only by the explicit RISK-ACCEPT in `decisions.md` dated 2026-11-10 ("verify-completion, urpv-s2 live browser render check"), which names the gap: visible and legible rendering in a real browser is unproven. | Automated test `check-urpv-s2-tag-short-track-as-reactive`, plus RISK-ACCEPT in `decisions.md` | Marked ✅ only because the RISK-ACCEPT satisfies the UI-evidence gate. The real-browser effect (the label is actually visible and legible) remains unverified, and the RISK-ACCEPT's own post-deployment visual smoke-test action has not been confirmed as done. See Follow-up Action 1. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: a product with zero short-track features renders every item as Planned or unlabelled, and never incorrectly as Reactive). Tests "zero short-track features never produces an incorrectly-tagged short item" and "standard-track item never shows Reactive; shows Planned honestly" pass. A third test confirms a journey-only item with no track data stays untagged, as the story's Out of Scope requires. Strength: `integration-real-code`. The claim is about which label the code emits, so the string-level assertion is adequate; it shares the same real-browser gap as AC3 for how the "Planned" label looks. | Automated test `check-urpv-s2-tag-short-track-as-reactive` | None against the AC as written. The visual gap is covered by the same RISK-ACCEPT as AC3. |

**Verification strength summary:** AC1, AC2, AC3, AC4 `integration-real-code`; 0 `unit`-only; 0 `live-verified`; 0 `production-observed`. AC3 relies on the RISK-ACCEPT for the UI-evidence gate.

---

## Scope Deviations

None. `gh pr diff 1070 --name-only` shows six files: `.github/pipeline-state.json` (bookkeeping), `decisions.md` and the implementation plan (artefacts), `src/web-ui/modules/product-rollup.js`, `src/web-ui/routes/products.js`, and `tests/check-urpv-s2-tag-short-track-as-reactive.js`. No `track`-keyed filtering was added (Out of Scope item 1, reserved for urpv-s4). Journey-only items were not given a derived `track` (Out of Scope item 2); the diff leaves them untagged, and a test asserts this. `computeOverallHealthSignal` and other health-derivation logic were not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (4 unit, 2 integration and 2 NFR tests per the plan, plus one added test for the journey-only untagged case, shipped as 9 named test blocks in one file)
**Tests passing in CI:** 9 / 9 implemented (re-run locally on merged master at d0a3ad048: `[urpv-s2] Results: 9 passed, 0 failed`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: real track carried through (ungrouped) | ✅ | ✅ | |
| AC1: track carried through for epic-nested story items | ✅ | ✅ | |
| AC1: default to standard only when key absent | ✅ | ✅ | |
| AC2: mergeFeatureSources resolves track from taxonomy | ✅ | ✅ | |
| AC4: zero short-track never yields a "short" item | ✅ | ✅ | |
| AC3: Reactive label in By Module and By Phase views | ✅ | ✅ | |
| AC4: standard-track never shows Reactive, shows Planned | ✅ | ✅ | |
| Journey-only item stays untagged (Out of Scope) | ✅ | ✅ | |
| NFR: non-empty text node and design-token colour | ✅ | ✅ | |

**Gaps (tests not implemented):** None among the planned automated tests. I did not map the 9 blocks one-to-one to the plan's named tests, since the plan lists 10 headed test descriptions across its Unit, Integration and NFR sections and the shipped file merges some of them; the AC and NFR intent of each is covered per the table above.

**Coverage-gap audit:** the test plan declares no `CSS-layout-dependent` gaps, on the reasoning that every AC asserts DOM text presence or data pass-through. That reasoning holds for the label's presence but not for its visible rendering, which is why `/verify-completion` recorded the RISK-ACCEPT in `decisions.md` (2026-11-10) before merge. The RISK-ACCEPT's required post-deployment visual smoke test has not been confirmed as executed at DoD time.

---

## NFR Status

Feature-level `nfr-profile.md` exists; its Performance, Security and Availability tables list urpv-s2 only under Authorisation. Story-level NFRs were also checked. Status in `nfr-profile.md` was not changed to Verified because other stories in the feature are still open.

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no new query, pure pass-through field | ✅ | Diff review: only a field copy in `computeTaxonomyRollup` and a string in the renderer. No new fetch or DB call. |
| Security: tenant_id scoping preserved (feature NFR profile, Authorisation row) | ✅ | Diff review: no query, route or data-access change. `track` is a field already present in the tenant's own synced `pipeline-state.json`. |
| Accessibility: text label present per MC-A11Y-02 (colour not sole indicator) | ✅ | The NFR test asserts a non-empty text node independent of colour. Both labels are literal text ("Reactive", "Planned"). |
| Accessibility: WCAG 2.1 AA contrast for the tag | ⚠️ | Colours are `var(--warn)` and `var(--muted)` tokens, asserted at `unit`/string level. No computed-contrast check or real-browser render exists, so contrast is not evidenced. Covered only by the same RISK-ACCEPT as AC3. |
| Design tokens: no hardcoded colours in new lines | ✅ | The NFR test asserts `var(--token)` usage. The pre-existing hardcoded colours elsewhere in `products.js` are covered by the separate RISK-ACCEPT in `decisions.md` dated 2026-11-09 (DoR, products.js design-token debt) and were not introduced by this story. |

---

## Metric Signal

No metric in the feature's `metrics[]` array lists `urpv-s2` in `contributingStories`: m1 lists only `urpv-s1`, and m2 and m3 list none. However, this story's own Benefit Linkage names m1 ("Reactive-work coverage on the surface"), so the omission looks like a bookkeeping gap rather than intent. Recording the signal for m1 against this story:

**Reactive-work coverage on the surface** (m1)
Signal: not-yet-measured
Evidence note: urpv-s2 ships the visible Reactive/Planned tag, but m1's target is "100% of existing short-track stories and decisions.md RISK-ACCEPT/SCOPE entries rendered", and urpv-s3 (decisions.md entries) is not yet shipped. No real-browser or production observation of the tag on a real connected product has been made, so no coverage figure can be taken yet. Suggested follow-up: add `urpv-s2` to m1's `contributingStories`.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 (AC3 only via RISK-ACCEPT; none is `❌`). Verification strength: 4 `integration-real-code`, 0 `live-verified`. UI-evidence gate: 1 browser-observable AC (AC3, with AC4's label text sharing the same gap) has no real browser check or Playwright evidence; it is covered by the recorded RISK-ACCEPT only.

**Follow-up actions:**
1. Confirm visually that the "Reactive" and "Planned" labels render legibly (including contrast) on this repo's own connected-product features view after the next staging or production deploy. This is the post-deployment smoke test the 2026-11-10 RISK-ACCEPT requires; it is not yet confirmed as done or tracked in `workspace/state.json` `pendingActions` (not checked in this assessment).
2. Add `urpv-s2` to m1's `contributingStories` in `.github/pipeline-state.json` via `node bin/skills advance`.
3. The RISK-ACCEPT's revisit trigger (authenticated Playwright coverage of the product view, expected from urpv-s3 or urpv-s4) will retroactively cover this label; track it there.

---

## DoD Observations

1. **Metric linkage gap.** The story's Benefit Linkage names m1 but the metric does not list the story. Tag: `/improve` candidate (definition-time check that every story's named metric lists that story).
2. **Not verified in this assessment:** real CI results for PR #1070 (only a local run on merged master), any live or browser rendering, and the contents of `workspace/state.json` `pendingActions`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Tag short-track features as reactive work in the consolidated features view".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
