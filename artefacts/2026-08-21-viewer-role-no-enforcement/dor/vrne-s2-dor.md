# Definition of Ready: Wire the viewer-write-block gate to Skill session routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s2-skill-sessions.md`
**Test plan reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s2-test-plan.md`
**Contract proposal:** `artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s2-dor-contract.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

---

## Contract Review

Reviewed the Contract Proposal against all 6 ACs and the test plan. No mismatches found — the proposed 9-call-site wiring plan (including canvas-edit/assumption-confirm, added per the `1-M1` review-finding resolution) aligns with AC1–AC6.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona matches `vrne-s1`'s pattern |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 2, AC2: 4, AC3: 3, AC4: 3, AC5: 2, AC6: 1 |
| H4 | Out-of-scope section is populated | ✅ | 3 items named (canvas-edit/assumption-confirm carve-out removed per `decisions.md`) |
| H5 | Benefit linkage field references a named metric | ✅ | Both benefit-metric.md metrics named |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH; 3 MEDIUM, all resolved/inherited-and-tracked via `/decisions` |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies names `vrne-s1` as upstream; contract declares `schemaDepends: []` (code-level dependency, no pipeline-state.json field read) — no field to validate against schema, check passes |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated; Category E had 1 MEDIUM (inherited from `vrne-s1`, tracked under the same `decisions.md` entry) |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs — condition does not trigger |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-21-viewer-role-no-enforcement/nfr-profile.md` |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ | Condition does not trigger |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence when story NFRs populated | ✅ | Profile exists |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank named entry | ✅ | Same as `vrne-s1` — "Hamish King, 2026-08-22" |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter — reuses `vrne-s1`'s already-built `requireNonViewer` |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Resolved — see `decisions.md` SCOPE entry (AC5/AC6 added) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged — `decisions.md`, 2026-08-22 (single entry covers all 4 `vrne` stories) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | — |

---

## Oversight level

**Medium** — same basis as `vrne-s1`. Operator confirmed awareness, 2026-08-22.

---

## Standards injection

**Domain tags:** `web-ui`, `security`, `auth`
**Matched standards files:** same 3 files as `vrne-s1` — `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`, `.github/standards/auth/auth-patterns.md`

Full text is identical to the version embedded in `vrne-s1-dor.md` — see that file for the complete standards text (auth-patterns.md, security-standards.md, web-ui-patterns.md in full). Not re-duplicated here to keep this artefact focused; the coding agent implementing this story must still read and comply with all three in full.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire the viewer-write-block gate to Skill session routes — artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s2-skill-sessions.md
Test plan: artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Requires vrne-s1 to be DoD-complete first — import requireNonViewer from src/web-ui/middleware/require-non-viewer.js, do not reimplement it
- Wire requireNonViewer into exactly the 9 call sites in routes/skills.js and routes/execute.js named in AC1-AC3 and AC5 of the story — including canvas-edit and assumption-confirm (do not skip these two; they were explicitly added to scope via /decisions, resolving a review finding)
- The critical assertion for AC2/AC3 tests is that the underlying model-call/commit/execute function is never invoked (spy-verified) — a 403 status code alone does not prove cost/side-effects were prevented if the gate check happens after the expensive call
- Node.js built-ins only — no new npm dependencies
- Denial logging: same structured JSON convention as vrne-s1 (event: 'viewer_write_denied', same field shape)
- Architecture standards: read .github/architecture-guardrails.md before implementing. Applicable domain standards (auth-patterns.md, security-standards.md, web-ui-patterns.md) are the same as vrne-s1's — see vrne-s1-dor.md for full text if not already reviewed
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (operator confirmed directly, 2026-08-22)
**Signed off by:** Hamish King, 2026-08-22
