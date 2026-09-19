# Definition of Done: `design.system` Context Tag Triggers a Real DoR Hard Block

**PR:** https://github.com/heymishy/skills-repo/pull/911 | **Merged:** 2026-09-19 (merge commit `6f99fd06`, verified via `gh pr view 911` — `state: MERGED` — and `git merge-base --is-ancestor` against `origin/master`)
**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s5.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s5-test-plan.md
**DoR artefact:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s5-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `.github/context.yml` contains a `design.system_reference` key pointing at `artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`'s real path, with an explicit comment citing `constraints.md` #8. Confirmed no `DESIGN.md` content is embedded anywhere in the diff. | `integration-real-code` (real file read/parse confirmed via direct inspection) | None |
| AC2 | ✅ | `scripts/check-design-tokens.js`'s `extractDesignTokens`/`scanFileForNonTokenColors` genuinely extract every hex value from `DESIGN.md`'s color-token tables (independently hand-counted by a reviewer: 34/34 match, including both multi-hex table cells) and correctly flag non-token colors with file+value, matching the `H-ADAPTER FAIL: ...` naming convention. AC2's own text was corrected during the final cross-task review to drop an originally-included "or font" claim that was never scoped by the test plan, never built, and never tested — see Deviation column and DoD Observations. | `integration-real-code` (real scan logic, run directly against real fixtures by multiple independent reviewers) | AC2's own text was corrected post-implementation to match delivered scope (color-only, not "color or font") — see DoD Observations #1 |
| AC3 | ⚠️ | The mechanism is genuinely wired: `scripts/check-design-tokens.js` (real, tested) is named and correctly described in `skills/definition-of-ready/SKILL.md`'s new `H-DESIGN` detail section, which an agent running `/definition-of-ready` would actually invoke. However, AC3's own literal claim — "`H-DESIGN` fires and `dorStatus` is set to `blocked`" — was never exercised end-to-end: no fixture story was run through a real `/definition-of-ready` execution producing an actual `dorStatus: blocked` transition. The only test evidence (`tests/check-h-design-gate.js`) is SKILL.md-text-pattern-matching, mirroring the established `H-INF`/`H-MIG` precedent exactly (confirmed: no programmatic DoR hard-block runner exists anywhere in this codebase for ANY conditional hard block, not just this one). The final cross-task reviewer's own explicit judgment: this is a legitimate best-effort proxy given the architecture, but AC3's own wording overclaims what is mechanically proven. | `unit` (SKILL.md-text-pattern-matching only — the real-world runtime claim is unverified) | Evidence-class gap: AC3's real-world claim ("`dorStatus` is set to `blocked`") rests on weaker evidence than its own wording implies — see Follow-up Actions |
| AC4 | ⚠️ | Same evidence-class caveat as AC3 for the "does not block sign-off" runtime half. The strictly stronger half — "no false positive" — IS genuinely proven: the compliant fixture (`tests/fixtures/dsa-s5-compliant-touched-file.js`) passes the real scan function with zero findings (`tests/check-design-tokens-scan.js` T3), independently re-run and confirmed by two reviewers. | `integration-real-code` (false-positive claim) + `unit` (blocking-behavior claim) | Same evidence-class gap as AC3 |
| AC5 | ✅ | `H-DESIGN`'s skip-when-absent documentation is present and correctly worded (`tests/check-h-design-gate.js` T3/T4/T5, all passing). Critically, the "other hard blocks unaffected" half IS mechanically proven, not just documented: `tests/check-inf4-h-inf-gate.js` (9/9) and `tests/check-mig3-h-mig-gate.js` (10/10) were both independently re-run after the `H-DESIGN` addition and confirmed byte-for-byte unchanged — real regression evidence. | `integration-real-code` (real regression re-run of sibling test suites) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Two recorded: (1) AC2's/AC4's "font" wording was corrected post-implementation to match delivered, tested scope — logged and reasoned in `decisions.md`, not silently dropped. (2) AC3/AC4's runtime "genuinely blocks/passes DoR sign-off" claims rest on documentation-pattern-matching evidence, not an executed fixture-driven DoR run — a real limitation shared with every other conditional hard block in this codebase (`H-INF`, `H-MIG`), not unique to this story, but not previously stated this explicitly in any of this feature's other DoD artefacts.

---

## Scope Deviations

None beyond the AC-text corrections already noted above. `git log master..feature/dsa-s5` (pre-merge, 11 commits) showed every commit mapping to a task, a code-quality-review-driven fix, the final-review-driven AC-text correction, or pipeline bookkeeping. The merged diff (`gh pr view 911 --json files`) touches exactly the 11 files the plan named: `.github/context.yml`, `scripts/check-design-tokens.js`, `skills/definition-of-ready/SKILL.md`, 2 new test files, 2 new fixtures, plus `artefacts/2026-09-18-design-system-adoption/stories/dsa-s5.md` (the AC-text correction) and expected bookkeeping. Nothing in the story's out-of-scope sections was implemented — notably, no automated structural/layout compliance checker was built (correctly left manual, as scoped).

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (test-plan-level entries); the real, executable test files contain 13 individual assertions across `tests/check-design-tokens-scan.js` (4) and `tests/check-h-design-gate.js` (9)
**Tests passing in CI:** 9 / 9 — confirmed via `gh pr checks 911` (all 8 CI jobs pass, including `Lint, typecheck, test, build` and `Validate traceability chain`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| context-yml-references-design-md-path (AC1) | ✅ | ✅ | Real file read, confirmed |
| h-design-scan-detects-hardcoded-color-not-in-token-list (AC2) | ✅ | ✅ | Independently hand-verified extraction logic (34/34 tokens) |
| h-design-scan-passes-token-only-values (AC2 negative) | ✅ | ✅ | Real negative control, confirmed |
| h-design-blocks-noncompliant-tagged-story-at-dor (AC3) | ✅ | ✅ | Documentation-pattern-matching only — see AC3's own evidence-class caveat above |
| h-design-passes-compliant-tagged-story-at-dor (AC4) | ✅ | ✅ | Same caveat for the blocking-behavior half; false-positive half genuinely proven |
| h-design-skipped-when-flag-absent-other-blocks-unaffected (AC5) | ✅ | ✅ | "Other blocks unaffected" half genuinely re-verified via real regression re-run |
| h-design-scan-completes-within-dor-budget (Performance NFR) | ⚠️ | — | Never formally measured against a stated budget — see NFR Status below |
| h-design-audit-trail-recorded (Audit NFR) | ✅ | ✅ | Confirmed via direct inspection of the real FAIL/PASS blockquote format and CLI output |

**Gaps (tests not implemented):** None — all 9 test-plan entries have a corresponding real test; the gap is in evidence *strength* for 2 of them (AC3, AC4's blocking half), not test *existence*.

**Coverage gap audit (CSS-layout-dependent ACs):** N/A — this story has zero CSS-layout-dependent ACs (confirmed at DoR time via H-E2E: "No layout-dependent ACs exist at all — this story has no UI/rendering component").

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: `H-DESIGN` scan completes within DoR sign-off's overall budget | ⚠️ Not formally measured | No deliberate timing measurement was taken against a stated budget threshold. Informal observation: `scripts/check-design-tokens.js` was run directly, repeatedly, by multiple reviewers during delivery (single synchronous file read + one regex sweep, no network/DB calls) and completed near-instantly each time — no perceptible delay was ever observed. This is a plausibility observation, not a measured NFR result. **Follow-up Action:** if this becomes load-bearing for a large-scale future rollout (many `hasDesignSystemTrack: true` stories scanning many files), take a real timing measurement then. |
| Security: none identified | ✅ N/A | Story's own NFR section states "None identified" — confirmed; this story adds no new routes, no new data flows, and reads only local repo files |
| Accessibility: none identified | ✅ N/A | Story's own NFR section states "None identified" (governance/tooling mechanism, not user-facing UI) — confirmed |
| Audit: `H-DESIGN`'s pass/fail result and offending file/value recorded, matching every other hard block's own convention | ✅ | Confirmed via direct inspection: the SKILL.md's `H-DESIGN FAIL — non-token color found in [file]: [value]` / `H-DESIGN PASS — no non-token colors found` blockquote format matches `H-INF`/`H-MIG`'s own audit-trail convention exactly, and the real CLI script's own console output (`H-DESIGN FAIL: ...` / `H-DESIGN PASS: ...`) independently confirms the same file+value naming at the mechanism level. |

---

## Metric Signal

`dsa-s5` is the sole contributing story for `m2` ("design.system DoR gate is real and enforced," target: "A deliberately-noncompliant tagged story genuinely fails DoR").

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m2: design.system DoR gate is real and enforced | ✅ (baseline: 0, mechanism did not exist) | **Partially — signal: `at-risk`, not `on-track`.** The mechanism now exists, is documented, and is backed by a real, independently-verified scanning script (a genuine advance from baseline 0). However, `m2`'s own literal target text — "a deliberately-noncompliant tagged story **genuinely fails DoR**" — was never actually exercised end-to-end: no fixture story was run through a real `/definition-of-ready` execution producing an observed `dorStatus: blocked` outcome. The evidence is SKILL.md-documentation-pattern-matching (the same evidence class every other conditional hard block in this codebase relies on), not a literal demonstration of the target's own claim. This is not a failure of `dsa-s5`'s own delivery — it correctly matched the established `H-INF`/`H-MIG` precedent — but `m2`'s target wording sets a literally higher bar than what any conditional hard block in this codebase can currently demonstrate. Evidence note: mechanism built and unit-tested; end-to-end "genuinely fails" demonstration not yet performed. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. If a genuine end-to-end demonstration of `m2`'s own target ("a deliberately-noncompliant tagged story genuinely fails DoR") is wanted, it would require either: (a) a human operator manually walking a real fixture story through an actual `/definition-of-ready` session and observing the real `dorStatus: blocked` outcome once, as a one-time validation event (not a repeatable automated test, since no programmatic DoR runner exists), or (b) building a programmatic DoR hard-block runner — a materially larger undertaking affecting every conditional hard block in this file, not scoped to this story.
2. Performance NFR (`H-DESIGN` scan timing) was never formally measured against a stated budget — take a real measurement if/when this becomes load-bearing at scale.
3. If font-value governance is later wanted (the capability AC2's original text implied but was never built), it needs its own `DESIGN.md` structural addition (a real, regex-extractable font-token table) plus a separately-scoped story.

---

## DoD Observations

1. **The final cross-task review gave a genuine NEEDS FIXES verdict** — the only story in this epic to receive one — correctly catching that AC2's own literal "color or font" wording had drifted from what the test plan actually specified, and what Tasks 1-2 actually built and tested (color-only). The earlier, softer "acknowledged, not fixed" framing (logged mid-delivery) was superseded: AC2's and AC4's own story text were corrected directly to match delivered reality, rather than left as an informal, unresolved note. Full reasoning trail in `decisions.md`.
2. **The final cross-task review's single most valuable contribution was surfacing a real evidence-strength gap in AC3/AC4's own claims** — not a defect in what was built, but an honest accounting of what the test suite actually proves versus what the AC's own wording asserts. This DoD reflects that finding directly (AC3/AC4 marked ⚠️, not a blanket ✅) rather than letting the gap go unstated in the permanent delivery record, consistent with this repo's own established "verification strength" DoD convention.
3. **Two code-quality-review-driven fixes landed during delivery**, both logged in `decisions.md`: a silent-degradation failure mode in the token-extraction script (fixed to fail loud on a missing section-end heading, matching existing behavior for a missing start heading), and an underspecified "touched files" source in `H-DESIGN`'s own documentation (fixed to name the DoR contract's `Estimated touch points` → `Files:` field explicitly, matching `H-INF`/`H-MIG`'s own field-naming precision).
4. **`H-DESIGN`'s hex-literal scanning is a known, disclosed limitation, not a hidden one**: the regex-based approach will false-positive on hex-and-hash-shaped text that isn't a color (a short git SHA, a CSS `#id` selector). Logged in `decisions.md` as an acknowledged characteristic of the current, correctly-scoped implementation — not fixed, since context-aware color-vs-non-color disambiguation is a materially larger, unscoped feature no AC or test asked for.

None of these observations require a fresh `/improve` feedback entry beyond what's already captured in `decisions.md` — items 1 and 2 are examples of the final cross-task review process working exactly as designed (catching a real gap a faster pass would have missed), not a process failure.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for dsa-s5 ("design.system Context Tag Triggers a Real DoR Hard Block").
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
