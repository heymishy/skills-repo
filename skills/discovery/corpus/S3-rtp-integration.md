# Corpus Case S3 — NZ Real-Time Payments Integration

## Case metadata

```json
{
  "case_id": "S3",
  "label": "Real-time payments infrastructure integration (NZ RTP scheme)",
  "difficulty": "high",
  "domain": "Payments / RTP scheme",
  "regulated_constraint_count": 2,
  "hidden_constraint": "16 of 47 scheme compliance checklist items unreviewed",
  "source": "workspace/handoffs/pipeline-corpus-S2-S7.md"
}
```

## Operator input

> /discovery — Payments NZ is launching the new real-time payments infrastructure
> (the RTP scheme) and the enterprise is required to participate as a scheme member.
> Our current domestic payment rails use batch processing with same-day settlement.
> The RTP scheme requires us to be able to receive and send payments within 60 seconds,
> 24/7/365, with immediate fund availability.
>
> We need to build the receiving side first — accepting inbound RTP payments to the enterprise
> customer accounts. This involves integrating with the Payments NZ central infrastructure,
> processing inbound payment messages in the ISO 20022 format, crediting customer accounts
> in real time, and sending scheme-required acknowledgement messages within the timeout
> window (currently 10 seconds from receipt).
>
> Our current core banking system processes transactions in batch windows. To support
> real-time crediting we will need a thin real-time processing layer that credits accounts
> immediately and reconciles with the batch core at end of day.
>
> The scheme rules require that we implement fraud screening on all inbound payments.
> Our current fraud system runs as a batch job — it does not have a real-time API.
> We have estimated that a real-time fraud check would add 2–4 seconds to processing
> time. We have not confirmed whether this fits within the 10-second acknowledgement
> window when combined with our other processing steps.
>
> AML screening is also required on inbound payments above $1,000. Our AML system
> has a real-time API but it has a P99 latency of 8 seconds under load. We have not
> load-tested the AML system at RTP volumes (estimated 40,000 transactions per hour
> at peak).
>
> Our scheme participation agreement requires us to be live by 2026-09-01. Missing
> this date triggers a financial penalty of $50,000 per day and potential suspension
> from the scheme.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as a mandatory scheme participation requirement with hard deadline and penalty exposure, bounded by real-time processing architecture constraints; NOT framed as "build a faster payments system"
- **Personas** — payments engineering team (own the integration), operations team (own the reconciliation risk), compliance team (own AML/CFT obligations), Payments NZ scheme operator (certification authority)
- **MVP scope** — bounded to: inbound RTP payment reception, ISO 20022 processing, real-time account crediting, 10-second acknowledgement with compliant fraud and AML screening; explicitly excluding outbound RTP (future phase)
- **Constraints** — C1 (scheme participation agreement — 2026-09-01 hard deadline, $50k/day penalty), C2 (AML/CFT Act — screening required on payments >$1,000), C3 (10-second acknowledgement window — scheme rule), C4 (fraud screening — real-time capability unconfirmed at required volume)
- **Assumptions** — must flag: fraud vendor real-time API suitability at 40k tph unconfirmed; AML system P99 latency at 4x current load unconfirmed; thin real-time crediting layer reconciliation risk unassessed; scheme certification checklist status unknown
- **Success indicators** — 100% scheme certification compliance, 10-second acknowledgement SLA met at peak volume, AML screening confirmed at RTP load

## Known failure modes for this case

- **Architecture blindness**: model does not surface the 10-second acknowledgement window as a forcing constraint on every processing decision
- **AML latency gap missed**: model treats "AML has a real-time API" as sufficient without flagging the P99 latency vs window size conflict
- **Scheme certification gap missed**: model omits the 16 unreviewed checklist items as a go-live risk
- **Fraud system architecture decision deferred**: model notes the requirement without flagging the architectural decision (rule-based pre-screen vs async full model) as unresolved
