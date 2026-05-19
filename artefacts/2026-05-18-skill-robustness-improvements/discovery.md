# Discovery: Skill Robustness Improvements (Consumer-Reported)

**Status:** Approved
**Created:** 2026-05-18
**Approved by:** Platform Operator — 2026-05-18
**Source:** External contribution — issue #344 (abhijeet-qsofte, OrderHub delivery session 2026-05-10)
**Author:** Platform Operator

---

## Problem Statement

Three behavioural gaps in existing pipeline skills were surfaced by an external consumer (OrderHub team) running the full `/tdd → /verify-completion → /branch-complete → /definition-of-done` inner loop against a real delivery project.

**Gap 1 — Pipeline state fetch can hang indefinitely.** Three skills (`/branch-complete`, `/implementation-plan`, `/subagent-execution`) call `git fetch origin master` with no timeout before reading `pipeline-state.json`. In repositories without a configured `origin` remote, on slow networks, or in air-gapped environments, this command blocks indefinitely and requires manual cancellation. The session is lost.

**Gap 2 — DoD entry condition message is minimal.** When `/definition-of-done` is invoked before the PR is merged, the error output is a single line with no guidance. Operators — especially those new to the pipeline — do not know what action to take next, how to check PR status, or why the gate exists.

**Gap 3 — DoD Step 6 asks for metric signals on infrastructure stories.** `/definition-of-done` Step 6 asks "Has a signal been measurable since this story merged?" for every story listed in a metric's `contributingStories`. Infrastructure/foundational stories (database models, scaffolding, CI setup) cannot yet produce a measurable signal because no user-facing features have shipped. The question is always answered "not yet", adding noise and confusion without value.

## Who It Affects

**Pipeline consumers on personal or corporate repos** — any operator running the inner loop in a local-only repo or a restricted network environment hits Gap 1 and loses work.

**Operators new to the pipeline** — Gap 2 is disorienting: the error doesn't explain what "merged" means in context, how to check, or what to do next.

**Teams with multi-epic features** — Gap 3 affects any feature where Epic 1 is foundational infrastructure (common pattern). Every DoD run on a foundation story produces a Step 6 that cannot be answered meaningfully.

## Why Now

The gaps were directly observed during a real delivery session (OrderHub s1-2, 2026-05-10) and reported via issue #344 with reproduction steps. All three affect inner loop reliability, which is the highest-frequency consumer touchpoint. Each fix is small and bounded — no architectural change required.

## MVP Scope

- **Gap 1:** Update the pipeline-state fetch pattern in `/branch-complete`, `/implementation-plan`, and `/subagent-execution` SKILL.md files to wrap `git fetch origin master` in a try/catch with a 5-second timeout, falling back to the local branch copy then the worktree file.
- **Gap 2:** Expand the `/definition-of-done` entry condition error block with: PR status, next steps (mark ready → get approval → merge → run DoD), and a brief "why this matters" explanation.
- **Gap 3:** Update `/definition-of-done` Step 6 to ask "Is measurement possible yet for this story?" as the first question before asking for a signal. If the operator answers no, record `not-yet-measured` with a brief evidence note and move on — no further prompts.

## Out of Scope

- Adding automated infrastructure-story detection via slug patterns or name heuristics (fragile, repo-specific — rejected in review of #344).
- Adding YAML frontmatter to test plan templates (test count mismatch detection — Issue #5 in #344 — requires separate discovery due to template schema change risk).
- Commit message template generation (`scripts/update-commit-template.js`) — Issue #8 in #344 — low value relative to governance overhead; rejected.
- Changing the `git fetch` pattern in skills not currently using it.
- Adding a new `measurementReady` field to story artefacts (out of scope for this MVP; operator question approach is sufficient).

## Assumptions and Risks

- The fallback chain (origin/master → local master → worktree file) is safe because pipeline-state reads are advisory at state-write time — a stale local copy will be overwritten with a fresh merge before the write is finalised by `branch-complete`.
- The DoD entry condition message change is text-only; no logic change. Risk: minimal.
- The Step 6 operator-question approach does not require schema changes to story artefacts or pipeline-state.json. Risk: minimal.

## Directional Success Indicators

- A consumer running `/branch-complete` in a local-only repo (no origin) sees a warning and continues rather than hanging.
- An operator running `/definition-of-done` before PR merge receives a message that tells them exactly what to do next without looking at external documentation.
- A team running DoD on an infrastructure story can record `not-yet-measured` in under 30 seconds without being asked irrelevant measurement questions.

## Constraints

- All three changes are modifications to existing `.github/skills/*.md` files — governed files requiring PR with platform team review (platform change policy).
- No new scripts, templates, or schema files introduced in this MVP.
- Must not change the observable behaviour of the pipeline-state write for repos that already have a healthy `origin` remote.

## Contributors

- abhijeet-qsofte — Consumer, reported gaps from live delivery session
- Platform Operator — Discovery synthesis and scope decisions

## Reviewers

- [Platform lead — to be assigned]

## Approved By

- Platform Operator — 2026-05-18
