## Definition of Ready: Restyle the Dashboard to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18

---

## Contract Proposal

**What will be built:**
Restyle `src/web-ui/views/dashboard-view.js`'s `renderDashboard` function and `src/web-ui/routes/dashboard.js`'s `handleDashboard` handler to match `DESIGN.md`'s "Dashboard/app shell" layout pattern (fixed 224px sidebar, fluid main column, max-width 1080px content), applying the token values already renamed/updated by `dsa-s1`'s change to `html-shell.js`.

**What will NOT be built:**
Fixing the stale/dead nav links tracked separately in `web-ui-experience-redesign`'s Epic B — that is IA work, not visual restyle. No change to `handleDashboard`'s existing adapters (`setLogger`, `setGetPendingActions`) or `handleGetActions`.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on sidebar/main-column layout | E2E |
| AC4 (no regression) | Playwright: re-run `psh-s4-dashboard-layout.spec.js` + any additional specs found by `/verify-completion`'s own coverage check | E2E |

**Assumptions:**
`handleDashboard`/`renderDashboard` are the real target functions (confirmed via direct code read). `dsa-s1`'s token rename lands first, per Dependencies.

**Estimated touch points:**
Files: `src/web-ui/routes/dashboard.js`, `src/web-ui/views/dashboard-view.js`. Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs, no mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Hamish King (Founder/Operator)" — real named individual |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC4 covered |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | "Visual consistency across the 4 real screens" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 1 |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated; Category E scored 5/5 |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | No gap-type ACs; Playwright configured |
| H-NFR | NFR profile exists | ✅ | Feature nfr-profile.md exists |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact as `dsa-s1` — already confirmed |

**H8-ext:** Dependencies lists `dsa-s1` as upstream, but this is a same-feature story dependency (token rename landing first), not a cross-story pipeline-state schema field dependency — `schemaDepends` declaration not applicable to this class of dependency. No pipeline-state schema fields are being consumed across stories here.

**H-ADAPTER:** No new adapter introduced. Not applicable.
**H-INF / H-MIG:** Both absent — skipped.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ⚠️ | 1 MEDIUM (1-M1, AC4 verification-method wording) not yet logged | Logging now, see decisions.md |
| W4 | Verification script reviewed | ✅ | — | Operator confirmed |
| W5 | No UNCERTAIN gap items | ✅ | — | Gap table: real, named risk (dashboard spec inventory), not an uncertain item |

---

## Oversight level

**Oversight:** Medium (inherited from parent epic)

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restyle the Dashboard to Match DESIGN.md — artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md

Goal:
Make every test in the test plan pass. Restyle src/web-ui/views/dashboard-view.js
(renderDashboard) and src/web-ui/routes/dashboard.js (handleDashboard) to match
DESIGN.md's "Dashboard/app shell" layout pattern and the Skills Platform -
Dashboard.dc.html reference mock, using the token values dsa-s1 already
updated in html-shell.js. Do not add scope beyond what the tests and ACs specify.

Constraints:
- dsa-s1 must land first (token rename dependency) — verify html-shell.js
  already has --success/--warn/--danger before starting.
- Do not fix the stale/dead nav links (tracked separately in
  web-ui-experience-redesign) — visual restyle only.
- Do not touch handleDashboard's existing adapters (setLogger,
  setGetPendingActions) or handleGetActions.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — share DoR artefact with tech lead awareness
**Signed off by:** Not required (Medium oversight)
