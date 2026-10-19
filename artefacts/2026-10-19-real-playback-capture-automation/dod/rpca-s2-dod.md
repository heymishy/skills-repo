# Definition of Done: Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage

**PR:** https://github.com/heymishy/skills-repo/pull/1004 (feature) + https://github.com/heymishy/skills-repo/pull/1005 (hotfix, see DoD Observations) | **Merged:** 2026-10-19 (both)
**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 — derives `{acId, selector}` from an E2E spec file naming the AC in a comment | ✅ | Unit tests (fixtures) + direct verification against 3 real spec files on disk (`fpd-s4-caption-sync.spec.js`, `jcx-s3-emotion-curve.spec.js`, `jcx-s7-panel-entry-and-save-feedback.spec.js`, the same 3 sampled at this epic's own `/clarify`). The real-file check against `jcx-s3` found a genuine bug (see DoD Observations) — fixed via `rpca-s2-hotfix1` (PR #1005), re-verified against all 3 real files post-fix: each now resolves its own distinct, correct selector. | `integration-real-code` (real, unmocked file parsing against real production spec files) | None, after the hotfix |
| AC2 — falls back to `selectors-manual.json` when no E2E match exists | ✅ | Unit tests: real fallback-file read/write via actual `fs` I/O (no mocking), including the "file doesn't exist" case returning `null` not a throw | `integration-real-code` | None |
| AC3 — skips with a named warning, doesn't crash, when neither source has an entry | ✅ | Unit test: real `buildCaptureList` call (not mocked sub-functions), spied `console.warn` confirms the specific AC id is named | `integration-real-code` | None |
| AC4 — a full multi-AC run reports correct capture/skip counts | ✅ | Integration test: 4-AC fixture (2 E2E-derived, 1 manual, 1 neither) produces exactly `"3 captured, 1 skipped"` | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

None of the 4 ACs describe browser-observable behaviour (pure CLI/file-parsing logic) — the UI-evidence gate does not apply to this story.

---

## Scope Deviations

None across either merged PR. `#1004`'s 4 task commits + 2 state-bookkeeping commits all map to the locked touch points (`scripts/playback-capture.js`, one test file). `#1005` (the hotfix) touched the same two files, exactly matching its own DoR contract.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (`rpca-s2`'s own test plan) + 2 / 2 (`rpca-s2-hotfix1`'s own test plan)
**Tests passing in CI:** 6 / 6; full regression suite 765/765 at current master (one transient local flake in `check-pcr-s1-test-runner.js` observed and ruled out — passes standalone and on re-run; unrelated to this story's own touch points; CI itself passed clean on both PRs)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): derive from fixture spec | ✅ | ✅ | |
| AC1 (unit): null when AC not named | ✅ | ✅ | |
| AC2 (unit): manual fallback used | ✅ | ✅ | |
| AC2 (unit): null when file missing | ✅ | ✅ | |
| AC3 (unit): skip + named warning | ✅ | ✅ | |
| AC4 (integration): multi-AC counts | ✅ | ✅ | |
| hotfix AC1 (unit): shared multi-AC header resolves distinctly | ✅ | ✅ | |
| hotfix AC2 (unit): real fpd-s4 file unaffected | ✅ | ✅ | |

**Gaps (tests not implemented):** None against either story's own test plan. The original `rpca-s2` test plan's own fixtures only exercised the single-AC-per-file convention — a real coverage gap for the multi-AC-header convention, found at this DoD and closed by `rpca-s2-hotfix1`'s own 2 new tests (see DoD Observations).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (spec-file parsing doesn't meaningfully slow a run) | ✅ | Pure in-memory string/regex operations, no new I/O beyond the existing `fs` reads |
| Security (no new NFR beyond `rpca-s1`'s own established posture) | ✅ | No new input surface; `loadManualFallback` follows the existing path-traversal guard convention (`rpca-s1-hotfix1`) |
| Accessibility | ✅ (N/A) | No new UI surface |
| Audit | ✅ (N/A) | Read-only |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Real capture coverage on new DoD-complete features | ✅ (0%, confirmed) | Not yet | `rpca-s2` generalises the mechanism `rpca-s1` proved, but doesn't itself wire into a feature's own natural DoD workflow — that's `rpca-s5`'s own scope. No new measurement event from this story alone. |
| M2 — Manual capture time per feature | ⚠️ Not yet fully measured | Not yet | Same reasoning — this story strengthens the mechanism's correctness, it doesn't itself produce a new timed capture run. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None remaining — the one real gap found at this DoD (`rpca-s2-hotfix1`) is already fixed and merged, not deferred.

---

## DoD Observations

1. **A real correctness bug was found at this DoD's own AC1 verification, not glossed over.** The merged `#1004`'s own unit tests only exercised the single-AC-per-file E2E spec convention (`fpd-s4-caption-sync.spec.js`'s own shape: one header comment naming exactly one AC). Verifying `deriveSelectorFromSpec` directly against a second real convention sampled at this epic's own `/clarify` — `jcx-s3-emotion-curve.spec.js`, whose header comment names all 3 of its ACs together — revealed that the function silently returned the SAME wrong selector (AC1's own) for AC2 and AC3 queries, not an error or a null. This is a materially worse failure mode than a missed case: a wrong screenshot could be silently captured and recorded as evidence for the wrong AC. Fixed same-day via a short-track story (`rpca-s2-hotfix1`, PR #1005, 2 regression tests including one reading the real `jcx-s3` file's own shape, merged). **`/improve` candidate:** this epic's own `/clarify` sampled 3 real spec files specifically to confirm selector stability — but the test-plan-writing step for `rpca-s2` only built fixtures matching 1 of those 3 sampled conventions. A test plan should cross-check its own fixtures against every real convention a prior `/clarify` step already sampled, not just one.
2. **The AC verification script's own manual scenarios, as originally written, assumed a CLI-wiring shape this story deliberately didn't build.** Found and corrected at `/verify-completion` (see `verification-scripts/rpca-s2-verification.md`'s own discrepancy note) — logged there as a second, smaller `/improve` candidate about batched verification-script templating.
3. A transient local test-suite flake (`check-pcr-s1-test-runner.js`, 1 failure on one full-suite run, 0 failures standalone and on re-run) was investigated and ruled unrelated to this story's own touch points — not fixed here, not blocking.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-s2 (Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage).
Check:
1. Does every AC row have a concrete evidence reference, including the verification-strength tag?
2. Is the AC1 bug (shared multi-AC header) described accurately, with the fix traced to a real merged PR?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
