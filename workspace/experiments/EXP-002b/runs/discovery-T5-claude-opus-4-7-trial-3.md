## Step 0 — Context check

**Product context:** I checked for `product/mission.md`, `product/constraints.md`, `product/tech-stack.md`. The constraints document I can see describes the **skills delivery platform itself** (the pipeline you're using), not your note-taking app's product context. I'll treat your note-taking app as a greenfield discovery with no pre-existing product artefacts.

**Reference materials:** No `artefacts/[feature-slug]/reference/` folder exists yet. If you have a brief, business case, or scoping document, drop it in `artefacts/[feature-slug]/reference/` and I'll read it before continuing.

**EA registry:** Will check `architecture.ea_registry_authoritative` once we name the systems in scope.

---

## Regulatory framing — required before Section 1

Per organisational context, you operate in a regulated financial services environment. A note-taking app capturing **meeting notes and decisions** is not a neutral utility in this context — it is a potential record-keeping system that may attract:

- **Data residency obligations** — where notes are stored and processed (cloud region, on-prem)
- **Retention policy** — statutory retention if notes touch customer matters, credit decisions, AML/CFT discussions, or board/committee records
- **Access controls** — if notes contain customer PII, transactional data, or material non-public information
- **Discoverability obligations** — notes may become discoverable evidence in regulatory investigations or litigation
- **Records management regime** — your firm likely has a corporate records policy distinguishing transitory notes from official records

I cannot proceed to problem framing until we surface which of these apply. So before Section 1:

> **Which regulatory and records-management regimes does this app need to operate within?**
>
> Specifically:
> 1. Will notes ever capture customer information, financial decisions, credit/lending discussions, AML matters, or board/committee material? (Yes / No / Unsure)
> 2. Does your firm have a corporate records management policy that classifies meeting notes? (Yes — and I can share it / Yes — but I don't know the detail / No / Unsure)
> 3. Are there data residency requirements (e.g. data must remain in-country)? (Yes — specify / No / Unsure)
>
> Reply: answer each — "Unsure" is a valid answer and we'll flag it as an assumption to validate.

---

**Why I'm not jumping to Section 1 (the problem statement):**

Your input — *"so our teams can capture meeting notes and decisions in one place"* — is a **solution gesture**, not a problem statement. "In one place" implies notes are currently scattered, but I don't yet know:
- Where they are now (Outlook? OneNote? Confluence? Personal notebooks? Teams chat?)
- Who is frustrated, and what specifically breaks when notes are scattered
- Whether the real problem is *capture*, *retrieval*, *decision traceability*, *handover when people leave*, or *compliance evidence*

These are very different products. We'll get to that in Section 1 — but the regulatory framing comes first because it constrains the entire solution space (e.g. "use Notion" may already be off the table depending on your answers above).

Awaiting your reply to the three regulatory questions.