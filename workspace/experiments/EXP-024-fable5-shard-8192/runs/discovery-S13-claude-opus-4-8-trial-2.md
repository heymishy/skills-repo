# /discovery — Trans-Tasman Payment Feature

I'll run this through the discovery pipeline. My job here is to pressure-test the framing before you commit to a 6-month build, surface the assumptions that could break the business case, and identify the questions that need answers before this becomes a delivery plan.

Let me be direct: there's a strong commercial case here, but several stated assumptions are doing a lot of load-bearing work and at least one of them looks fragile. Let me work through it.

---

## 1. What's actually being proposed (restating to check understanding)

You're proposing to **stop moving money across the Tasman entirely** for sub-$10k payments. The proprietary channel doesn't make a faster international payment — it makes a *domestic* payment on each side, with the cross-border value transfer happening inside the enterprise group's own treasury books.

That's the elegant part of the design, and it's also where most of the hidden risk lives. The mechanism's strength (you avoid the correspondent banking rails) is inseparable from its regulatory novelty (you've created an in-house cross-border value transfer service that doesn't look like your existing SWIFT product).

**This is not "extend the SWIFT flow with faster settlement." It is a structurally different product.** Several of your assumptions appear to treat it as the former. That's the central tension I want to test.

---

## 2. The assumptions I'd challenge hardest

### 🔴 A. "Our existing AML/CFT process covers the requirements"

This is the assumption most likely to be wrong, and it's stated with the most confidence ("our compliance team is comfortable"). Here's why I'd push back:

- **The customer base changes.** SWIFT international payments at $18–25 are self-selecting toward larger, less frequent, more deliberate transfers. A sub-$5, sub-2-hour channel will attract *higher frequency, lower value, more impulsive* flows. That changes your transaction monitoring baseline, your structuring risk (splitting to stay under $10k and under reporting thresholds), and your typologies. Same screening logic ≠ same risk profile.

- **The settlement mechanism may change your regulatory characterisation.** Because value never leaves the group and is netted in treasury books, you need to be confident about *who is the originating institution, who is the ordering institution, and who holds the recordkeeping obligation* on each leg. The FATF "travel rule" (originator/beneficiary information accompanying the payment) still applies — but does your internal routing channel actually carry that data to the AU side, or does the netting design quietly strip it? This is a common failure mode in book-transfer schemes.

- **Two regulators, not one.** RBNZ/DIA on the NZ side, AUSTRAC on the AU side. Your AU counterpart is crediting Australian accounts — that's an AUSTRAC-regulated activity. "Our compliance team is comfortable" almost certainly means *the NZ compliance team*. Has the AU counterpart's compliance and regulatory function signed off on what they're being asked to do?

**Question to resolve before anything else:** Is the comfort based on a documented assessment of *this specific mechanism*, or is it an extrapolation from the existing SWIFT product? Ask to see the analysis. If it doesn't exist, that's your finding.

### 🔴 B. "We anticipate some regulatory notifications will be required... standard notifications process"

I'd flag this as the second fragile assumption. "Notifications" implies you're telling the regulator about something within an existing authorisation. But you may be doing something that needs **approval, not notification**:

- Does this constitute a new payment service / designated business activity?
- Does netting cross-border customer flows through treasury books raise **prudential / liquidity / intra-group exposure** questions? You're creating an intraday credit exposure between the NZ entity and the AU entity that didn't exist for customer flows before. Treasury and the prudential regulator may have views on intraday limits, settlement risk, and what happens if the netting can't settle end of day.
- Does showing the customer "settled in 2 hours" while actual interbank settlement happens at EOD create a **disclosure / consumer protection** question? You're representing completion before value has actually moved between entities.

**Question to resolve:** Get the regulatory team to confirm in writing whether this is notification or approval, and the lead time. The difference between those two could be the difference between a 6-month and a 12-month timeline. *This is the single biggest threat to your stated schedule.*

### 🟡 C. "6-month build"

The 6 months almost certainly costs the *software*. It likely doesn't cost:
- Regulatory approval lead time (see above — could run in parallel or could be a hard gate)
- AU counterpart's own build, change governance, and compliance sign-off
- Treasury operating model changes for the netting/settlement process and intraday exposure management
- New transaction monitoring rules tuned to the new typologies, plus a tuning/calibration period
- Reconciliation and dispute/error handling between two ledgers in two countries

I'd treat 6 months as the *engineering* estimate and assume the *critical path* is regulatory + AU counterpart readiness.

### 🟡 D. The $4.2M revenue recovery assumption

Two things worth testing:
- **You can't price-match Wise and recover SWIFT-level revenue at the same time.** Dropping from $18–25 to <$5 is a ~75–80% per-transaction price cut. The business case isn't "recover $4.2M" — it's "recover volume at a much lower margin." What's the assumed volume uplift, and at <$5 does the unit economics (including the new monitoring/ops/recon cost) still clear?
- **What share of that $4.2M is actually addressable?** Sub-$10k payments only. How much of the leaked volume is above $10k (still routes to SWIFT) or is FX-driven where Wise's *exchange rate* is the real draw, not just speed? You'll lose customers on the FX spread even if you fix speed and fee.

**Question to resolve:** What's the segment-level breakdown of the $4.2M — by value band, frequency, and whether the customer's primary driver is speed, fee, or FX rate?

---

## 3. Things the framing is silent on

| Gap | Why it matters |
|---|---|
| **FX rate and who bears FX risk** | A "payment" to an AU bank account is an NZD→AUD conversion. Where does FX happen, who sets the rate, who carries the position between instruction and EOD settlement? This is half of why customers use Wise. |
| **Intraday / settlement failure** | What happens if EOD netting can't settle — group liquidity event, AU counterpart issue? The customer's been told "done in 2 hours." What's the unwind? |
| **Recipient verification (CDR / PayID / confirmation of payee)** | Australia is moving toward confirmation-of-payee. Crediting the *wrong* AU account via a fast irreversible channel is a real operational and fraud risk. |
| **Reversibility / error handling** | Domestic-fast rails are typically irreversible. Fraud and mistaken-payment recovery is much harder than SWIFT recall. |
| **AU counterpart governance** | They are a co-owner of this product, not a vendor. Their regulatory exposure, their change appetite, and their commercial terms are unmodelled here. |
| **Scope: "enterprise retail customers"** | "Enterprise" + "retail" is ambiguous. Are these business customers, consumers, or both? AML risk and product design differ materially. Clarify. |

---

## 4. What I'd do next (discovery outputs)

**Before committing the 6-month build, get written answers to these five gating questions:**

1. **Regulatory:** Is this notification or approval, on both sides of the Tasman, and what's the lead time? *(schedule gate)*
2. **AML:** Does a documented assessment exist for *this mechanism* specifically — including travel-rule data flow through the netting channel and the changed transaction profile? *(launch gate)*
3. **AU counterpart:** Has their compliance, treasury, and regulatory function committed to their leg, and on what terms? *(dependency gate)*
4. **Treasury:** What's the intraday exposure model and the settlement-failure unwind, and who's accountable for the FX position? *(operating model gate)*
5. **Commercial:** What's the addressable share of the $4.2M by value band and driver (speed vs fee vs FX), and do unit economics clear at <$5? *(business case gate)*

**Recommended reframe of the pilot:** Make the pilot's primary purpose to validate the *regulatory and operating model*, not customer demand. Demand is reasonably evidenced (the $4.2M leak). The unknowns are compliance, settlement, and the two-regulator picture. Design the pilot to stress those.

---

## Summary judgment

The commercial logic is sound and the channel design is genuinely clever. But the proposal **under-weights its own novelty.** It reads as "a faster, cheaper SWIFT payment," when structurally it's "an in-house cross-border value-transfer scheme settling through group treasury books across two regulatory jurisdictions." The two phrases I'd flag for the steering group are *"compliance team is comfortable"* and *"standard notifications process"* — both are stated as settled, and both are the items most likely to move your timeline and risk profile.

Resolve the five gating questions before locking the build estimate.

Want me to turn this into a discovery one-pager for stakeholders, or draft the specific questions for the compliance and regulatory teams in a form you can send directly?