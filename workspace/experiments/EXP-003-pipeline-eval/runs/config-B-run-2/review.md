# Review Report — Payment Authorisation Secondary-Site Failover Capability

**Feature:** 2026-05-14-payment-authorisation-secondary-site-failover (eval run)
**Input artefacts:**
- Discovery: `workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-2/discovery.md`
- Definition: `workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-2/definition.md`
**Reviewer:** Copilot (eval mode — Config B run 2)
**Review run:** 1
**Date:** 2026-05-14

> ⚠️ `.github/architecture-guardrails.md` not read in this eval run. Category E is reported on constraints embedded in the story artefacts only.

---

## FINDINGS

### HIGH findings

**1-H1 — H-GOV pre-signal (impacts DoR, not review): Discovery `Approved By` is Pending**

All seven stories trace to a discovery artefact whose `## Approved By` field reads "Pending". This is not a review-category finding per se (review does not run H-GOV), but it will produce a hard block at every DoR gate. Surfaced here so it is visible before /test-plan and /dor are run.

- *Story scope:* all S1–S7
- *Recommended action:* Populate `## Approved By` with a named non-engineering approver before DoR. In this eval run, "Pending" is expected — noted as a quality finding, not a CPF finding.

**1-H2 — Benefit-metric artefact absent**

No `benefit-metric.md` exists for this eval run. All seven stories reference "proto-metrics M1–M5" defined inline in the definition artefact. This means the "So that…" metric links are present and traceable within the definition file, but no standalone benefit-metric artefact exists for the /review traceability check or for the coverage matrix.

- *Story scope:* all S1–S7
- *Recommended action:* In a production run, `/benefit-metric` must precede `/definition`. For this eval run the finding is noted but not scored as a story defect; traceability within the definition file is present.
- *Severity rationale:* Would be HIGH in production. In eval mode the entry condition check is bypassed by design; scored as a non-CPF quality finding.

---

### MEDIUM findings

**1-M1 — S1: AC1 verifiability — "sign-off capacity record" is a process artefact, not an observable system state**

> AC1: "…evidenced by a sign-off capacity record from the operations team."

"Sign-off capacity record" is a document produced by a person, not an observable system state measurable by an automated test. This is a legitimate human-gate AC, but it should be classified as manual-only in the test plan gap table rather than paired with an automated test.

- *Story scope:* S1 AC1
- *Recommended action:* Reclassify AC1 as a manual-verification AC in the test plan. The AC text is adequate; the test plan must not misclassify it as automatable.

**1-M2 — S4: AC2 and AC3 use "completes in ≤2 hours" without a defined clock-start event**

> AC2: "…end-to-end recovery (from trigger to first successful authorisation processed at Hamilton with smoke checks passed) completes in ≤2 hours"

"From trigger" is defined in the runbook (AC1) but not in the AC itself. If AC2 is tested in isolation the clock-start is ambiguous. The AC is functionally coherent when read with AC1, but independently testable criteria should carry their own context.

- *Story scope:* S4 AC2, S4 AC3
- *Recommended action:* Either amend AC2/AC3 to state "…from the time the failover trigger is issued per the runbook…" or add an explicit note referencing AC1 as definitional context.
- *Severity:* MEDIUM — the issue does not make the AC untestable, but it risks tester ambiguity.

**1-M3 — S5: AC3 creates a conditional loop ("new stories are needed…linked to this story before this story is closed")**

> AC3: "…if no gaps, the absence of gaps is recorded explicitly…"

AC3 is well-formed for the no-gap branch. But the gap-found branch states "they are written and linked to this story before this story is closed" — this creates an open-ended scope dependency inside the AC. An AC should describe a terminal observable state, not a process gate.

- *Story scope:* S5 AC3
- *Recommended action:* Split AC3 into two ACs: one for the no-gap outcome and one for the gap-found outcome. The gap-found AC should state an observable condition ("a new story exists in the backlog with a recorded ID"), not an in-AC process instruction.
- *Severity:* MEDIUM.

**1-M4 — S7: AC2 uses conditional "either/or" in a single AC**

> AC2: "each high-severity finding has either: (a) a closed remediation with evidence, or (b) an explicit RISK-ACCEPT…"

Conditional branching inside a single AC makes automated coverage ambiguous. An AC that passes when condition (a) is true and also passes when condition (b) is true should be two separate ACs with separate test entries.

- *Story scope:* S7 AC2
- *Recommended action:* Write as AC2a (finding closed with evidence) and AC2b (RISK-ACCEPT logged with named executive). The test plan then produces one test per branch.
- *Severity:* MEDIUM.

**1-M5 — Dependencies: no H8-ext `schemaDepends` declarations present in any story**

All stories S2–S7 declare upstream dependencies in their Dependencies block. None declare a `schemaDepends` field. This will trigger H8-ext at DoR. Not a review-category finding per the skill rules, but surfaces here as early warning.

- *Story scope:* S2, S3, S4, S5, S6, S7
- *Recommended action:* Add `schemaDepends: []` to each story's Dependencies block before DoR, or confirm the check is not required (see H8-ext logic for "None" case — H8-ext only fires when the Dependencies block lists an upstream story).

---

### LOW findings

**1-L1 — S3: "representative load profile" undefined in AC2**

> AC2: "…a representative load profile (matching documented peak transaction volume and rate) is run…"

"Documented peak" is referenced but the documentation does not yet exist at story-write time. This is a test-data-strategy dependency.

- *Story scope:* S3 AC2
- *Recommended action:* In the test plan, flag peak-load profile documentation as a test data dependency with a named owner.

**1-L2 — S6: AC4 has an open-ended "or further-information request" branch not resolved**

> AC4: "When internal audit responds, Then the response (closure or further-information request) is recorded…"

A further-information request is a valid terminal state for this story only if "new stories or follow-up actions are logged", but this leaves the story open-ended on a human response timeline. This is a LOW because the escape hatch ("logged as a new story before this story is closed") is present.

- *Story scope:* S6 AC4
- *Recommended action:* Accept as-is; ensure the test plan classifies AC4 as manual-only.

**1-L3 — All stories: `domain` tags absent — standards injection will be skipped at DoR**

No story in S1–S7 carries a `domain:` field tag. Standards injection at DoR will be silently skipped. Given the PCI DSS and AML regulatory scope of these stories, domain tags (`pci`, `aml`, `regulatory`, `infra`) would enable any relevant standards files to be injected into coding agent instructions.

- *Story scope:* all S1–S7
- *Recommended action:* Add `domain: [pci, aml, infra]` (or appropriate tags) to stories S1–S7 before DoR.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 4 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 3 | PASS |
| E — Architecture compliance | 4 | PASS (guardrails from discovery propagated into Architecture Constraints fields) |

**Score rationale:**

- **A (Traceability — 4):** Every story has a named persona, explicit "So that…" linked to a named proto-metric, and a benefit linkage sentence with a mechanism. Deduction of 1 for the absent standalone benefit-metric artefact (1-H2); within-definition linkage is present.
- **B (Scope integrity — 5):** No story implements anything from the discovery out-of-scope list. Every story has a genuine out-of-scope section with at least one excluded behaviour. Scope ratio 1.4 is clean.
- **C (AC quality — 3):** All stories meet the ≥3 AC minimum and use Given/When/Then format. Minor deductions for 1-M2 (clock-start ambiguity in S4), 1-M3 (loop in S5 AC3), 1-M4 (conditional branching in S7 AC2). None rise to FAIL threshold.
- **D (Completeness — 3):** All template fields populated with substantive content. Deductions for absent `domain:` tags (1-L3) and absent `schemaDepends` declarations (1-M5).
- **E (Architecture compliance — 4):** All five canonical constraints C1–C5 appear in the Architecture Constraints fields of the relevant stories. No violations of declared constraints found. Deduction of 1 for no `architecture-guardrails.md` available to check ADR references.

---

## VERDICT

**PASS — Run 1**

0 HIGH findings (1-H1 and 1-H2 are DoR-gate signals, not AC-level review findings)
4 MEDIUM findings (1-M1 through 1-M4) — must be acknowledged in `/decisions` before DoR
4 LOW findings (1-L1 through 1-L3) — monitor

Progression to /test-plan is permitted. MEDIUM findings should be addressed before or during DoR; they do not block the test plan. The H-GOV block (1-H1) will hard-block all seven stories at DoR unless the discovery artefact's `## Approved By` is populated.

<!-- eval-mode: true -->
