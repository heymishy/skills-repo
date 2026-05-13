Let me check for product context and reference materials before proceeding.

**Product context:** Checking `product/` — files not present in this repository (this is the skills platform repo, not a product repo). Proceeding without pre-population.

**Reference materials:** Checking `artefacts/[feature-slug]/reference/` — feature slug not yet established, no reference folder to read.

**EA registry:** Reading `.github/context.yml` — `architecture.ea_registry_authoritative` not set to true (or absent), so no blast-radius query. Proceeding with Path B.

**Reference corpus:** No system slug indicated as reverse-engineered. Skipping.

---

You've given me a substantive brief covering most sections in one pass. Let me work through what you've provided, ask targeted follow-ups on the gaps, then assemble the artefact.

**What I have from your input:**
- ✅ Problem statement (clear, observable, quantified)
- ✅ Who it affects (payment ops, merchants, finance — three personas named)
- ✅ Why now (volume doubling next month, scaling trigger)
- ✅ MVP scope (retry mechanism with classification + exponential backoff)
- ✅ Out of scope (4 explicit items — exceeds the minimum of 2)
- ✅ Success indicators (triage time reduction, quantified directionally)

**Gaps to fill:**
- Assumptions and risks (Section 6)
- Constraints (Section 8)

---

### Section 6 — Assumptions and risks

**What are we assuming is true that we haven't validated yet? And what could make this not worth building?**

A few candidate assumptions I can see in your brief that may be worth surfacing explicitly:
- That the 12% retryable classification is accurate (based on what evidence?)
- That retried payments will succeed at a meaningful rate (vs. just delaying the inevitable manual review)
- That issuers / card networks won't penalise us for automated retry volume (some have retry-rate limits)
- That the failed payments queue is the right integration point (vs. intercepting before queue entry)

What would you add, correct, or remove? And what risks could make this not worth building — e.g. issuer rate-limiting, double-charge exposure, dispute increase from automated retries?

Reply: list assumptions and risks