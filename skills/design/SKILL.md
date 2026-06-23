---
name: design
description: >
  Translates an approved discovery + benefit-metric pair into a design artefact
  covering solution architecture and UX/interaction design. Reads from
  artefacts/[feature]/reference/ for design inputs (wireframes, tech specs,
  design system docs, architecture decisions). Produces a design artefact that
  unlocks /definition. Does not decompose into stories — that is /definition.
triggers:
  - "design the solution"
  - "how should we build this"
  - "solution architecture"
  - "technical design"
  - "ux design"
  - "design document"
  - after benefit-metric approval
---

# Design Skill

## Entry condition check

Before asking anything, verify:

1. Discovery artefact exists at `artefacts/[feature]/discovery.md` with status "Approved"
2. Benefit-metric artefact exists at `artefacts/[feature]/benefit-metric.md`

Also check for reference materials at `artefacts/[feature]/reference/`.
This is where design inputs live — wireframes, UX flows, tech specs, design system
documentation, architecture decision records, or sample components.

If reference materials are found, list them before starting:

> **Reference materials loaded:**
> - [filename] — [one-line description from content]
>
> I'll use these to pre-populate architecture and UX decisions.
> You can confirm, override, or extend anything I extract.

If entry condition not met:

> ❌ **Entry condition not met**
> [Specific issue — e.g. "Discovery artefact not found at expected path. Run /discovery first."]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 — Orient from prior artefacts

State what you found from the handoff context before asking anything:

> **Problem / opportunity:** [1–2 sentence summary from discovery]
> **Personas:** [list from discovery]
> **MVP scope boundary:** [inclusions and exclusions]
> **Benefit targets:** [key metrics and targets from benefit-metric]
>
> Ready to design the solution? Reply: yes — or correct any of the above first.

---

## Step 2 — Solution architecture

Ask one question at a time. Do not present a list of questions.
Goal: establish the technical approach clearly enough to decompose into stories.

Explore in this order:

1. **Integration points** — What existing systems, APIs, or data sources does this
   feature connect to? Check `tech-stack.md` for known systems; ask the operator
   to confirm or extend the list.

2. **Data and state** — What data does this feature create, read, update, or delete?
   Where is it stored? Any significant state machine or lifecycle?

3. **Hosting / runtime** — Where does this run? Existing service, new service,
   edge function, or client-side only?

4. **Key build decisions** — Any significant choices: build vs buy, protocol
   (REST/GraphQL/event/batch), framework, caching strategy? Surface the choice and
   the reason, not just the decision.

5. **Non-functional requirements** — Performance, scale, latency, availability, or
   security requirements from the discovery that constrain the design.

Surface constraints from `constraints.md` and `tech-stack.md` where they apply.
If a constraint rules out an option, say so explicitly.

---

## Step 3 — UX / interaction design

Ask one question at a time.
Goal: establish the user-facing interaction model at enough detail to write stories.

Explore in this order:

1. **Entry point** — How does the user arrive at this feature?
   What triggers it (navigation, notification, explicit action)?

2. **Primary flow** — Walk through the core use case step by step.
   What does the user see, decide, and do at each step?

3. **Edge cases and error states** — What are the key failure modes or boundary
   conditions the design must handle? (e.g. empty state, partial failure, timeout)

4. **Design system / components** — Which existing components apply?
   Are any new patterns or components needed?

5. **Accessibility** — Any specific accessibility requirements (WCAG level, screen
   reader flow, keyboard navigation)?

If wireframes, mockups, or UX flows exist in the reference folder, reference them:
> **[filename]:** I can see [what the wireframe shows]. Does this represent the intended flow?

---

## Step 4 — Decisions and open questions

Before producing the artefact, explicitly surface:

- Key architectural trade-offs made and why the chosen approach was selected
- Decisions deferred to definition or implementation, with the reason for deferral
- Open questions that must be answered before definition can proceed (mark as blocking)
- Assumptions taken from reference materials or prior artefacts (with source)

---

## Artefact format

When you have sufficient signal from steps 2–4, produce the design artefact.

Emit the slug on its own line first:
```
---SLUG---
[feature-slug]
```

Then wrap the artefact:
```
---ARTEFACT-START---
[full artefact content — see template below]
---ARTEFACT-END---
```

The file will be saved as `artefacts/[feature-slug]/design.md`.

---

Use template: `templates/design.md`
