# Test Plan: Migration path for existing fork consumers

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-migration.md
**Epic:** E2 — Distribution model
**Complexity:** 2 (Unstable — guide structure depends on Spike C sidecar layout)
**Test type:** Documentation structure check

**Note:** Phase 4 MVP is documentation-first — the deliverable is a migration guide document, not a CLI migration command. Tests validate guide structure and completeness, not code execution.

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | Migration guide document exists | Doc | — | `fs.existsSync` | `docs/migration-guide.md` present |
| T2 | Guide has pre-migration checklist section | Doc | AC3 | Regex: heading containing "pre-migration" or "checklist" | Section exists |
| T3 | Guide includes `skills-repo verify` as final migration step | Doc | AC1 | Search for `skills-repo verify` in guide | Phrase appears in a "final step" context |
| T4 | Guide documents `skills_upstream` configuration step | Doc | AC1 | Search for `skills_upstream` in guide | Configuration step present |
| T5 | Guide explicitly documents which customisations are abandoned vs preserved | Doc | AC3 | Search for "abandon" or "custom" with decision context | Guide names what is/is not preserved |
| T6 | Guide references Spike C output as source of truth for sidecar structure | Doc | AC1 | Search for `spike-c` or `spike c` | Spike C reference appears in guide |
| T7 | Guide has confirm-and-verify sequence | Doc | AC1 | Search for `verify` after a confirm/run step | Verify step follows a confirm instruction |
| T8 | Guide does not instruct consumer to commit credentials to repo | Security | NFR | Scan for `token`, `password`, `secret`, `tenantId` in a git commit context | No such instruction exists |
| T-NFR1 | Guide contains no OAuth tokens, tenant IDs, or credential strings | Security | NFR | Pattern scan of guide content | No UUID-shaped strings, no `Bearer ` strings |
| T-NFR2 | Guide includes a migration completion record step (decisions.md entry) | Audit | NFR | Search for `decisions.md` in guide | Guide references recording the migration event |

---

## Test descriptions

### T1 — Guide exists
`docs/migration-guide.md` must exist. If absent, all remaining tests fail.

### T2 — Pre-migration checklist
The guide must contain a section heading matching `pre-migration` or `checklist` (case-insensitive). The section must appear before the main migration steps.

### T3 — skills-repo verify as final step
The string `skills-repo verify` (or code block equivalent) must appear in the guide, in a context that follows the main migration steps (not only in an introduction). Look for it after the last numbered migration step or in a section with "final" or "verify" in the heading.

### T4 — skills_upstream config step
The guide must instruct the consumer to set `skills_upstream.repo` (or `skills_upstream` config block) in `.github/context.yml` as a step. The string `skills_upstream` must appear in the guide.

### T5 — Customisation decision point documented
The guide must contain the word "abandon" or "custom" in the context of a decision the consumer makes about their modified skills files. At minimum one sentence must describe what happens to custom content.

### T6 — Spike C reference
The guide must reference "Spike C" (case-insensitive: `spike c`, `spike-c`) to indicate that sidecar directory structure follows the Spike C verdict.

### T7 — Confirm-and-verify sequence
The guide must include a step instructing the consumer to run the install/migration and then immediately run `skills-repo verify`. The verify instruction must follow (not precede) the main install steps.

### T8 — No credential commit instruction
Scan the guide for patterns that would instruct the consumer to commit credentials: `git add` within 3 lines of `token`, `password`, `secret`, or `tenantId`. Expect zero matches.

### T-NFR1 — No live credentials in guide
Scan the guide for UUID-shaped strings (8-4-4-4-12 hex), `Bearer ` strings, or `-----BEGIN` markers outside fenced code blocks labelled `example`. Expect zero matches.

### T-NFR2 — Migration record step
The guide must mention `decisions.md` in the context of recording a migration event, confirming the audit requirement from the NFRs.

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T3, T4, T6, T7 |
| AC2 | (git history intact — structural; validated by human review during migration execution) |
| AC3 | T2, T5 |
| AC4 | T3, T7 |
| NFR: Security | T8, T-NFR1 |
| NFR: Audit | T-NFR2 |
