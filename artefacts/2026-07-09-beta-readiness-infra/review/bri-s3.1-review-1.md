# Review Report: Build the mock LLM gateway and fixture set — Run 1

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.1-mock-llm-gateway.md
**Date:** 2026-07-09
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C — AC2 locks the fixture matrix to exactly 5 stages ("minimum 10 fixtures for these 5 stages alone") before AC4 has actually run its verification of whether `branch-setup`/`branch-complete` invoke the gateway. Discovery's clarification log explicitly states "`/definition` must verify each of the 7 stages individually against actual code... before finalizing the mock gateway's fixture matrix" — i.e. this verification was supposed to happen before AC2's fixture matrix was written, not deferred to "when this story is implemented" (AC4). As written, if AC4 discovers `branch-setup`/`branch-complete` DO invoke the gateway, there is no AC requiring fixtures be built for them — AC2 already treats 5 stages as final.
  Fix: Either resolve AC4's determination before finalizing AC2 (i.e. do the code inspection now, during /definition, and write AC2 with the correct final stage count), or add a contingent AC: "Given AC4 determines branch-setup/branch-complete do invoke the gateway, When this is confirmed, Then fixtures are built for them too, extending the minimum fixture count accordingly."

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** C — AC4 ("a concrete determination is recorded... of whether each does or doesn't invoke skill-turn-executor") describes an investigative/documentation activity rather than observable product behaviour — borderline "describes implementation/process" rather than a testable outcome of the mock gateway itself.
  Risk if proceeding: low — the AC is still verifiable, just atypical in form.
  To acknowledge: consider splitting AC4 into a pre-story spike task, or accept as-is via RISK-ACCEPT.

---

## LOW findings — note for retrospective

- **[1-L1]** E — Architecture Constraints references "mirrors the ADR-018 auth-bypass-fixture pattern" informally rather than as a discrete constraint citation.

---

## Summary

1 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL

Scores — A-Traceability: 5, B-ScopeIntegrity: 5, C-ACQuality: 3, D-Completeness: 5. Note: C scored at the floor (3) rather than below it, but the AC2/AC4 sequencing contradiction is a HIGH-severity finding — Outcome corrected to FAIL per the template's rule ("PASS = no HIGH findings remain"). Correctly cites D37 (not ADR-009) for the injectable adapter pattern.
