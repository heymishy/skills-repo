# Review Report: Parallelize scripts/run-all-tests.js's sequential child-process execution — Run 1

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s9-run-all-tests-parallelization.md
**Date:** 2026-10-31
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance / F — Journey.js fixture hygiene / G — skills.js fixture hygiene / H — journeys.js fixture hygiene (all 8, A–H)
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** AC quality — AC4's acceptance threshold ("total wall-clock time is reduced by at least 40% ... on the same reference machine") is a single-run, hard-coded wall-clock percentage assertion — the same shape of NFR check that `tests/check-pcr-s1-test-runner.js` already has, and that this repo has already logged as a recurring environmental flake sensitive to concurrent machine load (`workspace/capture-log.md`, 2026-10 entries; this session's own tfhc-s8 DoD fresh-verification run hit a transient instance of it). A single-run 40% cutoff on `tfhc-s9`'s own AC4 is exposed to the identical risk the moment this story's own test suite is run concurrently with other load on the machine.
  Risk if proceeding: `/test-plan` writes a brittle, flaky single-run timing assertion for AC4 that fails intermittently for reasons unrelated to the actual implementation, requiring repeated "is this a real regression or noise" investigation — exactly the recurring pattern this repo has already hit with `pcr-s1`'s own timing NFR.
  To acknowledge: run /decisions, category RISK-ACCEPT — or have `/test-plan` design AC4's verification as a multi-run average or a documented manual/DoD-time measurement (consistent with how this story's own benefit-metric m10 and NFR profile already specify "a timed run at /definition-of-done", not a CI-gating unit test) rather than a hard single-run CI assertion.

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC5's parenthetical "(buffered per-child, flushed together once that child completes)" specifies an implementation technique (a specific buffering mechanism) rather than purely observable behaviour. The AC's core assertion — output is attributable to its originating file as a contiguous, non-interleaved block — is itself fully observable and testable as written; only the parenthetical over-specifies HOW. Does not affect testability or block progression; consider trimming the parenthetical from the AC itself and leaving the buffering approach as an implementation note at `/implementation-plan` time instead.
- **[1-L2]** Completeness — Story has no `**Domain:**` field. Its direct sibling in this same epic, `tfhc-s8` (also a pure test-infrastructure story, same epic, same session), carries `**Domain:** [testing]`. `.github/standards/index.yml`'s `testing` domain ("Cross-cutting test design patterns (test genuineness, mutation-testing discipline)") is directly relevant to this story's own AC2 (a dedicated concurrency-instrumentation test) and AC4 (a performance-measurement test) — both are exactly the kind of test-genuineness concern that standards file addresses. Recommend adding `domain: [testing]` so `/definition-of-ready` injects `.github/standards/testing/test-design-patterns.md` into the coding agent instructions, for consistency with `tfhc-s8`'s own precedent in the same epic.

---

## Scores

**Traceability score (1–5):** 5 — References epic, discovery, and benefit-metric correctly; "So that..." outcome is backed by a real Benefit Linkage mechanism sentence naming m10; m10 is present in the benefit coverage matrix. Persona ("developer or AI coding agent running the inner loop") matches discovery.md's "Who It Affects" item 1 near-verbatim, not a generic "a user".

**Scope integrity score (1–5):** 5 — Story's scope is exactly the implementation the epic's own Out of Scope section now explicitly unlocks (updated at /definition, 2026-10-31) once `tfhc-s8` closed the precondition; story doesn't implement anything still listed in epic or discovery Out of Scope; story's own Out of Scope section names 4 explicit exclusions (discovery mechanism, individual test-file logic, CI YAML, configurable concurrency override); the scope addition is logged as a SCOPE decision in `decisions.md`, linked back to discovery.md's own pre-anticipated conditional-MVP framing (not an unapproved addition).

**AC quality score (1–5):** 4 — All 6 ACs use Given/When/Then, are independently testable, avoid "should", and the one edge case (AC6, timeout-under-concurrency) correctly has its own AC rather than a sub-bullet. Minor issues only (see 1-M1, 1-L1): AC4's single-run percentage threshold risks reproducing an already-known timing-flakiness pattern in this repo, and AC5 carries an implementation-technique parenthetical that slightly oversteps "observable behaviour, not implementation."

**Completeness score (1–5):** 5 — User story in As/Want/So format with a named, discovery-matched persona; benefit linkage populated with a real mechanism sentence; out of scope populated with 4 genuine exclusions; NFRs populated (Performance numerically grounded in a fresh baseline, Security/Accessibility/Audit explicitly N/A with reasons); complexity rated (2); scope stability declared (Stable). The missing optional `Domain` tag (1-L2) is a retrospective-only note, not a checklist failure — the story template itself states this field is optional.

---

## Overall score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above.

### Category E: Architecture compliance

- Architecture Constraints field populated (not blank) ✓ — "None identified — checked against `.github/architecture-guardrails.md`."
- No violation of a named approved pattern ✓ — no applicable pattern found
- No use of a listed anti-pattern ✓ — none found
- Active repo-level ADRs ✓ — none of this story's touched surface (`scripts/run-all-tests.js`) intersects any Active ADR in `.github/architecture-guardrails.md`; ADR-021 (Copilot CLI subprocess execution engine) and the E2E drag-and-drop ADR are both unrelated subsystems. The `guardrails-registry` YAML block's items (MC-SEC-*, MC-CORRECT-*, MC-SELF-*, MC-CONSIST-*, MC-A11Y-*, ADR-001) are all scoped to `dashboards/pipeline-viz.html` and `pipeline-state.json` schema — none apply to this story's scope.
- Story NFRs align with mandatory constraints ✓ — no mandatory constraint in `.github/architecture-guardrails.md` addresses test-runner concurrency; no conflict.

**Architecture compliance score (1–5):** 5 — No applicable guardrail found against this story's actual touched-file scope; field correctly populated rather than left blank.

### Category F: Journey.js fixture hygiene

Category F: N/A — no journey.js-touching file in scope. This story's scope is `scripts/run-all-tests.js` and its own new test file; neither requires `src/web-ui/routes/journey` directly or transitively.

**Journey.js fixture hygiene score (1–5):** 5 — N/A.

### Category G: skills.js fixture hygiene

Category G: N/A — no skills.js-touching file in scope.

**skills.js fixture hygiene score (1–5):** 5 — N/A.

### Category H: journeys.js fixture hygiene

Category H: N/A — no journeys.js-touching file in scope.

**journeys.js fixture hygiene score (1–5):** 5 — N/A.

---

## Summary

0 HIGH, 1 MEDIUM, 2 LOW across 1 story.
**Outcome:** PASS
