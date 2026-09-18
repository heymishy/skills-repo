## Definition of Ready: Restyle the Skill-Session Chat Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s4.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s4-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18

---

## Contract Proposal

**What will be built:**
Restyle `src/web-ui/routes/skills.js`'s `_renderChatPage` function (this codebase's single largest, most heavily-used file, confirmed directly via this session's own prior `ep2-s3` story) and `src/web-ui/views/chat-view.js`'s `renderChat` function (imported and called by `skills.js`) to match `DESIGN.md`'s "Skill session" layout pattern — resizable two-pane layout, Focused/Chat segmented-control toggle, right pane varying by skill type. Token values applied throughout, reusing `dsa-s1`'s already-updated `html-shell.js` custom properties.

**What will NOT be built:**
Any functional/behavioral change to chat, journey-gate, sub-step affordances, or diagram mechanisms — pure-append/token-substitution discipline applies, matching the exact discipline `ep2-s3` already established and verified successful on this same file (never reorder existing structural markup).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock, all skill-type variants) | Playwright: structural assertions across generic/`ideate`/`definition` sessions | E2E |
| AC4 (no regression) | Playwright: re-run 15 pre-existing specs (13 locally-runnable + 2 `@real-staging` named as residual risk) | E2E |

**Assumptions:**
`_renderChatPage`/`renderChat` are the real target functions (confirmed directly, not assumed — this session's own `ep2-s3` story already worked extensively in this exact file). `dsa-s1`'s token rename lands first.

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js`, `src/web-ui/views/chat-view.js`. Services: none. APIs: none — this story adds no new routes, only restyles existing rendering.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs, no mismatches. Given this is the highest-complexity story in the epic (Rating 3), the pure-append discipline is called out explicitly in both the Contract and the Coding Agent Instructions below, not left implicit.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Dual persona ("a beta user... and... Hamish King") — flagged LOW in `/review`, not a block |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs (AC5 removed during `/review` — was a process instruction, not a testable AC; folded into Architecture Constraints) |
| H3 | Every AC has at least one test | ✅ | AC1-AC4 covered |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | "Visual consistency across the 4 real screens" |
| H6 | Complexity rated | ✅ | Rating: 3 (highest in the epic, deliberately sequenced last) |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 1 (the AC5 process-instruction finding was fixed during review, not carried forward) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps (the 2 `@real-staging` specs are a named residual risk within AC4's own coverage, not an uncovered AC) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated, includes the pure-append discipline note and the real `/verify-completion` coverage-check requirement; Category E scored 5/5 |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | No gap-type ACs; Playwright configured |
| H-NFR | NFR profile exists | ✅ | Feature nfr-profile.md exists |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact — already confirmed |

**H8-ext:** Dependencies lists `dsa-s1` as upstream (same-feature token-rename dependency) — not a pipeline-state schema field dependency, not applicable.
**H-ADAPTER:** No new adapter introduced. Not applicable.
**H-INF / H-MIG:** Both absent — skipped.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ⚠️ | 1 MEDIUM (1-M1, AC4 verification-method wording — the AC5 finding was fixed during review, not carried forward) not yet logged | Logging now, see decisions.md |
| W4 | Verification script reviewed | ✅ | — | Operator confirmed |
| W5 | No UNCERTAIN gap items | ✅ | — | Gap table: real, named risk (2 `@real-staging` specs), not an uncertain item |

---

## Oversight level

**Oversight:** Medium (inherited from parent epic — same level as the other 3 restyle stories, though this is the highest-complexity story within that level; the epic's own Rationale already names this exact screen as the reason Medium, not Low, applies epic-wide)

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restyle the Skill-Session Chat Page to Match DESIGN.md — artefacts/2026-09-18-design-system-adoption/stories/dsa-s4.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s4-test-plan.md

Goal:
Make every test in the test plan pass. Restyle src/web-ui/routes/skills.js's
_renderChatPage and src/web-ui/views/chat-view.js's renderChat to match
DESIGN.md's "Skill session" layout pattern and the Skills Platform - Skill
Session.dc.html reference mock, using the token values dsa-s1 already updated
in html-shell.js. This is the highest-complexity story in this epic -- do not
add scope beyond what the tests and ACs specify.

Constraints:
- dsa-s1 must land first (token rename dependency).
- PURE-APPEND DISCIPLINE (critical): this is this codebase's single largest,
  most heavily-used file. Any edit to the journey-gate panel or other existing
  functional markup within _renderChatPage must be additive/token-value-
  substitution only, NEVER a reorder of existing structural markup -- matching
  the exact discipline this repo's own ep2-s3 story already established and
  verified successful on this same file.
- Do not change any functional/behavioral mechanism (chat, journey-gate,
  sub-step affordances, diagrams) -- visual restyle only.
- Before opening a PR, run the mandatory route/handler E2E coverage check on
  this file (per /verify-completion's own established requirement for
  routes/skills.js changes, precedented by ep2-s3): identify every
  pre-existing spec touching this page, run every non-@real-staging one
  locally. The 15 specs named in this story's test plan are the known
  starting set; confirm no others exist.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
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
