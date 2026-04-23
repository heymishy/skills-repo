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
| AC1 | ⚠️ | T1a, T1b ✓ — `generate-status-report.js` callout present in workflow SKILL.md. T2 ✗ — `--daily` flag absent. Script does not support `--daily`; daily is the default (no flag). Callout uses `node scripts/generate-status-report.js` (produces daily report correctly). | Automated: tests/check-sro1-skill-routing.js T1, T2 | `--daily` flag specified in AC but omitted from implementation. Daily report still produced correctly — `--daily` flag does not exist on the underlying script. |
| AC2 | ⚠️ | T3 ✓ — `--weekly` present. T4 ✓ — trigger phrases present. Daily routing phrase links to bare `node scripts/generate-status-report.js` (no `--daily`). Same root cause as AC1 deviation. | Automated: T3, T4 | Same as AC1 — `--daily` variant absent from daily routing response. |
| AC3 | ✅ | T5a, T5b ✓ — `record-benefit-comparison.js` present. T6 ✓ — `--feature` flag present. T7 ✓ — `EXP-001` or "benefit measurement" present. | Automated: T5, T6, T7 | None |
| AC4 | ✅ | T8 ✓ — non-blocking language (defer/skip/optional/non-blocking) present near benefit comparison callout. | Automated: T8 | None |
| AC5 | ⚠️ | T-NFR1a ✓ — `node scripts/generate-status-report.js` invocation prefix present. T-NFR1b ✓ — `node scripts/record-benefit-comparison.js` invocation prefix present. `--daily` variant absent — same deviation as AC1/AC2. | Automated: T-NFR1a, T-NFR1b | AC5 requires both `--daily` and `--weekly` variants in workflow SKILL.md. `--weekly` present; `--daily` absent. |

**Deviation summary:** All deviations trace to a single root cause — `generate-status-report.js` has no `--daily` flag (daily is the default; invoking the script with no flags generates the daily report). The ACs and test plan were authored assuming `--daily` would exist. The implementation correctly reflects the script's actual CLI interface. The operator calling `node scripts/generate-status-report.js` receives the daily report as intended.

---

## Scope Deviations

**One scope deviation: `--daily` flag absent from workflow SKILL.md daily invocation callout.**

Root cause: `scripts/generate-status-report.js` CLI interface uses `--weekly` to select weekly output; daily is the default (no flag). The ACs specified `node scripts/generate-status-report.js --daily`, but this flag is not implemented on the script (changes to `generate-status-report.js` were out of scope for this story per DoR contract).

Impact: The operator receives the correct output. The deviation is cosmetic (wording mismatch between AC text and SKILL.md instruction), not a functional failure.

Follow-up options (for operator to decide):
1. Add `--daily` as an ignored alias in `generate-status-report.js` in a follow-up task, then re-run tests — resolves T2.
2. Accept via RISK-ACCEPT: acknowledge that the AC wording was aspirational and the implementation is correct as-is; update the test assertion for T2 to check for `node scripts/generate-status-report.js` without requiring `--daily`.

---

## Test Plan Coverage

**Tests from plan implemented:** 10/10
**Tests passing in CI:** 9/10 (T2 failing — `--daily` deviation)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — workflow SKILL.md references generate-status-report.js | ✅ | ✅ | T1a + T1b both pass |
| T2 — workflow SKILL.md references --daily flag | ✅ | ❌ | FAILING — `--daily` not present; see AC deviation |
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

**COMPLETE WITH DEVIATIONS**

Follow-up actions:
1. (Operator choice — not blocking) Resolve T2 deviation: either add `--daily` alias to `generate-status-report.js` (new short-track story) or accept via RISK-ACCEPT and update T2 assertion.
2. Merge PR #178 (src.1 SKILL.md-only additions — platform change policy PR; all CI green) to land remaining SKILL.md updates.
3. Measure M1 signal after next operator session using the new routing; update pipeline-state.json via `/record-signal`.

---

## DoD Observations

1. **`--daily` flag gap — AC/script interface mismatch (candidate for /improve):** The story ACs and test plan were authored before confirming the script's CLI interface. `generate-status-report.js` uses daily-as-default (no `--daily` flag), but the ACs specified the flag explicitly. For future stories touching CLI tool routing in skills: verify the exact script CLI flags before authoring ACs and test assertions. Add to `/definition` checklist: "confirm CLI flags from script before authoring exact invocation ACs".

2. **PR #178 (SKILL.md-only changes) still open at DoD time:** The platform change policy requires SKILL.md changes via PR. This creates a timing gap where the DoD can run on merged implementation code before the corresponding SKILL.md additions are also merged. DoD outcome is based on what is merged; PR #178 contents are not yet assessed here and will require a supplementary check or updated trace when merged.
