# Discovery Pipeline: Consent Management API for Open Banking

Let me work through this systematically. I'll surface what's clear, what's assumed, and — critically — what's missing or risky before this proceeds.

---

## 1. What You've Told Me (Restated for Confirmation)

- **Goal:** Consent-driven API exposing customer financial data to accredited third parties.
- **Data tiers:** (a) transaction history ≤12mo, (b) balances/available credit, (c) credit card summaries, (d) **enriched insights** (derived analytics, not raw data).
- **Consent model:** granular (per data-type, per third party), time-limited (≤12mo), revocable, with downstream deletion obligation.
- **Accreditation:** validated per-call, not just onboarding.
- **Launch:** 10 partners in 6 months, enriched insights on day one.

---

## 2. Critical Gaps & Challenges

I'm going to push back hardest where I see the most risk. The framing is mature, but several claims need scrutiny.

### 🔴 A. "Privacy team is comfortable" — comfortable with *what*, exactly?

You state the privacy team reviewed "the overall consent model." But the **enriched insights tier is the most privacy-sensitive component**, and it's not clear it was assessed as such.

- **Estimated monthly income** and **90-day projected balance** are *inferred attributes*, not data the customer provided. Sharing inferences about a person can carry different (often higher) regulatory and ethical weight than sharing raw facts.
- Under the Privacy Act (and especially under a CDR-style regime if you're in Australia — see Section 4), **derived data may be treated as "CDR data" and subject to the same or stricter rules**, including potential restrictions on whether it can even be shared.
- A spending-category breakdown can reveal sensitive information by inference — e.g. health (pharmacy/clinic spend), religious affiliation (donations), political donations, gambling.

**Challenge:** Did the privacy team specifically sign off on sharing *inferred/derived* data and the *re-identification and sensitive-inference risks* it carries — or did they sign off on the consent *mechanism*? These are very different reviews. I'd treat the latter as "not yet assessed."

### 🔴 B. Day-one enriched insights is the riskiest scope decision you've made

You've coupled your highest-value, highest-risk tier to your hardest deadline. This concentrates risk badly.

- If enriched insights hits a regulatory or accreditation snag, it blocks the *entire* launch rather than a deferrable feature.
- The analytics engine outputs are a **dependency you don't fully control** — accuracy, explainability, and liability for a *wrong* income estimate or balance projection all need ownership.

**Recommendation:** Decouple. Launch raw tiers (a–c) day one; bring enriched insights as a fast-follow once its specific regulatory/liability/accuracy questions are closed. This is a sequencing change, not a cancellation.

### 🟠 C. Revocation + downstream deletion is asserted but not designed

"On revocation, the third party must delete all data received" is a **contractual obligation you cannot technically enforce** once data leaves your boundary.

Open questions:
- How do you *verify* deletion? (You likely can't — so what's the attestation/audit model?)
- Does "delete" include **data derived by the third party** from your data? (e.g. their own models trained on it)
- What about data the third party has already shared **onward** to *their* sub-processors?
- Is there a legitimate-retention carve-out (e.g. the third party's own legal/AML obligations may *require* retention)? You can't demand deletion of something they're legally compelled to keep.

This is mostly a **legal/contractual + obligation-design** problem, not a technical one — but it must be designed, not asserted.

### 🟠 D. "Validate accreditation on each API call" — feasibility and failure modes

Good intent, but:
- Is there an **authoritative real-time accreditation status source** from the accreditation authority? If you must call out per request, what's the **latency budget** and **what happens when that source is down**? (Fail-open = data leak; fail-closed = outage.)
- "Blocked from new data access immediately" — what about **in-flight sessions** and **already-issued tokens**? Does revocation of accreditation also trigger the customer-revocation deletion path, or a separate one?

### 🟠 E. Consent ≠ Authentication ≠ Authorisation — who proves the customer is the customer?

The model describes consent capture in the member portal but is silent on:
- **Strong customer authentication** at consent time (the highest-value attack target is fraudulent consent).
- The **third-party redirect/authorisation flow** (OAuth2/FAPI-style?) — how does a third party initiate a consent request and receive scoped tokens?
- **Consent dashboard**: customers need to *view and manage* active consents, not just grant them. Revocation UX is as important as grant UX.

### 🟡 F. Granularity and data-minimisation edge cases

- "Transaction history up to 12 months" — can a customer consent to a **shorter** window or a **subset of accounts**? "Up to 12 months" suggests a ceiling, not a choice.
- **Joint accounts / authorised signatories**: can one account holder consent to share data that exposes another party's transactions? This is a classic open-banking landmine.
- **Multiple consents from same third party** overlapping in scope — how are they reconciled?

---

## 3. Assumptions I'm Making (Flag if Wrong)

1. **Jurisdiction is Australia** — "Privacy Act," "accredited third parties," "accreditation authority," "member portal" strongly suggest the **Consumer Data Right (CDR)** regime under the *Competition and Consumer Act* / ACCC/Treasury. **This materially changes everything** (see below).
2. You are an **ADI / data holder**, not a building a greenfield product outside regulation.
3. The "accreditation authority" is external (e.g. ACCC), not internal.
4. The member portal already has authenticated customer identity you can build on.

**If this is CDR:** much of your model is *prescribed*, not designed by you — consent rules, accreditation tiers, data standards (Consumer Data Standards), the register of accredited parties, deletion-vs-de-identification rules, and **what counts as shareable CDR data vs. value-added derived data** are all defined by the regime. Your "enriched insights" may fall under specific CDR rules about derived data, or may sit *outside* CDR as a commercial product (with different consent and liability implications). **You need to confirm this first — it determines whether you're building to a standard or inventing one.**

---

## 4. The Single Most Important Question

**Is this API in-scope for a formal open-banking regulatory regime (e.g. CDR), or is it a commercial/contractual data-sharing arrangement outside it?**

Everything downstream — consent rules, accreditation mechanics, whether enriched insights can be shared at all, deletion obligations, liability — branches on this answer. I'd resolve it before any further design.

---

## 5. Recommended Discovery Outputs / Next Steps

| Priority | Action | Owner |
|---|---|---|
| 🔴 1 | Confirm regulatory regime (CDR vs commercial vs hybrid) | Legal/Compliance |
| 🔴 2 | Targeted privacy/DPIA assessment of **enriched insights specifically** (inference, sensitive-attribute leakage, derived-data classification) | Privacy |
| 🔴 3 | Decision: decouple enriched insights from day-one launch | Product/Sponsor |
| 🟠 4 | Design revocation + deletion obligation model (attestation, audit, derived-data, retention carve-outs) | Legal + Eng |
| 🟠 5 | Define authN/authZ flow + SCA at consent + consent management dashboard | Eng/Product |
| 🟠 6 | Confirm authoritative real-time accreditation source + failure-mode policy | Eng + Compliance |
| 🟡 7 | Resolve joint-account / multi-party consent rules | Legal + Product |
| 🟡 8 | Define consent granularity edges (windows, account subsets, overlaps) | Product |

---

## 6. Summary Judgement

The **consent philosophy is sound** and the per-call accreditation instinct is good. But three things would stop me from greenlighting as-is:

1. **The privacy sign-off almost certainly doesn't cover the riskiest thing in scope** (derived insights).
2. **Day-one enriched insights couples your highest risk to your hardest deadline** — decouple it.
3. **The regulatory regime is unconfirmed**, and it dictates whether you're conforming to a standard or building one — a massive difference in 6-month feasibility.

Resolve the regime question and re-scope the insights tier, and the rest becomes tractable design work.

Want me to proceed to **solution shaping** for the raw-data tiers (assuming CDR), or first run a focused **risk deep-dive on the enriched insights tier**?