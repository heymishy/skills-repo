## Definition of Ready: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**Review artefact:** artefacts/2026-09-18-design-system-adoption/review/dsa-s2-review-2.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18 (re-signed 2026-09-19 — full live-data-wiring amendment, see `decisions.md`)

---

## Contract Proposal

**What will be built:**
Restyle `src/web-ui/views/dashboard-view.js`'s `renderDashboard` function and `src/web-ui/routes/dashboard.js`'s `handleDashboard` handler to match `DESIGN.md`'s "Dashboard/app shell" layout pattern, using the token values `dsa-s1` already added to `html-shell.js`. **Amended scope:** wire `renderDashboard` into `handleDashboard`'s response (replacing the current placeholder `<h1>Dashboard</h1>` body — confirmed `renderDashboard` is otherwise dead code, never called by any live route). Supply real data to `renderDashboard`'s props: (1) a new mapping function translating `getPendingActions`'s real return shape (`{items: [{featureName, artefactType, daysPending, artefactUrl}], bannerMessage}`) into `renderDashboard`'s expected `actions`/`pendingActionsCount` shape; (2) a new static skills-catalog array for the `skills` prop; (3) a new derivation function producing `inProgressCount`/`recent` from `journey-store.js`'s `listJourneys()`/`completedStages[]`.

**What will NOT be built:**
Fixing the stale/dead nav links tracked separately in `web-ui-experience-redesign`'s Epic B — that is IA work, not visual restyle. No change to `getPendingActions`'s own internal logic, validation, or error handling — reused exactly as it already works, only its already-existing `setGetPendingActions` test-injection seam is exercised (not modified). No change to `listJourneys`/`completeStage`/`journey-store.js`'s own internals. No rebuild of `renderShell`'s sidebar (already real, shared, token-correct after `dsa-s1`). No new session-status taxonomy beyond "done" for recent-session entries.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on sidebar/main-column layout | E2E |
| AC4 (no regression) | Playwright: re-run `psh-s4-dashboard-layout.spec.js` + any additional specs found by `/verify-completion`'s own coverage check | E2E |
| AC5 (real pending actions) | Unit (mapping-function shape) + Playwright (rendered content with a seeded adapter result) | Unit, E2E |
| AC6 (real skills catalog) | Unit (catalog shape) + Playwright (rendered cards + real session-start link) | Unit, E2E |
| AC7 (real in-progress count / recent sessions) | Unit (derivation-function shape) + Playwright (populated + empty-state cases) | Unit, E2E |

**Assumptions:**
`handleDashboard`/`renderDashboard` are the real target functions (confirmed via direct code read). `dsa-s1`'s token work lands first, per Dependencies (already merged — confirmed). `getPendingActions`'s `setGetPendingActions` test-injection seam is real and already exercised by `handleGetActions`'s own existing test coverage — confirmed via direct code read, not assumed. **Open assumption carried into `/implementation-plan`:** `listJourneys()`'s real production wiring status (vs. `NODE_ENV=test`-only wiring) has not been independently re-confirmed — `dsa-s1`'s own Task 6 finding only established the test-mode wiring. This must be checked before AC7 is implemented as designed; if unwired in production, that is a new finding requiring its own scope decision at `/implementation-plan` time, not something to silently work around.

**Estimated touch points:**
Files: `src/web-ui/routes/dashboard.js`, `src/web-ui/views/dashboard-view.js`, a new small skills-catalog config (file location TBD at `/implementation-plan` — likely a new small module or an inline const in `dashboard.js`). Services: `adapters/action-queue.js` (consumed, not modified), `modules/journey-store.js` (consumed, not modified). APIs: none new — no new routes.

---

## Contract Review

✅ **Contract review passed (re-reviewed for the amendment)** — proposed implementation aligns with all 7 ACs, no mismatches. The original contract's "What will NOT be built" line ("No change to `handleDashboard`'s existing adapters... or `handleGetActions`") is corrected here: the amendment does NOT change the adapter's own internals (still true, still respected), but it DOES now consume `_getPendingActions`/`setGetPendingActions` inside `handleDashboard` for the first time — the original contract's phrasing was written before the amendment and would have contradicted the amended test plan's own AC5 test approach if left uncorrected (CLAUDE.md's own B1/D1 rule: when a DoR contract and the real test plan conflict, the contract is the authoring defect). Corrected above.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Hamish King (Founder/Operator)" — unchanged, real named individual |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs (was 4) |
| H3 | Every AC has at least one test | ✅ | AC1-AC7 all covered, 15 tests total |
| H4 | Out-of-scope populated | ✅ | 7 items (expanded from 3 during amendment) |
| H5 | Benefit linkage references named metric | ✅ | "Visual consistency across the 4 real screens" — unchanged |
| H6 | Complexity rated | ✅ | Rating: 3 (amended from 2, with documented rationale) |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 2 (2 MEDIUM, both RISK-ACCEPTed in decisions.md) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps, all 7 ACs covered |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Extensively populated (real file/function/data-shape names); Category E scored 5/5 in run 2 |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | AC1-3 are layout-dependent, covered by configured Playwright tooling — no block |
| H-NFR | NFR profile exists | ✅ | Feature `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact as `dsa-s1` — already confirmed |

**H8-ext:** Dependencies lists `dsa-s1` as upstream (token work, already merged — confirmed via direct check that `--success`/`--warn`/`--danger` exist in the current `html-shell.js`) — same-feature story dependency, not a cross-story pipeline-state schema field dependency. `schemaDepends` not applicable.

**H-ADAPTER:** No NEW injectable adapter is introduced by this story — `getPendingActions`/`setGetPendingActions` already exist, already follow the D37 injectable-adapter pattern (confirmed: the stub default is the real production function, not a throwing stub, since it was built before D37 was established — this is pre-existing, out-of-scope to retrofit here), and this story only consumes the existing seam for its own new test coverage. Not applicable as a NEW-adapter check.

**H-INF / H-MIG:** Both absent — skipped. No new infrastructure or schema migration; `journey-store.js`/`action-queue.js` are both already-shipped, already-migrated modules being read, not written to differently.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable (unchanged, reasonable call despite scope growth — see review Category D) |
| W3 | MEDIUM review findings acknowledged | ✅ | 2 MEDIUM (1-M1 AC4 wording, 2-M1 AC5/AC6 implementation-detail wording) | Both RISK-ACCEPTed in `decisions.md` |
| W4 | Verification script reviewed | ⚠️ | Verification script not yet amended for AC5-AC7's new scenarios | Acknowledge and proceed — matches `dsa-s1`'s own established W4 precedent (amend the verification script alongside implementation, not as a DoR blocker) |
| W5 | No UNCERTAIN gap items | ✅ | — | Gap table: 3 real, named risks (spec inventory, external-network AC5 coverage boundary, `listJourneys` production-wiring status), none are vague "uncertain" placeholders |

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
Story: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md — artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md

Goal:
Make every test in the test plan pass (15 tests, AC1-AC7). Restyle
src/web-ui/views/dashboard-view.js (renderDashboard) and
src/web-ui/routes/dashboard.js (handleDashboard) to match DESIGN.md's
"Dashboard/app shell" layout pattern and the Skills Platform - Dashboard.dc.html
reference mock, using the token values dsa-s1 already updated in html-shell.js.
Wire renderDashboard into handleDashboard's response, replacing the current
placeholder <h1>Dashboard</h1> body. Build: (1) a mapping function from
getPendingActions's real shape to renderDashboard's expected actions shape,
(2) a small static skills catalog, (3) a derivation function from
listJourneys()/completedStages[] to inProgressCount/recent. Do not add scope
beyond what the tests and ACs specify.

Constraints:
- dsa-s1 has already landed (token work merged) — verify html-shell.js
  already has --success/--warn/--danger before starting (should already be
  true; if not, stop and report — do not re-add them here).
- Do not fix the stale/dead nav links (tracked separately in
  web-ui-experience-redesign) — visual restyle + real-data-wiring only, no
  information-architecture changes.
- Do not modify getPendingActions/listJourneys/completeStage's own internals
  — consume them exactly as they already work.
- Do not rebuild renderShell's sidebar — already real, already correct.
- Before implementing AC7, independently confirm listJourneys()'s real
  production wiring status (not just NODE_ENV=test wiring, already confirmed
  by dsa-s1's own Task 6 finding) — if unwired in production, stop and report
  this as a new finding rather than silently working around it.
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

**Proceed: Yes**
