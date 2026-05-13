# Corpus Case T5 — Deceptively complex, enterprise context required

## Case metadata

```json
{
  "case_id": "T5",
  "label": "Deceptively complex — gold standard is enterprise context questions, not a feature list",
  "difficulty": "hard",
  "expected_quality": "medium-high",
  "calibration_score": 0.72,
  "failure_modes_to_watch": ["feature-list-production", "tooling-duplication-blindness", "enterprise-constraint-blindness"]
}
```

## Operator input

> We should build a note-taking app so our teams can capture meeting notes and decisions in one place.

*(The operator is from a regulated financial services firm with 500+ employees. Read `product/constraints.md` for platform context.)*

## Expected discovery artefact characteristics

A high-quality response to this input should **not** contain a feature list. The correct output surfaces enterprise context questions and recommends `/clarify` before proceeding:

1. **Data residency question**: where must the notes data reside? UK/EU only? Is this subject to data localisation requirements under UK GDPR?
2. **Retention policy question**: how long are notes retained? Meeting notes may contain personally identifiable information, decisions with legal implications, or commercially sensitive information — retention policy is a hard constraint, not a feature.
3. **Tooling duplication question**: does the firm already have Microsoft Teams, Confluence, SharePoint, or similar? If so, why are those insufficient? Building when a licensed tool already exists requires a "build vs configure" justification.
4. **Access control question**: who can see whose notes? Cross-team visibility, client-facing content separation, and role-based access are enterprise requirements that shape the entire architecture — not features to add later.
5. **Compliance classification**: are any meeting notes subject to FCA record-keeping obligations (e.g. notes from client advisory meetings under MiFID II or COND)?

## Gold standard definition

The gold standard output:
- Recommends `/clarify` before proceeding to a full discovery artefact
- Contains the enterprise context questions (data residency, retention, tooling duplication, access control, compliance classification) as open questions or assumptions to validate
- Does NOT contain: rich text editor, tagging, search, collaboration features, mobile sync, notification preferences, or any other feature description
- Success indicators are framed as questions: "what does 'one place' mean — current meeting notes are in how many places?"

**T5 fail condition is binary:** A feature list appears in the output = fail. This applies regardless of framing. A response that says "We would need to consider enterprise constraints, but the MVP might include rich text editing, tagging, and search" has still failed — the feature list appearing at all, even with a preamble or caveat, is the categorical fail. The correct output contains zero feature descriptions.

A model that produces "MVP: rich text editing, tags, full-text search, collaborative editing" has **failed this case** regardless of how well-structured the output looks. Feature list production = D3=0.0, compliant=false.

## Scoring note

- T5 calibration score (0.72) is deliberately lower than T1 (0.88) — the input is plausible but enterprise context questions are the quality signal, not artefact completeness
- A model that surfaces data residency + retention + tooling duplication scores well on Constraint Completeness and Assumption Quality
- A model that surfaces all 5 enterprise context questions and recommends /clarify earns a score of 0.85+
- A model that produces any feature list earns D3=0.0 (MVP bounding) and is flagged non-compliant

## Known failure modes for this case

- **Feature list production (direct)**: model produces "MVP: rich text editor, @mentions, decision tagging, full-text search, meeting agenda templates" — categorical fail
- **Feature list production (preamble-wrapped)**: model writes "We should consider enterprise constraints, however the MVP could include rich text editing, tagging, and full-text search" — still categorical fail; the feature list appearing at all is the disqualifier, not its position in the response
- **Tooling duplication blindness**: model does not ask whether Teams/Confluence/SharePoint is already licensed and deployed
- **Enterprise constraint blindness**: data residency, retention policy, and compliance classification are absent from constraints and assumptions
- **Persona thinness**: "teams" without asking what types of teams, what their note-taking workflows look like, or whether the problem is capture or retrieval
