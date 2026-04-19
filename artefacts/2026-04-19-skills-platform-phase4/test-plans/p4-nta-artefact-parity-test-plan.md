# Test Plan: p4-nta-artefact-parity — Artefact format parity for bot sessions

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-artefact-parity.md
**Epic:** E4 — Non-technical access
**Dependency:** Spike D PROCEED verdict required; p4-nta-surface must be complete

## Scope

Tests verify that artefacts assembled from bot sessions match template schema exactly (MC-CORRECT-02), contain no placeholders, produce correct branch names (C1), and handle incomplete sessions safely (no partial commit). The `standards_injected` flag is present in session output.

**Implementation module:** `src/teams-bot/artefact-assembler.js`

---

## Test Cases

### T1 — Module exists and exports assembleArtefact

**Type:** Unit
**Check:** `src/teams-bot/artefact-assembler.js` exists and exports `assembleArtefact` as a function.

### T2 — Complete session → artefact with all required fields

**Type:** Unit — MC-CORRECT-02 template conformance
**Given:** A complete session object with answers for all required discovery template fields.
**When:** `assembleArtefact({ session, template: 'discovery', featureSlug: 'test-feature' })` is called.
**Then:** Returns an object with all required discovery template fields populated (non-empty strings): `problem`, `who`, `outcome`, `scope` or equivalent template-defined required fields.

### T3 — No placeholder strings in assembled artefact

**Type:** Unit
**Given:** Complete session passed to `assembleArtefact`.
**When:** Result is serialised to string.
**Then:** Output does not contain `[FILL IN]`, `TODO`, `PLACEHOLDER`, or `<placeholder>` patterns.

### T4 — Assembled artefact has no empty required fields

**Type:** Unit
**Given:** Complete session with all answers.
**When:** `assembleArtefact` returns.
**Then:** No required field in the result is null, undefined, or empty string `""`.

### T5 — Branch name follows convention chore/nta-<slug>-<date>

**Type:** Unit — C1
**Given:** `featureSlug: "my-feature"`, date of assembly is any valid date.
**When:** `assembleArtefact` returns (or a `getBranchName` helper is called).
**Then:** Returned branch name matches `/^chore\/nta-[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/` pattern.

### T6 — Incomplete session → null returned (no commit)

**Type:** Unit — AC4
**Given:** Session object with one or more required fields unanswered (missing answers).
**When:** `assembleArtefact` is called.
**Then:** Returns `null` or throws with an error indicating incomplete session — does not return a partial artefact.

### T7 — Session output includes standards_injected field

**Type:** Unit
**Given:** `assembleArtefact` called with `standardsInjected: true` in session metadata.
**When:** Result is inspected.
**Then:** Result or the session output object contains `standards_injected: true`.

### T8 — No hardcoded artefact paths (ADR-004)

**Type:** Static / source scan
**Check:** Source does not contain hardcoded paths like `artefacts/2026-...` or specific feature slug strings — paths are derived from `featureSlug` and `context.yml` `artefacts.root`.

### T-NFR1 — No PII beyond git-native equivalent (MC-SEC-02)

**Type:** Static / source scan
**Check:** Source contains no calls to external logging services with participant response text; no `console.log` with `session.answers` or `answer`.

### T-NFR2 — No forked repository references in source

**Type:** Static / source scan
**Check:** Source does not reference fork creation, `fork`, or `forked_from` in commit logic — commits go to origin branch (C1).

---

## Verification script

`artefacts/2026-04-19-skills-platform-phase4/verification-scripts/p4-nta-artefact-parity-verification.md`

## Test file

`tests/check-p4-nta-artefact-parity.js`

## Pass criteria

All 12 test assertions pass with 0 failures. TDD red baseline: all fail before `src/teams-bot/artefact-assembler.js` is implemented.
