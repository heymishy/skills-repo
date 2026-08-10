## Definition of Ready: isc-s1 — Make the default mock-gateway /ideate scenario actually cycle through lenses, assumptions, conditions, and completion

**Story:** artefacts/2026-08-10-ideate-success-lens-cycling/stories/isc-s1-ideate-success-lens-cycling.md
**Test plan:** artefacts/2026-08-10-ideate-success-lens-cycling/test-plans/isc-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- Modified: `tests/e2e/fixtures/llm-gateway/ideate.success.json` — migrated to `mgtc-s1`'s `responses` array format.
- Modified: `tests/check-a3-ideate-artefact-disk-match.js` — read-site update (`fixture.response` → `fixture.responses[0].response`), no assertion-logic change.
- Modified: `tests/check-a4-session-store-state.js` — same read-site update.
- Modified: `tests/check-mds-s1-diagram-showcase-fixtures.js` — `EXISTING_FIXTURE_CHECKSUMS` updated to remove `ideate.success.json` (this story's own deliberate change supersedes mds-s1's byte-identical guarantee for that one file only).
- New: `tests/check-isc-s1-ideate-success-lens-cycling.js`.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/modules/mock-llm-gateway.js`, `src/modules/skill-turn-executor.js` — `mgtc-s1` already implemented and correctly wires `turnIndex` end-to-end; zero code changes needed here.
- `src/web-ui/routes/skills.js` — the marker-parsing/rendering path is already correct; this story adds fixture content only.
- `tests/e2e/fixtures/llm-gateway/design.success.json`, `definition.success.json`, `definition.failure.json`, and every `mds-s1` `diagram-showcase` fixture — must remain byte-identical.

### Architecture Constraints

No new architectural decision — reuses `mgtc-s1`'s already-shipped `responses` array mechanism exactly as designed. No ADR required.

### Human oversight

**Low** — fixture content plus two existing tests' raw-shape read sites; zero production code changes.

### Coding Agent Instructions

1. `tests/e2e/fixtures/llm-gateway/ideate.success.json` — already rewritten to the `responses` array format (5 meaningful entries at indices 0/2/4/6/8, covering Lens A/B/C/D and a final artefact-completion turn, with unreachable odd-index slots padded with a duplicate of the preceding meaningful entry).
2. `tests/check-a3-ideate-artefact-disk-match.js` and `tests/check-a4-session-store-state.js` — already updated to read `fixture.responses[0].response` instead of `fixture.response`.
3. `tests/check-mds-s1-diagram-showcase-fixtures.js` — already updated to drop `ideate.success.json` from `EXISTING_FIXTURE_CHECKSUMS`.
4. Write `tests/check-isc-s1-ideate-success-lens-cycling.js` per the test plan's AC1–AC5, then run it plus every file in the test plan's Regression Tests section — zero regression required before this story is considered done.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — fixture data + unit-level marker/content checks only)

**PROCEED: Yes**
