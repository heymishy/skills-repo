## Step 0 — Product context and reference materials

Checking `product/constraints.md` as directed.

> **Product context read (`product/constraints.md`):**
> I've noted the regulated financial services context — 500+ employees, subject to prudential banking regulation and AML requirements.
>
> **Regulatory framing (surfaced before scoping, as required):**
> Before we write the problem statement, I need to name the applicable regulatory regime — meeting notes and decisions in a financial services firm likely touch:
> - **Prudential banking regulation** — board and committee decisions may be subject to record-keeping obligations (e.g. APRA CPS 220, RBNZ BS11, or equivalent)
> - **AML/CTF** — if decisions relate to customer risk or transaction approvals, there may be retention and audit trail obligations
> - **Data residency** — where notes are stored matters if they contain customer or transactional data
>
> I'll surface these in the Constraints section. You can correct scope as we go.

---

**EA registry check:** `architecture.ea_registry_authoritative` — I'll treat this as not yet confirmed for this session; no blast-radius query will be attempted unless you tell me a system slug to query against.

---

Now, the first question:

> **What's actually happening now that shouldn't be — or not happening that should?**
>
> You've described the solution ("a note-taking app") — I need the problem underneath it.
>
> Who's experiencing pain today, when does it happen, and what does it cost them when meeting notes and decisions aren't captured well? What's the current state — email chains, shared drives, nothing at all?
>
> Reply: describe the problem