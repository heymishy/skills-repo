# Definition of Ready: Shared session-origin derivation + product feature-list indicator

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s1-shared-derivation-and-product-list-indicator.md
**Test plan reference:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s1-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-09-08

**Contract Proposal:** artefacts/2026-09-08-session-origin-badge/dor/sob-s1-dor-contract.md

**Contract review:** ✅ Passed — proposed implementation aligns with all 9 ACs (see contract's AC-to-test-approach table). No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Hamish King, Platform Owner" — matches discovery/benefit-metric's own named persona |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 9 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | See sob-s1-test-plan.md AC Coverage table — no gaps |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | "List-view session-origin visibility" |
| H6 | Complexity is rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH. The 1 MEDIUM (1-M1) was resolved (story fixed), not merely acknowledged |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 5 constraints listed (incl. the 1-M1 fix); Category E review found 0 HIGH |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No AC triggers Step 3a's browser-layout scan — static, non-interactive indicator |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-08-session-origin-badge/nfr-profile.md` |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ N/A | No compliance NFRs (not regulated) |
| H-NFR3 | Data classification field not blank | ✅ | "Public" |
| H-NFR-profile | NFR profile presence when story declares NFRs | ✅ | Story's NFR section is populated (not "None"); nfr-profile.md exists |
| H-GOV | `## Approved By` in discovery.md has ≥1 non-blank named entry, not engineer-only | ✅ | Read directly from `discovery.md`: "Hamish King — Platform Owner — 2026-09-08" — non-engineering role. Positive M1 signal recorded |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A (reasoned) | `_getSessionOriginBulk`/`setGetSessionOriginBulk` follows the established **real-by-default, test-injectable** pattern (`_getArtefactCountsBulk`'s own precedent — confirmed by reading `products.js` directly), not D37's stub-throws pattern. D37's mandatory stub-throw/explicit-server.js-wiring requirement applies to adapters that default to an unsafe stub; this seam defaults to the real Postgres-backed implementation, so no separate wiring task or wiring AC is required |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 1-M1 was resolved directly in the story, not just acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases at pre-code sign-off | RISK-ACCEPT logged in `decisions.md` (2026-09-08) — verified as the post-merge smoke test instead |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | Gap table states "None" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These are appended below.

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` (sha256 `8c188790ec1c3808901cd26821ffabf9f1be9e16d5396dee25ea5c13ab6d7fc2`) — read in full before implementing.

Most directly relevant sections for this story:

- **Injectable adapter pattern (D37/ADR-009)**: read this section, then note the distinction argued in H-ADAPTER above — this story's seam deliberately does NOT follow the stub-throws shape this section describes; it follows the "real-by-default" shape `_getArtefactCountsBulk` already established. Do not add a throwing stub or a separate server.js wiring step; that would be over-applying D37 to a case it wasn't designed for.
- **HTML render function unit test pattern**: assert on specific string fragments (e.g. the indicator's class name and its `title`/`aria-label` text), never a full-HTML snapshot. Cover happy path, XSS-safety (not directly relevant here since no user-supplied string is rendered by this feature, but keep the pattern for the row-rendering function generally), and empty/null data (AC5's zero-completed-stages case).
- **Shared shell module**: this story does not add a new full-page route — it modifies an existing one (`handleGetProductView`/`_renderProductView`). No new `renderShell`/`renderShellWithNav` call is introduced; confirm the existing call is left unchanged.
- Stack constraints (no new npm dependencies, no Express) apply as always — nothing in this story requires a new dependency.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Shared session-origin derivation + product feature-list indicator — artefacts/2026-09-08-session-origin-badge/stories/sob-s1-shared-derivation-and-product-list-indicator.md
Test plan: artefacts/2026-09-08-session-origin-badge/test-plans/sob-s1-test-plan.md
Contract: artefacts/2026-09-08-session-origin-badge/dor/sob-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js, no new npm dependencies, no Express (raw http.createServer) — see copilot-instructions.md and .github/standards/web-ui/web-ui-patterns.md
- New injectable seam (_getSessionOriginBulk/setGetSessionOriginBulk) must be
  real-by-default (lazy require of getSessionOriginForJourneys), NOT a
  throw-by-default stub — do not apply the D37 stub-throws pattern here; see
  H-ADAPTER's reasoning in this DoR artefact and _getArtefactCountsBulk's
  existing implementation for the exact shape to mirror.
- The bulk call's ID list MUST be built from mergedItems.filter(item =>
  item.journeyId).map(item => item.journeyId) — NOT the raw rows array
  _getArtefactCountsBulk uses. This was review finding 1-M1; getting it wrong
  silently breaks AC4.
- Out of scope: /journey and org kanban wiring (separate stories sob-s2,
  sob-s3); any click/drill-down interaction on the indicator.
- Architecture standards: read .github/architecture-guardrails.md and
  .github/standards/web-ui/web-ui-patterns.md before implementing. Do not
  introduce patterns listed as anti-patterns or violate named mandatory
  constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)
