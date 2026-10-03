## Definition of Ready: Paginate the signals panel to handle real-world signal volume

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
**Test plan reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

---

## Contract Proposal

See `artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s3-dor-contract.md` for the full Contract Proposal and Contract Review.

**Contract review verdict:** ✅ PASSED — proposed implementation aligns with all 7 ACs, no mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Solo operator (you, today)" — matches the established persona convention already used by `ep2-s1`/`ep2-s2` |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs. Review Run 1 noted AC3/AC5 omit an explicit "When" clause (1-L1, LOW, not blocking) — substantively Given/Then, testable, unambiguous |
| H3 | Every AC has at least one test in the test plan | ✅ | AC Coverage table: AC1–AC6 each have unit + integration coverage; AC7 has dedicated E2E coverage |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 items named |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 3 — Self-improvement loop accessibility |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: 0 HIGH, 0 MEDIUM, 1 LOW (not blocking) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | 1 gap (AC7, CSS-layout-dependent) explicitly acknowledged and resolved via real E2E tooling — not left open |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies names `ep2-s1` as upstream — `schemaDepends: ["prStatus", "dodStatus"]` declared; both fields confirmed present in `.github/pipeline-state.schema.json`. `ep2-s1`'s own real current values (`prStatus: "merged"`, `dodStatus: "complete"`) confirm the upstream dependency is not just schema-valid but genuinely already satisfied — stronger than the equivalent check at `ep2-s2`'s own DoR time, where `ep2-s1` had not yet merged. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Thorough (real measured scale, pagination mechanism, order-preservation decision, extension-not-replacement decision); Review Run 1 Category E: 0 HIGH/MEDIUM |
| H-E2E | AC7 is `CSS-layout-dependent`; E2E tooling (Playwright) is already configured in this repo — condition for blocking (no tooling AND no RISK-ACCEPT) is not met | ✅ | Not blocking — real Playwright E2E test assigned (test plan's own E2E Tests section) |
| H-NFR | NFR profile exists at `artefacts/2026-09-28-weeb-ui-learnings-and-improvements/nfr-profile.md` | ✅ | Exists, already carries `ep2-s3`-specific rows (Performance, Accessibility) added prior to this DoR pass |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance framework applies (confirmed in NFR profile's own Compliance section) |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" — confirmed in NFR profile |
| H-NFR-profile | NFR profile presence (story declares real NFRs) | ✅ | Story's own NFR section has 3 populated items (Performance, Accessibility, Security) — profile confirmed to exist |
| H-GOV | Governance approval — discovery artefact `Approved By` | ✅ | Read directly from `discovery.md`: "Hamish King — Operator / Product Owner — 2026-09-29" — non-blank, non-engineering role |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | This story introduces no injectable adapter (`setX()` function) — `paginateSignals` is a plain pure function, not an adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set on this story |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set on this story |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` not set on this story |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings exist (1 LOW only, not subject to W3) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ Not yet done | Script may not perfectly reflect real-world usage nuance | Pending — same standing item as every other story in this feature (`ep1-s1`, `ep1-s2`, `ep2-s1`, `ep2-s2`); RISK-ACCEPT logged in `decisions.md`, 2026-10-04 entry |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | AC7's own gap has a clear, resolved handling decision (real E2E test), not "UNCERTAIN" | — |

---

## Oversight level

**Oversight level:** Medium (per the parent epic's own declared oversight: "Signal seeding requires correct injection of signal context into the skill session model... Medium oversight ensures the session model handles signal seeds correctly before full closure." — the same Medium level already applied to `ep2-s1`/`ep2-s2`.)
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Paginate the signals panel to handle real-world signal volume — artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s3-test-plan.md
DoR contract: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s3-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New pure module: src/web-ui/utils/paginate-signals.js, exporting
  paginateSignals(signals, rawPage) and SIGNALS_PAGE_SIZE (= 50, fixed
  constant, not operator-configurable per the story's own Out of Scope).
  No I/O, no adapter calls -- matches ep2-s2's own signal-context.js
  precedent for pure, independently-unit-testable helper modules.
- Extend src/web-ui/routes/signals-panel.js's handleGetSignalsPanelHtml to
  read req.query.page (a plain string or undefined -- confirmed via direct
  read of server.js's own parseQuery, never pre-parsed or an array) and
  call paginateSignals before rendering.
- Extend src/web-ui/views/signals-panel-view.js's renderSignalsPanel to
  accept an OPTIONAL 3rd `pagination` parameter. CRITICAL: when omitted,
  the function must render exactly as it does today -- ep2-s1's own 7
  existing test call sites in tests/check-ep2-s1-signals-panel.js all
  call it with exactly 2 arguments and must continue to pass UNMODIFIED.
  The existing empty-state short-circuit (zero signals -> "No signals
  yet") must remain the first check, before any pagination-bar markup is
  considered -- a paginated render with 0 real signals must still hit
  that branch, never a "page 1 of 1, 0-0 of 0" bar.
- Preserve getSignals()'s own existing signal order -- pagination slices
  the existing output, PAGE_SIZE at a time; introduces no new sort policy.
- Do NOT touch ep2-s1's own existing Accessibility E2E test
  (tests/e2e/ep2-s1-signals-panel.spec.js) -- AC7 adds a new, additional
  E2E spec (tests/e2e/ep2-s3-signals-pagination.spec.js); it does not
  require modifying the already-shipped one.
- Do NOT implement operator-interactive sort/filter/dismissal/bulk-action
  controls -- explicitly out of scope, deferred to Phase 5.
- Do NOT add a dedicated test for the Security NFR beyond the AC4 tests
  already planned -- the test plan explicitly cross-references AC4's own
  tests rather than naming a separate test, to avoid repeating ep2-s2's
  own DoD finding (a named-but-never-implemented NFR test).
- DO implement the dedicated NFR-Performance test named in the test plan
  (tests/check-ep2-s3-signals-pagination.js) as a REAL test() call --
  this is explicitly named and required, not optional, per the same
  lesson.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a
  PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning
**Signed off by:** Not required (Medium oversight)
