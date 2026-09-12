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
| NFR: `--with-outer-loop` overhead under 3000ms | ✅ | **Closed 2026-09-12 by `obpf-s1`** (PR #869, merged): real root cause found (~60-70 subprocess spawns in `assemble-copilot-instructions.sh`'s per-skill metadata extraction, not the `scr-s1` double-call `scr-s1` itself had already ruled out as the dominant cost) and fixed. Real, isolated measurement: `runInit({withOuterLoop:true})` now ~2.5-3s, down from the ~3722-3776ms this DoD originally measured. `outerLoopFlagOverheadUnder3Seconds` now genuinely passes. | Automated test, re-run post-fix (`obpf-s1`'s own DoD) | None — closed |

---

## Scope Deviations

None remaining. **Timing NFR gap closed 2026-09-12 by `obpf-s1`** — see AC row above. Originally: this was the same gap recorded at merge time (`pipeline-state.json` already showed `testPlan.passing: 9` of `totalTests: 10` before this pass). Re-confirmed twice in this pass (3722ms, 3776ms), both consistently ~24% over the 3000ms budget. All functional behaviour was always correct — only the timing threshold was missed, and that threshold is now met.

---

## Test Plan Coverage

**Tests passing in CI:** 9/10, re-run fresh 2026-08-17 (twice, consistent).
**Gaps:** The one timing-NFR gap is pre-existing and already accurately reflected in `pipeline-state.json` prior to this pass — this DoD confirms it rather than newly discovering it.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: `--with-outer-loop` overhead under 3000ms | ✅ | Closed by `obpf-s1` (2026-09-12) — ~2.5-3s measured, real root-cause fix, see AC row above |

---

## Metric Signal

No formal benefit-metric artefact traced in this pass. No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- ~~If the 3-second budget matters in practice, consider re-measuring on a quiet/idle machine...~~ — **Superseded (2026-09-12).** `obpf-s1` root-caused and fixed the actual dominant cost (subprocess-spawn volume, not machine load) — the gap is closed for real, not just re-measured under different conditions.

---

## DoD Observations

1. This is an honest re-confirmation of an already-known, already-recorded gap — not a new discovery. The value of this DoD pass here is closing the loop: confirming the gap is still real (not something that silently got fixed since merge) and writing the missing artefact/state sync, rather than re-investigating from scratch.
2. Closes out the 5-story `2026-08-05-repo-bootstrap-no-fork` retroactive DoD batch.
