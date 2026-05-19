# Review: wucp.1 — Pipeline context auto-loader

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Story:** wucp.1
**Run:** 1
**Reviewer:** GitHub Copilot (automated review)
**Date:** 2026-05-10
**Status:** PASS — 0 HIGH, 2 MEDIUM

---

## Category A — Traceability

**Score: 5 — PASS**

- Epic reference present ✓
- Discovery reference present ✓
- Benefit-metric reference present ✓
- "So that..." clause names a specific metric (M3 — outer loop completeness; MM2 — unassisted replication) ✓
- Benefit Linkage has a mechanism sentence explaining the causal chain to the metric ✓
- M3 and MM2 are present in the benefit-metric coverage matrix ✓

No findings.

---

## Category B — Scope Discipline

**Score: 5 — PASS**

- Story implements nothing declared out-of-scope in the epic ✓ — buildSystemPrompt() addition only; no new routes or adapters
- Story implements nothing declared out-of-scope in the discovery ✓
- Own Out of Scope section populated ✓ — mid-session file reads, token budget hard limiting, write-mode loading, fleet artefact listing all named and excluded
- No scope additions present — N/A for accumulator note requirement ✓

No findings.

---

## Category C — AC Quality

**Score: 4 — PASS**

AC1–AC4, AC6–AC7: Well-formed Given/When/Then, observable system behaviour, independently testable, "does/returns" language. ✓

**Finding 1-M2 (MEDIUM):** AC5's trigger is process-oriented — `"When this story is implemented"` — rather than a system-state condition. All other ACs use a system state as the When clause. Process-oriented triggers are a test execution gap: a test cannot observe "the story is implemented" — it can only observe that an artefact file exists or does not exist.

Fix: rephrase to `"When the story is ready to merge, Then a schema inspection artefact must exist at artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md"` — or move the merge gate to the DoR Pre-check section and reframe AC5 as an artefact-existence check at deploy time.

---

## Category D — Completeness

**Score: 5 — PASS**

- User story in As/I want/So that ✓
- Named persona ("platform operator using the web UI") ✓
- Benefit Linkage populated with non-trivial mechanism ✓
- Out of Scope populated ✓
- NFRs populated (performance: <200ms first-turn latency impact; security: no credential values in prompt; D37 wired adapter) ✓
- Complexity rated (1 — well understood) ✓
- Scope stability declared (Stable) ✓
- DoR Pre-check present ✓

No findings.

---

## Category E — Architecture Compliance

**Score: 3 — PASS**

- ADR-004 (context.yml canonical config source) correctly referenced and respected ✓
- ADR-009/No credential leakage: secretRef inspection gate (AC5) correctly addresses this ✓
- D37 (injectable adapter stub-throws): referenced and applied to the file-reader adapter ✓
- Zero npm dependencies: constraint present ✓
- No SKILL.md modification: constraint present ✓
- ADR-022 (multi-skill orchestration Option B): N/A — this story does not add sessions or handoffs; static paths read once into system prompt. Should be declared N/A (LOW gap — not raised as a finding given the static nature of the reads)

**Finding 1-M1 (MEDIUM):** Architecture Constraints references `"ADR-023 path guard: Not applicable — the file reads in the auto-loader are from known, static paths..."` but **ADR-023 in the guardrails registry is the handoff schema ADR** — *"Handoff schema between journey stages is artefact content injection (B-iii)"*. The path traversal guard is not ADR-023; it is a repo-level coding standard from `copilot-instructions.md` (sourced from ougl.5 AC11, ougl.6 AC8, NFR-sec-pathtraversal, web-ui-patterns.md) with no separate ADR number.

Fix: change `"ADR-023 path guard: Not applicable"` → `"Path traversal guard (coding standard, copilot-instructions.md): Not applicable — the file reads in the auto-loader are from known, static paths defined at code time, not from free-form request input."`

---

## Findings Summary

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| 1-M1 | MEDIUM | E | ADR-023 reference is wrong — ADR-023 is the handoff schema ADR, not path traversal guard. Fix: cite coding standard directly. |
| 1-M2 | MEDIUM | C | AC5 trigger "When this story is implemented" is process-oriented, not a system-state condition. Fix: rephrase to artefact-existence check. |

---

## Verdict

**PASS ✅**

0 HIGH findings. Story is clear to proceed to /test-plan.

Recommended fixes (should be applied before /definition-of-ready, not required before /test-plan):
- Fix 1-M1: replace ADR-023 reference in Architecture Constraints
- Fix 1-M2: rephrase AC5 When clause to system-state condition
