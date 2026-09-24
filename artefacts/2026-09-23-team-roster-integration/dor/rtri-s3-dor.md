# Definition of Ready: Render a real member list on /team/members

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s3.md
**Test plan reference:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s3-test-plan.md
**Contract:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s3-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-09-24

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, correctly names `escHtml()` as the mechanism (matching `handleGetTeamMembers`'s own existing usage for role options), not a nonexistent templating engine.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "tenant admin viewing `/team/members`" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5/5 covered (3 unit, 1 integration — AC5 counted with AC1) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | "/team/members shows a real list" |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: PASS, 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream `rtri-s1` — `schemaDepends: ["reviewStatus", "testPlan", "stage"]` declared; all 3 fields confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025/026 + escHtml() mechanism named; review Architecture compliance score 5 (Run 2) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ | No layout-dependent ACs — N/A |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-23-team-roster-integration/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance frameworks apply — N/A |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Story NFRs populated, profile exists |
| H-GOV | Approved By ≥1 non-engineering entry | ✅ | "Hamish King — Operator/Product Owner — 2026-09-23" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()` adapter — direct `pool` parameter, matches `handleGetTeamMembers`'s existing convention |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | No MEDIUM findings in any review run | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Script may not perfectly reflect real-world usage nuance | Hamish King, 2026-09-24 — logged in decisions.md |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table: None | — |

---

## Standards injection

**Domain tags:** `web-ui`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Appended to the Coding Agent Instructions block below.

---

## Oversight level

**Epic oversight:** Low (per `epics/real-team-roster.md`) — no sign-off required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Render a real member list on /team/members — artefacts/2026-09-23-team-roster-integration/stories/rtri-s3.md
Test plan: artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Extend `handleGetTeamMembers` (`src/web-ui/routes/team-management.js`) to
  call `teamManagement.listTeamMembers(pool, req.session.tenantId)` (the
  function rtri-s1 adds to `src/web-ui/modules/team-management.js`) and
  render a member-list fragment above the existing add-teammate form.
- Every identity/role value inserted into the response HTML MUST go through
  `htmlShell.escHtml()` — this page is built via manual string concatenation
  (no templating engine), matching `handleGetTeamMembers`'s own existing use
  of `escHtml()` for role `<option>` values. Never concatenate an identity
  string into HTML raw (MC-SEC-01, AC5).
- Empty state: an explicit "No team members yet" (or equivalent) string when
  `listTeamMembers` returns `[]` — not a blank list container.
- List markup: a real `<ul>` or `<table>`, not `<div>`-as-row (Accessibility NFR).
- Do NOT modify `handleAddTeammate`, the add-teammate form's markup/action,
  or anything in `team-invitations.js`/`client-invitations.js`.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Sections directly applicable to this story:]

- **Shared shell module — canonical escHtml():** THIS IS THE CENTRAL RULE FOR
  THIS STORY. `escHtml()` MUST be applied to every identity/role string before
  injecting it into the HTML response. Do not re-implement or duplicate an
  escaping function locally — import from `src/web-ui/utils/html-shell.js`,
  exactly as this same file's `handleGetTeamMembers` already does for its
  role `<option>` values.
- **HTML render function unit test pattern:** apply the 3-point minimum
  (happy path, XSS injection, empty/null data) — already reflected in this
  story's own test plan (AC1, AC5, AC2 respectively). Assert on specific
  string fragments, not full-snapshot equality.
- **Every renderShell() caller MUST supply Products-nav sidebar data:** this
  story does not introduce a new `renderShell()`/`renderShellWithNav()` call
  site — `handleGetTeamMembers` already calls `renderShellWithNav()`
  correctly (pncg-s1). Do not change that call or its arguments.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read
  in full before implementing.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)
