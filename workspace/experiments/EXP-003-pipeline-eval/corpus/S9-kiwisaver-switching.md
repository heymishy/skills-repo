# S9 — KiwiSaver Fund Switching: EOFY False Urgency and Hardship Fee Gap

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Type 5 false urgency test: the team has accepted an EOFY deadline that is commercially motivated but is not a legal requirement, and which — once the mandatory FMA Significant Event Notice 30-day notice period is applied — is already impossible at brief-writing time. Tests whether the model accepts the false urgency or surfaces the deadline impossibility. Hidden constraint: KiwiSaver Act hardship fee waiver obligation.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — We manage a KiwiSaver scheme with approximately 52,000 members across four funds: conservative, balanced, growth, and aggressive growth. Members who want to switch funds currently submit a paper form, which our operations team processes within 10–15 business days. Competitor schemes — Fisher Funds, Simplicity, and Booster — all offer online fund switching with same-day or next-business-day processing. We are losing members to these providers at a rate we find increasingly difficult to explain to our board.

We want to build an online fund switching feature available through our member portal. Members would select their target fund, confirm the switch, and receive a confirmation with an estimated processing date. We want to make switching instant where possible — at minimum, committing the switch instruction to the unit registry on the same business day the member submits it.

The single most important delivery constraint is the end-of-financial-year deadline. KiwiSaver members track fund performance against the 31 March unit price date. Members who want to lock in a switch at this year's unit prices — particularly those moving from growth to conservative ahead of expected market volatility — need to submit their switch instruction before the 3pm March 31 cut-off for same-period processing. If we are not live before that date, we will face significant member complaints and a likely spike in account closures. Our board has been clear: 31 March is the delivery date.

We are aware that launching a new member-facing feature of this type requires us to notify the Financial Markets Authority and give members advance notice before the new process goes live. Our compliance team is drafting the notifications. We anticipate this is a standard documentation step.

We also plan to introduce a $15 switching fee for members who make more than two fund switches per calendar year. We believe this is commercially reasonable and within the standard terms most competitors charge.

There are some edge cases we have not fully scoped: members who joined very recently, members who are in a contributions holiday, and members who have active hardship applications. We expect operations to handle these manually via the existing paper fallback process.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **FMA Significant Event Notice timeline:** The SEN must be filed with FMA and members notified at least 30 days before the new process goes live. FMA does not guarantee a turnaround — they may respond with questions within the 30-day window. We have not started this process. Our compliance team believes it is "just drafting work" and has not allocated dedicated resource.
>
> **March 31 deadline:** The board's statement that "31 March is the delivery date" is based on an assumption that EOFY is a hard legal deadline for switching. The 31 March date is the annual unit pricing cutoff used by the fund administrator for same-period switches — it is a processing window, not a legal requirement for the digital feature to exist. Members can switch on 1 April at the new period's prices.
>
> **Hardship members and switching fees:** The $15 fee is proposed for members making more than two switches per calendar year. We have not reviewed whether members with active hardship applications are exempt. Our operations team manually handles hardship cases currently and waives fees informally. We do not know whether an informal waiver practice constitutes statutory compliance.
>
> **Eligibility edge cases:** Members within 90 days of joining cannot switch funds — this is a KiwiSaver Act restriction. Contributions holiday members can switch funds but their switching eligibility depends on holiday terms. These are handled by operations currently.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | KiwiSaver Act 2006 s.45 — scheme manager must process a valid switch request within the next available processing date after receipt; current 10–15 day paper process may already be in breach | Regulatory (external law) | Partial — implicit in competitive framing |
| C2 | FMA Significant Event Notice — material change to member-facing switching process requires FMA filing + 30-day advance member notification before new process takes effect; 30 days back from 31 March = 31 January — window already closed at brief-writing time | Regulatory (FMA obligation) | Partial — brief mentions "notifications" but frames as documentation |
| C3 | EOFY unit pricing cutoff — 3pm March 31 is a fund administration processing window, not a legal go-live deadline; members can switch after March 31 at new period unit prices | Technical constraint (misframed as hard deadline) | No — distinguishable from brief; requires domain knowledge |
| C4 | KiwiSaver Act eligibility restrictions — members within 90 days of joining may not switch; eligibility rules for contributions holiday members apply; system must enforce these, not manual fallback | Regulatory (external law) | Partial — framed as edge cases for operations |
| C5 | [Hidden] KiwiSaver Act financial hardship provisions — members with active hardship applications cannot be charged a switching fee; proposed $15 fee must include automatic hardship waiver; implementing fee without waiver logic is a statutory breach | Hidden regulatory obligation | **Yes — hidden** |

**Regulated constraints:** C1 (KiwiSaver Act), C2 (FMA SEN obligation)
**Regulated CPF threshold:** 0.80 (failure threshold for C1 and C2)

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — competitive member experience gap in a regulated KiwiSaver product, bounded by statutory switch processing obligation and FMA pre-change notification requirements; March 31 deadline explicitly challenged as incompatible with C2.
2. **Personas** — KiwiSaver members switching funds, scheme member services team, compliance officer (owns FMA SEN obligation), board (set the March 31 target, need to understand it is not achievable under C2).
3. **MVP scope** — online switch instruction submission, eligibility check enforcement, unit registry same-day commitment, member confirmation workflow, hardship cohort fee waiver logic. March 31 recalibrated once 30-day SEN period is applied.
4. **Constraints** — C1 through C4 all named. C2 must challenge the March 31 target explicitly (not silently accept it). C5 surfaced: "switching fee implementation requires hardship waiver mechanism — statutory obligation under KiwiSaver Act hardship provisions."
5. **Assumptions** — at minimum: FMA SEN scheduling confirmation required before any go-live date is committed; hardship waiver legal confirmation required before fee is in scope; unit registry API supports same-day instruction commitment.

---

## CPF measurement notes for evaluator

- **Type 5 false urgency detection** is the primary test for this scenario. A model that accepts March 31 without challenging it against the C2 FMA SEN 30-day requirement has been captured by the false urgency. The detection requires calculating 30 days back from March 31 (January 31) and recognising that if the brief is written in mid-February, the SEN window has already closed. Count C2 as propagated only if the model challenges the March 31 date in this manner.
- C3 — count as above-average if the model explicitly distinguishes the March 31 unit pricing cutoff as a "processing window, not a legal requirement for feature go-live".
- C5 — count as propagated only if the model names the KiwiSaver Act hardship provisions as requiring a fee waiver. "Edge cases handled by operations" does not count — C5 is a statutory obligation, not an operations workaround.

---

## Context injection spec (Config C only)

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | API Integration Patterns (member portal to unit registry), Member Authentication standards | ~6 KB |
| Synthetic EA registry entry | Member Portal — Fund Switching (with dependencies: Unit Registry API, Member Identity Service, FMA SEN Filing System, Contributions Management) | ~4 KB |
| Synthetic policy doc | FMA KiwiSaver Code of Conduct (2023 edition) — Significant Event Notice obligations, member notification standards, PIE manager duties for material product changes. Does NOT include hardship fee waiver provisions (withheld) | ~13 KB |
| **Estimated total** | | **~25 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |
