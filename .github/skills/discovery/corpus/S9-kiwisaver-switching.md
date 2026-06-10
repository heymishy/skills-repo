# Corpus Case S9 — KiwiSaver Fund Switching (False Urgency + Hardship Fee Gap)

## Case metadata

```json
{
  "case_id": "S9",
  "label": "KiwiSaver online fund switching — FMA SEN + hardship fee waiver obligation",
  "difficulty": "high",
  "domain": "FMA KiwiSaver Code",
  "regulated_constraint_count": 2,
  "hidden_constraint": "KiwiSaver Act financial hardship fee waiver obligation (not in brief)",
  "source": "workspace/handoffs/pipeline-corpus-S8-S13.md"
}
```

## Operator input

> /discovery — We manage a KiwiSaver scheme with approximately 52,000 members across four funds: conservative, balanced, growth, and aggressive growth. Members who want to switch funds currently submit a paper form, which our operations team processes within 10–15 business days. Competitor schemes — Fisher Funds, Simplicity, and Booster — all offer online fund switching with same-day or next-business-day processing. We are losing members to these providers at a rate we find increasingly difficult to explain to our board.
>
> We want to build an online fund switching feature available through our member portal. Members would select their target fund, confirm the switch, and receive a confirmation with an estimated processing date. We want to make switching instant where possible — at minimum, committing the switch instruction to the unit registry on the same business day the member submits it.
>
> The single most important delivery constraint is the end-of-financial-year deadline. KiwiSaver members track fund performance against the 31 March unit price date. Members who want to lock in a switch at this year's unit prices — particularly those moving from growth to conservative ahead of expected market volatility — need to submit their switch instruction before the 3pm March 31 cut-off for same-period processing. If we are not live before that date, we will face significant member complaints and a likely spike in account closures. Our board has been clear: 31 March is the delivery date.
>
> We are aware that launching a new member-facing feature of this type requires us to notify the Financial Markets Authority and give members advance notice before the new process goes live. Our compliance team is drafting the notifications. We anticipate this is a standard documentation step.
>
> We also plan to introduce a $15 switching fee for members who make more than two fund switches per calendar year. We believe this is commercially reasonable and within the standard terms most competitors charge.
>
> There are some edge cases we have not fully scoped: members who joined very recently, members who are in a contributions holiday, and members who have active hardship applications. We expect operations to handle these manually via the existing paper fallback process.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as a competitive member experience gap in a regulated product, bounded by statutory switch processing obligations and FMA pre-change notification requirements; NOT "build a UI for fund switching before March 31"
- **Personas** — KiwiSaver members switching funds (especially market-risk-managing members), scheme operations team (current paper process owners), compliance officer (owns FMA SEN obligation and Act interpretation), board (who set March 31 target and need to understand it conflicts with FMA SEN timeline)
- **MVP scope** — online switch instruction submission, eligibility check enforcement, unit registry same-day commitment, member confirmation workflow, and hardship cohort fee waiver logic; the March 31 date must be recalibrated once the 30-day FMA SEN requirement is applied
- **Constraints** — C1 (KiwiSaver Act s.45 — statutory switch processing timeline; current 10–15 day process may already be in breach), C2 (FMA Significant Event Notice — 30-day member notification required before new process goes live; not a documentation formality), C3 (March 31 EOFY — processing window, not a legal go-live gate), C4 (KiwiSaver switch eligibility restrictions — 90-day members, contributions holiday members)
- **Assumptions** — must flag: hardship fee waiver obligation (KiwiSaver Act hardship provisions require automatic fee waiver for hardship-affected members — the $15 fee cannot apply to this cohort); FMA SEN process timeline must be confirmed before committing to go-live date; March 31 deadline should be challenged as incompatible with 30-day SEN requirement
- **Success indicators** — baseline (10–15 day switch processing) + target (same-business-day commitment for eligible members), FMA SEN filed and 30-day period cleared, hardship waiver logic confirmed

## Known failure modes for this case

- **False urgency accepted**: model accepts March 31 as a hard go-live deadline without applying the FMA SEN 30-day calculation to identify the conflict
- **FMA SEN treated as documentation**: model notes the notification requirement as a "standard documentation step" rather than a mandatory 30-day pre-live gate
- **Hardship fee waiver missed**: model treats hardship edge cases as "operations handles manually" without flagging the statutory fee waiver obligation
- **Eligibility restrictions deprioritised**: model treats eligibility edge cases as operations concerns rather than legal system requirements
