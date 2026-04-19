# Definition of Ready: p4-enf-schema — Structured output schema validation

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-schema.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-enf-schema-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-enf-schema-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E3 — Structural Enforcement
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform maintainer (heymishy). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike A verdict in schema ✅. `expected-output-shape` syntax from Spike A output is a sequencing constraint. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C5, MC-CORRECT-02, Spike A output, ADR-004. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no operator output logged externally. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Correctness (MC-CORRECT-02 — structured error object), Performance (validation ≤100ms). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — `expected-output-shape` syntax depends on Spike A interface specification; REDESIGN verdict may change the validation library. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** Spike A must have a non-null verdict (provides `expected-output-shape` syntax). `p4-enf-decision` ADR must be committed. `p4-enf-package` must be complete (provides `evaluateGate` and `advanceState`).

**Scope contract:**
- Implement `validateOutputShape(output, schema)` that validates agent output against the `expected-output-shape` JSON Schema declared at a workflow node.
- AC1: schema violation → structured error `{error: "OUTPUT_SHAPE_VIOLATION", field: "<failing_field>", expected: "<schema_type>", actual: "<actual_value>"}`. Blocks `advanceState`.
- AC2: error identifies failing field by JSON path (e.g. `.stories[0].ac_count`), expected type/constraint, actual value or null.
- AC3: node without `expected-output-shape` → validation skipped; step proceeds without error (opt-in per node).
- AC4: deterministic — two runs on identical input/schema produce identical results.
- Schema validation uses hash-verified skill declaration for `expected-output-shape` (C5).

**Architecture constraints:**
- C5: `expected-output-shape` from hash-verified skill content; consumer cannot substitute without hash changing
- MC-CORRECT-02: validation errors conform to platform error schema (structured JSON object); plain text errors not acceptable
- ADR-004: if schema validation enabled/disabled per skill via context.yml, use `enforcement.*` namespace; no CLI flag bypass
- MC-SEC-02: no operator output content logged externally during validation

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike A syntax dependency), W4 (verification script)
Upstream gate: Spike A verdict + p4-enf-decision ADR + p4-enf-package complete.
