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

## Data Model diagram markers (csd-s4)

When point 2 ("Data and state") surfaces new tables, columns, or
relationships — or reuses existing ones — emit a `data-model` diagram
content-block so the canvas panel renders an as-designed Data Model diagram
the operator can compare against the as-built diagram later
(csd-s5/csd-s6 — the drift-check downstream of this story).

Use the same `---CANVAS-JSON: {...}---` marker convention `/ideate` already
established (see `skills/ideate/SKILL.md`, "Canvas markers (inc5)") and that
the canvas rendering already consumes (`type: "data-model"`,
`content: { mermaid: "<erDiagram syntax>" }`) — per ADR-026, do not invent a
new marker shape when an existing one already covers this:

```
---CANVAS-JSON: {"type":"data-model","title":"<string>","content":{"mermaid":"<erDiagram syntax>"}}---
```

Fields:
- `type`: always `data-model` for this content-block
- `title`: short human-readable title (e.g. "Data model")
- `content.mermaid`: a Mermaid `erDiagram` string describing entities, columns, and relationships

### What the diagram must include (AC1, AC2)

- **New entities/columns proposed by this feature** — every new table,
  column, or relationship discussed under point 2.
- **Existing entities the feature touches, even with no schema change** — if
  the feature reuses an existing table (e.g. `credits`) without altering its
  shape, that table must still appear in the diagram. Do not draw an empty or
  new-only diagram just because nothing changed on a touched table — the
  diagram exists so drift can be checked against the full picture of what
  this feature relies on, not just the delta of what changed.
- **Do not include unrelated existing tables** — only entities genuinely
  relevant to this feature's data flow. A diagram padded with every table in
  the schema is as unhelpful as one that omits touched-but-unchanged tables.

### Naming convention (AC3)

Entity and column names in the diagram MUST exactly match the real naming
used in this repo's migration files (`scripts/migrate-schema-*.js`) — never a
generic placeholder name (e.g. `Table1`) and never a paraphrase (e.g.
`Balance` instead of the real `balance` column). Check the actual migration
file before naming an entity or column in the diagram. This is what makes
the as-designed diagram directly comparable to the as-built diagram csd-s5
later generates from the same migration files.

### Reuse-check prompt before finalising a new entity (AC4, ADR-026)

Before finalising the diagram, for every genuinely NEW entity being
proposed (not for entities that already exist in the schema), surface an
explicit prompt:

> Does an existing entity's shape already cover this concept? [new entity
> name] looks like it could extend or reference [closest existing entity],
> per ADR-026 (reuse an existing entity/primitive when its shape already
> covers a new concept, rather than introducing a new one). Reply: yes,
> extend/reference [existing entity] — or no, this is a genuinely new
> entity, proceed as designed.

This prompt does not block diagram creation. If the operator confirms no
existing entity covers the concept, the new entity proceeds and the diagram
is finalised with it included — the prompt surfaces the check, it does not
gate progress (matching ADR-026's own convention: reuse where it makes
sense, but a new entity remains a legitimate outcome). The prompt exists to
catch non-optimal design at the earliest possible point — before
implementation even starts.

Do not surface this prompt when the session only reuses existing entities
and proposes no new one at all — it fires only when a genuinely new entity
is actually on the table, not on every diagram generation.

### Security (NFR)

The diagram must show schema structure only — table names, column names,
and relationship cardinality. Never row-level data, tenant IDs, or other
real/sample data values — schema structure only, never row-level or
tenant-specific data.

### Worked example

A feature that adds a new `feature_flags` table and reuses the existing
`credits` table without any schema change:

```
---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    CREDITS {\n        text tenant_id PK\n        integer balance\n        timestamptz updated_at\n    }\n    FEATURE_FLAGS {\n        uuid id PK\n        text tenant_id FK\n        text flag_key\n        boolean enabled\n    }\n    FEATURE_FLAGS }o--|| CREDITS : \"scoped by tenant_id\""}}---
```

`CREDITS`'s columns (`tenant_id`, `balance`, `updated_at`) match
`scripts/migrate-schema-credits.js` exactly — the naming-convention
requirement (AC3) applied directly, not just described.

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
