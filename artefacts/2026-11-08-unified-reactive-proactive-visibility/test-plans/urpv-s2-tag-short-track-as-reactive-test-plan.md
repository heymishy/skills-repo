## Test Plan: Tag short-track features as reactive work in the consolidated features view

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s2-tag-short-track-as-reactive.md
**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Test plan author:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `track` field carried through `computeTaxonomyRollup`, defaulting to `"standard"` only when genuinely absent | 2 tests | — | — | — | — | 🟢 |
| AC2 | `mergeFeatureSources` resolves `track` from the taxonomy source on overlap | 1 test | — | — | — | — | 🟢 |
| AC3 | Rendered item shows a "Reactive" text label, distinguishable from "Planned", in both By Module and By Phase tabs | — | 2 tests | — | — | — | 🟢 |
| AC4 | Zero short-track features never results in an incorrectly-tagged "Reactive" item | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs assert DOM text-node presence or plain data pass-through — no CSS layout, position, or rendering dependency. (A separate, DoR-time design-token contrast gate already exists — see NFR Tests below — and is intentionally not duplicated here.)

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixtures in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Synthetic `pipeline-state.json` fixture with one `track: "short"` feature, one `track: "standard"` feature, and one feature with no `track` field at all | Synthetic | None | Third case exists specifically to test the default-only-when-absent rule |
| AC2 | Synthetic taxonomy item and journey item sharing the same `feature_slug`, with differing `track` values | Synthetic | None | Taxonomy item's `track` must win |
| AC3 | Synthetic rendered-item fixture with `track: "short"` and one with `track: "standard"` | Synthetic | None | |
| AC4 | Synthetic fixture with zero `track: "short"` features | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### computeTaxonomyRollup carries a feature's real track value through to the emitted item

- **Verifies:** AC1
- **Precondition:** Fixture `pipeline-state.json` with a feature having `track: "short"` and another with `track: "standard"`.
- **Action:** Run `computeTaxonomyRollup` over the fixture.
- **Expected result:** The emitted item corresponding to the short-track feature carries `track: "short"`; the standard-track item carries `track: "standard"` — both real values, not inferred.
- **Edge case:** No.

### computeTaxonomyRollup defaults track to "standard" only when the field is genuinely absent

- **Verifies:** AC1
- **Precondition:** Fixture feature object with no `track` key at all (not `track: null`, not `track: ""` — key fully absent).
- **Action:** Run `computeTaxonomyRollup` over the fixture.
- **Expected result:** The emitted item's `track` is `"standard"`. A second assertion with `track: ""` (empty string, a different "falsy but present" case) confirms the function does not silently coerce an explicit empty value the same way — it is treated as whatever the real production parsing does with a present-but-empty field, not blindly defaulted by this function's own logic alone. (If the story's intent is that only a fully-absent key defaults, this test pins that distinction explicitly rather than leaving it ambiguous.)
- **Edge case:** Yes — absent key vs. falsy-but-present value.

### mergeFeatureSources resolves track from the taxonomy source on overlap

- **Verifies:** AC2
- **Precondition:** A taxonomy item with `feature_slug: "x"`, `track: "short"` and a journey item with the same `feature_slug: "x"`, `track: "standard"` (or no track at all).
- **Action:** Run `mergeFeatureSources` with both sources.
- **Expected result:** The merged item's `track` is `"short"` — the taxonomy source's value, consistent with how `name`/`epicName` are already resolved on overlap in the existing function.
- **Edge case:** No.

### Zero short-track features never produces an incorrectly-tagged Reactive item

- **Verifies:** AC4
- **Precondition:** Fixture with every feature's `track` explicitly `"standard"` (no `track: "short"` anywhere).
- **Action:** Run `computeTaxonomyRollup` then `mergeFeatureSources` over the fixture.
- **Expected result:** Every emitted item's `track` is `"standard"` — zero items with `track: "short"`.
- **Edge case:** Yes — the "honest zero" case the AC explicitly names.

---

## Integration Tests

### Rendered item shows a "Reactive" text label in both the By Module and By Phase tab views

- **Verifies:** AC3; MC-A11Y-02 (text label, not colour alone)
- **Components involved:** `computeTaxonomyRollup`, `mergeFeatureSources`, `_renderConsolidatedFeaturesSection` (By Module tab render path)
- **Precondition:** Merged item list containing one item with `track: "short"`.
- **Action:** Call `_renderConsolidatedFeaturesSection` with "By Module" tab active, then again with "By Phase" tab active, using the same item list.
- **Expected result:** In both renders, the short-track item's card contains a visible text node reading "Reactive" (exact label text to be confirmed against the story's chosen convention at implementation — this test asserts a text node distinguishable from "Planned" is present in both tab views, not tied to one specific tab's markup path).

### Standard-track or unlabelled item never shows a "Reactive" label

- **Verifies:** AC4
- **Components involved:** Same render path as above.
- **Precondition:** Merged item list where every item has `track: "standard"`.
- **Action:** Call `_renderConsolidatedFeaturesSection`.
- **Expected result:** No rendered card contains the text "Reactive"; every card shows "Planned" (or is unlabelled, per the implementation's chosen default-display convention) — the zero-reactive-work state is shown honestly.

---

## NFR Tests

### Reactive/Planned tag always includes a text node, independent of CSS class

- **NFR addressed:** Accessibility (MC-A11Y-02 — colour not sole indicator)
- **Measurement method:** Render the tag for a `track: "short"` item; assert the element's `textContent` is non-empty and reads "Reactive", independent of which CSS class is applied (i.e. the assertion does not depend on resolved colour, only on the DOM text node existing).
- **Pass threshold:** Text node present and reads the expected label for both `track` values.
- **Tool:** The project's configured test runner (`npm test`)

### Tag uses DESIGN.md token classes only, no inline colour

- **NFR addressed:** Accessibility / Design-system compliance (`product/constraints.md` #9)
- **Measurement method:** Inspect the rendered tag element's attributes; assert no inline `style="color:..."` (or equivalent inline colour) attribute is present, and assert the applied class name is one of the allowed token classes defined in `DESIGN.md`.
- **Pass threshold:** Zero inline colour styles; class name present in the allowed token set. (Full WCAG 2.1 AA contrast-ratio verification is the existing `H-DESIGN` DoR gate's job via `scripts/check-design-tokens.js` — not duplicated here, since this story will set `hasDesignSystemTrack: true` at DoR per `product/constraints.md` #9.)
- **Tool:** The project's configured test runner (`npm test`)

---

## Out of Scope for This Test Plan

- Filtering UI keyed on `track` — that is urpv-s4's scope, which reuses this story's tag; no filter behaviour is tested here.
- Re-deriving `track` for journey-only items with no corresponding `pipeline-state.json` feature — explicitly out of scope per the story; those remain untagged by design, not a gap.
- WCAG contrast-ratio measurement itself — delegated to the existing `H-DESIGN`/`scripts/check-design-tokens.js` DoR gate (see NFR Tests above).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 4 ACs are fully covered by Unit/Integration tests; the one adjacent concern (contrast ratio) is already owned by an existing DoR-time mechanism, not a gap in this plan | — |
