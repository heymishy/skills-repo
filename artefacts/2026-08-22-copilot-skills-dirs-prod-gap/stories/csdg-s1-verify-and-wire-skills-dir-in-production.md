## Story: Verify and wire the correct skills directory for this repo's own production deployment

**Epic reference:** None — short-track investigation/fix (bounded, well-diagnosed; no discovery/benefit-metric required per CLAUDE.md's short-track definition).
**Discovery reference:** N/A — short-track.
**Benefit-metric reference:** N/A — short-track.
**Domain:** [web-ui]

## User Story

As an **external API consumer calling `POST /api/skills/:name/sessions` with a JSON body**,
I want to **create a session for any real, valid skill name (e.g. `benefit-metric`, `discovery`, `definition`)**,
So that **the JSON skill-session API works for this repo's own self-hosted deployment, not just for consumer repos bootstrapped from it**.

## Benefit Linkage

**Metric moved:** JSON API availability / correctness for `POST /api/skills/:name/sessions`.
**How:** Confirming (or fixing) the skills-directory resolution removes a class of 400 SKILL_NOT_FOUND responses for any JSON-API caller requesting a skill that only exists in this repo's root `skills/` directory.

## Architecture Constraints

`src/adapters/skill-discovery.js`'s `listAvailableSkills()` — investigate and, if needed, correct its default/override resolution for this repo's own self-hosted deployment. No architecture guardrail conflict identified; `.github/architecture-guardrails.md` checked.

## Dependencies

- **Upstream:** None.
- **Downstream:** None currently blocked.

## Acceptance Criteria

**AC1:** Given access to this repo's Fly.io deployment configuration (`flyctl secrets list -a <app>` or equivalent), When checked, Then confirm whether `COPILOT_SKILLS_DIRS` is currently set for the production app — this determines whether AC2–AC4 describe a live bug or a test-only gap.

**AC2:** Given AC1 finds `COPILOT_SKILLS_DIRS` is NOT set in production, When `POST /api/skills/benefit-metric/sessions` (or any real skill name not in `.github/skills/`'s current partial infra-only subset) is called with a JSON body against the live server, Then reproduce the 400 `SKILL_NOT_FOUND` response to confirm real, current production impact (not just a local/test-environment finding).

**AC3:** Given AC2 confirms live impact, When the fix is applied (either: set `COPILOT_SKILLS_DIRS=skills` as a Fly env var for this repo's own app; or change `listAvailableSkills`'s default resolution to prefer root `skills/` when present, falling back to `.github/skills/` only when it isn't — the implementer should pick whichever doesn't regress bootstrap/consumer-repo behaviour, see Out of Scope), Then `POST /api/skills/benefit-metric/sessions` (and other real skill names) succeed with 201 against the live server.

**AC4:** Given the fix from AC3, When `.github/skills/`'s existing `infra-definition`/`infra-plan`/`infra-review` skills are requested via the same endpoint, Then they continue to resolve correctly — the fix must not remove or shadow this repo's own use of that directory for its distinct purpose.

**AC5:** Given a genuinely fresh consumer repo (post-`/bootstrap`, skills installed only at `.github/skills/`, no root `skills/` directory), When the same endpoint is exercised, Then behaviour is unchanged from before this fix — this story must not alter the documented consumer-repo bootstrap contract.

## Out of Scope

- Changing `handlePostSkillSessionHtml` (the form-urlencoded path used by the browser UI) — not affected by this gap; only the JSON-body (`handlePostSession`) path is in scope.
- Any change to `.github/skills/`'s own contents (`infra-definition`/`infra-plan`/`infra-review`) — those are real, intentional, and stay as-is.
- A general audit of every other place `listAvailableSkills`/`COPILOT_SKILLS_DIRS` is referenced across the codebase beyond this one endpoint's actual behaviour (AC1–AC5 scope the investigation to `handlePostSession`'s reachable path specifically).
- Choosing the AC3 fix approach in advance — the implementer should confirm which of the two options (env var vs. default-resolution change) fits without regressing AC5, rather than this story prescribing one.

## NFRs

- **Performance:** None identified — directory resolution is a cheap, already-cached-per-request filesystem read.
- **Security:** None identified — no new attack surface; this only affects which directory an existing, already-validated skill-name lookup reads from.
- **Accessibility:** N/A — backend API only.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1 — Well understood, clear path once AC1's live-config check resolves the open question (real bug vs. test-only gap). The fix itself (env var or a small default-resolution change) is small and localized.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic

## Diagnostic reference

Found while resolving `tests/artefact-preview.test.js` and `tests/artefact-writeback.test.js`'s pre-existing `npm test` failures (both showed "session creation failed: 400 !== 201" uniformly across every test that called `handlePostSession`).

Root cause chain:
1. `src/adapters/skill-discovery.js`'s `listAvailableSkills(repoPath)` defaults to `<repoPath>/.github/skills/` unless `COPILOT_SKILLS_DIRS` overrides it.
2. This repo's own skills live at repo-root `skills/` (confirmed: `skills/benefit-metric/`, `skills/discovery/`, etc. all exist there).
3. `.github/skills/` also exists in this repo, but contains only `infra-definition/`, `infra-plan/`, `infra-review/` — an unrelated, intentional subset (purpose not yet investigated as part of this finding).
4. `handlePostSession` (`src/web-ui/routes/skills.js`) is live-wired at `server.js:2679` for `POST /api/skills/:name/sessions` when the request body is JSON (not form-urlencoded) — a real, reachable production route, not dead/legacy code.
5. `fly.toml`'s `[env]` block only sets `PORT` — `COPILOT_SKILLS_DIRS` is not set in the committed, non-secret config. Whether it's set as an undisclosed Fly secret is unknown from this environment (secrets aren't readable via the local git checkout) — that's exactly what AC1 needs to confirm before treating AC2 as a live-confirmed bug rather than a hypothesis.

The two test files were fixed independently (setting `process.env.COPILOT_SKILLS_DIRS = 'skills'` before requiring `routes/skills` in each) — that fix is a legitimate, hermetic test-environment correction on its own merits, orthogonal to whichever way this story's AC1 investigation resolves.
