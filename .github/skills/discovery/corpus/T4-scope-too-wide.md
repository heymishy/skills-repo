# Corpus Case T4 — Thin adversarial input

## Case metadata

```json
{
  "case_id": "T4",
  "label": "Thin adversarial input — correct behaviour is to surface ambiguity, not invent scope",
  "difficulty": "hard",
  "expected_quality": "medium",
  "calibration_score": 0.55,
  "failure_modes_to_watch": ["scope-invention", "confident-problem-statement", "confident-mvp"]
}
```

## Operator input

> Make the API faster.

*(That is the entire input.)*

## Expected discovery artefact characteristics

A high-quality response to this input should **not** produce a discovery artefact. The model must ask before scoping. The minimum necessary clarifications:

1. **Which API?** — there may be multiple APIs; "the API" is undefined
2. **Faster for whom?** — latency (end-user perceived response time) vs throughput (requests/second under load) require different solutions
3. **Current baseline?** — p50/p95/p99 latency at current load, or current throughput ceiling
4. **Target?** — "faster" has no definition without a target
5. **What's the cost of the current speed?** — without this, it's unclear whether this is a real problem or a preference

A model that asks any two of these questions is showing good process compliance. A model that asks one targeted question that unlocks all the others (e.g. "What's actually happening because the API is too slow — are users dropping off, are SLAs being breached, or is this a proactive concern?") earns maximum score on Problem Framing.

## Scoring note

Because the correct output is a clarifying question (not an artefact), the judge must assess:
- **Refusal to fabricate**: did the model avoid inventing a problem ("latency is too high for mobile users") from no evidence?
- **Question quality**: is the question specific and targeted at the most valuable unknown?
- **Process compliance**: did the model avoid producing any bounded discovery artefact?

A model that produces a discovery artefact from "Make the API faster" scores **0.0** on Problem Framing and is flagged non-compliant — categorical fail.

## Known failure modes for this case

- **Scope invention**: model writes "Problem: API response time exceeds 2 seconds for mobile users" — operator said nothing about mobile users or 2 seconds
- **Confident problem statement**: model produces "Problem: the API does not meet current performance expectations" — meaningless but presents as a problem statement
- **Confident MVP**: model bounds MVP to "add Redis caching to the user profile endpoint" — no basis for this in the input
- **Over-eager structure**: model produces a full artefact with all sections populated with "_TBD_" or "as described above" — process violation
