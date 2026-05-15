# /review — Corpus Case T3 — Card Experience API: Scope integrity (HIGH) — Trial 2

**Case:** T3-scope-high
**Model:** claude-sonnet-4-6
**Trial:** 2

---

## FINDINGS

### 2-H1 — HIGH — Category B (Scope integrity) — Stories S5 and S6: implement features explicitly deferred in the discovery out-of-scope section

Cross-referencing the discovery artefact's out-of-scope section against the full story set reveals two stories implementing features that are named as explicit deferrals to other teams and initiatives:

**Story S5 (Broker portal read access):** This story defines a new endpoint `/v1/broker/clients/{clientId}/cards/{cardId}/summary` accessible to financial advisers via a distinct `role: adviser` OAuth authentication path, with an audit trail on every adviser read. The discovery out-of-scope section states:

> "Broker portal integration: access for financial advisers and brokers to view client card data via the broker portal is a separate initiative managed by the Wealth Products team. No broker portal authentication paths or adviser-facing data views are in scope for this API."

Story S5 implements exactly these excluded items: broker portal authentication (separate OAuth flow with adviser role), and adviser-facing card data views. The story's own "Benefit linkage" section attempts to claim alignment with Metric M1, but scope deference in a discovery artefact is not overridden by a benefit claim — this requires a formal scope change approved by the discovery approvers.

**Story S6 (KiwiSaver balance display):** This story adds a `kiwiSaverSummary` field (containing `currentBalance` and `fundType`) to the existing card balance endpoint, sourcing data from the internal KiwiSaver account service. The discovery out-of-scope section states:

> "KiwiSaver account integration: displaying KiwiSaver balances or account summaries alongside card data is owned by the KiwiSaver product team. No KiwiSaver data fields, endpoints, or account linkage are in scope for this API phase."

Story S6 implements exactly what is excluded: KiwiSaver data fields (`currentBalance`, `fundType`), KiwiSaver account service integration, and KiwiSaver data appearing in card API responses.

Neither story references an approved scope change note or a decision record that revises the discovery boundary. The constraint propagation summary shows both stories implementing C2 (OAuth authentication) without noting that their OAuth paths are distinct from the cardholder-facing C2 scope. This does not constitute scope approval.

Stories S1–S4 are well-formed and all within scope. The defect is localised to the Epic 3 stories.

Per SKILL.md Category B: implementing something explicitly listed in the discovery out-of-scope section is a HIGH threshold breach.

No other HIGH or MEDIUM findings.

---

## SCORE

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| Traceability | 4 | PASS | Discovery reference present and active. Benefit metric references M1 and M2 with active status. Story-level benefit linkage populated for all stories. Minor: S5 and S6 benefit linkage claims misalign with scope deference (these are out-of-scope stories, so their metric claims are secondary to the scope finding). |
| Scope integrity | 1 | FAIL | S5 implements broker portal integration explicitly deferred to the Wealth Products team. S6 implements KiwiSaver data integration explicitly deferred to the KiwiSaver product team. Neither has an approved scope change note. |
| AC quality | 5 | PASS | ACs across all six stories are well-formed GWT with specific, measurable outcomes and HTTP status codes where applicable. |
| Completeness | 4 | PASS | NFRs, complexity, scope stability, and effort estimates populated for all stories. Benefit linkage present. |

*Category E (Architecture compliance) — skipped. No architecture-guardrails.md provided in corpus bundle.*

---

## VERDICT

**FAIL — 1 criterion below threshold.**

Scope integrity = 1 (FAIL). Stories S5 and S6 implement features that the discovery artefact explicitly assigns to other teams (Wealth Products and KiwiSaver product team respectively). These stories must be removed from this feature or a formal scope change must be approved — including sign-off from the original discovery approvers — and a scope note added to the definition artefact referencing the revised discovery boundary.
