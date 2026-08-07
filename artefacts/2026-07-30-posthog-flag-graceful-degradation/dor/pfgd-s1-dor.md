# Definition of Ready Checklist

## Definition of Ready: Degrade gracefully when the PostHog flags adapter is unwired, instead of 500ing every gated page

**Story reference:** artefacts/2026-07-30-posthog-flag-graceful-degradation/stories/pfgd-s1-posthog-flag-graceful-degradation.md
**Test plan reference:** artefacts/2026-07-30-posthog-flag-graceful-degradation/test-plans/pfgd-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly prevents a repeat of the just-observed production outage |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Explicit non-goal: does not weaken isEnabled()'s D37 contract |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Degrade gracefully when the PostHog flags adapter is unwired, instead of 500ing every gated page — artefacts/2026-07-30-posthog-flag-graceful-degradation/stories/pfgd-s1-posthog-flag-graceful-degradation.md
Test plan: artefacts/2026-07-30-posthog-flag-graceful-degradation/test-plans/pfgd-s1-test-plan.md

Goal:
The fix is already implemented: a new isEnabledOrDefault() wrapper added to
src/web-ui/modules/posthog-flags.js, and all 5 existing isEnabled() call
sites (products.js x2, impersonation.js x2, settings.js x1) switched to use
it. New test file tests/check-posthog-flags-graceful-degradation.js (5
tests, all passing). Open a PR, confirm CI passes, and report back once
merged.

Oversight level: Low (additive wrapper function + call-site swap, no change
to any existing function's contract, full existing test suite for the
affected call sites re-run and passing unchanged)
```

---

## Sign-off

**Oversight level:** Low — additive, backward-compatible change; `isEnabled()`'s own contract and every existing test asserting it are unchanged.
**Sign-off required:** No (Low — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via direct instruction to add defense-in-depth while setting the production PostHog secret, 2026-07-30
