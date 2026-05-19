# Review: wucp.4 — Session start wizard

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Story:** wucp.4
**Run:** 1
**Reviewer:** GitHub Copilot (automated review)
**Date:** 2026-05-10
**Status:** PASS — 0 HIGH, 2 MEDIUM, 1 LOW

---

## Category A — Traceability

**Score: 3 — PASS**

- Epic reference present ✓
- Discovery reference present ✓
- Benefit-metric reference present ✓
- "So that..." clause names M3 and MM2 ✓
- Benefit Linkage mechanism sentence present and causal ✓

**Finding 4-M1 (MEDIUM):** The benefit-metric coverage matrix (`benefit-metric.md`, Metric Coverage Matrix) does not include wucp.4 in the M3 or MM2 rows. M3 row lists `wucp.1, wucp.2, wucp.3`; MM2 row lists `wucp.1, wucp.2, wucp.3`. The story's Benefit Linkage claims to move both metrics ("the session wizard gives the operator an explicit selection step... closes the gap that otherwise requires the operator to paste the feature slug manually"), and the Scope Accumulator Note directly justifies it on M3 grounds ("M3 (outer loop completeness) cannot be validated without the operator injecting a feature slug by hand at session start").

The matrix is the machine-readable traceability record read by `/trace`. A story that moves a metric but is absent from the matrix creates a trace gap.

Fix: update benefit-metric.md Metric Coverage Matrix — add wucp.4 to M3 row with note: `"wucp.4 (session start wizard — correct feature context selection, required for M3 dogfood cycle validity)"`. Add to MM2 row: `"wucp.4 (session start wizard — eliminates manual slug entry, reducing friction in unassisted cycle)"`.

---

## Category B — Scope Discipline

**Score: 4 — PASS**

- Story implements nothing declared out-of-scope in the epic ✓
- Discovery out-of-scope section does not mention a session start wizard — this is a confirmed scope addition ✓
- Own Out of Scope section populated ✓ — git repo creation, search/filter, archive/delete, multi-repo all excluded
- Scope addition is declared and justified in the Scope Accumulator Note ✓ — justification is causal (wucp.1 delivers partial value without it; M3 cannot be validated without it)

No blocking findings. Scope addition is appropriately governed.

---

## Category C — AC Quality

**Score: 4 — PASS**

AC1, AC2, AC3, AC5, AC6: Well-formed Given/When/Then, observable system behaviour, independently testable. ✓

**Finding 4-L1 (LOW):** AC4 embeds the full STAGE_INDEX constant definition (12 entries with exact numeric values) inside the AC body. This is a deliberate ambiguity-resolution choice noted in the Complexity Rating (`"the stage-name → stageIndex mapping is resolved by a hardcoded lookup table — see AC4"`). The intent is good — it closes the implementation ambiguity. However, as written, the AC is prescriptive about *implementation values* not just observable behaviour. If the journey sequence changes (e.g. a new stage is inserted), the index numbers in AC4 become wrong and the AC fails even if the observable behaviour (feature selected → journey initialised at correct stage) is correct.

Fix: move the STAGE_INDEX constant to Architecture Constraints where it belongs as an implementation constraint. Rephrase AC4 to describe observable behaviour only: `"Given the feature list is displayed, When the operator selects a feature, Then session.activeFeatureSlug is set to the selected feature's slug, the journey is initialised at the stage position corresponding to the feature's stage field using the exported STAGE_INDEX lookup table (defined in Architecture Constraints), and wucp.1's buildSystemPrompt() scopes the artefact listing to artefacts/[activeFeatureSlug]/. A stage name not in the lookup table falls back to stageIndex 0."` Add to Architecture Constraints: `"STAGE_INDEX lookup table: { discovery: 0, 'benefit-metric': 1, definition: 2, review: 3, 'test-plan': 4, 'definition-of-ready': 5, 'branch-setup': 6, 'implementation-plan': 7, 'subagent-execution': 8, 'verify-completion': 9, 'branch-complete': 10, 'definition-of-done': 11 }. Must be exported for unit testing. Dynamic derivation is not permitted."`

---

## Category D — Completeness

**Score: 5 — PASS**

- User story in As/I want/So that ✓
- Named persona ("platform operator using the web UI") ✓
- Benefit Linkage populated with causal mechanism ✓
- Out of Scope populated ✓
- NFRs populated (performance: <200ms; security: slug allowlist + HTTP 400; accessibility: keyboard navigation) ✓
- Complexity rated (2 — resolved by hardcoded lookup) ✓
- Scope stability declared (Stable) ✓
- DoR Pre-check present ✓

No findings.

---

## Category E — Architecture Compliance

**Score: 4 — PASS**

- wucp.1 dependency declared with correct coupling note (ships independently, full value requires wucp.1) ✓
- Journey stage coexistence constraint present ✓
- No new npm dependencies ✓
- Security: slug validated against allowlist from pipeline-state.json, HTTP 400 on mismatch ✓

**Finding 4-M2 (MEDIUM):** Architecture Constraints references `"ADR-023 path guard: Not applicable — the feature slug is selected from a controlled allowlist..."` but **ADR-023 in the guardrails registry is the handoff schema ADR** — *"Handoff schema between journey stages is artefact content injection (B-iii)"*. This is the same wrong reference as finding 1-M1 in wucp.1. The path traversal guard is a repo-level coding standard from `copilot-instructions.md`, not ADR-023.

Fix: replace `"ADR-023 path guard: Not applicable"` → `"Path traversal guard (coding standard, copilot-instructions.md): Not applicable — the feature slug is selected from a controlled allowlist read from pipeline-state.json, not from free-form path input. No path.resolve guard is required."`

---

## Findings Summary

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| 4-M1 | MEDIUM | A | benefit-metric.md coverage matrix does not list wucp.4 in M3 or MM2 rows — traceability gap. Fix: update matrix. |
| 4-M2 | MEDIUM | E | ADR-023 reference is wrong — ADR-023 is the handoff schema ADR, not path traversal guard. Fix: cite coding standard directly. |
| 4-L1 | LOW | C | AC4 embeds implementation values (STAGE_INDEX constant) inside AC body — move to Architecture Constraints; keep AC behaviour-focused. |

---

## Verdict

**PASS ✅**

0 HIGH findings. Story is clear to proceed to /test-plan.

Recommended fixes (should be applied before /definition-of-ready, not required before /test-plan):
- Fix 4-M1: update benefit-metric.md coverage matrix to include wucp.4 (required for /trace chain integrity)
- Fix 4-M2: replace ADR-023 reference in Architecture Constraints
- Fix 4-L1: move STAGE_INDEX constant to Architecture Constraints; rephrase AC4 as behaviour-only
