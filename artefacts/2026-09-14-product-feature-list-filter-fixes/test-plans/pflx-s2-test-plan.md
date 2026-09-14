# Test Plan: Default the product features list to active (non-definition-of-done) features only (pflx-s2)

**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s2-default-active-only-feature-list.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-pflx-s2-default-active-only-filter.js`, using the same "extract the real generated client script and evaluate it in real `jsdom` against a real render" technique as `pflx-s1` (see that story's own test plan and `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` for the established precedent).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | Rendering a mixed set of items (some `stage: 'definition-of-done'`, some not) and loading the real script leaves every `definition-of-done` item hidden immediately, before any simulated interaction |
| T2 | AC2 | Source-inspection | The rendered "Active only" checkbox's `checked` attribute is present by default |
| T3 | AC3 | Behavioural | Unchecking "Active only" (dispatching a real `change` event) reveals the previously-hidden `definition-of-done` items |
| T4 | AC4 | Behavioural | Re-checking "Active only" after T3 hides those items again |
| T5 | AC5 | Regression | A non-`definition-of-done` item's visibility is unaffected by toggling "Active only" on or off (governed only by search/health) |
| T6 | AC6 | Behavioural | The same mixed item set rendered across "By Module", "By Phase", and "All" tabs all correctly hide their own `definition-of-done` copies on initial load |

## Regression coverage

- `pflx-s1`'s own auto-expand tests re-run to confirm the active-only default (applied at load) does not itself trigger group auto-expansion (per that story's own Architecture Constraints — auto-expand is search-only).
- Existing health-chip count rendering (`check-pdt-s2-triage-summary-strip.js`) re-run unmodified — this story does not change `healthCounts` computation.

## Out of Scope (per story)

- Recomputing health-chip counts for the active-only default.
- Persisting the checkbox state across reloads.
- Any change to what `definition-of-done` means as a stage value.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
