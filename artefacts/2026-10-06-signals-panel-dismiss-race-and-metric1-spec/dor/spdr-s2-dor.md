# Definition of Ready Checklist

## Definition of Ready: Automated Playwright timing spec for Metric 1

**Story reference:** artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s2-metric1-playwright-timing-spec.md
**Test plan reference:** artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/test-plans/spdr-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator who wants a repeatable, caveat-free read on Metric 1" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | Direct E2E coverage for all 4 |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Metric 1 — Time-to-triage, with an explicit non-replacement scope note (decisions.md) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review ran — short-track. Logged in `decisions.md`. |
| H8 | Test plan has no uncovered ACs | ✅ | None |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with confirmed seeding precedent, the specific gap in the existing fixture shape, and the backward-compatibility argument for AC4 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Not CSS-layout-dependent |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery — short-track. Named follow-up, operator explicitly asked to pick up ("Do both follow ups please", 2026-10-06). Logged in `decisions.md`. |
| H-ADAPTER | D37 | ✅ N/A | No new adapter — `/test/seed-signals`'s extension is additive to an existing test-only seam, not a new injectable adapter |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption.

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ |
| W2 | Scope stability declared | ✅ |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md` — no new npm dependency (Playwright already a devDependency per ADR-018).

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Automated Playwright timing spec for Metric 1
  — artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s2-metric1-playwright-timing-spec.md
Test plan: artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/test-plans/spdr-s2-test-plan.md

Goal: Make every test in the test plan pass. Do not add scope beyond the ACs.

Constraints:
- Extend src/web-ui/server.js's /test/seed-signals to accept an optional
  `signals` array, falling back to the existing uniform-count generator
  when absent — do not change its existing behaviour for count-only callers
- New spec file: tests/e2e/spdr-s2-metric1-timing.spec.js, using the
  existing withAuth fixture (tests/e2e/fixtures/auth.js)
- Do NOT add this spec to npm test's default chain (ADR-018)
- Do NOT touch ep2-s1-signals-panel.spec.js or ep2-s3-signals-pagination.spec.js
  — re-run them unchanged to confirm AC4
- Open a draft PR when tests pass

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
