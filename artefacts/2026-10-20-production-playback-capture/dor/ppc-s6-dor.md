# Definition of Ready: Dashboard-shell UX/CX parity and scope/benefit summary

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md
**Contract proposal:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s6-dor-contract.md
**Assessed by:** Claude (session)
**Date:** 2026-10-26

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs. The Contract Proposal explicitly excludes modifying `html-shell.js`/`products.js`, consistent with `/review` Run 2's own `1-H1` fix (reuse `renderShellWithNav`, don't reimplement the shell).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Tenant Product Owner |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC6 all covered, `ppc-s6-test-plan.md` |
| H4 | Out-of-scope populated | ✅ | 4 named exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m1, m3 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | `/review` Run 2 — PASS, 0 HIGH, 0 MEDIUM (was FAIL/1 HIGH in Run 1, resolved) |
| H8 | No uncovered ACs in test plan | ✅ | No gap-table entries beyond the acknowledged AC6 layout-dependence (handled, not a gap) |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | `renderShellWithNav`, `escHtml()`, ADR-025, `DESIGN.md` all named; `/review` Run 2 Category E score 5 |
| H-E2E | Layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | AC6 is CSS-layout-dependent (`hasLayoutDependentGaps: true`), covered by 2 new Playwright E2E tests — tooling configured (ADR-018), no RISK-ACCEPT needed |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` includes `ppc-s6` rows |
| H-NFR2 | Compliance NFR human sign-off | ✅ (N/A) | No compliance framework applies |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Discovery `## Approved By` | ✅ | "Hamish King — Platform Owner — 2026-10-21" — positive M1 signal |
| H-ADAPTER | New adapter wiring AC | ✅ (N/A) | No new injectable adapter introduced — `fetchArtefact` is reused as-is from `ppc-s4`, already wired |
| H-INF | Infra-plan gate | ✅ (N/A) | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ (N/A) | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance | ✅ | `node scripts/check-design-tokens.js` run against the real touch point (`playback-evidence.js`) — PASS (pre-existing `#ddd` violation already fixed this session). `html-shell.js`/`products.js` are NOT touch points for this story (consumed, not modified) and were correctly excluded from this scan — see `decisions.md` 2026-10-26 DESIGN entry for the much larger pre-existing gap found there, logged separately, not blocking this story. |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | |
| W2 | Scope stability declared | ✅ | Stable | |
| W3 | MEDIUM review findings acknowledged | ✅ | `/review` Run 2 has 0 MEDIUM findings for `ppc-s6` | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Same standing gap as `ppc-s1`–`ppc-s5` — no second reviewer in this solo-operator repo | RISK-ACCEPT — see consolidated `decisions.md` entry below |
| W5 | No UNCERTAIN gap-table items | ✅ | AC6's layout-dependence has an explicit, non-UNCERTAIN mitigation (E2E tests, not manual-only) | |

---

## Oversight level

**Medium** (from parent epic) — operator awareness stands in for tech-lead sign-off, same standing convention.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Dashboard-shell UX/CX parity and scope/benefit summary — artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Touch-points: src/web-ui/routes/playback-evidence.js, tests/check-ppc-s6-dashboard-shell-parity.js (new),
tests/e2e/ppc-s6-responsive-summary.spec.js (new)

Do not modify: src/web-ui/utils/html-shell.js, src/web-ui/routes/products.js,
src/web-ui/routes/playback.js, src/utils/dod-parsing.js

Constraints:
- Call renderShellWithNav(pool, req.session.tenantId, opts) from routes/products.js —
  NEVER call _htmlShell.renderShell directly. This is a HARD requirement, not a preference:
  a direct renderShell() call silently drops the Products-nav sidebar, a documented defect
  that has recurred 3 times already in this codebase (bvnd-s1, pan-s1, pncg-s1)
- Apply escHtml() to the fetched discovery.md/benefit-metric.md content at this story's own
  render call site — do not assume it's inherited from extractMarkdownSection/parseBenefitMetricTargets,
  which do NOT escape internally
- Reuse renderCoverageSummaryHtml/computeAcCoverageSummary exactly as-is — do not write a
  second coverage-rendering implementation
- Scope/Benefit cards MUST define an explicit single-column stack below 768px
  (@media (max-width: 768px) or an equivalent reflowing grid) — a fixed multi-column grid
  with no override is not acceptable per DESIGN.md
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Design system: this story is tagged hasDesignSystemTrack:true — no new hardcoded colors;
  run node scripts/check-design-tokens.js against every touched file before opening the PR
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing
  it and do not mark ready for review

## Applicable standards

### web-ui (.github/standards/web-ui/web-ui-patterns.md)
[Full text attached as-is per Standards injection. Most directly relevant sections for this
story: "Shared shell module — canonical source for renderShell() and escHtml()" (the
renderShellWithNav requirement above is a direct instance of this rule); "HTML render
function unit test pattern" (XSS-injection + empty/null coverage, already in the test plan).]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Operator awareness stands in for tech-lead sign-off.
**Signed off by:** Pending — awaiting operator confirmation in chat.

**Definition of ready: PROCEED** (pending sign-off confirmation above)
