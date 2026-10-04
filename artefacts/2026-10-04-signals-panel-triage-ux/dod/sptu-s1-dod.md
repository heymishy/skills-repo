# Definition of Done: Add `/signals` to the main navigation

**PR:** https://github.com/heymishy/skills-repo/pull/938 | **Merged:** 2026-10-04
**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
**Test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — "Signals" nav row renders in the main sidebar | ✅ | `tests/check-sptu-s1-signals-nav.js` — `renderShell()` output contains `href="/signals"` and visible text "Signals" in the main nav section | `unit` | None |
| AC2 — Nav row shows active state on `/signals` | ✅ | Same test file — `renderShell('signals', ...)` marks only the Signals row `sw-nav-item--active`; live browser check on local dev (2026-10-05) also shows the row rendered and active on `/signals` | `unit` + `integration-real-code` (live local render) | None |
| AC3 — No existing nav row or page is regressed | ✅ | Reused `check-b2-account-nav.js`'s own "zero dangling NAV_ITEMS entries" logic against the post-change array — all of Org board, Pod Manager, Settings, Admin credits, Admin mock gateway, and the new Signals entry resolve | `unit` | None |
| AC4 — Nav row is keyboard-accessible | ✅ | Unit test confirms no `tabindex` override on the rendered `<a>` element. **Additionally closed the DOM-presence-only gap at DoD time**: a real keyboard Tab-walk was performed against a running local dev server (2026-10-05) — starting from the top of `/signals`, the 3rd `Tab` press moved visible browser focus onto the "Signals" nav row with a real, visible focus outline (screenshot evidence captured, Claude-in-Chrome session). This is a genuine sequential-focus-order check, not an inference from attribute absence — see `architecture-guardrails.md`'s `res-s4` anti-pattern precedent, which this closes. | `unit` + `integration-real-code` (live local keyboard-Tab check) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The story's own Out of Scope items (icon/branding bikeshedding, changes to `handleGetSignalsPanelHtml`, unread/count badging) were not touched — confirmed by reviewing the merged diff, which is a single-entry addition to `NAV_ITEMS` in `html-shell.js` only, matching the DoR contract's exclusive-touchpoint constraint.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| renderSidebar includes a "Signals" nav row linking to /signals (AC1) | ✅ | ✅ | |
| renderSidebar marks the Signals row active when active='signals' (AC2) | ✅ | ✅ | |
| NAV_ITEMS: all pre-existing entries still resolve to a registered route (AC3) | ✅ | ✅ | Reused `check-b2-account-nav.js` logic, not duplicated |
| The Signals nav row is a plain, focusable `<a>` with no tabindex override (AC4) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility — nav row keyboard-reachable | ✅ | AC4's unit test (no `tabindex` override) plus the live keyboard-Tab check performed at DoD time (above) |
| Security — no new attack surface | ✅ | Static label/href addition only, no new input or query handling; confirmed at `/review` (Category E, no findings) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Time-to-triage | ❌ | Not yet | `sptu-s1` only enables reaching the page; the full timed filter→sort→dismiss×10 sequence benefit-metric.md defines for Metric 1 also requires `sptu-s3` (sort) and `sptu-s4` (dismiss), neither of which has started. Measurement is not yet possible. |

**Signal: not-yet-measured**
**Evidence note:** Metric 1 requires the full filter→sort→dismiss flow; only the nav-discovery and filter (`sptu-s2`) legs exist so far — sort (`sptu-s3`) and dismiss (`sptu-s4`) are unstarted.
**Date measured:** null

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. This story's origin was itself a real, user-surfaced finding mid-outer-loop ("I can't see a UI path to the feature") that revealed the exact "API shipped, UI never wired" anti-pattern this repo has now fixed three times (`pod-manager`/pmnv-s1, `admin-mock-gateway`/alrf-s7, `sptu-s1`). Worth a standing check at `/review` or `/verify-completion` time for any story whose route handler references an `active:`/nav id that `NAV_ITEMS` doesn't yet contain — not yet proposed as a formal `/improve` candidate, but a recurring enough pattern (3 occurrences) to warrant one if it recurs a 4th time.
2. AC4's test-plan classification ("DOM-structure assertion, not a real sequential-focus-order test — no E2E test required") was followed as written at test-plan time, but the DoD's own UI-evidence gate correctly required closing that gap before marking the AC ✅ with full confidence. No process defect — the test plan's classification was reasonable at the time, and the gate did its job.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add /signals to the main navigation" (sptu-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
