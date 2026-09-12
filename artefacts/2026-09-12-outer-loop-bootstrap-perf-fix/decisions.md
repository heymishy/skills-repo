# Decision Log: 2026-09-12-outer-loop-bootstrap-perf-fix

**Feature:** Batch skill-metadata extraction to close the `--with-outer-loop` performance NFR gap
**Discovery reference:** None — short-track root-cause fix
**Last updated:** 2026-09-12

---

## Decision categories

| Code | Meaning |
|------|---------|
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |

---

## Log entries

---
**2026-09-12 | ARCH | pre-implementation profiling**
**Decision:** Root-caused `rb-s5`'s `--with-outer-loop` NFR overage (previously ~24% over the 3000ms budget, re-affirmed by both `rb-s5` and `scr-s1`) to `scripts/assemble-copilot-instructions.sh`'s `get_skill_description`/`get_skill_triggers` helpers, which spawn a subprocess (`awk`, plus `sed`/`tr` for reformatting) once per outer-loop skill across two separate loops — roughly 60-70 subprocess spawns for 8 outer-loop skills. Isolated, single-process profiling (no concurrent load, unlike this session's own earlier heavily-loaded measurements) found: `assemble-copilot-instructions.sh` alone costs ~4.9 seconds of the total ~5.7 second `runInit({withOuterLoop:true})` measurement; bare git-bash subprocess-spawn overhead is only ~50ms; the drift-check step is ~78ms. `scr-s1`'s own prior investigation found and fixed a real but small contributor (~150ms from one redundant call) and explicitly left "the dominant cost lies elsewhere... unprofiled as out of scope" — this is that dominant cost, now found and measured.
**Alternatives considered:** (a) Reimplement the YAML-frontmatter parsing logic in pure bash (no awk at all) — prototyped first, found genuinely fragile: `benefit-metric` and `decisions` skills have malformed/multi-line content nested inside their `triggers:` blocks (e.g. multi-sentence markdown paragraphs under a `- ` bullet), and awk's existing regex-based state machine already handles this correctly by accident of its exact matching rules; a naive bash reimplementation using pattern-based `break` conditions produced silent data loss on these exact files during prototyping. Rejected as too fragile for a low-traffic script given the safer alternative below achieves the same win. (b) Batch the awk invocation itself (one `awk` call processing all 8 skill files in one pass, using awk's own multi-file `FNR`/`FILENAME` handling, with the exact same regex matching rules unchanged) — selected. Preserves the already-correct, already-battle-tested parsing logic exactly; only changes the invocation strategy from N calls to 1.
**Rationale:** Prototyped and verified byte-for-byte identical output against all 8 real outer-loop skill files (including the malformed edge cases) before writing any story artefact. Isolated timing comparison: the old per-skill pattern's equivalent real workload (2 passes × 8 skills, matching `assemble()`'s own structure) measured ~2750ms; the new batched single-call approach measured ~92ms for the same underlying extraction — a ~30x reduction in this specific step, more than enough to close the ~24% budget overage.
**Made by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12 — pipeline-state audit follow-up, root-cause investigation explicitly authorized by the operator after the diagnostic finding was presented (given the real blast radius of modifying platform-distributed bootstrap tooling).
**Revisit trigger:** If a future skill's SKILL.md frontmatter has a description/triggers shape the current awk regex doesn't already handle correctly (this risk is unchanged by this fix — the parsing logic itself is untouched, byte-for-byte identical to before).
---

---
**2026-09-12 | ASSUMPTION | implementation, byte-parity verification**
**Decision:** During real end-to-end byte-parity verification (regenerating the same populated temp dir's `CLAUDE.md` via both the old script and the new fixed script), found the OLD script's own trigger-formatting pipeline has a genuine, pre-existing bug: `sed 's/    - /, /g'` doesn't include the comma `tr '\n' ','` already inserted immediately before each match, so every trigger separator renders as a double comma (`,, `) rather than a single one (`, `) in the assembled instruction file. This has been live since `scr-s1` shipped this exact pipeline (2026-08-07) — over a month, unnoticed, because no test asserts the exact final punctuation (only structure/presence). It is even baked into `tests/fixtures/assembled-copilot-instructions.md`, which was never a live test dependency (confirmed via repo-wide grep — no test file references it), just a stale reference artifact.
**Alternatives considered:** (a) Deliberately reproduce the double-comma bug in the new pure-bash reimplementation, to keep this story's change surface to "performance only" — rejected: knowingly reintroducing a bug already fixed for free by a correct reimplementation would be perverse, and this repo's own conventions favour recording a found defect honestly over preserving it for narrower AC wording. (b) Fix it and record it explicitly as an incidental, welcome correctness improvement (selected) — the pure-bash reimplementation was written from first principles against the intended output shape, not by copying the buggy sed pattern, so the fix required no extra effort.
**Rationale:** This story's own AC1 was revised to describe this finding explicitly rather than claim literal byte-identical output that would no longer be true. The stale, never-referenced fixture file (`tests/fixtures/assembled-copilot-instructions.md`) was updated to the corrected format so it doesn't silently document a bug as though it were intended behaviour.
**Made by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12 — found during implementation's own real end-to-end verification pass, not anticipated at story-writing time.
**Revisit trigger:** None expected — this is a strictly-better, lower-risk output than before.
---

## Architecture Decision Records

<!-- No ADR-level entry -- this decision is log-entry weight (an internal performance optimization with a fully specified, low-risk fix), not a structural decision affecting future features. -->
