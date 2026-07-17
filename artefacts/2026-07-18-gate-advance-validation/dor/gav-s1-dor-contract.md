# DoR Contract: Extend gate-advance structural validation to all 7 canonical gate names

**Story reference:** artefacts/2026-07-18-gate-advance-validation/stories/gav-s1.md
**Test plan reference:** artefacts/2026-07-18-gate-advance-validation/test-plans/gav-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/enforcement/cli-outer-loop.js`, extend `SUPPORTED_GATES` from `['definition-of-ready']` to include all 7 canonical gate names from `src/enforcement/gate-map.js` (`discovery-approved`, `benefit-metric-active`, `definition-complete`, `test-plan-complete`, `dor-signed-off`, `branch-complete`, `definition-of-done`), keeping `definition-of-ready` as a permanent accepted alias of `dor-signed-off` (both routed through the existing H1-H9 logic, unchanged).
2. Add a dedicated validation function per new gate name (`validateDiscoveryApproved`, `validateBenefitMetricActive`, `validateDefinitionComplete`, `validateTestPlanComplete`, `validateBranchComplete`, `validateDefinitionOfDone`), each reading its target artefact (or, for `branch-complete`, the story's `pipeline-state.json` entry) and returning the same `{ exitCode, stdout, stderr }` shape as the existing H1-H9 checks.
3. `validate()`'s main switch dispatches to the correct function based on the `gateName` argument; unsupported names still hit the existing `UNSUPPORTED_GATE` branch, now naming all 8 accepted strings (7 canonical + the `definition-of-ready` alias).
4. New test file `tests/check-gav-s1-*.js` covering all 25 unit tests + 4 integration tests from the test plan.

**What will NOT be built:**
- No change to `gate-map.js` itself, or to any SKILL.md's own instructions to actually call `gate-advance`.
- No change to `bin/skills advance`'s non-gated write path.
- No change to the unrelated `.github/governance-gates.yml` / `pipeline-viz.html` dashboard gate-sync system.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | U1-U4 (alias parity, backward compatibility, failure-path parity, unsupported-gate regression) | unit |
| AC2 | U5-U9 (complete pass, missing-section fail x2, placeholder-Approved-By fail, blank-section fail) | unit |
| AC3 | U10-U13 (complete pass, missing-field fail, zero-Tier-1 fail, "at least one" pass) | unit |
| AC4 | U14-U17 (complete pass, <3 ACs fail, blank scope fail, bad complexity fail) | unit |
| AC5 | U18-U19, IT2 | unit + integration |
| AC6 | U20-U22, IT3 | unit + integration |
| AC7 | U23-U25, IT4 | unit + integration |
| NFR-Security | IT1 (path traversal across all 6 new gates) | integration |
| NFR-Audit | Message-content assertions embedded in every failing-path unit test | unit |

**Assumptions:**
- `gate-map.js`'s 7 names are treated as fixed and correct — this story does not question whether they're the right 7 names, only implements validation for exactly those.
- "At least one Tier 1 metric fully populated" (AC3/U13) is the bar for `benefit-metric-active`, not "all metrics" — matches how `/benefit-metric` itself treats Tier 2/3 as more exploratory than Tier 1.
- For `branch-complete` (AC6), the "artefact" is the story's own `pipeline-state.json` entry, not a separate Markdown file — the CLI's existing `artefactPath` argument is repurposed to mean "the feature-slug context to look up," consistent with how the coding-agent instructions will need to pass it.

**Estimated touch points:**
Files: `src/enforcement/cli-outer-loop.js`, `tests/check-gav-s1-*.js` (new)
Services: None
APIs: None

---

## Contract Review

Reviewed against all 7 story ACs and the test plan's AC Coverage table:

- AC1 ↔ built via alias routing to existing H1-H9 logic, verified by U1-U4 — ✅ aligned.
- AC2 ↔ built via `validateDiscoveryApproved`, verified by U5-U9 — ✅ aligned.
- AC3 ↔ built via `validateBenefitMetricActive`, verified by U10-U13 — ✅ aligned.
- AC4 ↔ built via `validateDefinitionComplete`, verified by U14-U17 — ✅ aligned.
- AC5 ↔ built via `validateTestPlanComplete` (generalising existing H3/H8 coverage logic), verified by U18-U19 + IT2 — ✅ aligned.
- AC6 ↔ built via `validateBranchComplete` reading pipeline-state.json, verified by U20-U22 + IT3 — ✅ aligned.
- AC7 ↔ built via `validateDefinitionOfDone`, verified by U23-U25 + IT4 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator or coding agent advancing a story across a gated stage boundary" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | See coverage table above |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Governance gate integrity, quantified as "0 of 7 boundaries reliably enforceable today" |
| H6 | Complexity is rated | ✅ | Rating 3, Unstable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | References CLAUDE.md cdg.7 and the existing H1-H9 pattern as the established constraint |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs — pure CLI/tooling |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-18-gate-advance-validation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design, same precedent as `pcr-s1`/`stis-s1` |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass**, with the H-GOV note recorded transparently (same precedent as `pcr-s1`/`stis-s1`).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Unstable — flagged directly in the story, complexity 3 | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in AC2-AC6's proposed criteria | **Acknowledged — proceed.** Same rationale as `pcr-s1`/`stis-s1` precedent: operator directly requested this story via `/improve` follow-up, already briefed on the full gap. Given Complexity Rating 3, the implementation plan should treat AC2-AC6's exact criteria as a starting hypothesis to be confirmed against real artefacts during implementation, logging any adjustment in this feature's decisions.md. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's gap table names one risk (criteria may need adjustment) with an explicit mitigation, not left uncertain | — |
