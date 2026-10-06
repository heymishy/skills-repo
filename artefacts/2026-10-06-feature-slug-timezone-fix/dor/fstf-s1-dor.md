# Definition of Ready Checklist

## Definition of Ready: Generate the feature-slug date prefix in the operator's own saved timezone

**Story reference:** artefacts/2026-10-06-feature-slug-timezone-fix/stories/fstf-s1-timezone-aware-feature-slug-date.md
**Test plan reference:** artefacts/2026-10-06-feature-slug-timezone-fix/test-plans/fstf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator creating a new feature... near a UTC day boundary" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 4 directly covered |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | Correctness fix, no metric moved — matches `dswf-s1`/`wswda-s1`/`spdr-s1` precedent; real incident evidence given instead |
| H6 | Complexity rated | ✅ | 2 (two call sites + a new shared module, still well-understood) |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review ran — short-track. Logged in `decisions.md`. |
| H8 | Test plan has no uncovered ACs | ✅ | None |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with confirmed root cause (exact file/line, both call sites), confirmed reusable existing infrastructure, and an explicit honest caveat about the fix's own limits |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Pure backend fix |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery — short-track. Operator explicitly requested this fix ("Yes fix it short track please", 2026-10-06). Logged in `decisions.md`. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | `getTenantLocalDateString` is a plain function, not an injectable adapter — explicitly justified in the story's own Architecture Constraints (an operator with no saved timezone is the expected majority case, not a misconfiguration to alarm on) |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption.

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ |
| W2 | Scope stability declared | ✅ |
| W4 | Verification script reviewed by a domain expert | ⚠️ RISK-ACCEPT — same standing acknowledgement as every other story this session (solo-operator context) |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md` — no new npm dependency (`Intl` is a Node built-in).

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Generate the feature-slug date prefix in the operator's own saved timezone
  — artefacts/2026-10-06-feature-slug-timezone-fix/stories/fstf-s1-timezone-aware-feature-slug-date.md
Test plan: artefacts/2026-10-06-feature-slug-timezone-fix/test-plans/fstf-s1-test-plan.md

Goal: Make every test in the test plan pass. Do not add scope beyond the ACs.

Constraints:
- New file: src/web-ui/modules/person-locale.js, exporting
  getTenantLocalDateString(pool, identityKey) -- plain async function, not
  a D37 adapter (see story's own Architecture Constraints for why)
- Use Intl.DateTimeFormat('en-US', {timeZone, year:'numeric', month:'2-digit',
  day:'2-digit'}).formatToParts(date) to build the YYYY-MM-DD string
  explicitly -- do not rely on a locale's default separator formatting
- routes/journey.js: reuse the existing module-level _featureEditsPool
  (already wired to the real pool in server.js) -- no new wiring call
- routes/products.js: reuse the existing pool parameter already threaded
  into handlePostProductFeature -- no new wiring call
- Never let a timezone-lookup failure block or throw out of journey
  creation (AC3) -- the helper itself must catch everything internally
- New test file: tests/check-fstf-s1-timezone-aware-slug.js
- Do NOT touch routes/settings.js (si-s2's own file) -- only consume its
  existing people.timezone column
- Open a draft PR when tests pass

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
