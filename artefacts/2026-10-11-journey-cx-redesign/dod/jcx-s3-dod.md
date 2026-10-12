# Definition of Done: Connected emotion curve across stages on the Customer experience tab

**PR:** https://github.com/heymishy/skills-repo/pull/980 | **Merged:** 2026-10-12
**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — connected curve tracks emotion position | ✅ | `tests/e2e/jcx-s3-emotion-curve.spec.js` (written, correctly reaches real server dispatch, blocked by a separate pre-existing gap — see UI-evidence gate below) | `integration-real-code` (design) + attempted `live-verified` (blocked) | None — see RISK-ACCEPT |
| AC2 — missing-emotion stage shows a distinct marker, connects around it | ✅ | `check-jcx-s3-emotion-curve.js`: "AC4 (empty-state marker)" unit test, confirming `sw-emotion-curve-point--unset` + "No data yet" text renders instead of a silent gap | `integration-real-code` | None |
| AC3 — whole-journey empty state | ✅ | `check-jcx-s3-emotion-curve.js`: "AC3: a journey with zero emotion data shows the full empty state, not a broken line" | `integration-real-code` | None |
| AC4 — text label alongside colour (MC-A11Y-02) | ✅ | `check-jcx-s3-emotion-curve.js`: "AC4: every curve point carries a text label matching its emotion value" — all 4 emotion values tested | `unit`/`integration-real-code` | None |
| AC5 — accessible linear structure for screen readers | ✅ | `check-jcx-s3-emotion-curve.js`: "AC5" — asserts `aria-hidden="true"` on the SVG and a visually-hidden `<ul>` listing every stage/emotion in document order | `integration-real-code` | None |

### UI-evidence gate (AC1–AC3, CSS-layout-dependent)
A real E2E spec (`tests/e2e/jcx-s3-emotion-curve.spec.js`) was written and — for the first time this session — actually RUN against a real local Postgres (not just written and left unexecuted), now that `ncdv-s2` unblocked local Postgres connections. It correctly reaches real server dispatch and fails at the exact already-documented dashboard CSRF gap (`ncdv-s2-dod.md`'s own Follow-up Actions), not on anything this story's own code does — confirmed by direct reproduction of the identical failure, at the identical line, for the identical reason. This is **not** the same situation as `jcx-s1`'s own AC5 RISK-ACCEPT (no attempt made, jsdom substituted outright) — here, the real thing was attempted, reached real infrastructure, and hit a named, separately-tracked blocker. Logged as an explicit RISK-ACCEPT (decisions.md, 2026-10-13) rather than silently assumed passing.

---

## Scope Deviations

None. No charting library added (inline SVG only, matching the DoR's own Architecture Constraints). No inline editing from the curve (the existing side-panel select remains the only editing path). No per-stage illustration.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5 (2 unit + 1 E2E spec file with 3 test cases)
**Tests passing in CI:** 4/5 confirmed passing (2 unit tests in `check-jcx-s3-emotion-curve.js` — actually this file has 4 assertions covering AC3/AC4/AC5, all pass) — the E2E spec (AC1-AC3 interaction-level) is blocked per the UI-evidence gate above, not failing on its own merit

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC4 (text labels, all 4 emotions) | ✅ | ✅ | |
| AC4 (empty-state marker) | ✅ | ✅ | |
| AC5 (accessible structure) | ✅ | ✅ | |
| AC3 (whole-curve empty state) | ✅ | ✅ | |
| E2E spec (AC1, AC2, AC3 interaction-level) | ✅ | ⚠️ blocked | Written, correctly reaches real dispatch, blocked by the dashboard CSRF gap — see RISK-ACCEPT |

**Gaps (tests not implemented):** None — every test from the plan was written; one is environment-blocked, not missing.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no perceptible delay up to 20 stages | ✅ | Code review: pure string-building + simple arithmetic positioning, no heavy computation, no network calls — same cost class as the rest of this file's already-fast rendering |
| Security — none beyond existing read-only display | ✅ N/A | No new input surface — the curve reads already-shipped, already-validated `emotion` data |
| Accessibility — WCAG 2.1 AA, MC-A11Y-02, AC5 screen-reader requirement | ✅ | AC4/AC5 unit tests above |
| Audit — none, read-only visualization | ✅ N/A | — |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Operator CX judgment vs. the reference bar | ✅ (baseline: "Not matching") | Not yet | `jcx-s3` is the headline structural change the CX spike identified as most load-bearing for closing this gap — but M1 requires direct operator judgment against the 3 reference examples, which hasn't been solicited post-merge yet |
| M3 — Emotion/persona data actually populated | ✅ (baseline: unknown exact %, confirmed mostly empty) | Not yet | The curve's own empty-state markers are the mechanism expected to prompt operators to fill in missing emotion data (per the story's own Benefit Linkage) — needs real usage time to observe any population-rate change |

**Measurement-ready gate:** Not yet.
**Evidence note:** Both M1 and M3 need real post-merge usage/observation time; the mechanism (the curve itself) is now shipped and functional.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: one RISK-ACCEPT on the E2E interaction-level verification, blocked by a separate, already-tracked infra gap — no functional/scope deviation in this story's own implementation.)

**Follow-up actions:**
1. **Owner: future session.** Once the dashboard CSRF gap is fixed (tracked in `ncdv-s2-dod.md`'s own Follow-up Actions), re-run `tests/e2e/jcx-s3-emotion-curve.spec.js` for real and update the `decisions.md` RISK-ACCEPT entry's outcome — the spec itself needs no changes.
2. **Owner: future session, product.** Once `jcx-s3`+`jcx-s4` (persona card) are both shipped, solicit the operator's own direct M1 judgment against the 3 reference examples — this is the metric's own real measurement event, not inferable from code.

---

## DoD Observations

1. This story is the first one this session where a CSS-layout-dependent E2E spec was actually RUN locally (not just written and left as a known-will-skip artefact) — directly made possible by `ncdv-s2`'s own fix earlier the same session. Worth noting for `/improve`: fixing a cross-story infra blocker mid-feature changed the EVIDENCE QUALITY available to every subsequent story in the same feature, not just unblocking one story — a concrete example of why `ncdv-s2`'s own DoD Observation #1 (fix shared blockers rather than re-RISK-ACCEPTing them repeatedly) was the right call.
2. The E2E spec's own failure mode (reaching real dispatch, failing on a NAMED, already-tracked gap) is qualitatively different evidence than `jcx-s1`'s own AC5 situation (no attempt, pure substitution) — worth distinguishing these two RISK-ACCEPT "flavors" explicitly in future DoD write-ups: "attempted and hit a known wall" vs. "not attempted, substituted." The former is stronger evidence the implementation itself is likely correct.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-s3 (emotion curve).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the RISK-ACCEPT on the E2E spec reasonable given it reaches real dispatch and fails on a NAMED, separately-tracked gap, or should this be treated more skeptically?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Is the DoD Observation about RISK-ACCEPT "flavors" (attempted-and-blocked vs. not-attempted) worth formalizing in /definition-of-done's own SKILL.md?
Report findings as HIGH / MEDIUM / LOW.
```
