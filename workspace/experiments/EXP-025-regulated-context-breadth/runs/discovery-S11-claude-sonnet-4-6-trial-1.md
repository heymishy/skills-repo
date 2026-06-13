I'll read the product context, reference materials, and configuration before proceeding.

Checking `product/` for mission, constraints, and tech-stack files... not found.

Checking `artefacts/open-banking-consent-api/reference/`... not found.

Checking `.github/context.yml` for EA registry and evaluation mode configuration...

**Context read:** Regulated NZ financial services operator (registered bank, RBNZ primary regulator, FMA secondary). Evaluation mode: checking... proceeding as interactive session.

EA registry: checking `architecture.ea_registry_authoritative`... not explicitly set in session context, proceeding without blast-radius query (Path B).

---

Before I begin structuring this discovery, I want to surface something that the input raises immediately and that will materially affect scope, timeline, and every constraint section of this artefact.

---

> **Before I draft the artefact, I need to raise a structural constraint that affects the feasibility of the stated launch plan.**

The brief describes a consent management API for accredited third-party access to customer financial data, as part of an open banking programme. In the New Zealand context, this is a regulated activity under an emerging framework — and the regulatory posture of that framework directly affects what "launch within 6 months" can mean.

**The question I need answered before I can scope this accurately:**

> **Which regulatory framework is this open banking programme operating under — and has the accreditation authority and consent model been formally established?**
>
> Specifically:
>
> - Is this operating under the **Consumer Data Right (CDR)** framework being developed by MBIE and the Commerce Commission under the Customer and Product Data Act 2025 (CPDA 2025)?
> - Or is this a **proprietary / voluntary** open banking implementation (e.g. ahead of the CDR designation, or as a supplementary commercial programme)?
> - Has the accreditation authority referenced in the brief been formally designated — and is the bank already operating under, or anticipating, a **data holder obligation** under CPDA 2025?
>
> This matters for the following reasons, all of which will appear as hard constraints in the artefact:
>
> 1. **CPDA 2025 / CDR data holder obligations** impose specific technical standards, consent model requirements, and audit obligations that may not be optional — the bank cannot design its own consent model if CDR designation applies
> 2. **The accreditation authority** — if this is a CDR programme, the accreditation regime is set by regulation, not by the bank
> 3. **Enriched insights** (spending categories, income estimates, projected balances) are derived/inferred data, not raw banking data — their status under a CDR consent model is not straightforward and may require separate regulatory confirmation
> 4. **Privacy Act 2020 (NZ)** — the brief mentions the privacy team has reviewed the consent model, but if CDR applies, Privacy Act obligations interact with CDR obligations in ways that require explicit mapping, not just comfort with the approach
> 5. **CCCFA** — credit card summaries (statement balances, utilisation) are credit contract data — retention and disclosure obligations under CCCFA apply to what third parties can receive and what deletion-on-revocation means in practice
>
> Reply: describe the regulatory framework this programme is operating under — CDR/CPDA, proprietary voluntary, or a hybrid

---

I'll hold the full artefact until I have this answer, as the answer determines whether several sections (Constraints, Assumptions, Out of Scope, MVP scope) can be written with any accuracy.