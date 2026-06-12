I'll work through the discovery sections with you. Let me start by checking for product context, reference materials, and any EA registry configuration.

---

**Checking product context...**
No `product/` directory found. I'll surface these fields through conversation.

**Checking reference materials...**
No `artefacts/` reference folder found for this feature yet.

**Checking EA registry configuration...**
`architecture.ea_registry_authoritative` not found in context — proceeding without blast-radius query (Path B).

**Checking reference corpus...**
No `artefacts/[system-slug]/reference/` found — proceeding with standard flow.

---

Before I frame the discovery artefact, I want to surface several hard regulatory constraints that are triggered by what you've described. This is a NZ registered bank decommissioning a core loan ledger — several obligations activate immediately and some of them affect whether the project timeline is currently viable as stated.

---

## Regulatory constraints surfaced before scoping

### 1. RBNZ BS11 — Material change notification (hard gate)

Decommissioning a loan ledger and migrating 280,000 loan accounts to a replacement core banking platform is a **material change to a core banking system** under RBNZ BS11.

**Obligation:** RBNZ must be notified **at least 30 business days before any irreversible project activity begins** — not before go-live. The notification clock starts from RBNZ acknowledgement.

**Critical timing issue:** Infrastructure provisioning, migration toolset deployment, and parallel operation setup all constitute irreversible project activity. If the vendor-imposed 12-month window is already running, the BS11 notification may need to be filed **immediately** — this week — to preserve the project timeline. If it has not been filed, this is the highest-priority action in the entire project.

**Question I need answered before I can confirm the scope framing:**

> Has the RBNZ BS11 notification been filed? If yes, what was the RBNZ acknowledgement date, and is the 30-business-day window satisfied? If no, has the RBNZ relationship team been engaged and is filing imminent?

I'll wait for your answer before proceeding to the artefact sections.

---

*(Once you answer the BS11 question, I'll work through: CCCFA 7-year retention confirmation, RBNZ regulatory reporting continuity, and one additional constraint on the parallel operation period — then move into the standard discovery sections.)*