# Corpus Case T3 — Regulated domain with compliance constraints

## Case metadata

```json
{
  "case_id": "T3",
  "label": "Regulated input — model must surface compliance constraints, not just scope",
  "difficulty": "medium-hard",
  "expected_quality": "high",
  "calibration_score": 0.82,
  "failure_modes_to_watch": ["compliance-blindness", "thin-constraints", "implementation-in-discovery"]
}
```

## Operator input

> **What's the problem or opportunity you want to explore?**
>
> We need to implement transaction monitoring alerts for AML threshold breaches. Our current system flags transactions over £10,000 in cash equivalents but we have no real-time alerting — compliance officers check a report manually every morning. We've had two near-misses in the last 90 days where threshold breaches sat undetected for 18+ hours. The FCA expects near-real-time detection and we're behind the curve.
>
> **Who it affects:** Compliance officers (detection lag), MLRO (money laundering reporting officer — responsible for filing SARs), risk team (exposure while breaches sit undetected).
>
> **Why now:** FCA review is scheduled for Q4. We need demonstrable near-real-time monitoring before then.
>
> **MVP:** Real-time alerting to the compliance team when a transaction breaches the £10,000 threshold. Alerts via internal Slack + email. Compliance officer reviews and clears or escalates.
>
> **Success:** Threshold breach detection goes from 18+ hours to under 15 minutes.

## Expected discovery artefact characteristics

A high-quality output from this input should:
- Problem statement describes the detection lag and regulatory exposure — not "build alerts"
- Surfaces the MLRO persona and their specific obligation (SAR filing under POCA 2002 / MLR 2017)
- MVP is bounded: real-time detection and alert routing only; SAR filing workflow is a separate system concern
- Constraints include: FCA regulatory obligation (near-real-time detection is a compliance requirement, not a preference), audit trail requirement (all alerts and dispositions must be logged for regulatory evidence), false positive rate (high false positive rate will overwhelm compliance officers and reduce detection efficacy)
- Assumptions include: the threshold logic is accurate (£10k rule may be more nuanced — structuring risk), alert routing to Slack/email is compliant for internal financial alerts
- Out of scope: SAR filing automation, upstream transaction screening changes, threshold rule changes
- Success indicators are anchored: "18+ hours → < 15 minutes" is the baseline + target

## Scoring note

- A model that produces alerts without mentioning audit trail, FCA obligation, or SAR filing context scores poorly on Constraint Completeness (D7=0.0 if all three are absent)
- A model that treats the £10,000 threshold as a fixed fact without noting structuring risk (deliberate breaking of transactions to stay under threshold) scores poorly on Assumption Quality
- A model that includes SAR filing automation in MVP scope has failed MVP Bounding — the operator scoped to alert routing only

## Known failure modes for this case

- **Compliance blindness**: model scopes the feature as a notification system without surfacing FCA obligation, audit trail, or MLRO persona
- **Thin constraints**: constraints section lists only "Slack API availability" — misses the regulatory, audit trail, and false-positive rate constraints
- **Implementation in discovery**: model includes alert schema, Slack webhook configuration, or threshold rule query logic in the discovery artefact
- **Missing MLRO**: compliance officer is mentioned but MLRO role and SAR obligation are absent — MLRO is the primary regulatory actor
