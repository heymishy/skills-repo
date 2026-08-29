# What's in This Release — Revise an Earlier Stage Mid-Journey (2026-08-29)

**Available from:** 2026-08-29

---

## What's New

### You can now go back and fix an earlier stage without starting over

Once you'd confirmed a stage (like Discovery or Design) and moved on, there was no way to reopen it — if you spotted a mistake or got new information later, your only options were to live with it or restart the whole journey from scratch. Now, clicking any earlier completed stage takes you straight back into a live conversation with the model, so you can ask a question or request a change, no matter how far back it is or how much you've built on top of it since.

### The model tells you when a change might affect later stages — and lets you decide what to do about it

When you revise an earlier stage, the model looks at what changed and tells you whether it looks like a small tweak or something that might matter to the stages built on top of it (for example, a change to the core problem you're solving vs. a wording fix). It's a suggestion, not an automatic action — you always choose what happens next.

### You can flag affected stages for a second look, or decide nothing needs to change

When the model flags a possible downstream impact, you can mark those later stages with a visible "may need review" reminder (nothing about them changes automatically), or tell it to leave everything as-is. Either way, your choice is recorded alongside the model's original suggestion, so over time we can see how often the model's judgment matches what people actually decide. When you go back and look at a flagged stage, its reminder clears — it won't nag you forever.

---

## What We Fixed

No bug fixes in this release — this is entirely new capability.

---

## What's Not in This Release

- **Nothing regenerates automatically.** Even when the model flags a downstream stage as possibly affected, nothing about that stage is ever changed for you without your explicit say-so — this was a deliberate boundary from the start, not something cut for time.
- **No new "handle it differently" screen.** If you want to respond to a suggestion in some other way, you do that through the same conversation you're already in — we didn't build a separate UI for it.
- A couple of small, already-flagged loose ends are tracked for follow-up (not user-visible today): a flag placed on a stage you haven't reached yet won't clear until you get there and look at it, and one older audit-logging detail on the "save a revision" step is missing a bit of tracking data. Neither affects what you can actually do with the feature.

---

## Questions?

Hamish King — Platform Owner
