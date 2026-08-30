## Story: Remove /review's story-selection and category-selection prompts

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** None — short-track (no discovery artefact by design)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator running a feature through /review (via CLI or a web UI skill session)**,
I want to **have /review proceed straight into reviewing all stories with all 5 categories, without being asked which stories or which categories first**,
So that **reaching the review stage doesn't introduce friction that was already identified and confirmed twice as unwanted, and the web UI's own skill sessions (which follow the raw SKILL.md text with no access to prior operator feedback) behave the same way a CLI session already does.**

## Bug found (live, via web UI dogfooding)

While dogfooding the first fully web-UI-driven feature (`Cross-Channel Feature Continuity`), reaching `/review` produced the prompt "Which stories would you like to review?" instead of proceeding directly. Root-caused: `skills/review/SKILL.md` Step 1 (line 64: *"Review all stories, or a specific one? Reply: all — or name the story"*) and Step 2 (lines 78–90: *"Which review categories should I run? ... Reply: 1, 2, or 3"*) both still contain the literal interactive prompts, unmodified. This exact preference was already confirmed twice by the operator in prior sessions (2026-08-06, during `multi-tenant-repo-resolution`; 2026-08-07, during `cross-surface-state-sync`) — but the fix was only ever applied as an agent's own in-session behavioral adaptation (skipping the prompts when running `/review` manually), never written into the governed skill file itself. Any execution path that reads the raw file fresh — including, critically, the web UI's own skill sessions, which have no access to an agent's prior-session memory — still hits the original friction.

## Architecture Constraints

- Edit `skills/review/SKILL.md` only — Step 1 and Step 2's prompt blocks become direct statements ("Reviewing all N stories, all 5 categories" as a fact, not a question), matching the exact wording already established in the operator's own confirmed preference.
- Per this repo's Platform Change Policy (`CLAUDE.md`), SKILL.md changes must go through the normal branch/PR flow — not a direct commit to master — even though this is a text-only change with no application code touched.
- Preserve the "exception" already named in the confirmed preference: if the operator has *explicitly named* a specific story (told, not asked), respect that — this story removes the *unprompted* selection question, not the ability to scope a review when asked to.
- Preserve the "already reviewed — exclude unless re-review requested" logic in Step 1's Session recovery check — that's a different mechanism (skipping already-reviewed stories) from the removed prompt (asking which of the remaining stories to review), and stays as-is.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `/review` runs for a feature with N story artefacts (none previously reviewed), When Step 1 begins, Then the skill states "Reviewing all N stories, all 5 categories" as a direct statement and proceeds to Step 3 for each story — it does not ask "Review all stories, or a specific one?" and does not wait for a reply.

**AC2:** Given the same scenario, When the skill would otherwise reach Step 2, Then no "Which review categories should I run?" prompt is presented — all 5 categories (A–E) run unconditionally for every story.

**AC3:** Given the operator has explicitly named a specific story before /review runs (e.g. "review just story X"), When /review runs, Then it respects that explicit instruction and scopes to that story — the removed prompts are about not *asking* unprompted, not about ignoring an explicit operator instruction.

**AC4:** Given some stories already have a review artefact on disk and others don't (mixed state), When Step 1's Session recovery check runs, Then already-reviewed stories are still excluded from the default scope exactly as before (this behavior is unchanged by this story) — the fix only removes the *prompt*, not the pre-existing recovery/exclusion logic.

## Out of Scope

- Any change to the review categories (A–E) themselves, their scoring rubric, or findings format — untouched.
- Any change to `/definition-of-ready`, `/test-plan`, or any other skill's own prompts — this story is scoped to `/review` only.

## NFRs

- **Performance:** Not applicable — text-only change.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session (this is the third confirmation of the same underlying preference)
