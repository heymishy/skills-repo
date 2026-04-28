# NFR Profile: In-Flight Learning Capture

**Feature:** 2026-04-28-inflight-learning-capture
**Date reviewed:** 2026-04-28
**Status:** Active — NFRs identified at definition. Reviewed at 2026-04-28.

---

## Performance targets

- Instruction text additions must not materially inflate context usage per skill invocation. Target: ≤60 words added to `copilot-instructions.md` for the self-recording rule; ≤30 words per SKILL.md reminder callout (AC5 of ilc.2).
- The `/capture` command write must not block session flow — it is a simple append operation with no blocking I/O dependencies.

## Security requirements

- No credentials, tokens, or personal data may be written to `workspace/capture-log.md`. The signal-text field records operational observations only.
- `workspace/capture-log.md` is a runtime workspace file — it must not be committed to the repository (to avoid accidental leakage of in-session notes or operator observations into the git history).

## Data classification

- **Public** — `workspace/capture-log.md` contains pipeline delivery signals (decisions, learnings, patterns). No PII, no secrets, no customer data.

## Data residency

Not applicable — all data lives in the local workspace file system, not a cloud store.

## Availability SLA

Not applicable — this feature is a local workspace convention, not a service.

## Compliance frameworks

None — this feature makes no schema changes and introduces no new regulated surface. ADR-011 (artefact-first) compliance is satisfied by the existence of these story artefacts.

## Dependency and portability

- No new npm dependencies (discovery constraint C1).
- No changes to `pipeline-state.json` schema (discovery constraint C2).
- All implementation is instruction text in Markdown — portable across models, sessions, and environments.
