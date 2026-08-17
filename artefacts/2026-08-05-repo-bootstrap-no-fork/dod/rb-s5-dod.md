# Definition of Done: Optionally install the full outer loop during bootstrap

**PR:** https://github.com/heymishy/skills-repo/pull/669 | **Merged:** 2026-08-05
**Story:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-*.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| Functional ACs (outer-loop opt-in install, `context.yml` flag flip, instruction-file regeneration reflecting the flag) | ✅ | `check-rb-s5-optional-outer-loop-install.js`, 9/10 assertions — all functional behaviour confirmed working: skills registry seeded, 46 skills installed, harness-agnostic instruction files assembled and drift-checked clean, `outerLoop.enabled=true` flag set and reflected | Automated test, re-run fresh on current master 2026-08-17 (twice) | None functional |
| NFR: `--with-outer-loop` overhead under 3000ms | ❌ | Re-run fresh twice: 3722ms, then 3776ms — consistently ~700-750ms over budget, not a one-off flake | Automated test, re-run fresh 2026-08-17 (x2) | **Pre-existing, already documented — see below** |

---

## Scope Deviations

**Timing NFR consistently over budget.** This is the same gap already recorded at merge time (`pipeline-state.json` already showed `testPlan.passing: 9` of `totalTests: 10` before this pass — not a new finding). Re-confirmed twice in this pass (3722ms, 3776ms), both consistently ~24% over the 3000ms budget, not a random one-off flake. All *functional* behaviour (the actual outer-loop installation, flag-flipping, and instruction-file regeneration) works correctly — only the timing threshold is missed.

**Possible confound, noted honestly rather than assumed:** this test was re-run during an exceptionally long, resource-heavy session (multiple background coding agents, extensive git operations, many concurrent test runs across dozens of DoD-backlog stories in the same sitting). The timing margin is real and reproducible right now, but this session's own unusually high concurrent load on the machine is a plausible contributing factor that a clean-machine re-run might not reproduce as severely. Recorded as observed fact (2 consistent measurements), not as a definitive root cause.

---

## Test Plan Coverage

**Tests passing in CI:** 9/10, re-run fresh 2026-08-17 (twice, consistent).
**Gaps:** The one timing-NFR gap is pre-existing and already accurately reflected in `pipeline-state.json` prior to this pass — this DoD confirms it rather than newly discovering it.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: `--with-outer-loop` overhead under 3000ms | ❌ | 3722ms / 3776ms measured, consistently ~24% over budget |

---

## Metric Signal

No formal benefit-metric artefact traced in this pass. No metric signal to record.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: Hamish King] If the 3-second budget matters in practice (e.g. it's advertised to users as a hard SLA rather than an internal target), consider re-measuring on a quiet/idle machine to separate "genuinely slow" from "this session's own heavy concurrent load inflated the number." Low urgency — the actual functional behaviour is correct; only a soft performance target is missed by a small, consistent margin.

---

## DoD Observations

1. This is an honest re-confirmation of an already-known, already-recorded gap — not a new discovery. The value of this DoD pass here is closing the loop: confirming the gap is still real (not something that silently got fixed since merge) and writing the missing artefact/state sync, rather than re-investigating from scratch.
2. Closes out the 5-story `2026-08-05-repo-bootstrap-no-fork` retroactive DoD batch.
