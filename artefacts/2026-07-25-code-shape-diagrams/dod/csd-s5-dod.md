# Definition of Done: As-built diagram generation via static file parsing

**PR:** [#610](https://github.com/heymishy/skills-repo/pull/610) | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s5-as-built-diagram-generation.md
**Test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s5-test-plan.md
**DoR artefact:** artefacts/2026-07-25-code-shape-diagrams/dor/csd-s5-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `src/modules/migration-schema-parser.js` statically parses `scripts/migrate-schema-*.js` (balanced-paren `CREATE TABLE` parsing, no live DB connection) and generates a mermaid `erDiagram` using the exact canvas content-block shape csd-s1/csd-s2 already render | `tests/check-csd-s5-as-built-diagram-generation.js` (10/10 passing), tested against REAL migration files in this repo, not only synthetic fixtures | None |
| AC2 | ✅ — **closed 2026-09-12 by `csd-s7`** | Program Design as-built covered via `src/modules/call-graph-extractor.js` (real `require()`-edge extraction). System Architecture as-built generation was originally missing at this story's own merge, but `csd-s7` (merged 2026-07-26, DoD-complete) built `src/modules/service-call-detector.js`, implementing the static `require()`-allowlist extraction method this DoD's own follow-up action asked for. | `csd-s7`'s own DoD (`csd-s7-dod.md`), 9/9 tests passing, ~3 weeks in production with no incidents as of its 2026-08-17 retroactive pass | None — closed |
| AC3 | ✅ | Generated diagrams written to `artefacts/<featureSlug>/diagrams/as-built-data-model-<timestamp>.json` as versioned files — never overwritten, each generation call adds a new file | Integration test confirms a second call adds a new file rather than overwriting | None |
| AC4 | ✅ | Malformed migration files throw `MigrationParseError` naming the file and specific problem; surfaced as a real HTTP 500 with the error message, never a silent empty/incorrect diagram | Unit test (module level) + integration test (through the real route handler via its D37-style adapter seam) | None |

---

## Scope Deviations

None remaining. **System Architecture as-built generation gap closed 2026-09-12** — see AC2 row above. At this story's own merge, the gap was recorded as requiring a follow-up decision + story rather than a silent omission; `csd-s7` (merged 2026-07-26) was exactly that follow-up, and its own DoD confirms it closed this epic's last open gap.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-csd-s5-as-built-diagram-generation.js` | ✅ | ✅ | 10/10 (6 unit, 2 integration, 2 NFR), independently re-run at merge verification against REAL migration files plus hand-authored fixtures for edge cases |

**Gaps (tests not implemented):** None against the test plan as written — the test plan itself covers only Data Model + a minimal Program Design proof, consistent with the AC2 scope gap above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — completes within normal session time budget (`NFR-parsing-drift-time-budget`) | ✅ | NFR test parses a representative set of ≥5 migration files in <5000ms |
| Security — structure only (`NFR-data-exposure-scope`) | ✅ | Generated diagrams never include row-level data — confirmed by code review of `generateErDiagram()` |
| Audit — generation events logged | ✅ | Injectable logger records `as-built-diagram-generation-succeeded`/`-failed` events with feature slug, diagram type, table count / error |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P1 — Time-to-drift-determination | ❌ | Once a real feature completes the full cycle and csd-s6's drift check runs against it | Completes the as-built half for Data Model; System Architecture as-built remains a gap (see AC2) |

**Measurement-ready gate:** Not yet — see epic-level consolidated note.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. ~~Decide and implement System Architecture as-built generation (AC2's unmet half)...~~ — **Done (csd-s7, merged 2026-07-26).** `service-call-detector.js` implements the static `require()`-allowlist extraction method, per `decisions.md`'s 2026-07-26 ARCH entry.
2. A pre-existing column-type-token mismatch between csd-s4's design convention and this module's `mapType()` function exists but was correctly sidestepped for this story's own AC1 (name-level matching only) — see csd-s6's DoD for where this surfaced and how it was handled.

---

## DoD Observations

1. **Process incident, not a code defect:** this story's implementing subagent was cut off mid-task by an account-wide session usage limit while real, uncommitted work sat in its worktree with no PR. The orchestrating session found the work via `git status` (per this repo's own "verify independently, don't trust self-report" convention), reviewed it in full, ran its tests directly, and finished the remaining steps (pipeline-state.json bookkeeping, commit, push, PR) itself rather than losing the work or re-dispatching into the same limit. Candidate for `/improve`: subagent dispatch prompts for the rest of this epic were updated in-session to explicitly warn "if you're running low on turns, commit real progress rather than stopping mid-task uncommitted" — worth making this a standing instruction in `/subagent-execution`'s own SKILL.md rather than something added ad hoc per dispatch.
2. See AC2 deviation above — the right call was made (flag the gap, don't silently under-deliver, don't invent an unauthorized extraction method) but it does mean this epic's benefit metrics (P1 particularly) cannot fully materialize for System Architecture diagrams until the follow-up lands.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "As-built diagram generation via static file parsing" (csd-s5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
