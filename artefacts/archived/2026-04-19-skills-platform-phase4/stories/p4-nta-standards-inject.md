## Story: Standards injection for non-technical discipline roles

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e4-non-technical-access.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **non-technical outer-loop participant in a specific discipline role (e.g. product manager running discovery, risk reviewer approving DoR)**,
I want to **have the Teams bot inject the standards and guidelines relevant to my discipline role at the appropriate step in my workflow session — without me needing to know where the standards files are or what they contain**,
So that **my bot session produces artefacts that reflect the same discipline-specific quality standards as a git-native operator session using the /discovery or /review skill directly**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence; M3 — Teams bot C7 fidelity
**How:** Artefact parity (p4.nta-artefact-parity) ensures format correctness; standards injection ensures quality correctness. A discovery.md produced by a PM who did not know the quality standards for discovery artefacts may pass the template schema but fail the /review quality gate. Standards injection closes this gap — the bot injects the relevant standards into the session at the right moment (per C7: one question at a time, with the standards visible as context before the question is asked).

## Architecture Constraints

- C7: standards are injected as context before a question, not after; the bot must not ask a question and then follow it with the relevant standard — the participant sees the standard first (as a preceding message or card element), then the question; this is part of C7's mediation function, not a UI preference
- ADR-004: standards file paths are sourced from the sidecar install (the platform's standards directory) — the bot reads standards from the installed sidecar at the path specified in `context.yml`; no hardcoded file paths
- C5: the bot reads the standards files from the hash-verified sidecar — it does not fetch standards from a remote URL at session time; the standards content is the content of the installed, hash-verified sidecar
- MC-SEC-02: standards content is not sent to any external logging or analytics service during injection

## Dependencies

- **Upstream:** p4.nta-surface must be complete (bot runtime handles session conversation and message ordering)
- **Parallel dependency:** p4.dist-install — the sidecar must be installable (E2) for the bot to have a standards source to read from; if the sidecar is not installed, the bot falls back to "standards unavailable" and continues the session without injection, flagging the artefact with `standards_injected: false`

## Acceptance Criteria

**AC1:** Given a non-technical participant is in a bot discovery session and the session reaches a step where a standards reference applies (e.g. discovery problem statement step with `standards/product/discovery-quality.md`), When the bot sends the question for that step, Then the message or adaptive card for that step includes the standards content (or a summary not exceeding 1,200 characters) as context before the question text — the participant reads the standard before formulating their answer.

**AC2:** Given the sidecar is installed and the bot reads the standards file via `context.yml` paths, When the bot injects standards content, Then the content is sourced from the installed sidecar (the hash-verified version) — the bot does not fetch from the upstream remote URL at session time.

**AC3:** Given the sidecar is not installed (e.g. a new environment where `init` has not been run), When the bot reaches a step that requires standards injection, Then the bot sends the question without standards context, appends a note: "Standards unavailable — sidecar not installed. Run `skills-repo init` to enable standards injection.", and marks the session output with `standards_injected: false` — the session continues rather than blocking.

**AC4:** Given a participant's discipline role is declared in the session initiation (e.g. "product-manager", "risk-reviewer"), When the bot resolves which standards to inject at each step, Then it uses only the standards applicable to the declared discipline — it does not inject engineering or security standards to a product manager session, and does not inject product standards to a risk-reviewer session.

## Out of Scope

- Authoring or modifying the standards files themselves — standards are authored via the platform's standards authoring process; this story reads them, it does not write them
- Generating summaries of standards using an LLM at session time — the 1,200-character limit is met by selecting the most relevant section from the standards file, not by LLM summarisation
- Injecting standards into git-native operator sessions — this story is for the Teams bot surface only

## NFRs

- **Security:** Standards content not sent to external services (MC-SEC-02); hash-verified source only (C5)
- **Correctness:** `standards_injected: false` flag correctly written to session output when sidecar unavailable
- **Accessibility:** Standards content delivered as plain text or markdown within Teams adaptive card limits

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — depends on Spike D PROCEED verdict; deferred if DEFER

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-standards-inject.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 5 |
| intermediates_produced | 23 |
