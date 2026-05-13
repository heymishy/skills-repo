# NFR Profile — Skills Platform Phase 4

**Feature:** 2026-04-19-skills-platform-phase4
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Produced at:** /definition close

---

## Overview

This NFR profile records the non-functional requirements that apply across Phase 4 stories. Each constraint is named, defined, and mapped to the stories where it is load-bearing. Where a constraint is owned by a specific enforcement mechanism, that mechanism is identified.

---

## C1 — Non-Fork

**Constraint:** The platform must never require a consumer to fork the skills repository to use it. Any distribution, install, or artefact commit operation must be achievable on the consumer's own repository without modifying the upstream skills repository.

**Load-bearing stories:** p4-dist-install (sidecar install must not create a fork), p4-dist-migration (migration from fork-based to sidecar model — post-migration state must be non-fork), p4-nta-artefact-parity (bot commits artefacts to origin branch, not a fork)

**Verification method:** Governance check in `npm test` confirms no install or distribution command creates a fork; migration story AC1 verifies post-migration state is non-fork.

---

## C4 — Human Approval Gate

**Constraint:** All approval gates (DoR sign-off, definition approvals, architectural decisions) require an explicit human action. No automated or inferred approval is permitted.

**Load-bearing stories:** p4-enf-decision (ADR requires heymishy review before E3 implementation begins), p4-dist-upgrade (upgrade diff/confirm requires operator confirmation before applying), p4-nta-gate-translation (Teams bot approval requires approver's explicit button press — no auto-approval), p4-enf-second-line (Theme F governance controls require human approval; this story delivers inputs only)

**Verification method:** Each story's AC explicitly tests that no approval is processed without the designated human action; `process-dor-approval.js` only writes `dorStatus: signed-off` when called with a valid approval payload.

---

## C5 — Hash Verification

**Constraint:** Skill content must be hash-verified at the time of invocation (not at install time only). A hash mismatch must abort the skill delivery and produce a structured error. No bypass parameter (`--skip-verify`, `force`, etc.) is permitted.

**Primary enforcement mechanism owner:** p4-enf-package (the `verifyHash` function is the canonical implementation; all adapters call it)

**Load-bearing stories:** p4-dist-lockfile (lockfile stores SHA-256 hashes; `verify` command re-checks), p4-enf-package (`verifyHash` — no bypass path), p4-enf-mcp (calls `verifyHash` before delivering skill body), p4-enf-cli (calls `verifyHash` at envelope build), p4-nta-standards-inject (reads standards from hash-verified sidecar at session time, not remote URL)

**Verification method:** Unit test in `npm test` asserts that `verifyHash` with a mismatched hash returns `HASH_MISMATCH` error, not a truthy result; integration test on each adapter confirms abort-on-mismatch behaviour.

---

## C7 — One Question at a Time (Structural)

**Constraint:** The platform enforces single-turn interaction mediation structurally, not conventionally. No surface may send more than one question to the operator before the previous answer is recorded.

**Primary enforcement mechanism owner:** p4-enf-mcp (MCP tool's input schema rejects multi-question payloads), p4-nta-surface (Teams bot state machine enforces AWAITING_RESPONSE lock)

**Load-bearing stories:** p4-enf-mcp (AC2: input schema permits only single question context), p4-nta-surface (AC1: bot state machine — AWAITING_RESPONSE lock), p4-nta-standards-inject (AC1: standards injected before question, not after)

**Verification method:** MCP adapter CI test asserts that a multi-question tool input is rejected; Teams bot unit test asserts AWAITING_RESPONSE state prevents second question send.

---

## C11 — No Persistent Hosted Runtime

**Constraint:** No Phase 4 feature may introduce an always-on hosted service. All enforcement mechanisms must be event-driven: they activate per-invocation and terminate after. A per-session or per-call lifecycle is acceptable; a per-environment daemon is not.

**Load-bearing stories:** p4-enf-mcp (AC4: MCP adapter process exits after tool call; CI test confirms no persistent background process), p4-nta-surface (AC3: Teams bot handler is stateless and event-driven; no in-memory session state between invocations)

**Verification method:** CI test starts the adapter, invokes one call, asserts adapter process exits; Teams bot test asserts handler function is stateless.

---

## ADR-004 — Context.yml Single Config Source

**Constraint:** All configuration values used by Phase 4 features (upstream source paths, skill locations, distribution settings, Teams channel IDs, enforcement settings) must be sourced from `.github/context.yml`. No hardcoded values in implementation code.

**Scope:** Applies to all Phase 4 stories that read configuration. Particular risk areas: CLI adapter (Craig's `init` command must read upstream source from context.yml, not from a hardcoded URL), Teams bot (tenant ID, channel routing, approver list), MCP adapter (lockfile location, skill source path).

**Verification method:** Governance check in `npm test` (`check-approval-adapters.js` or equivalent) asserts no hardcoded URLs in implementation files; each story's AC includes an explicit ADR-004 check.

---

## MC-SEC-02 — No Credentials in Artefacts

**Constraint:** No story's output — artefact, trace, CI log, or tool response — may contain API keys, authentication tokens, session identifiers, or user credentials.

**Scope:** Applies to all 24 Phase 4 stories. Particular risk areas: CLI `emit-trace` output (must not include any execution context credential), Teams bot approval payload (must not include Teams auth tokens), MCP tool response (must not include operator's agent API key), second-line evidence chain inputs (must not include audit reviewer identity values beyond what the schema defines as acceptable).

**Verification method:** Each story's CI check includes a credential-pattern scan on produced artefacts; MC-SEC-02 is noted in each story's NFRs.

---

## MC-CORRECT-02 — Schema-First

**Constraint:** Any new field written to `pipeline-state.json`, trace artefacts, or other governed data structures must be defined in the schema before the first write. Existing schemas must not be broken by new fields.

**Primary risk area:** Phase 4 introduces a new `guardrails[]` array entry (ADR-phase4-enforcement), optional `executorIdentity` trace field (p4-enf-second-line AC2), and `standards_injected` session metadata (p4-nta-standards-inject, p4-nta-ci-artefact AC3).

**Load-bearing stories:** p4-enf-decision (guardrails[] entry), p4-enf-second-line (executorIdentity optional field), p4-nta-ci-artefact (standards_injected warning)

**Verification method:** `scripts/validate-trace.sh --ci` validates trace schema; `npm test` validates pipeline-state.json schema; any new field must be added to the schema file before the implementation story is merged.

---

## Scope Accumulator

| Epic | Story count | Discovery MVP scope item addressed |
|------|------------|-------------------------------------|
| E1 — Spike programme | 5 | All: A (extractability), B1/B2 (mechanism), C (distribution), D (Teams) |
| E2 — Distribution model | 8 | Distribution sync (M1 scope item) |
| E3 — Structural enforcement | 6 | Per-invocation fidelity (M2 scope item); regulated consumer CLI (Craig's scope item) |
| E4 — Non-technical access | 5 | Non-technical participant outer loop (M3 scope item) |
| **Total** | **24** | **All 5 discovery MVP scope items** |

**Drift assessment:** No scope drift detected. All 24 stories map to discovery MVP scope items. No story was added beyond what the discovery artefact identified as Phase 4 scope. The risk-first slicing (E1 spikes gate E2/E3/E4) is a delivery approach choice within the declared scope, not a scope addition.

**Complexity distribution:**
- Complexity 3 (high ambiguity, spike or novel mechanism): 8 stories — p4-spike-a, p4-spike-b1, p4-spike-b2, p4-spike-c, p4-spike-d, p4-enf-package, p4-enf-mcp, p4-enf-cli, p4-nta-surface
- Complexity 2 (some ambiguity, known unknowns): 12 stories — p4-dist-install, p4-dist-lockfile, p4-dist-upgrade, p4-dist-migration, p4-dist-registry, p4-enf-decision, p4-enf-schema, p4-enf-second-line, p4-nta-gate-translation, p4-nta-artefact-parity, p4-nta-standards-inject, p4-nta-ci-artefact
- Complexity 1 (well understood, clear path): 3 stories — p4-dist-no-commits, p4-dist-commit-format, p4-dist-upstream
