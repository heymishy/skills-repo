I'll start by checking for product context and reference materials.

**Checking `product/` directory...**

I don't see a `product/` directory at the repo root (`product/mission.md`, `product/constraints.md`, `product/tech-stack.md` were referenced, but none are present in the organisational context provided). The organisational context I have describes the **skills platform itself** — not your firm's product context.

So I'm going to surface what I do know from your operator note, and ask you to confirm or correct before we proceed:

> **Operator context (from your note, not from a product/ file):**
> - Regulated financial services firm
> - 500+ employees
> - No `product/mission.md`, `constraints.md`, or `tech-stack.md` available to me
>
> **Reference materials:** I don't have a feature slug yet, so I can't check `artefacts/[feature-slug]/reference/`. I'll ask about reference materials once we've named the feature.

---

Before I ask the first discovery question, I need to flag something about your starting statement.

You said: *"We should build a note-taking app so our teams can capture meeting notes and decisions in one place."*

That's a **solution** ("build a note-taking app"), not a problem. The discovery skill is designed to dig underneath solutions to find the actual problem — otherwise we risk specifying the wrong thing.

Also, given you're in regulated financial services, "meeting notes and decisions" is a phrase that immediately surfaces compliance questions: record-keeping obligations, audit trail requirements, data residency, retention policies, and access controls. These will become hard constraints later, but they also shape what the *problem* actually is.

Let me start with the first real discovery question:

---

### Section 1 — Problem statement

> **What's actually happening now that shouldn't be — or not happening that should?**
>
> Not the solution ("build an app") — the underlying problem. To help frame it:
> - Where are meeting notes and decisions captured today? (Email? OneNote? Confluence? Personal notebooks? Nowhere?)
> - When someone needs to find a decision made 3 months ago, what happens?
> - When auditors or compliance ask "who decided X and when?", what's the current process?
> - Has anything gone wrong recently — a missed commitment, a disputed decision, a regulatory finding, a knowledge loss when someone left?
>
> A couple of sentences on what's broken (or missing) is enough to start.
>
> Reply: describe the problem