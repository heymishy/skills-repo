# T5 — Hidden constraints / claude-opus-4-6 / Run 1

**Date:** 2026-05-10
**Model:** claude-opus-4-6
**Case:** T5-hidden-constraints
**Experiment:** EXP-001-discovery-phase4-5
**Status:** CONFOUNDED — model read `product/mission.md`, `product/tech-stack.md`, `product/constraints.md` from this repo; domain context bled into response. Superseded by run-2 (fresh repo, no product context).

---

## Operator input

We should build a note-taking app so our teams can capture meeting notes and decisions in one place.

---

## Model response

That's a raw idea — the pipeline starts it with `/discovery`, which structures it into a proper artefact before any building happens.

Before I run the discovery skill, a quick orientation check: I noticed state.json likely has in-progress work (lots of recent feature artefacts). Per the session-start convention, I should check state first. 

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/workspace/state.json#1-1), lines 1 to 60

There's an active feature in flight: **`2026-05-08-web-ui-copilot-chat-parity`** (currently in definition, with stories wucp.0–wucp.4 ready for review). Starting a new discovery for a note-taking app would open a parallel feature.

Two things to flag before proceeding:

1. **Scope check** — this repo is the *skills delivery pipeline platform*, not a product workspace for arbitrary apps. A "team note-taking app" doesn't obviously fit this repo's mission (governed SDLC pipeline). Is this:
   - (a) a real feature you want to add to the pipeline platform itself (e.g. notes-as-artefacts inside the workflow)?
   - (b) a hypothetical/test idea to exercise `/discovery`?
   - (c) intended for a different repo entirely?

2. **In-flight work** — wucp is mid-definition. Opening a parallel discovery is allowed but will compete for attention. 

Analyzing your answers...

Read skill [discovery](file:///c%3A/Users/Hamis/code/skills%20repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#1-1), lines 1 to 200

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product/mission.md)

Before I open Section 1, one important framing observation from mission.md:

> *"Not a project management tool — it does not replace Jira, track sprint velocity, or generate reports for stakeholders"*

A general-purpose team note-taking app is squarely outside this product's mission (governed SDLC pipeline). However, **decisions and meeting notes captured *as governed pipeline artefacts*** (e.g. extending `decisions.md`, capture-log, or a new `meetings/` artefact type) *would* fit. I'll keep that in mind and challenge scope drift as we go.

Starting `/discovery` now. One question at a time, per the skill.

---

### Section 1 — Problem statement

**What's actually happening now that shouldn't be — or not happening that should?**

Not the solution (the note-taking app), but the underlying problem:

- Who experiences it? (which of the personas in mission.md — devs, tech leads, PMs, BAs, UX, CoP leads, platform maintainers?)
- When does it happen? (during outer-loop sessions, in standups, in ad-hoc meetings, during DoR sign-off?)
- How often, and what does it cost when unresolved? (decisions get re-litigated, captures get lost, no audit trail, …?)

Reply with a few sentences describing the pain — and especially: **where in the existing pipeline does information currently get dropped on the floor?** That will tell us whether this is a real pipeline gap or belongs in a different tool.