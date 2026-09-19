## Definition of Ready: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**Review artefact:** artefacts/2026-09-18-design-system-adoption/review/dsa-s2-review-3.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18 (re-signed 2026-09-19 for the full live-data-wiring amendment; re-signed again 2026-09-19 for the CRITICAL re-target — see `decisions.md`)

---

## Contract Proposal

**What will be built:**
Restyle the REAL, live `GET /dashboard` route — `src/web-ui/routes/products.js`'s `handleGetDashboard`/`_renderProductDashboard` (confirmed by direct routing trace: `server.js:2743-2748` dispatches here whenever `_pshPool` is set, which is true in every real configuration, including `NODE_ENV=test`) — to match `DESIGN.md`'s "Dashboard/app shell" layout pattern, using the token values `dsa-s1` already added to `html-shell.js`. Add a greeting, "Run a skill" grid, "Waiting on you", and "Recent sessions" sections to `_renderProductDashboard`'s body content (currently a simple Products-list). Reuse, not rebuild, Tasks 1-3's already-committed, already-reviewed data-wiring functions (`_mapPendingActionsForDashboard`, `_deriveDashboardJourneyData`, `_formatCompletedAgo`, currently in `routes/dashboard.js`) — relocate them (mechanism decided at `/implementation-plan`: new shared module vs. direct import) rather than duplicate the logic.

**What will NOT be built:**
Fixing the stale/dead nav links tracked separately in `web-ui-experience-redesign`'s Epic B. No change to `getPendingActions`/`listJourneys`/`completeStage`'s own internal logic — reused exactly as they already work. No rebuild of `renderShell`'s sidebar. No new session-status taxonomy beyond "done." No change to `products.js`'s OTHER functions (`handleGetProductView`, `handleGetProductNew`, `_renderRoadmapTab`, the kanban-board rendering path, `?view=board`'s own branch) — only `handleGetDashboard`'s non-board branch and `_renderProductDashboard` are touched. No deletion/cleanup of `routes/dashboard.js`'s now-confirmed-dead route-wiring (`handleDashboard`, `_DASHBOARD_SKILLS_CATALOG`) — only its 3 reusable data-wiring functions are relocated/exported for reuse; the dead route itself is a separate future decision. The existing "no products yet" onboarding CTA (`products.length === 0` branch) is preserved unchanged in behavior — only its token/styling values are affected by the shared `renderShell` token update, not its structure or copy.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read on the real `/dashboard` route | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on sidebar/main-column/greeting/skill-grid/columns layout | E2E |
| AC4 (no regression) | Playwright: re-run `psh-s4-dashboard-layout.spec.js` + every other pre-existing spec touching `handleGetDashboard`/`_renderProductDashboard` (found by `/verify-completion`'s mandatory coverage check) + explicit `?view=board` unaffected check | E2E |
| AC5 (real pending actions) | Unit (mapping-function shape, already passing from Tasks 1-3) + Playwright (rendered content with a seeded adapter result, on the real route) | Unit, E2E |
| AC6 (real skills catalog) | Unit (catalog shape, already passing from Tasks 1-3) + Playwright (rendered cards + real session-start link, on the real route) | Unit, E2E |
| AC7 (real in-progress count / recent sessions) | Unit (derivation-function shape, already passing from Tasks 1-3, including the tenant-filter correctness fix) + Playwright (populated + empty-state cases, on the real route) | Unit, E2E |
| AC8 (zero-products onboarding preserved) | Playwright: real session, zero products, confirm the CTA still renders and functions | E2E |

**Assumptions:**
`handleGetDashboard`/`_renderProductDashboard` are the REAL, live target functions — confirmed not just by reading the handler's own code (the mistake made the first time) but by tracing the real router dispatch AND independently re-verifying with a real server + real authenticated HTTP request (`decisions.md`'s CRITICAL finding entry has the full empirical evidence). `dsa-s1`'s token work has already merged (confirmed). Tasks 1-3's data-wiring functions are correct and reusable as-is (already spec-compliance- and code-quality-reviewed against real data; the tenant-filter correctness fix from Task 3's own review is preserved when relocated). **Open assumption carried into `/implementation-plan`:** the exact relocation mechanism for Tasks 1-3's functions (shared module vs. direct import) is undecided — review finding [3-L1], RISK-ACCEPTed as a legitimate deferred decision, not a gap. `listJourneys()`'s real production wiring status must still be independently confirmed (carried forward from the prior amendment, not yet resolved).

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (`handleGetDashboard`, `_renderProductDashboard`), `src/web-ui/routes/dashboard.js` (3 functions relocated/exported, not deleted), possibly a new small shared module for the relocated functions (exact path TBD at `/implementation-plan`). Services: `adapters/action-queue.js` (consumed), `modules/journey-store.js` (consumed). APIs: none new — no new routes; `GET /dashboard` itself is unchanged as a route, only its rendered content changes.

---

## Contract Review

✅ **Contract review passed (re-reviewed for the CRITICAL re-target)** — proposed implementation aligns with all 8 ACs, no mismatches. This is the SECOND correction to this contract's "What will be/NOT be built" sections in this story's delivery (first: wiring `getPendingActions` into the dashboard render path; second, this one: which file actually IS the dashboard render path) — both corrections follow CLAUDE.md's own B1/D1 rule (when a DoR contract and reality conflict, the contract is the authoring defect, corrected to match reality) rather than forcing reality to match an already-written contract.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Hamish King (Founder/Operator)" — unchanged, real named individual, now even more apt since this is confirmed to be the page he actually uses daily |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs (was 7) |
| H3 | Every AC has at least one test | ✅ | AC1-AC8 all covered, 18 tests total |
| H4 | Out-of-scope populated | ✅ | 9 items (expanded from 7 during the re-target, explicitly naming the newly-visible `products.js` risk surface) |
| H5 | Benefit linkage references named metric | ✅ | "Visual consistency across the 4 real screens" — unchanged |
| H6 | Complexity rated | ✅ | Rating: 3 (held, with an updated rationale explaining why technical ambiguity is actually lower now despite higher stakes) |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 3 (2 MEDIUM carried forward + 1 new LOW, all RISK-ACCEPTed in decisions.md) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps, all 8 ACs covered |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Extensively populated with the real, empirically-verified target function names, signature, and existing branches to preserve; Category E scored 4/5 in run 3 (dropped 1 point only for the explicitly-deferred [3-L1] relocation-mechanism decision, not a gap in rigor) |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | AC1-3/AC8 are layout-dependent, covered by configured Playwright tooling — no block |
| H-NFR | NFR profile exists | ✅ | Feature `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact as `dsa-s1` — already confirmed |

**H8-ext:** Dependencies lists `dsa-s1` as upstream (token work, already merged) plus this story's own already-committed Tasks 1-3 (data-wiring logic to be reused, not a cross-story pipeline-state schema field dependency). `schemaDepends` not applicable.

**H-ADAPTER:** No NEW injectable adapter is introduced by this story — same reasoning as the prior DoR sign-off, unaffected by the re-target (`getPendingActions`/`listJourneys` remain the same real, pre-existing data sources regardless of which route file calls them).

**H-INF / H-MIG:** Both absent — skipped. No new infrastructure or schema migration.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable — re-affirmed in review run 3 despite the major re-target, since the ACs' own substance is unchanged, only the target file |
| W3 | MEDIUM review findings acknowledged | ✅ | 2 MEDIUM (carried forward, AC4/AC5-AC6 wording) + 1 LOW (relocation mechanism deferred) | All RISK-ACCEPTed in `decisions.md` |
| W4 | Verification script reviewed | ⚠️ | Verification script not yet amended for the re-target (still describes the dead `dashboard.js` route) | Acknowledge and proceed — matches `dsa-s1`'s own established W4 precedent; must be amended alongside implementation before `/verify-completion`, not treated as a DoR blocker |
| W5 | No UNCERTAIN gap items | ✅ | — | Gap table: 5 real, named risks (spec inventory — now materially larger given the real target file; external-network AC5 boundary; `listJourneys` production-wiring status; expanded coverage-check stakes; the deferred relocation mechanism) — all concretely named, none vague |

---

## Oversight level

**Oversight:** Medium (inherited from parent epic) — **flagged for extra care, not formally raised:** this story now touches a confirmed real, live, beta-user-facing production route for the first time in this feature's delivery (every other change so far — `dsa-s1`'s artefact viewer, `dsa-s2`'s own Tasks 1-3 — either touched already-real routes or, it turns out, dead code). The epic's own Medium-oversight rationale ("a visual regression is customer-visible... human review at PR is warranted") already anticipated this risk class in principle; this story is the first to make it concrete. Recommend the human PR review for this specific story pay particular attention to AC4/AC8 (no regression, zero-products onboarding preserved) given the real stakes — noted here rather than silently proceeding at the same review bar as a lower-stakes story.

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
Make every test in the test plan pass (18 tests, AC1-AC8). The REAL target
is src/web-ui/routes/products.js's handleGetDashboard/_renderProductDashboard
-- NOT src/web-ui/routes/dashboard.js, which is confirmed dead code (GET
/dashboard never reaches it in any real configuration, including
NODE_ENV=test -- see decisions.md's CRITICAL finding entry for the full
empirical proof before assuming otherwise). Restyle _renderProductDashboard's
body content to match DESIGN.md's "Dashboard/app shell" pattern and the
Skills Platform - Dashboard.dc.html mock (greeting, "Run a skill" grid,
"Waiting on you", "Recent sessions"), using the token values dsa-s1 already
updated in html-shell.js. REUSE (relocate, do not rebuild) Tasks 1-3's
already-committed, already-reviewed data-wiring functions currently in
routes/dashboard.js: _mapPendingActionsForDashboard, _deriveDashboardJourneyData,
_formatCompletedAgo. Decide and document the relocation mechanism (new shared
module vs. direct import) as your own first task. The existing zero-products
onboarding CTA ("Create your first product") MUST continue to work exactly as
it does today (AC8) -- do not replace or break it.

Constraints:
- dsa-s1 has already landed (token work merged) — verify html-shell.js
  already has --success/--warn/--danger before starting.
- Do not fix the stale/dead nav links (tracked separately in
  web-ui-experience-redesign).
- Do not modify getPendingActions/listJourneys/completeStage's own internals.
- Do not rebuild renderShell's sidebar.
- Do not touch any OTHER function in routes/products.js — handleGetProductView,
  handleGetProductNew, _renderRoadmapTab, the kanban-board rendering path, and
  the ?view=board branch of handleGetDashboard itself are all explicitly
  out of scope. Confirm your diff touches only handleGetDashboard's
  non-board branch and _renderProductDashboard before committing each task.
- Do NOT delete or modify routes/dashboard.js's dead handleDashboard route
  wiring or _DASHBOARD_SKILLS_CATALOG -- only relocate/export the 3 reusable
  data-wiring functions named above.
- Before implementing AC7, independently confirm listJourneys()'s real
  production wiring status — if unwired in production, stop and report this
  as a new finding rather than silently working around it.
- Preserve the tenant-filter correctness fix already applied to
  _deriveDashboardJourneyData's caller (!(j.tenantId && j.tenantId !==
  sessionTenantId), not strict ===) when relocating this logic — do not
  regress to a stricter filter.
- The verification script (artefacts/2026-09-18-design-system-adoption/
  verification-scripts/dsa-s2-verification.md, if it exists) still describes
  the dead dashboard.js route and must be amended to describe the real
  products.js route before /verify-completion.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

Oversight level: Medium (flagged for extra human-review care — see Oversight
level section above; this is the feature's first change to a confirmed
real, live, beta-user-facing production route)
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — share DoR artefact with tech lead awareness
**Signed off by:** Not required (Medium oversight)

**Proceed: Yes**
