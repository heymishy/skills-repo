## Story: Reconcile check-pipeline-state-integrity.js's rules with the actual JSON schema

**Track:** Short-track (hardening fix — found via direct investigation, not a new feature)

## User Story

As a **platform owner running the local governance checks before opening or updating a PR**,
I want **`scripts/check-pipeline-state-integrity.js` to catch every `required`-field and `enum`-value violation that CI's `validate-trace.sh`'s `jsonschema`-based schema check would catch**,
So that **a schema violation is caught locally (in seconds, before a push) instead of only surfacing after a CI round-trip against a real PR**.

## Benefit Linkage

Directly closes a gap found during `wuar-s1`/`rsc-s1`'s own PR cycle (2026-09-30): a pre-existing `pipeline-state.json` feature entry (`2026-09-29-test`) was missing a required `name` field. `scripts/check-pipeline-state-integrity.js` reported "0 fail" against it (it has no check for a feature's `name` presence at all), while CI's `Validate traceability chain` job — which runs the real `.github/pipeline-state.schema.json` through Python's `jsonschema` library — correctly failed the same PR with `features > 304: 'name' is a required property`. The gap was found and fixed live, one violation at a time, across 2 separate CI round-trips, purely because the local checker didn't cover ground the real schema already enforces. Reading both files side by side (this story's own investigation) surfaced a substantially larger set of the same class of gap — not just `name`, but several other `required` fields and several `enum` constraints the local checker has no equivalent for at all.

## Architecture Constraints

- No new npm dependencies. `scripts/check-pipeline-state-integrity.js` is intentionally zero-external-dependency plain Node (its own header comment); this story preserves that — no `jsonschema`/`ajv` library is introduced, this remains a hand-written set of targeted checks matching the file's own established `C<n>` convention.
- Every new check follows the existing file's own shape exactly: a `findings.push({level, code, message})` entry inside `checkFeature`/`checkStory`, a `VALID_*` constant array for any new enum, and a companion block of self-tests in the "Self-tests (pure logic — no filesystem)" section before the real integration check runs — matching the density and phrasing style of the existing C1–C14 self-tests.
- New check codes continue the existing sequential numbering from C15 (the last defined code is C14; C9 exists but is defined out of numeric order in the file, this does not change that).
- `.github/pipeline-state.schema.json` is the single source of truth being reconciled against — every new check must cite the exact schema line/property it mirrors in its own header-comment entry, matching the file's existing per-check documentation convention (see C1–C14's own header comments).

## Dependencies

None.

## Acceptance Criteria

**AC1 (feature required fields):** Given a feature entry is missing `name`, When the integrity check runs, Then it fails with a new code naming the missing field and citing the schema requirement — mirroring C11's existing message shape for the sibling `track` field. Given a feature entry is missing `health`, When the check runs, Then it fails the same way.

**AC2 (health enum validity):** Given a feature's `health` field (or an epic-nested story's `health` field) is present but not one of `green | amber | red`, When the check runs, Then it fails with a new code naming the invalid value and the valid enum — mirroring C7's existing message shape for the sibling `stage` field.

**AC3 (epic-nested story required fields):** Given an epic-nested story (`feature.epics[].stories[]`, object form) is missing `name` or missing `stage` or missing `health`, When the check runs, Then it fails for each missing field with a new code — mirroring C8's existing message shape for the sibling `slug` field in the same object shape.

**AC4 (status enum validity):** Given a story's `dorStatus` is present but not one of `not-started | blocked | signed-off`, When the check runs, Then it fails. Given an epic-nested story's `reviewStatus` is present but not one of `not-started | passed | has-findings`, When the check runs, Then it fails. Given an epic-nested story's `verifyStatus` is present but not one of `not-started | running | passed`, When the check runs, Then it fails.

**AC5 (guardrails[] structural validity):** Given a `feature.guardrails[]` entry is missing any of `id`, `category`, `label`, `status`, When the check runs, Then it fails naming the missing field(s). Given a `guardrails[]` entry's `category` is present but not one of `mandatory-constraint | adr | nfr | compliance-framework | pattern | anti-pattern`, or its `status` is present but not one of `met | not-met | na | excepted | not-assessed | active`, When the check runs, Then it fails naming the invalid value — this directly covers the exact risk CLAUDE.md's own Coding Standards section already documents ("These values are validated by `validate-trace.sh --ci` — invalid values cause hard CI failures on agent PRs") but which no local check currently enforces.

**AC6 (tasks[] structural validity extension):** Given a `story.tasks[]` entry is missing `id` or missing `name` (the existing C4 check only covers `tddState`), When the check runs, Then it fails naming the missing field. Given a `tasks[]` entry's `tddState` is present but not one of `not-started | committed | green | refactor | done` (the existing C4 check only verifies the field is present, not that its value is valid), When the check runs, Then it fails naming the invalid value.

**AC7 (spikes[] structural validity):** Given a `feature.spikes[]` entry is missing `id` or missing `storySlug`, When the check runs, Then it fails naming the missing field. Given a `spikes[]` entry's `verdict` is present, non-null, and not one of `PROCEED | REDESIGN | DEFER | REJECT`, When the check runs, Then it fails.

**AC8 (no false positives against the current real file):** Given the real, current `.github/pipeline-state.json` on `master` at the time this story merges, When the fully-extended check runs against it, Then it reports 0 new failures beyond what already exists today — every new check must be validated against the real file before merge, not only against synthetic fixtures, exactly as this story's own investigation validated the `2026-09-29-test` gap directly against the schema via `python -c "...jsonschema..."` rather than trusting the local checker's own silence.

## Out of Scope

- Introducing a real JSON-schema library (`ajv`, `jsonschema` for Node) to replace the hand-written checks wholesale — the file's own header comment states "Zero external dependencies... plain Node.js fs only" as a deliberate design choice; this story extends that pattern rather than replacing it.
- Achieving 100% mechanical parity with every property in `.github/pipeline-state.schema.json` (e.g. `programmes[]`, `coverageRisk`, `standardsInjected`, `watermarkResult`, `sessionIdentity` and other rarely-written, low-risk fields) — scoped to the `required` and `enum` constraints on the fields this repo's own skills actually write routinely (features, stories, guardrails, tasks, spikes), matching the same risk profile the existing C1–C14 checks already target.
- Changing `validate-trace.sh` or `.github/pipeline-state.schema.json` themselves — this story makes the local checker match the existing schema, not the other way around.
- Retroactively fixing any pre-existing schema violation this story's new checks might surface in the real, current `pipeline-state.json` beyond what AC8 requires (confirming 0 *new* failures) — any genuinely new finding against real data is a separate follow-up bookkeeping fix, not part of this story's own implementation task.

## NFRs

- **Performance:** Not applicable — this script already parses the full `pipeline-state.json` once per run; new checks are additional O(n) array scans over already-collected features/stories, negligible at this repo's current scale (647 stories).
- **Security:** Not applicable — no new input surface; operates only on already-trusted repo-local JSON.
- **Accessibility:** Not applicable — CLI/CI tooling, no UI.
- **Audit:** The new checks' own failure messages ARE the audit trail for this story's concern — no new persistent storage required.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
