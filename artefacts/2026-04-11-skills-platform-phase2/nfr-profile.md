# NFR Profile: Skills Platform — Phase 2

**Feature:** 2026-04-11-skills-platform-phase2
**Generated at:** 2026-04-11 — /definition Step 7
**Applies to:** All Phase 2 stories unless a story-level NFR override is stated

---

## Overview

Phase 2 is a platform capability expansion — not a user-facing product. NFRs apply to: the platform library itself (skill files, scripts, templates), the fleet registry and aggregation mechanism, the improvement agent, and the governance viz. User-facing performance NFRs (typical of product stories) are not the primary concern; correctness, security, self-containment, and auditability are the dominant NFR categories.

---

## Performance

- **Standards routing lookup:** `standards/index.yml` lookup must resolve any discipline or domain slug in < 100ms on any machine capable of running Node.js — no network call required.
- **CI aggregation job (p2.7):** Fleet aggregation for ≤20 squads must complete in < 60 seconds. This is a CI budget constraint, not a latency SLA.
- **Improvement agent proposal generation (p2.11):** For ≤500 trace files, the agent completes pattern detection and proposal writing in < 5 minutes on a standard developer machine. Long-running agent runs must emit progress to stdout.
- **Pipeline-viz rendering:** No regression. Phase 1 established baseline: viz renders with ≤2s delay on a cold browser open with ≤50 feature entries in `pipeline-state.json`.

---

## Security

- **No credentials in committed files (all stories):** `fleet/squads/{id}.json`, `fleet-state.json`, proposal files in `workspace/proposals/`, and `pipeline-state.json` must not contain credentials, tokens, API keys, or personal data — applies to every story that writes new file types. MC-SEC-02.
- **Bitbucket DC Docker auth secrets (p2.10):** App passwords, OAuth tokens, and SSH private keys used in DC Docker test topology must be injected as CI secret variables — never committed to the repository, even in test fixtures.
- **Improvement agent trace redaction (p2.11):** Any personal data found in trace files must be redacted before the agent processes or writes proposal content. The agent must not propagate PII into `workspace/proposals/` files.
- **No external fetch calls from viz (all viz changes):** MC-SEC-03 — pipeline-viz.html must not make network requests to external URLs at runtime, including any new fleet panel or persona routing indicators added in Phase 2.
- **HTTPS only for EA registry queries (p2.6):** All HTTP calls to the EA registry in the surface adapter resolver must use HTTPS. No HTTP fallback. MC-SEC-03.

---

## Self-Containment

- **pipeline-viz.html (all viz changes):** Must remain a single self-contained file with no runtime npm dependencies. No build step required to open and render. ADR-001. MC-SELF-01, MC-SELF-02.
- **scripts (.github/scripts/):** Plain Node.js, no external npm dependencies. Must run with only `node` available. Applies to any new scripts added for fleet aggregation or CI validation.
- **Standards files (p2.9):** Each standard file is a standalone document — must not import or reference another standard's content. Standards may note relationships in an "Adjacent standards" section but must not require reading another file to be interpreted.

---

## Correctness

- **Schema-first for all new fields (all stories):** Any new field written to `pipeline-state.json` or `fleet-state.json` must exist in the schema before any skill or CI script reads or writes it. ADR-003. MC-CORRECT-02.
- **Evidence fields over stage-proxy (all state writes):** DoR sign-off from persona routing (p2.8) must write `dorStatus: signed-off` to `pipeline-state.json` — not just update `stage`. Gate logic must read evidence fields. ADR-002.
- **Fleet aggregation correctness (p2.7):** each entry in `fleet-state.json` must reflect the squad's `pipeline-state.json` at the time the aggregation job ran — no stale cached values.
- **config.yml single source of truth (p2.8, p2.9, p2.10, p2.11, p2.12):** All configurable parameters (channel routing targets, CI platform, staleness window, failure pattern thresholds) must be read from `context.yml`. ADR-004.

---

## Auditability

- **Proposal immutability (p2.11, p2.12):** Once a proposal file (`workspace/proposals/[id]-*.md`) is written, the original evidence and proposed diff sections must not be modified. Only the `status` field transitions via the review workflow. `challenger-result.md` files are permanent records once written.
- **Accepted skill changes traceable to proposal (p2.12):** Every commit modifying a `.github/skills/*/SKILL.md` file as a result of an improvement agent proposal must include the proposal ID in the commit message.
- **dorApprover field (p2.8):** When a non-engineer sign-off is processed, `pipeline-state.json` must record `dorApprover` as a role identifier or username (not full PII name or email) and `dorChannel` as the interface used — permanent record, not overwritten by subsequent actions.

---

## Consistency

- **Standards file format (p2.9):** All new `core.md` and `POLICY.md` files must use the P1.7 heading structure and MUST/SHOULD/MAY statement format. No structural variation across disciplines.
- **Channel hint additions (p2.8):** Any change to the `channel_hints` schema in `context.yml` must be reflected simultaneously in the skill instruction text and the schema definition. MC-CONSIST-02.
- **Improvement agent idempotency (p2.11):** Running the improvement agent twice against the same trace set and filters produces the same set of proposals. No duplicate proposal files on re-run.

---

## Accessibility

- **Fleet panel in pipeline-viz (p2.7):** Squad cards added to the fleet panel must follow the same keyboard-accessibility and colour-indicator pattern as existing feature cards. MC-A11Y-01, MC-A11Y-02 — colour alone must not indicate squad health status; an icon or label must also be present.

---

## Maintainability

- **Improvement agent SKILL.md (p2.12):** The improvement-agent skill must cover the complete workflow in a single SKILL.md file. It must not require reading another skill's SKILL.md to understand the end-to-end process.
- **No hardcoded org identifiers anywhere (all stories):** AP-02 — no hardcoded org names, team names, Jira project keys, Slack workspace IDs in any new file. ADR-004 `context.yml` is the configuration source.

---

## Story-Level NFR Overrides

| Story | Override | Reason |
|-------|----------|--------|
| p2.10 (Bitbucket CI) | Isolation: Cloud and DC test paths must be independently executable | AC6 requires no cross-contamination between Cloud and DC validation paths |
| p2.10 (Bitbucket CI) | Reproducibility: DC Docker test environment must be reproducible from committed config | Any developer with Docker must be able to run DC tests locally |
| p2.11 (improvement agent) | Privacy: trace data redacted before processing | Trace files may contain operator names from session metadata |
| p2.12 (challenger) | Human oversight: challenger pre-check requires a named human reviewer | Phase 2 human-assisted constraint (A3); CI job ID is not sufficient for `reviewer` field |
| p2.6 (EA registry) | AC unavailability fallback: registry unreachable must not cause silent git-native fallback | MC-CORRECT-01 — adapter selection must be explicit, not covert |

---

## Out-of-Scope NFRs

- Real-time fleet state refresh (p2.7 — scheduled/push trigger only; real-time is Phase 3)
- ML/AI bias evaluation or model cards (p2.9 POLICY.md floor only; specialist ML safety is a separate workstream)
- Full PCI or regulatory compliance tooling for discipline standards (p2.9 provides the POLICY.md floor template; enterprise compliance implementation is per-team)
