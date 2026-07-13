# DoR Contract: Capture delivery-pattern learnings from the beta-readiness-infra and team-identity-roles epics

**Story reference:** artefacts/2026-07-13-epic-learnings-capture/stories/els-s1-capture-epic-delivery-learnings.md
**Test plan reference:** artefacts/2026-07-13-epic-learnings-capture/test-plans/els-s1-capture-epic-delivery-learnings-test-plan.md

---

## Contract Proposal

**What will be built:**
1. `CLAUDE.md`'s "Injectable adapter rule (D37)" section gains a 4th mandatory point: wiring tests must assert the wired implementation is behaviourally correct (e.g. two different inputs produce two different, individually-correct outputs), not just that a function reference was assigned.
2. `CLAUDE.md` gains a new coding-standards rule: when a new adapter/fetch reuses an *existing* adapter for a *new* purpose, the test's mock must be checked against that adapter's real, currently-wired production response shape.
3. `CLAUDE.md`'s session conventions gain a new rule: after any coding-agent subagent reports completion, independently verify actual git state and PR existence before treating the report as ground truth.
4. `.github/architecture-guardrails.md`'s Anti-Patterns table gains a new row mirroring (3).
5. A new `workspace/proposals/2026-07-13-estimate-skip-marker-improve-proposal.md` file (8 required front-matter fields) proposing that discovery/definition's estimate prompt treat any non-`/estimate` reply as an implicit skip, writing the `null` marker rather than leaving no record.
6. A new content-verification test file, `tests/check-els-s1-epic-learnings-capture.js`, matching this repo's existing `check-md-*.js` convention for governed-file content assertions.

**What will NOT be built:**
- No direct edit to `skills/discovery/SKILL.md` or `skills/definition/SKILL.md` — item 5 is a proposal only, per `/improve`'s own rule that SKILL.md files are never edited directly.
- No application code, schema, or test-infrastructure change beyond the one new content-verification test.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test (U1): read CLAUDE.md, assert D37 section contains the wiring-correctness rule | unit |
| AC2 | Unit test (U1): read CLAUDE.md, assert D37/coding-standards section contains the mock-shape rule | unit |
| AC3 | Unit test (U2): read CLAUDE.md, assert session conventions contain the dispatch-verification rule | unit |
| AC4 | Unit test (U3): read architecture-guardrails.md, assert the new Anti-Patterns row exists | unit |
| AC5 | Unit test (U4): read the proposal file, assert all 8 required front-matter fields present | unit |

**Assumptions:**
- `CLAUDE.md` is this repo's equivalent of `/improve`'s "`copilot-instructions.md`" destination for universal (non-domain-specific) coding standards — confirmed via `context.yml`'s `agent.instruction_file: "copilot-instructions.md"` field, which this repo has renamed to `CLAUDE.md` in practice (the actual root file present).
- This story's changes are governed under the Platform Change Policy (PR required for `CLAUDE.md`/`architecture-guardrails.md` changes) — this story is delivered via a short-lived branch + PR, not a direct commit to master, consistent with that policy and distinct from the pipeline-bookkeeping exemption used for `pipeline-state.json`/`artefacts/`.

**Estimated touch points:**
Files: `CLAUDE.md`, `.github/architecture-guardrails.md`, `workspace/proposals/2026-07-13-estimate-skip-marker-improve-proposal.md` (new), `tests/check-els-s1-epic-learnings-capture.js` (new)
Services: None
APIs: None

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1/AC2 ↔ CLAUDE.md D37 section additions, verified by U1 — ✅ aligned.
- AC3 ↔ CLAUDE.md session conventions addition, verified by U2 — ✅ aligned.
- AC4 ↔ architecture-guardrails.md Anti-Patterns row, verified by U3 — ✅ aligned.
- AC5 ↔ proposal file, verified by U4 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "operator running future epics through this pipeline" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A (documented) | No benefit-metric-tracked feature applies — this is post-DoD `/improve` process capital, explicitly noted as such in the story, tied to `product/mission.md`'s self-improving-harness success outcome rather than a numeric metric |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No `/review` run — single-story short-track with no scope ambiguity, same precedent as `pcr-s1` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Explicitly scopes to governed-file changes only |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states "None identified" — no feature-level NFR profile needed for a single documentation-only story |
| H-GOV | Governance approval | ✅ N/A | Short-track, no discovery artefact — same precedent as `pcr-s1`/`stis-s1` |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass** (with H5/H7/H-GOV noted as N/A with explicit rationale, same precedent as prior short-track stories this session).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review run | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Operator directly requested this capture in-session with full context of both originating bugs already established. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Low — content-only change to governed instruction files, no application code, low blast radius, human (operator) directly reviewing and requesting this in-session.
