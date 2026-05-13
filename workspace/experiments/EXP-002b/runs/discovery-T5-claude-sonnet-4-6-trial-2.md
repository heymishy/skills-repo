## Step 0 — Context check

**Product context read (`product/constraints.md`):**
I've noted the platform context from the constraints file. Key signals for a regulated financial services firm (500+ employees):
- Data residency requirements will apply — meeting notes and decisions likely contain customer-adjacent or commercially sensitive content
- Retention policy constraints are in scope (statutory retention periods for decision records in financial services)
- Access control boundaries required wherever notes touch client, transaction, or compliance data
- Applicable regulatory regime should be surfaced before MVP scoping

**EA registry:** I'll check `architecture.ea_registry_authoritative` in `context.yml` once we've identified which systems this feature touches — I'll prompt for that when we reach scope.

**Reference materials:** No `artefacts/` folder for this feature yet — we'll create one once we've agreed the slug.

---

Let's start the discovery conversation. One question at a time.

---

> **What's actually happening now that shouldn't be — or not happening that should?**
>
> Not the solution — the problem. Who experiences it, when, how often, and what does it cost them when it's unresolved?
>
> (For example: are meeting outcomes getting lost? Are decisions being made twice because nobody can find the record? Is there a compliance or audit angle — e.g. decision records required for regulatory purposes that aren't being captured reliably?)
>
> Reply: describe the problem