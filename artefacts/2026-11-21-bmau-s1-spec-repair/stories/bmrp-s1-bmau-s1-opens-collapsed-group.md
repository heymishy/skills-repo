## Story: The bulk-assign E2E spec opens the collapsed group it clicks in, so it passes instead of timing out

**Epic reference:** None - short-track (test repair; one of the quarantined specs left after the E2E failure triage)
**Discovery reference:** None - short-track skips discovery. Evidence, measured on 2026-11-21 on master (`7ff0618ff`): `tests/e2e/bmau-s1-bulk-assign-rerender.spec.js` run alone fails at `checkboxes.nth(0).check()` with "element is not visible" for the full 30 seconds. Everything before that line passes: the product, the two features, the repo seed and the module are created (module creation returns 201), so the spec's own header comment ("KNOWN GAP ... Adapter not wired: modulesDb ... will fail the moment it tries to create a module") is stale; the fake test database now backs modules. The cause is pdt-s1: product-view module groups start collapsed, and the two features are unclassified, so the checkboxes sit inside the collapsed Unclassified group. Since ctab-s1 the collapsed body is `visibility: hidden`, so Playwright reports it as not visible (before ctab-s1 it timed out with no useful message). The spec was written before pdt-s1 and never opened the group. The same defect was repaired in `frsr-s1` (esh-s1).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [testing] [web-ui-test-support]

## User Story

As **the operator of the platform, who reads the E2E jobs to learn whether a change broke something**,
I want **the bulk-assign spec to exercise bulk assignment instead of failing before it starts**,
So that **the failing list shrinks by one real, known cause, and the bulk-assign re-render behaviour (AC3 of the original story) is covered again**.

## Benefit Linkage

**Metric moved:** the spec goes from failing in every recorded CI E2E run (and locally, alone, with 30 s timeouts) to passing alone in at least three of three local runs and in the pull request's CI run; the E2E failing list on CI loses `bmau-s1`.
**How:** the spec opens the Unclassified group (clicks its header and waits for `aria-expanded="true"`) before it checks the boxes inside it; its stale header comment is replaced.

## Architecture Constraints

- Change confined to `tests/e2e/bmau-s1-bulk-assign-rerender.spec.js` and, once the repaired spec has passed on CI, its entry in `tests/e2e/capability-matrix.json`. No `src/` change; the product behaves as designed (groups start collapsed, the spec must open one).
- The spec's original assertions are kept as they are: both rows move into the target module's body without a page reload (URL unchanged), the Unclassified section ends with zero items, and both count badges update.
- Preserve each file's existing line endings.

## Dependencies

- **Upstream:** pdt-s1 (groups start collapsed), ctab-s1 (collapsed content is `visibility: hidden`), esh-s1 (the same repair on `frsr-s1`), tiso-s1 (shared-session CSRF).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given the repaired spec, When it runs alone, Then it passes, in at least three of three consecutive local runs (before: it failed with "element is not visible" at the first checkbox, measured on master).
**AC2:** Given the repaired spec, When it reaches the checkboxes, Then it has first clicked the Unclassified group's header and asserted `aria-expanded="true"`, so the checkboxes are clicked while visible rather than forced or hidden-clicked.
**AC3:** Given the repaired spec, Then its original assertions are unchanged: the two rows end up in the target module's body (count 2) with the URL unchanged, the Unclassified body ends at zero items, and the headers read (2) and (0).
**AC4:** Given the spec file, Then the stale "KNOWN GAP ... Adapter not wired: modulesDb" header is replaced by a note that says modules work in the harness and why the spec opens the group.
**AC5:** Given the pull request's CI run, When the E2E report is read, Then `bmau-s1` passes there; and the spec's matrix entry moves from `quarantined` to `extended` with a reason that states the repair and the evidence.
**AC6:** Given the pull request, When its changed files are listed, Then they are the spec and `tests/e2e/capability-matrix.json` only (plus artefacts).

## Out of Scope

- Any change to product code, the collapse behaviour, or the fake test database.
- The other quarantined specs (`dsa-s2`, `ep3-s1`, `fpd-s4`, `wuce18`).
- Moving the spec to the blocking `core` lane (the operator's call).
- `continue-on-error`.

## NFRs

- **Test honesty:** the repair must not weaken the spec; every assertion that existed still runs and still fails if the behaviour breaks.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
