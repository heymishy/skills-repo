Before we go further, "Make the API faster" isn't enough to start a discovery on. It's a proposed solution wrapped around an unstated problem, and I can't scope it without knowing what's actually happening.

I'll work through this one question at a time. Before the first question, two quick context checks:

**Product context:** I'd normally read `product/mission.md`, `constraints.md`, and `tech-stack.md` to pre-populate personas and known constraints. If those exist, I'll use them — otherwise we'll surface that context through conversation.

**Reference materials:** If you have a perf report, an SLO dashboard screenshot, a customer complaint thread, or a ticket that triggered this, drop it into `artefacts/[feature-slug]/reference/` and I'll read it before continuing. Otherwise we'll work from your description.

---

### Section 1 — Problem statement

**What's actually happening now that shouldn't be?**

"Faster" is a direction, not a problem. I need to understand the underlying pain. For example:
- Is a specific endpoint timing out under load?
- Are customers complaining about a specific user journey feeling slow?
- Is an SLO being breached?
- Is infra cost climbing because of inefficient queries?
- Is a downstream consumer (mobile app, partner integration, batch job) blocked?

Who experiences the slowness, when does it happen, how often, and what does it cost them when it's unresolved?

Reply: describe the actual problem — or point me to a reference document that does.