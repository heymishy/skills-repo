# Definition of Ready: alrf-s12 — Add a --dry-run flag to scripts/purge-e2e-tenants.js

**Story reference:** artefacts/2026-07-26-function-level-audit/stories/alrf-s12-purge-script-dry-run-flag.md
**Test plan reference:** artefacts/2026-07-26-function-level-audit/test-plans/alrf-s12-purge-script-dry-run-flag-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-27

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As the operator running a one-off manual purge..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC4 |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1/AC3 → dry-run test; AC2/AC3 → no-flag test; AC4 → manual grep check |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | See story |
| H5 | Benefit linkage field references a named metric | N/A | Short-track — no new benefit hypothesis, closes an operational tooling gap |
| H6 | Complexity is rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Coverage gaps: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | No new pattern introduced |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ | No AC is CSS-layout-dependent |

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | None — confirmed | Copilot |
| W2 | Scope stability is declared | ✅ | Stable | Copilot |
| W3 | MEDIUM review findings acknowledged | N/A | Short-track skips /review | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Self-reviewed only | Low risk given complexity 1 and unmodified underlying functions |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | None | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: alrf-s12 — Add a --dry-run flag to scripts/purge-e2e-tenants.js — artefacts/2026-07-26-function-level-audit/stories/alrf-s12-purge-script-dry-run-flag.md
Test plan: artefacts/2026-07-26-function-level-audit/test-plans/alrf-s12-purge-script-dry-run-flag-test-plan.md

Goal:
Add a `--dry-run` CLI flag to scripts/purge-e2e-tenants.js's require.main===module
entrypoint block only. When present, call findE2eTenantIds (read-only) instead of
purgeE2eTenants, print "[dry-run] Would purge N e2e-test- tenant(s): ...", and exit 0.
Do not modify findE2eTenantIds/purgeTenant/purgeE2eTenants themselves.

Constraints:
- CI's existing cleanup steps (e2e.yml, staging-deploy.yml) must continue to call
  the script with no flag — do not change those workflow files.
- This repo's platform change policy requires scripts/ changes to go through a PR,
  not a direct push to master.
- Open a draft PR when tests pass.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — Low oversight, complexity 1, no unresolved warnings.
**Signed off by:** Not required (Low oversight)
