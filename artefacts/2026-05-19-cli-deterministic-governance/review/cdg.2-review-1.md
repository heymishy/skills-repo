# Review: cdg.2 — H1-H9 DoR deterministic checks: complete coverage and ≥33 test fixtures

**Feature:** 2026-05-19-cli-deterministic-governance
**Story:** cdg.2
**Run:** 1
**Reviewer:** GitHub Copilot (automated review)
**Date:** 2026-05-23
**Status:** PASS — 0 HIGH, 2 MEDIUM, 2 LOW

---

## Category A — Traceability

**Score: 5 — PASS**

- Epic reference present ✓ — `artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase1-validate-cli.md`
- Discovery reference present ✓ — `artefacts/2026-05-19-cli-deterministic-governance/discovery.md`
- Benefit-metric reference present ✓ — `artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md`
- "So that..." clause names a specific outcome connected to M3 ("executable code rather than model judgment, and I can confirm this in CI by running `npm test`") ✓
- Benefit Linkage names metric M3 explicitly and has a mechanism sentence ("adds the remaining 32 H-priority DoR deterministic checks … reaching the ≥33 fixture threshold that is the Phase 1 exit condition") ✓
- M3 is present in the benefit-metric coverage matrix ✓

No findings.

---

## Category B — Scope Discipline

**Score: 5 — PASS**

- Story implements nothing declared out-of-scope in the epic (no state writes, no skill surgery, no trace emission, no non-DoR gates) ✓
- Story implements nothing declared out-of-scope in the discovery ✓
- Own Out of Scope section populated ✓ — non-DoR gates, H-E2E/H-NFR checks, W1-W5 warnings, automatic correction, fixture file preference all named
- No scope additions relative to the epic out-of-scope list ✓

No findings.

---

## Category C — AC Quality

**Score: 4 — PASS**

AC1, AC3–AC7: Well-formed Given/When/Then, observable system behaviour, exit codes and message formats explicitly stated. ✓

AC2 and AC8: See findings below.

**Finding 2-M1 (MEDIUM):** AC1 and the story's scope stability note both reference "the 33 H-priority deterministic items … catalogued in the pre-architecture ideation audit." However, `artefacts/2026-05-19-cli-deterministic-governance/research/ideation.md` explicitly states the Step 5 detailed output (the DoR gate check specification) "was not saved as a separate artefact file." The 33-item breakdown (how many sub-checks per H-category, and exactly which items constitute the 33) is not accessible in any artefact on disk. AC1 requires implementing "all 33 H-priority deterministic items" and AC2 requires "a minimum of 33 individual assertions (one per H-priority deterministic item)" — but without a reference catalogue, an implementer must independently derive the list from the DoR SKILL.md, with no way to verify completeness against the intended catalogue.

The /test-plan writer faces the same gap: to write test cases, they need the enumeration. The DoR SKILL.md defines H1-H9 (9 check categories) but the 33-item count implies ~3-4 sub-checks per category with no documented mapping.

Fix: add an appendix to cdg.2 (or a separate reference file at `artefacts/2026-05-19-cli-deterministic-governance/reference/dor-h1-h9-check-catalogue.md`) enumerating all 33 items, derived from DoR SKILL.md H1-H9 sub-check expansion. This makes the story self-contained and gives the /test-plan and coding agent an authoritative reference.

**Finding 2-M2 (MEDIUM):** AC1 states the CLI exits "with the exit code corresponding to that category (1–7)" for H1-H9 violations. However, there are 9 H-categories (H1-H9) and only 7 unique exit codes available in the 1-7 range (exit code 8 is reserved for system/usage errors per cdg.1 AC2 and AC6). This means at least two H-categories must share an exit code, or two H-categories are excluded from the 1-7 range. Neither cdg.1 nor cdg.2 defines the mapping from H-categories to exit codes. Without this mapping, an implementer cannot assign codes deterministically, and two different implementations of the CLI may produce different exit codes for the same violation — defeating the goal of a typed exit code framework.

Concrete risk: an implementer assumes H8 → exit code 8 (collides with UNSUPPORTED_GATE) or H9 → exit code 9 (undefined), producing a CLI that violates the framework stated in cdg.1.

Fix: add an exit code mapping table (e.g. H1→1, H2→2, H3→3, H4→4, H5→5, H6→6, H7 or H8 or H9→7 noting which are merged and why) to the Architecture Constraints section of cdg.1 or as a shared reference. This mapping must be established before /test-plan can verify exit code assertions.

Note: this finding could equally be raised against cdg.1 since the exit code framework is defined there. It is raised here because cdg.2 is the story that must implement all 9 categories — making the mapping gap most consequential at this story.

**Finding 2-L1 (LOW):** AC8 is written as "Given `npm test` runs the full suite after cdg.2 is merged, then all pre-existing tests continue to pass" — this omits an explicit "When" clause, deviating from the Given/When/Then format that H2 of the DoR gate (which this story is designed to enforce) requires. The story is being reviewed against the exact gate it implements — the format inconsistency is minor but should be corrected for consistency and to ensure the DoR validator does not flag this story's own AC8 as a format failure.

Fix: add an explicit "When" clause, e.g. "Given the full test suite before cdg.2 merged had N passing tests, when `npm test` runs after cdg.2 merges, then all pre-existing tests continue to pass…"

**Finding 2-L2 (LOW):** AC8's regression check states "The test count increases by at least 33 relative to the count before cdg.1 merged." This baseline ("count before cdg.1 merged") is a historical data point that is not captured in any accessible artefact. At the time of implementing or verifying cdg.2, the implementer would need to locate or reconstruct the pre-cdg.1 test count. A more verifiable and self-contained phrasing: "the total number of test assertions in `tests/check-cli-outer-loop.js` is at least 33" — this is checkable at any point without a historical baseline.

Fix: restate AC8's count check as an absolute assertion on `tests/check-cli-outer-loop.js` fixture count (≥33) rather than a delta from a historical baseline.

---

## Category D — Completeness

**Score: 5 — PASS**

- User story in As/I want/So that ✓
- Named persona ("platform maintainer") ✓
- Benefit Linkage populated with a causal mechanism sentence ✓
- Out of Scope populated with explicit exclusions ✓
- NFRs populated (performance <10s, security no credentials in test output, no new deps, test isolation) ✓
- Complexity rated (2) ✓
- Scope stability declared (Stable, with rationale) ✓
- Architecture Constraints section populated ✓
- Dependencies section populated (upstream: cdg.1 must be DoD-complete; downstream: none within feature) ✓
- DoR Pre-check checklist present ✓

No findings.

---

## Category E — Architecture Compliance

**Score: 5 — PASS**

- ADR-011 (Artefact-first rule) referenced — story is the artefact for all additions to `cli-outer-loop.js` and `tests/check-cli-outer-loop.js` ✓
- ADR-013 (Phase 4 enforcement architecture: shared governance package) referenced — cli-outer-loop.js remains structural artefact validator only; no calls to governance-package.js ✓
- Product constraint 3 (read-only validate) present — H4-H9 additions do not change read-only nature ✓
- OWASP A01 (Path traversal guard established in cdg.1 applies to all code paths) present ✓
- Test fixture isolation stated in Architecture Constraints and mirrored in NFRs ✓
- No anti-patterns from the guardrails active list present ✓

No findings.

---

## Summary

| Category | Score | Findings |
|----------|-------|----------|
| A — Traceability | 5 | — |
| B — Scope Discipline | 5 | — |
| C — AC Quality | 4 | 2-M1 (MEDIUM): 33-item catalogue not accessible on disk; 2-M2 (MEDIUM): H1-H9 → exit code 1-7 mapping not defined; 2-L1 (LOW): AC8 missing When clause; 2-L2 (LOW): AC8 uses inaccessible historical baseline |
| D — Completeness | 5 | — |
| E — Architecture Compliance | 5 | — |

**Verdict: PASS**
**Blocking:** None — 0 HIGH findings
**Acknowledge before /test-plan:** 2-M1 and 2-M2 are MEDIUM — recommend resolving both before /test-plan runs, as the test plan writer needs the 33-item enumeration and the exit code mapping to write meaningful test assertions. L1 and L2 are LOW — can be addressed at story revision or noted in /decisions.
