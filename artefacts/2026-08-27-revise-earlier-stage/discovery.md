# Discovery: Revise an Earlier Stage Mid-Journey

**Status:** Approved
**Created:** 2026-08-27
**Approved by:** Hamish King — Platform Owner — 2026-08-27
**Author:** Copilot

---

## Problem Statement

Once a stage in the outer-loop journey (discovery → benefit-metric → design → definition → review → test-plan → definition-of-ready) is gate-confirmed, the journey moves on and that stage becomes permanently read-only. There is no way to reopen it, ask a follow-up question, or revise its artefact from within the journey. This affects operators regardless of *why* they want to revisit — the model got something wrong and it wasn't caught before confirming, or new information surfaced later that should change an earlier decision. Today, the only options are to accept the earlier artefact as-is or abandon/restart the journey. This is felt most acutely once several later stages have already been built on top of the flawed earlier one — the cost of being "locked in" compounds the further the journey has progressed.

## Who It Affects

**Hamish King** and **Abhi** — both encountered this problem directly, each acting as a solo product owner + engineer running the full outer loop themselves (no separate PO/engineer split). As a solo operator, they're the one who both scoped the earlier stage *and* is now discovering, later in the same journey, that it needs revising — there's no separate reviewer catching it upstream. They're trying to correct or extend an earlier stage's output without losing the work already built on top of it in later stages, and without restarting the whole journey from scratch.

## Why Now

The platform is in active beta with real external users, generating live feedback, and is also being demoed to prospective users/stakeholders. Both contexts make the "permanently locked once confirmed" limitation costly in a new way: beta feedback often surfaces exactly the kind of "this earlier stage needs revising" signal this problem describes, and a demo audience watching an operator hit a hard wall — "I can't fix that now, I'd have to start over" — undermines confidence in the product at the moment it matters most for adoption and credibility.

## MVP Scope

An operator can reopen an earlier, already-confirmed stage's session and continue the conversation — ask a question, request a revision — the same live, interactive chat experience already available for the *current* stage (matching the `aslr-s1`/`adsr-s1` fix for the active stage). No automatic cascade of downstream re-generation by default.

When the operator's revision changes the earlier stage's artefact, the model assesses whether the change is likely **material** to downstream stages (e.g. did the problem statement, scope boundary, or a named constraint change — vs. a wording/clarity tweak with no scope impact) and presents that judgment to the operator: *"This looks like a [material / minor] change to [stage name] — I'd suggest [flagging / re-running] the N downstream stage(s) built on it. Want me to do that, leave them as-is, or handle it differently?"* The model's materiality read is a **suggestion**, not an automatic trigger — the operator always makes the final call.

Must be true for the first person who uses it to find it useful: they can fix a real mistake in an earlier stage mid-journey without restarting, and the system actively helps them judge blast radius instead of leaving them to guess — but never acts on downstream stages without their explicit go-ahead.

**Clarified (2026-08-27):** This applies to *any* previously completed stage in the journey, not just the immediately-preceding one — the operator can jump back arbitrarily far to revise a stage. The step-nav's "done" stage links (currently pointing to the static read-only view) route directly into the live session instead — collapsing the separate "view" vs "revise" distinction for stages reached this way. Other entry points that also use the read-only view today (e.g. the artefact-index page's plain "View" link) aren't automatically covered by this — `/definition` should scope precisely which surfaces change vs. stay read-only. Revisions overwrite the artefact in place at its existing file path (matching today's model) — no new versioning mechanism, pre-revision content is not preserved.

## Out of Scope

- **Automatic cascading updates to every other artefact** — and why excluded: the model may *suggest* downstream impact per the MVP scope above, but nothing regenerates or updates automatically without explicit operator confirmation for that specific instance. No "revise once, silently ripple through the whole journey" behaviour.
- **Adding new skills** — and why excluded: this reuses the existing skill sessions/conversations already defined for each stage (discovery, benefit-metric, design, etc.). It does not introduce new skill types, new SKILL.md files, or a new "revision" skill — it's about *reopening access* to an existing stage's existing conversation, not new conversational capability.

## Assumptions and Risks

[ASSUMPTION] Reopening an already gate-confirmed session for further live turns can coexist with the existing `journey.completedStages` record (which already captured that stage's artefact path and completion timestamp) without corrupting or duplicating that record — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] The model can produce a materiality judgment (scope/constraint/problem-statement change vs. wording tweak) that operators find genuinely useful and trustworthy, rather than noisy or wrong often enough to be ignored — unconfirmed, requires /clarify before scope is locked.

~~[ASSUMPTION] Operators want this for *any* earlier stage, not just the one immediately before the current stage~~ — **Resolved via /clarify (2026-08-27):** confirmed, any completed stage, no restriction.

~~[ASSUMPTION] The existing artefact-storage model... can support a stage having been revised and re-saved more than once without breaking `/trace`'s traceability chain validation...~~ — **Resolved via /clarify (2026-08-27):** revisions overwrite in place at the existing file path, matching today's model — no new versioning or reference-resolution mechanism needed.

**Risk:** If reopening an earlier stage is too easy/frictionless, it could encourage "just fix it later" scope drift instead of getting stages right the first time — undermining the pipeline's own governance intent (each stage gate exists to lock in a decision before building further). Mitigating this well (the materiality-prompt design) is central to why this is worth building carefully, not just as a raw "unlock everything" toggle.

**Risk:** If the materiality-suggestion logic is unreliable, operators may stop trusting it and just always choose "leave downstream as-is" — reducing the feature to "unrestricted access to old sessions" with none of the intended safety benefit.

## Directional Success Indicators

**Journey restarts avoided:** Baseline: `[UNKNOWN BASELINE]` — no current tracking of how often an operator abandons a journey specifically because an earlier stage needs revising (today this looks identical to any other abandoned journey in the data). Target: a measurable, non-zero count of journeys where the operator used this feature to revise an earlier stage instead of starting over. Measured via: a new audit/PostHog event (e.g. `earlier_stage_reopened`) fired when this flow is used, cross-referenced against journeys that did *not* subsequently get abandoned.

**Materiality-suggestion trust:** Baseline: `[UNKNOWN BASELINE]` — feature doesn't exist yet. Target: operators accept (follow) the model's materiality suggestion in a clear majority of cases, rather than routinely overriding it — signals the suggestion is actually useful, not noise. Measured via: logging the model's suggestion alongside the operator's actual choice (accept / override-to-more / override-to-less) each time the prompt fires.

**Live usage confirms it unblocks the exact reported pain:** Baseline: 2 known live occurrences (Hamish, Abhi) where this gap blocked forward progress. Target: zero further occurrences of "I had to restart because I couldn't fix an earlier stage." Measured via: direct operator report / capture-log signal, same channel that surfaced this story in the first place.

## Constraints

None identified.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- Hamish King — Platform Owner

## Approved By

Hamish King — Platform Owner — 2026-08-27

---

## /clarify recommendation

**Superseded by the Clarification log below.** Of the original 4 unconfirmed assumptions, 2 were resolved via `/clarify` on 2026-08-27 (stage-scope boundary; artefact revision model). 2 remain genuinely open and are not blocking — they are execution-risk items to be validated by usage (per the Directional Success Indicators), not scope-defining questions `/definition` needs answered upfront:

- [ASSUMPTION] Reopening an already gate-confirmed session for further live turns can coexist with the existing `journey.completedStages` record without corrupting or duplicating that record.
- [ASSUMPTION] The model can produce a materiality judgment that operators find genuinely useful and trustworthy.

## Clarification log

[2026-08-27] Clarified via /clarify:
- Q: Does this apply to any completed stage, or only the immediately-preceding one? A: Any completed stage, no restriction.
- Q: How does the operator get from viewing an earlier stage to revising it — a new "Revise" action, or the step-nav "done" links going live directly? A: Step-nav "done" links go straight to the live session, collapsing the view/revise distinction for stages reached that way.
- Q: Does a revision overwrite the artefact in place, or save a new dated version? A: Overwrite in place, matching today's model.

---

**Next step:** Human review and approval → /benefit-metric
