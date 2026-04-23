# Definition of Done: src.1 — Integrate CLI observability tools into skill routing

**PR:** https://github.com/heymishy/skills-repo/pull/182 | **Merged:** 2026-04-23
**Story:** artefacts/2026-04-21-skill-routing-cli-tools/stories/src.1-skill-routing-cli-integration.md
**Test plan:** artefacts/2026-04-21-skill-routing-cli-tools/test-plans/src.1-skill-routing-cli-integration-test-plan.md
**DoR artefact:** artefacts/2026-04-21-skill-routing-cli-tools/dor/src.1-skill-routing-cli-integration-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1a, T1b ✓ — `generate-status-report.js` callout present. T2 ✓ — `--daily` added by PR #178 to workflow SKILL.md. Script accepts `--daily` as a no-op alias (daily is default); correct output produced either way. | Automated: tests/check-sro1-skill-routing.js T1, T2 | None — deviation resolved by PR #178 merge + script alias added 2026-04-23. |
| AC2 | ✅ | T3 ✓ — `--weekly` present. T4 ✓ — trigger phrases present. Daily routing phrase now includes `--daily`. | Automated: T3, T4 | None |
| AC3 | ✅ | T5a, T5b ✓ — `record-benefit-comparison.js` present. T6 ✓ — `--feature` flag present. T7 ✓ — `EXP-001` or "benefit measurement" present. | Automated: T5, T6, T7 | None |
| AC4 | ✅ | T8 ✓ — non-blocking language (defer/skip/optional/non-blocking) present near benefit comparison callout. | Automated: T8 | None |
| AC5 | ✅ | T-NFR1a ✓ — `node scripts/generate-status-report.js` invocation prefix present. T-NFR1b ✓ — `node scripts/record-benefit-comparison.js` invocation prefix present. Both `--daily` and `--weekly` variants present after PR #178. | Automated: T-NFR1a, T-NFR1b | None — deviation resolved. |

**No deviations.** The `--daily` gap present at initial DoD assessment was resolved by: (1) PR #178 merging `--daily` into `workflow/SKILL.md` callouts, and (2) adding `--daily` as a documented no-op alias in `generate-status-report.js` (2026-04-23). All 12/12 tests now pass.

---

## Scope Deviations

None. The `--daily` deviation recorded at initial assessment was resolved prior to final sign-off.

---

## Test Plan Coverage

**Tests from plan implemented:** 10/10
**Tests passing in CI:** 10/10 (all passing after PR #178 merge)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — workflow SKILL.md references generate-status-report.js | ✅ | ✅ | T1a + T1b both pass |
| T2 — workflow SKILL.md references --daily flag | ✅ | ✅ | Resolved by PR #178 merge |
| T3 — workflow SKILL.md references --weekly flag | ✅ | ✅ | |
| T4 — workflow SKILL.md includes status report trigger routing phrases | ✅ | ✅ | |
| T5 — improve SKILL.md references record-benefit-comparison.js | ✅ | ✅ | T5a + T5b both pass |
| T6 — improve SKILL.md references --feature flag | ✅ | ✅ | |
| T7 — improve SKILL.md references EXP-001 or Benefit Measurement | ✅ | ✅ | |
| T8 — improve SKILL.md benefit comparison section is non-blocking | ✅ | ✅ | |
| T-NFR1a — workflow SKILL.md uses node scripts/ invocation prefix | ✅ | ✅ | |
| T-NFR1b — improve SKILL.md uses node scripts/ invocation prefix | ✅ | ✅ | |

**Gaps:** None. All 10 planned tests implemented. T2 fails due to the documented deviation, not a missing test.

---

## NFR Status

No NFRs defined for this story (per DoR artefact).

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — CLI observability tool discovery rate (proportion of sessions where operator uses status report or benefit comparison tool) | ✅ | After first operator session using the merged routing | Baseline: 0% (neither tool referenced by any skill prior to this story). Both tools now routed via workflow and improve SKILL.md respectively. Signal measurable on next real pipeline session. |

---

## Outcome

**COMPLETE**

Follow-up actions:
1. Measure M1 signal after next operator session using the new routing; update pipeline-state.json via `/record-signal`.

---

## DoD Observations

1. **`--daily` flag gap — AC/script interface mismatch (candidate for /improve):** The story ACs and test plan were authored before confirming the script's CLI interface. `generate-status-report.js` uses daily-as-default (no `--daily` flag), but the ACs specified the flag explicitly. For future stories touching CLI tool routing in skills: verify the exact script CLI flags before authoring ACs and test assertions. Add to `/definition` checklist: "confirm CLI flags from script before authoring exact invocation ACs".

2. **PR #178 (SKILL.md-only changes) still open at DoD time:** The platform change policy requires SKILL.md changes via PR. This creates a timing gap where the DoD can run on merged implementation code before the corresponding SKILL.md additions are also merged. DoD outcome is based on what is merged; PR #178 contents are not yet assessed here and will require a supplementary check or updated trace when merged.
