# Spike Brief: parallelization git-commit-collision risk

**Question:** Of the files that exercise `skills.js`'s skill-turn artefact-completion code path, exactly which are still not behind the `stis-s1` D37 adapter (`setSkillTurnGitCommitAdapter`), and what is the resulting verdict for `scripts/run-all-tests.js` parallelization?
**Type:** 4 — Data/integration (what does the real code and test suite actually do, independently re-derived — not an assumption carried forward from the original, never-enumerated "64 files" estimate)
**Blocking:** `scripts/run-all-tests.js` parallelization implementation (gated on PROCEED, per `discovery.md` item 6)
**Scope:** Narrow — single targeted source/test sweep, up to 3 steps
**Done condition:** A precise list of remaining at-risk files, plus a recorded PROCEED/REDESIGN/DEFER verdict.
**Out of scope:** Implementing the parallelization itself, or closing any remaining-risk file's gap — both are separate follow-on work, gated on this spike's verdict.

**Note on pre-answering Steps 1–6:** this spike's question, blocking stage, type, scope, and done condition are already fully specified in `benefit-metric.md` (Metric 6) and `discovery.md` (item 6), both reviewed and approved earlier in this epic's own session. Proceeding directly to investigation.

**Note on the "64 files" figure:** no artefact anywhere in this epic's chain (or its parent, `test-suite-infra-refactor`) actually enumerates the 64 subprocess-spawning files as a list — it is referenced consistently as an inherited estimate from an earlier, unsaved investigation. This spike does not attempt to reconstruct that broader estimate; it investigates the actual, real risk mechanism directly (the `stis-s1` D37 adapter's own call site) and reports a precise list grounded in that mechanism, which is what the done condition actually asks for.
