## Step 0 — Checking product context and reference materials

**Checking `product/constraints.md`...**

> **Product context read:**
> - Regulated financial services firm, 500+ employees
> - Platform constraints from `product/constraints.md` noted — I'll surface relevant hard limits (data residency, retention, access control) as we go
> - No feature reference folder found at `artefacts/[feature-slug]/reference/` yet — we'll build context through conversation

**Regulatory context (required before scoping):**

You're in a regulated financial services firm. Before writing a problem statement I need to name the applicable regulatory regime, since any internal tooling that captures decisions may be subject to record-keeping obligations.

Relevant regimes likely in scope for an internal note-taking and decisions tool:

- **Audit trail / record-keeping obligations** — financial services regulators (FCA, APRA, RBNZ, SEC depending on jurisdiction) typically require that decisions affecting risk, compliance, or customer outcomes are documented and retrievable for defined periods
- **Data residency** — where meeting notes and decisions are stored and processed
- **Access control** — notes may capture material non-public information (MNPI), customer data references, or regulatory findings

---

> **Before we start shaping the problem statement — one regulatory question:**
>
> Which jurisdiction(s) does your firm operate in, and are there known record-keeping or data residency requirements I should carry into the constraints section from the outset?
>
> (For example: FCA conduct record-keeping, APRA CPS 234 information security, RBNZ model risk, SEC 17a-4 — or "we're not aware of specific obligations for internal tooling" is a valid answer too.)
>
> Reply: describe the regulatory context — or "not aware of specific obligations"