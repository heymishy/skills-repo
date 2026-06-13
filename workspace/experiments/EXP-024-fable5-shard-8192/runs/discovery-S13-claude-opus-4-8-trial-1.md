I'll run the /discovery pipeline on this trans-Tasman payment feature. Let me work through this systematically, focusing on surfacing the assumptions and risks that matter before you commit to a 6-month build.

## Discovery Summary

You want to build a fast, cheap NZ→AU payment channel for enterprise retail customers, routed via your group's internal treasury books rather than SWIFT, to recapture ~NZD $4.2M of annual revenue leaking to Wise and remittance providers.

The core mechanism is the part that needs the most scrutiny — so let me start there.

---

## Critical Issues to Resolve Before Build

### 1. The settlement mechanism may not be the simple "internal routing" you're describing

The flow you've described — NZ customer instruction → settled via group treasury books → AU counterpart credits AU recipient → net positions cleared end-of-day — is functionally a **cross-border money transfer business built on intra-group liquidity netting**. A few things follow from that:

- **This is not the same activity as your internal treasury flows.** The existing reciprocal routing agreement covers the enterprise's *own* treasury positions. Using it to settle *third-party customer* payments is a materially different use. The agreement almost certainly needs to be re-papered to cover customer flows, liability allocation, error/recall handling, and indemnities. **Assumption to test:** "the existing agreement covers this." I'd flag this as likely false.
- **Who holds customer funds, and where, during the 2-hour window?** Between debit at the NZ end and credit at the AU end, the customer's money is sitting on the group treasury books. That has implications for trust/client-money treatment, capital, and what happens if either entity fails mid-flight. This needs a clear answer, not an assumption.

### 2. The Australian regulatory perimeter is the biggest unknown — and it's not "your" regulator

You mention your regulatory team manages "standard notifications." The risk is that this isn't a notification problem; it's a **licensing and AUSTRAC problem on the Australian side.**

- The AU counterpart is **crediting Australian recipients** — that is the act of providing a payment/remittance service into Australia. **AUSTRAC** enrolment/registration and AML/CFT obligations apply at the AU end under Australian law, not just RBNZ rules at the NZ end.
- **Open question for the AU counterpart:** Are they licensed/authorised to provide this service to third-party beneficiaries, or only to conduct intra-group treasury activity? "Shared group infrastructure" does not automatically confer the right to push customer payments.

**This is the single most likely thing to blow your 6-month timeline.** I'd recommend a regulatory feasibility spike *before* any build commitment.

### 3. The AML/CFT "comfort" needs to be challenged, not accepted

Your compliance team is comfortable that extending existing screening covers it. I'd push back on three specific points:

- **The risk profile of this channel is different.** Fast (2-hour), cheap, sub-$10k payments are *exactly* the profile that money launderers favour — speed, low cost, and structuring below thresholds. The same screening logic applied to a faster, cheaper rail produces a higher residual risk. Has the **risk assessment been redone for the new channel**, or just inherited?
- **Structuring below the $10k SWIFT cut-over.** Your design creates an explicit incentive to keep payments under $10k. That's a structuring vector you've designed in. You need velocity/aggregation monitoring, not just per-transaction threshold reporting.
- **Dual-jurisdiction obligations.** AML/CFT applies on *both* ends. NZ RBNZ obligations + AU AUSTRAC obligations, and they don't perfectly mirror each other.

Recommendation: treat this as **"comfort to be evidenced via a fresh channel-specific risk assessment,"** not a settled question.

---

## Assumptions Register (the ones that would hurt most if wrong)

| Assumption | Risk if wrong | Confidence | Action |
|---|---|---|---|
| Existing reciprocal agreement covers customer flows | High — illegal/uncovered settlement | Low | Legal review now |
| AU counterpart is authorised to credit third-party beneficiaries | Critical — kills the channel | Unknown | Regulatory spike (AU) |
| "Standard notifications" cover the regulatory requirement | High — could be licensing, not notification | Low | RBNZ + AUSTRAC perimeter check |
| Existing AML/CFT logic is sufficient | High — different risk profile | Low–Med | Channel-specific risk reassessment |
| 6-month build is the binding constraint | Med — regulatory likely longer | Med | Sequence regulatory ahead of build |
| $4.2M is recoverable revenue | Med — Wise wins on UX/FX too | Med | Validate FX margin & UX gap |

---

## Two questions the business case glosses over

1. **Where does the FX rate get set, and at what margin?** Wise's appeal isn't only speed and per-transaction fee — it's transparent, near-mid-market FX. If your $4.2M revenue loss assumption bakes in a fat FX spread, you may find that matching Wise on the *visible* fee while keeping your FX margin doesn't actually win the customers back. **Decompose the $4.2M: how much is fee, how much is FX?**

2. **Why NZ→AU only, and is one-directional viable?** A one-way channel means net positions only ever flow one direction, which has liquidity and settlement implications (your AU counterpart is constantly pre-funding credits). The treasury netting model works much better with bidirectional flow. Worth checking whether one-directional is actually operationally cheaper or just simpler to scope.

---

## Recommended Next Steps (before committing to the 6-month build)

1. **Regulatory & legal feasibility spike (2–4 weeks)** — AU perimeter (AUSTRAC, licensing), NZ perimeter, and re-papering of the inter-entity agreement. *This gates everything.*
2. **Fresh channel-specific AML/CFT risk assessment** — including structuring/velocity controls.
3. **Decompose the $4.2M revenue figure** into fee vs FX components and pressure-test recoverability.
4. **Define client-money/in-flight funds treatment** during the settlement window.
5. **Only then** scope the build and pilot.

---

Before I go deeper, I want to focus the next pass usefully. Which of these would be most valuable to expand?

- **A** — A deeper regulatory/licensing perimeter analysis (NZ + AU)
- **B** — A structured risk assessment of the AML/CFT and financial-crime exposure
- **C** — A revised business case (decomposing the $4.2M and modelling the FX question)
- **D** — A revised delivery plan that sequences the regulatory gates ahead of build

Also worth confirming: is the **AU counterpart a wholly-owned group entity or a separate legal/regulated entity**? That single fact changes a lot of the above.