## Benefit Metric: CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail

**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md (Approved 2026-05-19)
**Date defined:** 2026-05-19
**Metric owner:** Hamis — Platform Maintainer
**Reviewers:** Craig (@craigfo) — Peer reviewer / convergent implementor

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative is a platform infrastructure improvement, not a user-facing product feature. The "users" are platform operators (engineers and tech leads running the pipeline). Tier 1 metrics track operator-facing outcomes (pipeline reliability and trustworthiness). Tier 2 metrics track structural platform quality (testability and correctness-by-construction). Tier 3 tracks compliance auditability obligations surfaced in the discovery.

---

## Tier 1: Platform Operator Outcomes

### M1: Regulated Story Composite Pipeline Fidelity Score (CPF)

| Field | Value |
|-------|-------|
| **What we measure** | The composite pipeline fidelity score (CPF) from an EXP-003-equivalent evaluation run — regulated story set, same scoring rubric, measuring whether deterministic gate checks are correctly executed across all six outer loop stages |
| **Baseline** | 0.675 — EXP-003 Config C (Haiku on regulated stories, 2026-05). Root cause: definition Step 4a.1–4a.4 deterministic constraint propagation running in model context |
| **Target** | ≥ 0.90 — the platform's stated compliance threshold. Measured after Phase 1 (validate CLI deployed) + Phase 3 (skill surgery removes duplicate prose) |
| **Minimum validation signal** | ≥ 0.80 — confirms the CLI correction loop is having measurable effect. If ≥ 0.80 but < 0.90 after Phase 1 alone, proceed to Phase 3 skill surgery before re-testing. If < 0.80 after Phase 1 + Phase 3, pause and investigate correction loop convergence |
| **Measurement method** | Re-run EXP-003 equivalent experiment after each phase boundary (Phase 1 deploy, Phase 3 deploy). Platform maintainer owns the run. Same eval corpus and scoring rubric as EXP-003. |
| **Feedback loop** | If signal < 0.80 after Phase 1 + Phase 3: activate H7.2 spike (correction loop convergence experiment per surgically modified skill). If signal ≥ 0.80 but < 0.90: extend Phase 3 surgery to remaining lower-priority items before re-test. If signal ≥ 0.90: proceed to Phase 4 CI integration planning. |

---

### M2: Gate Bypass Incident Rate

| Field | Value |
|-------|-------|
| **What we measure** | Count of pipeline-state.json stage advancement events where the corresponding validate run has no trace entry or returned non-zero (i.e. state was advanced without a passing gate check). Post Phase 2 only — Phase 1 establishes the observability mechanism. |
| **Baseline** | Not yet established — no mechanism to detect bypasses today. This is the gap. Establishing the baseline is a Phase 1 interim deliverable (manual audit of pipeline-state.json against session notes). Phase 2 makes this measurable by construction via the trace log. |
| **Target** | 0 undetected gate bypasses per quarter. Measured via trace.jsonl audit after Phase 2 deploy. |
| **Minimum validation signal** | Baseline established (Phase 1 exit condition). A defined baseline — even if non-zero — confirms the observability mechanism works and the problem is measurable. |
| **Measurement method** | Phase 2+: automated audit of trace.jsonl advancement events matched against validate runs (validate entry with exit 0 must precede each advance entry for the same stage/feature). Platform maintainer runs quarterly. Phase 1 interim: manual session review. |
| **Feedback loop** | If bypass rate > 0 post Phase 2: identify whether bypass occurred in VS Code Mode B (developer-driven, expected to be manual) or web UI Mode A (harness-driven, should be enforced). If Mode A bypass: architecture defect in the harness — escalate to phase blocker. If Mode B bypass: operator education and optional Mode B wrapper script (Option B from Harness Integration Architecture). |

---

## Tier 2: Platform Structural Quality

### M3: Gate Logic Unit Test Coverage

| Field | Value |
|-------|-------|
| **Hypothesis** | Moving deterministic gate checks from SKILL.md prose to executable code makes them testable. A test fixture per H-priority DoR item (H1–H9, 33 items) is the Phase 1 exit condition and the structural proof of the proposition. |
| **What we measure** | Count of unit test fixtures in `tests/check-cli-outer-loop.js` covering H-priority DoR deterministic items (H1–H9) |
| **Baseline** | 0 — no gate-logic test fixtures exist today. All checks are in SKILL.md prose; the npm test suite only greps YAML/text for string presence. |
| **Target** | ≥ 33 unit test fixtures covering all H1–H9 DoR deterministic items (Phase 1 definition-of-done condition) |
| **Minimum signal** | ≥ 20 fixtures passing in CI — confirms the CLI structure is sound and extensible. Sufficient to proceed to Phase 2 planning. |
| **Measurement method** | npm test suite fixture count; CI-enforced on every push. Platform maintainer reviews fixture completeness against H1–H9 DoR checklist at Phase 1 DoD. |
| **Feedback loop** | If fixture count < 20 at Phase 1 DoD: do not merge; implementation is incomplete. If fixture count ≥ 20 but < 33: merge with a follow-on story for remaining items — do not hold Phase 1 for coverage of lower-risk H items. |

---

### M4: Schema Violation Rate on CLI-Written State Writes

| Field | Value |
|-------|-------|
| **Hypothesis** | CLI-written state writes (via `skills advance`) are schema-valid by construction because the CLI validates against `.github/pipeline-state.schema.json` before writing. This reduces the ad-hoc schema violation rate from "known to occur regularly" to zero. |
| **What we measure** | Count of pipeline-state.json writes from `skills advance` (Phase 2+) that fail schema validation, measured via the `schema_valid` field in trace entries |
| **Baseline** | Not yet established by count. Known from ad-hoc incidents: wrong enum values, missing required fields, and invalid `prStatus` values occur regularly during inner loop runs. Phase 2 deploy establishes the measurable baseline automatically via the trace log. |
| **Target** | 0 schema violations from CLI-written state writes (Phase 2+) |
| **Minimum signal** | 0 schema violations in the first 5 pipeline runs using `skills advance`. If any violation occurs, CLI pre-write validation is defective — fix before continuing. |
| **Measurement method** | `validate-trace.sh --ci` `schema_valid` field in trace entries (Phase 2+). Automated; runs on every CI push. Platform maintainer reviews on Phase 2 DoD. |
| **Feedback loop** | Any violation is a defect in the CLI pre-write validation logic. Treat as a phase blocker. Fix and re-run immediately. No tolerance for violations in CLI-written paths — these are supposed to be correct by construction. |

---

## Tier 3: Compliance and Auditability

### T3M1: Gate Enforcement Auditability

| Field | Value |
|-------|-------|
| **Obligation source** | Platform mission: "encoding compliance requirements... as versioned, hash-verified instruction sets that AI agents execute against." Secondary persona: risk and compliance stakeholders / auditors reviewing regulated delivery traces. Surfaced explicitly in discovery as a primary problem driver. |
| **What we measure** | Binary: for a given feature's delivery trace, can a compliance auditor confirm that each stage advance was preceded by a deterministic gate check (validate entry with exit 0 in trace.jsonl), rather than relying solely on model acknowledgement in a prompt? Met = yes. Not met = no. |
| **Target** | Met — for every feature delivered via `skills advance` (Phase 2+), trace.jsonl contains a validate entry with exit 0 for every stage advance. No stage advance without a preceding validate record. |
| **Minimum signal** | At least one complete feature delivery (discovery through inner loop) produces a trace.jsonl that a human reviewer can follow end-to-end and confirm enforcement. |
| **Validated by** | Platform maintainer (Phase 1–2). Compliance auditor / platform team review (Phase 3+). |
| **Sign-off required at DoR** | No — this is a platform-level metric; not required per-story. However, any story in a regulated context that relies on CLI-enforced gates should note this metric as a traceability reference. |

---

## Metric Coverage Matrix

<!-- Populated by /definition once stories are created -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: CPF ≥ 0.90 | Phase 1 validate CLI + Phase 3 skill surgery stories | Gap — stories not yet written |
| M2: Gate bypass rate = 0 | Phase 2 advance command + trace log stories | Gap — stories not yet written |
| M3: ≥ 33 unit test fixtures | Phase 1 CLI story (direct exit condition) | Gap — stories not yet written |
| M4: 0 schema violations | Phase 2 advance command stories | Gap — stories not yet written |
| T3M1: Auditability met | Phase 2 trace emission stories | Gap — stories not yet written |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the /definition and /implementation-plan skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
