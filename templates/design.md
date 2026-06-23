# Design: [Feature Name]

**Status:** Draft
**Feature:** [slug]
**Contributors:** [names and roles]
**Date:** [YYYY-MM-DD]
**Prior artefacts:** discovery.md, benefit-metric.md

---

## Summary

[2–3 sentences: what is being built, the technical approach chosen, and the core
UX pattern. No jargon — readable by a non-technical stakeholder.]

---

## Solution Architecture

### Overview

[How this feature fits into the existing system. Describe components involved and
how they relate. A short bullet list or ASCII diagram is acceptable.]

### Integration points

| System | Interaction type | Direction | Notes |
|--------|-----------------|-----------|-------|
| [system name] | [REST / event / DB / batch] | [in / out / both] | [key notes] |

### Data and state

[What data is created, read, updated, or deleted. Where it is stored.
Any significant state machine or lifecycle (e.g. pending → active → archived).]

### Hosting and runtime

[Where this runs. New service? Existing service? Client-side only? Edge?]

### Key technical decisions

| Decision | Choice made | Rationale |
|----------|-------------|-----------|
| [what was decided] | [the chosen approach] | [why this over alternatives] |

### Non-functional requirements

| Requirement | Target | Source |
|-------------|--------|--------|
| [e.g. latency] | [e.g. p95 < 200ms] | [discovery / constraint / stakeholder] |

---

## UX / Interaction Design

### Entry point

[How the user arrives at this feature. Navigation path, trigger, or context.]

### Primary flow

1. [Step 1 — user sees / does]
2. [Step 2]
3. [Step 3]
4. [Continue until the happy path is complete]

### Edge cases and error states

| Scenario | User-facing behaviour |
|----------|-----------------------|
| [empty state] | [what they see] |
| [partial failure] | [what they see] |
| [timeout / offline] | [what they see] |

### Design system

[Components reused from the existing design system.
Any new patterns or components this feature introduces.]

### Accessibility

[WCAG level target. Key keyboard/screen reader flows. Colour contrast requirements.]

---

## Constraints

[Hard constraints from tech-stack.md, constraints.md, or regulatory requirements
that shaped the design decisions above.]

---

## Open questions

| # | Question | Owner | Blocking definition? |
|---|----------|-------|----------------------|
| 1 | [question] | [who needs to answer] | Yes / No |

---

## Deferred decisions

[Decisions not made here, with reason for deferral and where they land
(e.g. "API versioning strategy — deferred to implementation; no story-level impact").]
