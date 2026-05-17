# AQ Score: NZ Real-Time Payments (RTP) — Inbound Payment Integration (S3 Config A)

**STATUS: SELF-SCORED — INVALID**

---

## Notice

This file was created by the same session that produced the pipeline artefacts (discovery.md, definition.md, review.md, test-plan.md, dor.md). Per EXP-008-corpus-breadth-eval CONVENTIONS.md, same-session self-scoring is invalid for the Artefact Quality (AQ) dimension.

**aq_status: requires_judge_scoring**

AQ scoring for this run must be performed by the designated judge model (claude-sonnet-4-6, as locked in manifest.md) in a separate session with no prior context from this run session. The judge must read each artefact cold and score against the AQ rubric without knowledge of the CPF evaluation intent.

---

## Run identification

| Field | Value |
|-------|-------|
| Story | S3 — NZ Real-Time Payments (RTP) Integration |
| Config | A — Uniform claude-sonnet-4-6 |
| Run date | 2026-05-18 |
| Pipeline artefacts produced | discovery.md, definition.md, review.md, test-plan.md, dor.md |

---

## CPF scores (valid — evaluator-scored)

| Metric | Score |
|--------|-------|
| cpf_general | 1.00 (5/5 constraints surfaced: C1, C2, C3, C4, C5) |
| cpf_regulated | 1.00 (both regulated constraints C1 and C2 surfaced with full gate coverage) |
| C5 surfaced | true |
| C5 surfacing quality | full (not injection-aided) |
| C5 surface stage | /discovery |

---

## AQ score (placeholder — judge scoring required)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Discovery completeness | PENDING — judge required | — |
| Definition story quality | PENDING — judge required | — |
| Review finding precision | PENDING — judge required | — |
| Test plan coverage | PENDING — judge required | — |
| DoR gate rigour | PENDING — judge required | — |
| **AQ composite** | **null** | **Requires judge session** |

---

## Instructions for judge

1. Open a new session with no context from this run
2. Read `runs/config-A-S3/discovery.md`, `definition.md`, `review.md`, `test-plan.md`, `dor.md` in sequence
3. Score each artefact dimension against the EXP-008 AQ rubric
4. Record scores in this file and update `aq_status` to `complete`
5. Update `run-record.yaml` with the final AQ score

The judge must not have access to this file or any context about the CPF evaluation intent when scoring AQ dimensions.
