# Story: Activate domain-tag standards injection at story authoring time

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the gap surfaced via `/improve` on the product-rollup epic (2026-07-16-product-rollup)
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator authoring a new story via `/definition`**,
I want **`/definition` to prompt for (or reasonably infer) a `domain` tag matching an existing key in `.github/standards/index.yml`, and `/definition-of-ready`'s standards-injection step to actually inject the matching standards content when a domain tag is present**,
So that **future coding-agent instructions actually include the relevant standards (e.g. the blended-aggregation rule just added to `web-ui-patterns.md`) instead of relying on the agent to already know to check standards files unprompted**.

## Benefit Linkage

**Metric moved:** Standards-injection activation rate — the fraction of newly-authored stories whose matching domain standards actually reach the coding-agent instructions block, versus silently skipped.
**How:** Checked across every one of this repo's 184 story artefacts to date: zero use a `domain` field. `.github/standards/index.yml`'s own header comment describes exactly this mechanism ("When a story has a domain tag matching a key here, `/definition-of-ready` will include all standards files for that domain in the coding agent instructions block") — but it has never fired, meaning every domain-specific standard written since this mechanism was built (including the two files updated by this session's own `/improve` run) has depended entirely on the coding agent already knowing to check `.github/standards/` unprompted, rather than being handed the relevant content directly.

## Architecture Constraints

- `.github/standards/index.yml`'s existing domain taxonomy (`api`, `auth`, `data`, `web-ui`, `payments`, `ui`, `security`, and any others already present) is reused as-is — this story does not redesign the taxonomy.
- `/definition-of-ready`'s existing "Standards injection" step (the one that currently prints "Story has no `domain` field — skipped silently" for every story) already contains the matching/injection logic for when a domain *is* present — this story must confirm that logic actually works correctly once exercised for the first time, not assume it does just because it was written.
- This builds directly on this session's ADR-026/ADR-027 pattern (`.github/architecture-guardrails.md`) of closing gaps found via `/improve` — the same session that fed new content into `web-ui-patterns.md` is the first real opportunity to confirm the injection mechanism those additions depend on actually works.

## Dependencies

- **Upstream:** None.
- **Downstream:** None directly, but every future story tagged with a domain benefits once this ships — including any story that would otherwise silently miss the blended-aggregation rule, the injectable-adapter pattern, or any other domain-specific standard already written.

## Acceptance Criteria

**AC1:** Given `skills/definition/SKILL.md`'s story-authoring instructions currently do not mention the `domain` field at all, When a new story is authored for code that clearly matches an existing `.github/standards/index.yml` domain (e.g. a story touching `src/web-ui/routes/*.js`), Then `/definition`'s instructions prompt the author to consider setting `domain: [<matching-domain>]` on the story, rather than leaving it unset by default.

**AC2:** Given a story has `domain: [web-ui]` set at authoring time, When `/definition-of-ready` runs its Standards injection step, Then the full content of `.github/standards/web-ui/web-ui-patterns.md` is actually included in the resulting Coding Agent Instructions block — verified against a real fixture story, not just a unit test of the matching logic in isolation.

**AC3:** Given a story has `domain: [web-ui, security]` set (multiple domains), When `/definition-of-ready` runs, Then both `web-ui/web-ui-patterns.md` and `security/security-standards.md` are included, not just the first match.

**AC4:** Given a story has NO `domain` field set, When `/definition-of-ready` runs, Then the existing behaviour is fully preserved — it explicitly notes "Story has no `domain` field — skipped silently" in the DoR artefact, exactly as it does today. This story does not make domain tagging mandatory.

**AC5:** Given a story sets a `domain` value that does not match any key in `.github/standards/index.yml` (e.g. a typo, `domain: [web-uis]`), When `/definition-of-ready` runs, Then it surfaces a clear warning naming the unmatched domain — rather than silently injecting nothing and looking identical to the "no domain set" case.

## Out of Scope

- Retroactively tagging any of this repo's 184 existing historical story artefacts with a `domain` field — this story only changes behaviour going forward for newly-authored stories.
- Redesigning or expanding the domain taxonomy in `.github/standards/index.yml` — reuses the existing domain keys as-is.
- Making `domain` a mandatory field / a DoR hard block — this story activates the mechanism when a tag is present, it does not force every story to set one.
- The separate `standards/` top-level tree (governance/data/devops/product/etc. domain profiles) — confirmed during investigation this is an unrelated, broader compliance-domain-profile system, not the `.github/standards/index.yml` per-story injection mechanism this story targets.

## NFRs

- **Performance:** Not applicable — reading a handful of small standards Markdown files at DoR time, not a runtime hot path.
- **Security:** None identified — no new external input; domain values are matched against a fixed, repo-controlled key list in `index.yml`.
- **Accessibility:** N/A — no UI surface.
- **Audit:** The DoR artefact must record which domain(s) were matched and which standards file(s) were actually injected, for traceability (extends the existing "Standards injection" section's output, does not change its location).

## Complexity Rating

**Rating:** 2 — some ambiguity. The matching/injection code path in `/definition-of-ready` has never been exercised (confirmed: 0/184 stories ever set a domain), so while the logic reads as correct, this is the first real test of it — there is a real chance of a latent bug surfacing only once actually triggered.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
