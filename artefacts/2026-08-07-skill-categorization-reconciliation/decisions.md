# Decision Log: skill-categorization-reconciliation

**Feature:** Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap
**Track:** Short-track (per CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`)
**Last updated:** 2026-08-07

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | A structural gap in the skill/process itself, surfaced transparently rather than silently bypassed |
| `SLICE` | Decomposition and sequencing choices |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-07 | GAP | /definition-of-ready**
**Decision:** Proceed past H-GOV without a discovery artefact's `## Approved By` section, since short-track stories have no discovery artefact by design.
**Context:** Same structural gap already documented for `pcr-s1`/`stis-s1`/`tpac-s1`/`npwe-s1`/`emss-s1`.
**Rationale:** Satisfied via the operator's direct in-session instruction to scope and proceed.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** See prior entries' equivalent — same underlying process gap.
---

---
**2026-08-07 | SLICE | operator direction**
**Decision:** Combine the original "items 3" (dual skill-categorization lists) and "item 4" (NFR overhead shortfall) gaps into a single short-track story rather than two separate ones.
**Alternatives considered:** Two independent short-track stories, scoped and delivered separately.
**Rationale:** `rb-s5`'s own `decisions.md` RISK-ACCEPT explicitly named reconciling the categorization as a plausible path to also closing the NFR gap — the two problems share a root cause (the categorization duplication is part of why the assembly script's per-skill extraction logic wasn't already unified/cached), so fixing them together is more coherent than two isolated patches.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None expected.
---

---
**2026-08-07 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed past DoR without the verification script being reviewed by a domain expert first (W4). Also acknowledges that AC4's timing re-measurement is environment-sensitive (Windows/Git-Bash specific) and may not generalise to other CI runner OSes without separate verification.
**Rationale:** Same rationale as every other story this session for W4; the environment-sensitivity is inherent to timing NFRs and matches `rb-s5`'s own measurement basis, not a new risk this story introduces.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If the NFR passes on Windows/Git-Bash but a different CI runner OS shows a different result, treat as a pattern signal requiring cross-platform re-verification.
---

---
**2026-08-07 | RISK-ACCEPT | Inner coding loop (scr-s1) — AC4 honest result: NFR gap not closed**
**Decision:** AC3's fix (`get_skill_triggers` called once per skill instead of twice, in `assemble-copilot-instructions.sh`'s Core Platform Layer enabled branch) is implemented and verified — both by a source-level unit test (`tests/check-scr-s1-skill-categorization-reconciliation.js`) and an isolated wall-clock measurement (direct script invocation, `OUTER_LOOP_ENABLED=true` vs `false`, 8 samples each: average delta dropped to ~155ms). AC4 required re-verifying the full `--with-outer-loop` end-to-end overhead against the 3-second budget using `rb-s5`'s own measurement method (`tests/check-rb-s5-optional-outer-loop-install.js`'s `outerLoopFlagOverheadUnder3Seconds` NFR test). Post-fix measurements (5 runs): 3680ms, 3775ms, 3858ms, 3867ms, 5766ms — average ~4189ms. **The NFR still fails the 3-second budget** and is not meaningfully different from the pre-fix baseline measured on this same machine at the start of this story (4635ms, single sample) or `rb-s5`'s own original ~3.6-3.7s measurement. Per this story's own DoR instruction ("report the HONEST result... rather than silently dropping it or fabricating a passing result"), the RISK-ACCEPT on `rb-s5`'s NFR is re-affirmed, not resolved — see the corresponding fresh entry appended to `artefacts/2026-08-05-repo-bootstrap-no-fork/decisions.md`.
**Root-cause correction:** `rb-s5`'s original decisions.md entry attributed the entire NFR delta to the `get_skill_triggers` double-call. That attribution does not hold up under isolated measurement — the double-call was real and worth fixing (AC1-AC3's stated goal), but it contributed at most a few hundred milliseconds to a delta of several seconds. The true dominant cost is elsewhere in `runInit()`'s `--with-outer-loop` path (skill copying, the `--all-harnesses` assembly + drift-check subprocess chain, or general Windows/Git-Bash `spawnSync` overhead) and was not isolated further, since profiling `runInit()`'s full path is outside this story's DoR-contracted scope (fixing the specific `get_skill_triggers` redundancy named in AC3, not a general performance audit).
**Alternatives considered:** Report the isolated ~155ms improvement as sufficient evidence of NFR resolution — rejected as not honestly representing the end-to-end number the NFR actually gates.
**Made by:** Coding agent (dispatched inner-loop run) — 2026-08-07
**Revisit trigger:** A future story that profiles `runInit()`'s full `--with-outer-loop` path end-to-end (not just the assembly script in isolation) to find the actual dominant cost contributor.
---
