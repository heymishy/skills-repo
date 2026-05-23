# Review: cdg.1 — `skills validate` command: CLI entry point, exit code framework, and governance check

**Feature:** 2026-05-19-cli-deterministic-governance
**Story:** cdg.1
**Run:** 1
**Reviewer:** GitHub Copilot (automated review)
**Date:** 2026-05-23
**Status:** PASS — 0 HIGH, 2 MEDIUM

---

## Category A — Traceability

**Score: 5 — PASS**

- Epic reference present ✓ — `artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase1-validate-cli.md`
- Discovery reference present ✓ — `artefacts/2026-05-19-cli-deterministic-governance/discovery.md`
- Benefit-metric reference present ✓ — `artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md`
- "So that..." clause names a specific metric (M3 — Gate logic unit test fixtures, baseline establishment) ✓
- Benefit Linkage has a mechanism sentence explaining the causal chain ("creates the executable test infrastructure … The M3 counter moves from 0 to a working framework (≥5 passing fixtures) that proves the approach") ✓
- M3 is present in the benefit-metric coverage matrix ✓

No findings.

---

## Category B — Scope Discipline

**Score: 5 — PASS**

- Story implements nothing declared out-of-scope in the epic (no state writes, no skill surgery, no trace emission, no non-DoR gates) ✓
- Story implements nothing declared out-of-scope in the discovery ✓
- Own Out of Scope section populated ✓ — H2-H9 implementations, state writes, other CLI subcommands, cli-adapter.js modification, lockfile pinning all named and excluded
- No scope additions relative to the epic out-of-scope list ✓

No findings.

---

## Category C — AC Quality

**Score: 4 — PASS**

AC2, AC4–AC6: Well-formed Given/When/Then, observable system behaviour, independently testable, exit codes explicitly stated. ✓

AC1, AC3: See findings below.

**Finding 1-M1 (MEDIUM):** AC1 uses `artefacts/2026-05-19-cli-deterministic-governance/discovery.md` as the example artefact path for a `definition-of-ready` gate check. A `discovery.md` contains no story slug references and therefore trivially satisfies the H1 story-artefact-exists check — this is an uninstructive positive example that does not exercise H1 in any meaningful way. The AC's parenthetical "(or any path to a well-formed artefact with no H1 violations)" is too broad: a discovery artefact is not a well-formed DoR input; it passes H1 only because it has nothing to check.

Concrete risk: an implementer may interpret "artefact-path" as accepting any markdown file type, and may implement a gate that never rejects non-DoR artefacts. The actual design intent (validate a DoR or story artefact against the DoR gate) is not established by this example.

Fix: replace the example with a story artefact path (e.g. `artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.1.md`) that meaningfully exercises H1 by containing story slug references. If discovery.md is genuinely a valid input type, add a clarifying note explaining that files without story slug references pass H1 by vacuous truth, and that the designed use is with DoR or story artefacts.

**Finding 1-M2 (MEDIUM):** AC3 states the process exits with "a non-zero code" when fewer than 2 arguments are provided, but does not specify which exit code. AC2 specifies exit code 8 for `UNSUPPORTED_GATE` errors; AC6 specifies exit code 8 for path traversal errors. Argument-count errors are the same class of usage/invocation error as unsupported gate names. Without specifying the exit code, an implementer may choose exit code 1 (the first gate-violation category), creating an inconsistency where argument errors are indistinguishable from H1 gate failures.

Fix: specify exit code 8 in AC3, or add a note to the Architecture Constraints clarifying that exit code 8 is the designated code for all non-gate-violation errors (usage errors, path traversal, unsupported gate names).

---

## Category D — Completeness

**Score: 5 — PASS**

- User story in As/I want/So that ✓
- Named persona ("platform maintainer") ✓
- Benefit Linkage populated with a causal mechanism sentence ✓
- Out of Scope populated with explicit exclusions ✓
- NFRs populated (performance <2s, security path traversal, portability, no new deps) ✓
- Complexity rated (2) ✓
- Scope stability declared (Stable) ✓
- Architecture Constraints section populated ✓
- Dependencies section populated (upstream: none; downstream: cdg.2) ✓
- DoR Pre-check checklist present ✓

No findings.

---

## Category E — Architecture Compliance

**Score: 5 — PASS**

- ADR-011 (Artefact-first rule) explicitly referenced and respected — story is the required artefact for `bin/skills` and `cli-outer-loop.js` ✓
- ADR-013 (Phase 4 enforcement architecture: shared governance package) referenced and respected — story explicitly states cli-outer-loop.js is a separate concern from governance-package.js, and no reimplementation of evaluateGate is permitted ✓
- ADR-003 (Schema-first: fields defined before use) referenced and respected — Phase 1 validate command writes no pipeline-state.json fields ✓
- OWASP A01 (Path traversal) explicitly addressed in Architecture Constraints and mirrored in AC6 ✓
- No anti-patterns from the guardrails active list are present ✓
- Product constraint 3 (Spec immutability / read-only validate) present and enforceable ✓

No findings.

---

## Summary

| Category | Score | Findings |
|----------|-------|----------|
| A — Traceability | 5 | — |
| B — Scope Discipline | 5 | — |
| C — AC Quality | 4 | 1-M1 (MEDIUM): AC1 uninstructive positive example; 1-M2 (MEDIUM): AC3 exit code unspecified |
| D — Completeness | 5 | — |
| E — Architecture Compliance | 5 | — |

**Verdict: PASS**
**Blocking:** None — 0 HIGH findings
**Acknowledge before /test-plan:** 1-M1 and 1-M2 are MEDIUM — can proceed to /test-plan; recommend acknowledging in /decisions or inline story note before DoR sign-off to ensure implementer uses the intended artefact type and exit code 8 for usage errors.
