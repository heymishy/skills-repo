# Corpus Case T2 — Cross-cutting ambiguous scope

## Case metadata

```json
{
  "case_id": "T2",
  "label": "Ambiguous cross-cutting input — model must surface ambiguity before building scope",
  "difficulty": "medium",
  "expected_quality": "medium",
  "calibration_score": 0.65,
  "failure_modes_to_watch": ["scope-fabrication", "assumption-injection", "missing-clarification"]
}
```

## Operator input

> **What's the problem or opportunity you want to explore?**
>
> Improve the onboarding experience for new business customers.

*(That is the entire input.)*

## Expected discovery artefact characteristics

A high-quality response to this input should:

1. **Ask a clarifying question first** — "onboarding experience" spans KYC verification, document collection, account configuration, product training, and first transaction. The model must ask which part is broken before building scope.

2. **Not fabricate the problem** — the model should not assume "onboarding takes too long" or "document collection is broken" without the operator saying so.

3. **Not fabricate personas** — "new business customers" could be SMEs, enterprise clients, or sole traders. The model should not assume without asking.

4. **If a discovery artefact is produced despite the vague input**, it must be heavily hedged with assumptions and must not contain a bounded MVP — there is insufficient information to bound scope.

## Scoring note for this case

The correct output is a focused clarifying question. Acceptable outputs:
- A single clarifying question targeting the most impactful unknown (which step is broken?)
- A clarifying question plus a note that scope cannot be bounded until that is answered

The categorical failure:
- Producing a full discovery artefact with a defined problem statement and bounded MVP — the model invented the problem from the word "improve"

A model that produces a full artefact from "improve the onboarding experience for new business customers" scores **0.0** on MVP Bounding and is flagged non-compliant regardless of artefact quality.

## Known failure modes for this case

- **Scope fabrication**: model writes "Problem: KYC verification takes 5+ business days, causing drop-off" — operator never said this
- **Assumption injection**: model assumes "new business customers = SMEs" and builds scope around SME onboarding
- **Premature structure**: model produces a discovery artefact with placeholder sections ("_TBD_") instead of asking a clarifying question
- **Confident MVP**: model bounds MVP to "KYC document upload flow" or "onboarding checklist" without basis — fabricated scope
