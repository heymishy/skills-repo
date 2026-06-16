# Definition of Ready: inc5 — Canvas-JSON marker instruction in /ideate SKILL.md

**Story reference:** artefacts/2026-06-15-ideate-web-ux-inc3/stories/inc5.md
**Test plan reference:** artefacts/2026-06-15-ideate-web-ux-inc3/test-plans/inc5-test-plan.md
**Contract:** artefacts/2026-06-15-ideate-web-ux-inc3/dor/inc5-dor-contract.md
**Assessed by:** Claude Sonnet 4.6 (agent)
**Date:** 2026-06-16

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all ACs. No mismatches between the Contract Proposal and the story's ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a facilitator running an /ideate session..." — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs. Written in prose condition/action/result form rather than literal Given/When/Then labels — same lenient precedent as inc3's H2 (inc3-dor.md), each AC states the triggering lens output and the expected canvas render |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1+Scenario1, AC2→T2+Scenario2, AC3→T3, AC4→T4, AC5→inc4 regression test (check-inc4-canvas-panel.js T5)+Scenario5, AC6→T5+Scenario3 |
| H4 | Out-of-scope section is populated | ✅ | 4 bullets — new block types, panel layout/CSS, other SKILL.md files all explicitly excluded |
| H5 | Benefit linkage field references a named metric | ✅ | M2 — Canvas block render fidelity |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | inc5-review-2.md: 0 HIGH, 0 MEDIUM, 1 LOW (cosmetic, not blocking). Outcome: PASS |
| H8 | Test plan has no uncovered ACs (gaps explicitly acknowledged) | ✅ | AC1/AC2/AC6 gap type `Untestable-by-nature`, acknowledged in test plan's Coverage gaps table and routed to manual verification scenarios |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names inc4 as upstream → contract declares `schemaDepends: ["stage", "dodStatus"]`; both fields confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | "None identified — SKILL.md instruction content is governed by pipeline process, not architecture-guardrails.md (guardrails line 38)." Review Architecture compliance score: 5/5 |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ N/A | `hasLayoutDependentGaps: false` (test plan Step 3a, pipeline-state.json) — no layout-dependent ACs in this story |
| H-NFR | NFR profile exists or story declares "NFRs: None" | ✅ | `artefacts/2026-06-15-ideate-web-ux-inc3/nfr-profile.md` exists (feature-level, shared across inc3/inc4/inc5) |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ N/A | No compliance NFRs with named regulatory clauses in the NFR profile |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Added this run: "Internal — non-public but low sensitivity" (Security section, nfr-profile.md), consistent with `context.yml` (`meta.scope: personal`, `meta.regulated: false`) |
| H-NFR-profile | NFR profile presence check (B1-enforce) | ✅ N/A | Story's NFR section reads "None identified" — check skipped per skill rule; profile exists anyway |
| H-GOV | `## Approved By` section in discovery artefact has ≥1 non-blank named entry | ✅ | Fixed this run: discovery.md now has "## Approved By / - Hamish King — Engineering lead — 2026-06-15" (read live from file system, not pipeline-state.json) |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | No injectable adapters (`setX()` functions) introduced by this story |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | Story NFRs: "None identified — instruction text only..." |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | 0 MEDIUM findings in inc5-review-2.md — nothing to acknowledge |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed by a domain expert independent of the authoring agent — acknowledged below |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | All 3 gap rows (AC1/AC2/AC6) are typed `Untestable-by-nature` with explicit handling (manual scenarios), not left as UNCERTAIN |

**W4 acknowledgement:** Risk if proceeding — the verification script's 5 scenarios may miss an edge case a domain expert (e.g. the facilitator who runs live sessions) would catch. Acknowledging and proceeding: this story's complexity (1, Stable) and small surface area (single governed-file instruction block) make the risk low; the verification scenarios were modelled directly on inc4's `parseCanvasBlock` schema and inc3's manual-scenario precedent. Logged as a RISK-ACCEPT candidate — see note below.

---

## Oversight level

**High** — governed file (`.github/skills/ideate/SKILL.md`), same basis as inc3 and inc4.

**Signed off by:** Hamish King — Engineering lead, 2026-06-16

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: inc5 — Canvas-JSON marker instruction in /ideate SKILL.md — artefacts/2026-06-15-ideate-web-ux-inc3/stories/inc5.md
Test plan: artefacts/2026-06-15-ideate-web-ux-inc3/test-plans/inc5-test-plan.md
Contract: artefacts/2026-06-15-ideate-web-ux-inc3/dor/inc5-dor-contract.md

Goal:
Make every test in tests/check-inc5-canvas-skill-instruction.js pass (T1-T5, currently
4 passing / 12 failing — TDD red state). Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Modify ONLY: .github/skills/ideate/SKILL.md (additive only — new instruction block,
no modification to existing lens step text, assumption cards, or condition cards)

Append to package.json test chain (same commit as this change, not before):
  && node tests/check-inc5-canvas-skill-instruction.js

SKILL.md change — add a canvas marker instruction block that:
- Names "Lens A" and instructs emission of a `cluster-tree` CANVAS-JSON marker for
  the Lens A opportunity map output (within close proximity of the Lens A reference
  per T1's 1500-char window)
- Names "Lens D" and instructs emission of a `table` CANVAS-JSON marker for the
  Lens D strategy table output
- Instructs emission of a `text` CANVAS-JSON marker for narrative/prose lens output
  (Lens C, Lens E), explicitly scoped to "narrative" or "prose" output
- States the exact marker format: `---CANVAS-JSON: {"type":"cluster-tree"|"table"|"text","title":"<string>","content":<object>}---`
  (same `---<NAME>-JSON: {...}---` convention as ASSUMPTION-JSON/CONDITION-JSON)
- Includes at least 3 well-formed worked examples, one per type (cluster-tree, table, text)
- States cadence guidance using language matching T5's check, e.g. "exactly one
  CANVAS-JSON marker" or "one CANVAS-JSON marker per lens output" — one marker per
  lens step, no duplicates

Constraints:
- No code changes — src/web-ui/routes/skills.js and src/web-ui/views/chat-view.js
  (parseCanvasBlock, canvasBlock SSE event, #canvas-panel, renderCanvasBlock) are
  already in production from inc4 and must not be touched
- Architecture standards: SKILL.md content is exempt from architecture-guardrails.md
  per its line 38 ("Skill files and templates are content, not code")
- Open a draft PR when tests pass — do not mark ready for review
- Human review and merge required (governed file)

After merge:
- Run a live /ideate session covering at least Lens A and Lens D outputs and write
  the verification artefact at
  artefacts/2026-06-15-ideate-web-ux-inc3/verification/inc5-canvas-skill-verification.md
  (Scenarios 1, 2 are blocking DoD gates per the story's Definition of done entry
  condition; this also satisfies inc4's previously-deferred DoD entry condition)

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Engineering lead, 2026-06-16
