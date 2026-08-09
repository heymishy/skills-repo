## Story: Build the agent-driven Playwright review and validate it against a seeded issue set

**Epic reference:** epics/epic-1-rubber-duck-review-capture-mvp.md
**Discovery reference:** artefacts/2026-08-09-rubber-duck-review-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-08-09-rubber-duck-review-capture/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **developer/operator running the outer loop**,
I want to **know whether an AI agent autonomously driving a real feature via Playwright/Chrome tooling can reliably find real issues**,
So that **I don't invest in wiring this mode into CI (Story 4) if it can't actually detect known real gaps (Meta Metric 2 — agent-driven mode issue-finding reliability)**.

## Benefit Linkage

**Metric moved:** Meta Metric 2 — Agent-driven mode issue-finding reliability
**How:** This story builds the minimal agent-driven review mechanism and directly measures its detection rate against a fixed validation set, producing the first real data point for Meta Metric 2 before any CI-integration investment (Story 4) is made.

## Architecture Constraints

- **ADR-018** (Active): Playwright is this repo's E2E testing framework; specs live in `tests/e2e/`; Playwright is a devDependency only; the unit test chain (`npm test`) must never invoke Playwright. This story's Playwright-driving mechanism must follow this convention exactly, not introduce a second E2E framework or a parallel invocation path.
- **Reuses existing LLM-invocation infrastructure** (per discovery's clarified constraint): the agent-driven mode is built on this codebase's existing `skill-turn-executor.js`-style invocation pattern, not a separate, purpose-built mechanism — and is therefore subject to the same mock-gateway safety net (`mgar-s1`) as every other LLM-invoking path.

## Dependencies

- **Upstream:** None (independent of Stories 1-2 — this validates the *other* risky assumption)
- **Downstream:** Story 4 (CI wiring) does not proceed until this story's AC3 minimum detection rate is confirmed met

## Acceptance Criteria

**AC1:** Given a small, fixed validation set of past real gaps (seeded from this session's own 2 confirmed examples — `lphf-s1`'s undeleted golden-trace candidate, `lphf-s4`'s wrong live learnings-count — reintroduced as test fixtures against a local or preview build), When the agent-driven review runs against each fixture, Then it produces narrated commentary describing what it observed while interacting with the real UI.

**AC2:** Given the agent's narrated commentary from AC1, When it is reviewed against each fixture's known real gap, Then the commentary explicitly flags the injected issue (not just generic praise or a pass-through description) for at least one of the two seeded fixtures — proving detection capability exists at all, before AC3's quantified threshold is assessed.

**AC3:** Given the full validation set (the 2 seeded fixtures, plus any additional known-gap fixtures added during this story), When the agent-driven review runs against all of them, Then it correctly flags at least 50% (Meta Metric 2's minimum validation signal) — recorded as a count (N flagged / N total) in this story's verification notes.

**AC4:** Given the agent-driven review runs against a fixture with NO injected issue (a clean, correctly-behaving version of the same feature), When it completes, Then it does not fabricate a false-positive finding — confirming the mode isn't simply flagging everything indiscriminately, which would trivially inflate AC3's detection rate without real signal.

## Out of Scope

- CI integration — this story runs the agent-driven review manually/locally or via a one-off script, not as an automated pipeline job (that's Story 4).
- Real staging — this story validates against local/preview fixtures reproducing known gaps; running against real staging is Story 4's concern.
- The human-narrated mode — Stories 1-2.

## NFRs

- **Performance:** Not defined for this validation exercise — a manual/one-off run, not a latency-sensitive production path.
- **Security:** If the agent-driven mode needs any authentication to interact with a preview/local build, it must follow the existing secrets-store pattern (`product/constraints.md` #12) — no credential in the agent's own context.
- **Accessibility:** Not applicable.
- **Audit:** AC3's flagged/total count is the audit record for Meta Metric 2's first measurement — logged in this story's verification notes.

## Complexity Rating

**Rating:** 3 — high ambiguity. This is a genuinely novel mechanism (an agent narrating its own observations while driving a real UI) with no established pattern in this codebase to follow, unlike Story 1's more conventional transcription/extraction pipeline.
**Scope stability:** Unstable — if AC3's minimum signal isn't met, Story 4 (CI wiring) is descoped or deferred per the epic's scope-stability note.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
