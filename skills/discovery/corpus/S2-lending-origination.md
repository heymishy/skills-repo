# Corpus Case S2 — Lending Origination (Personal Loan Application Flow)

## Case metadata

```json
{
  "case_id": "S2",
  "label": "Lending origination — CCCFA + FMA bias disclosure",
  "difficulty": "very-high",
  "domain": "Credit / CCCFA + FMA",
  "regulated_constraint_count": 3,
  "hidden_constraint": "Demographic disparity not disclosed to FMA",
  "source": "workspace/handoffs/pipeline-corpus-S2-S7.md"
}
```

## Operator input

> /discovery — Our personal lending team wants to digitise the personal loan application
> journey for existing the enterprise customers. Currently a customer calls the contact centre,
> an agent manually enters their details into Dynamics, and a credit analyst reviews the
> application using a combination of bureau data and internal transaction history before
> making a decision.
>
> The manual process takes 3–5 days end to end. Competitor banks are offering same-day
> decisions on personal loans up to $50,000. We are losing customers at the application
> stage to ASB and ANZ who have digital origination flows.
>
> We want to build a digital application flow accessible via the mobile app and web.
> The customer enters their loan purpose, amount, and term. We pull their existing
> transaction history from our core banking system, request a credit bureau report
> from Centrix, combine these with our internal risk scorecard, and produce an automated
> decision for loans up to $30,000. Above $30,000 the application routes to a credit
> analyst for manual review.
>
> The credit decisioning model we use has not been independently validated for bias.
> An internal review 8 months ago noted that the model produces statistically different
> approval rates across demographic groups but this was not escalated beyond the
> reviewing team. We have not disclosed this to the FMA.
>
> Our responsible lending obligations under the Credit Contracts and Consumer Finance
> Act require us to make reasonable inquiries about the customer's financial situation
> before advancing credit. We currently satisfy this via the manual agent interview.
> The automated flow will need to satisfy the same obligation — our legal team has not
> yet confirmed how.
>
> We want to go live before end of Q3 to capture the winter lending season.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as competitive digital gap in a regulated lending product bounded by statutory inquiry obligations and algorithmic fairness requirements; NOT framed as "build a digital loan application"
- **Personas** — loan applicants (who need speed and certainty), credit analysts (who currently own the decision workflow), compliance/legal team (who must confirm CCCFA reasonable inquiry approach), and the FMA relationship (given the undisclosed disparity finding)
- **MVP scope** — bounded to: digital application capture, automated decisioning for ≤$30k, credit bureau integration subject to confirmed data sharing agreement, CCCFA reasonable inquiry mechanism (pending legal sign-off); explicitly excluding automated decisions >$30k and live deployment before legal confirmation
- **Constraints** — C1 (CCCFA reasonable inquiry — legal sign-off not yet obtained), C2 (FMA algorithmic fairness — disparity finding not disclosed), C3 (Centrix DSA may not cover personal lending), C4 ($30k automated decision ceiling)
- **Assumptions** — must flag: undisclosed FMA demographic disparity as a go-live blocker; CCCFA automated inquiry mechanism unconfirmed; Centrix DSA scope unconfirmed
- **Success indicators** — baseline (3–5 day decision time) + target (same-day automated decision for eligible applications), with regulatory compliance preconditions named

## Known failure modes for this case

- **Regulatory blindness**: model treats Q3 deadline as a hard constraint and deprioritises CCCFA/FMA gates
- **FMA disclosure gap missed**: model omits the undisclosed demographic disparity as a constraint/blocker
- **CCCFA automated inquiry glossed over**: model assumes automated transaction analysis satisfies reasonable inquiry without flagging legal confirmation as prerequisite
- **Centrix integration assumed**: model treats bureau data access as given without noting DSA uncertainty
