# AC Verification Script: atr.1 — Audit Trace Report CLI

**Story:** atr.1 — Generate standalone audit trace report from CLI
**Purpose:** Pre-code sign-off, post-merge smoke test, delivery review

---

## Scenario 1 — Active feature report (AC1)

**Setup:** Have a feature that has been through the full pipeline (e.g. Phase 3 or PSA).

1. Open a terminal in the repo root
2. Run: `node scripts/trace-report.js --feature 2026-04-14-skills-platform-phase3`
3. A Markdown report prints to the terminal
4. Check: the report shows the feature name, current stage, and health status
5. Check: each story has its own section with chain link rows
6. Check: each chain link (discovery, benefit-metric, story, test-plan, DoR, DoD) shows ✅ or MISSING

**Pass if:** Report appears within a few seconds, is readable without referring to any JSON file, and every story is listed.

---

## Scenario 2 — Archived feature report (AC2)

1. Run: `node scripts/trace-report.js --feature 2026-04-09-skills-platform-phase1`
2. This feature was archived by psa.1 and lives in `pipeline-state-archive.json`
3. Check: the report is produced (no error about missing feature)
4. Check: the report shows an `[archived]` indicator
5. Check: stories are listed with chain links

**Pass if:** Archived features produce the same quality report as active features.

---

## Scenario 3 — Gate evidence correlation (AC3)

1. Run the report for a feature that has a merged PR (e.g. PSA or a Phase 3 story)
2. Check: at least one story section includes a "Gate Evidence" section
3. Check: the gate evidence shows a verdict (pass/fail), a trace hash, and the checks that were run

**Pass if:** Gate evidence is correlated with the story — the trace hash from the PR comment matches what's in the report.

---

## Scenario 4 — Missing artefact detection (AC4)

1. Run the report for any feature
2. If any artefact file has been deleted or never existed, the report shows it as `MISSING` with the expected file path
3. You should not need to open `pipeline-state.json` to find what's missing — the report tells you

**Pass if:** Missing files are clearly flagged with their expected paths.

---

## Scenario 5 — Unknown feature slug (AC5)

1. Run: `node scripts/trace-report.js --feature does-not-exist`
2. Check: the script prints an error message naming the slug you typed
3. Check: the error lists the available feature slugs you could use instead
4. Check: the script exits with a non-zero code (the terminal shows an error indicator)

**Pass if:** Clear error with available alternatives — not a stack trace.

---

## Scenario 6 — No arguments (AC6)

1. Run: `node scripts/trace-report.js` (no flags)
2. Check: usage instructions print, showing the `--feature <slug>` flag
3. Check: script exits with non-zero code

**Pass if:** Helpful usage message, not a crash.

---

## Scenario 7 — Stage-aware chain links (AC7)

1. Run the report for a feature that has stories at mixed stages (some early, some complete)
2. Find a story that is at an early stage (e.g. `definition` or `test-plan`)
3. Check: chain links that are not yet expected (DoR, DoD for a `definition`-stage story) show as "not yet reached" — NOT as "MISSING"
4. Find a story that is DoD-complete
5. Check: all chain links show ✅ or MISSING (not "not yet reached")

**Pass if:** The report distinguishes between "this file should exist but doesn't" and "this stage hasn't been reached yet."
