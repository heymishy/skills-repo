# Definition of Ready: Skill launcher redesign — show 5 primary CTAs, hide chained skills

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
**Test plan reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

**Note:** This is a genuinely new DoR pass — no prior DoR file existed for this story (unlike `ep1-s1`/`ep1-s2`, whose prior DoR files existed but were non-conformant).

---

## Contract Proposal

**What will be built:**
A new component `src/web-ui/skill-launcher.js` rendering exactly 5 hardcoded primary CTAs (discovery, ideate, reverse-engineer, spike, improve) plus a collapsible "Advanced skills" section showing all 41+ skills. Keyboard-navigable, visually distinct primary-vs-advanced styling.

**What will NOT be built:**
No config.yml parameterization of the entry-point list (hardcoded for MVP). No skill search/filtering in the advanced view. No re-ordering. No skill descriptions.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real browser rendering + bounding-box/font-size measurement | E2E (Playwright) |
| AC2 | DOM query for absence of chained skills in primary section | Unit + E2E |
| AC3 | DOM query + click for advanced-section full list | Unit + Integration |
| AC4 | Real browser computed-style inspection of advanced section | E2E (Playwright) |
| AC5 | Click a chained skill in advanced section, confirm real launch call | Integration |
| AC6 | Compare fresh render vs. render with simulated prior session state | Unit |

**Assumptions:**
A static fixture list of all 41+ real skill names (mirroring this repo's actual `skills/` directory) is available and stable enough to commit as a test fixture. AC1 and AC4's real-browser E2E tests are the correct classification per this repo's own CSS-layout-dependent AC handling rule (Step 3a of `/test-plan`) — not downgraded to manual-only, since Playwright is already configured and in active use.

**Estimated touch points:**
Files: `src/web-ui/skill-launcher.js` (new), `tests/skill-launcher.test.js` (new, unit/integration), `tests/e2e/ep1-s3-launcher-layout.spec.js` (new, E2E).
Services: None new.
APIs: None (frontend component only; reads the existing skill list, does not add a new endpoint).

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC6; no mismatch.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 9/9 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 6 items |
| H5 | Benefit linkage names a metric | ✅ | "Metric 1 — Skill launcher clarity (benefit-metric.md)" |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Exact target file named (`skill-launcher.js`); review Category E: no violations |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ | AC1 and AC4 are CSS-layout-dependent; E2E tooling (Playwright) is configured and both are covered by real E2E tests in the test plan — not a gap |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-28-weeb-ui-learnings-and-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence | ✅ | Story declares NFRs; profile present |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ | "Hamish King — Operator / Product Owner — 2026-09-29" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No injectable adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set — no `DESIGN.md` token dependency named in this story's own Architecture Constraints |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review Run 2: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ Not yet done | Script may not perfectly reflect real-world usage nuance | Pending — same as `ep1-s1`/`ep1-s2`, recommend operator review before coding |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards Injection

Story has no `domain` field — skipped silently.

---

## Oversight Level

**Epic oversight:** Medium (per `epics/signals-foundation-launcher-redesign.md`) — "The launcher redesign is high-visibility (operator's first interaction with the web UI)." DoR artefact to be shared before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Skill launcher redesign: show 5 primary CTAs, hide chained skills
Story artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New component src/web-ui/skill-launcher.js. Primary CTA list is a
  hardcoded constant (PRIMARY_SKILLS = [discovery, ideate, reverse-engineer,
  spike, improve]) -- do NOT parameterize via context.yml (explicitly out
  of scope, deferred to Phase 5).
- Advanced section: collapsible, starts collapsed by default, shows all
  41+ skills when expanded, visually de-emphasized (smaller text/lower
  contrast/indentation vs. primary CTAs).
- Preserve backward compatibility: every skill remains directly runnable
  via the advanced section or a direct link -- never blocked.
- No new npm dependencies.
- AC1 and AC4 require real Playwright E2E tests (CSS-layout-dependent) --
  do not substitute a DOM-presence-only test for these two ACs.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing the specific blocker and stop -- do not improvise.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness only
**Signed off by:** Not required (Medium oversight, DoR PROCEED: Yes)
