## Story: Local pipeline-state schema checks catch the required-field/enum/type mistakes that today only surface as CI-only failures

**Short-track:** bug fix -- recurring gap surfaced across five separate capture-log incidents (D22, D29, and three others), found via the full-history capture-log scan.

## User Story

As **Hamish King (Founder/Operator)**,
I want **`node scripts/check-pipeline-state-integrity.js` to catch the specific `pipeline-state.schema.json` required-field, enum, and type mistakes that have repeatedly slipped through local checks and only surfaced as a "Validate traceability chain" CI failure on an already-open PR**,
So that **a hand-constructed pipeline-state.json entry gets caught before it is pushed, not after CI runs on the PR**.

## Background / Investigation

`scripts/check-pipeline-state-integrity.js` already runs locally (via `npm test`) and already implements several schema-adjacent checks (C6: `testPlan.status` enum, C7: `feature.stage` enum, C8: epic-nested story missing `slug`). But the capture-log documents at least five separate real incidents where a *different* schema violation slipped through this same local check and was only caught by CI's `scripts/validate-trace.sh` (which shells out to Python's `jsonschema` library against `.github/pipeline-state.schema.json` directly) running against an already-open PR:

- Flat `feature.stories[]` entries missing the schema-required `id` field (tst-s1, jlc-s1 -- two separate incidents)
- `feature.track` missing entirely on hand-constructed short-track feature entries (dtra-s1, dspw-s1, tdc-s1)
- `dodStatus: null` instead of the schema-required string `'not-started'`
- `prStatus: 'not-started'` -- not a valid value of the schema's enum (`none|draft|open|merged`)
- `acVerified` written as the string `"true"` instead of an integer, because no runtime check compares a `bin/skills advance` field value against its declared schema type

Locally, `python3` is not usable on this operator's Windows dev machine (`Permission denied` -- resolves to the Windows Store stub), so CI's own Python-based schema validator cannot simply be run locally as-is; a Node-only check consistent with this repo's existing all-Node tooling (`ci-lint.js`, `ci-typecheck.js`, this same file's C1-C8 checks) is the natural fit, and avoids introducing a second, potentially-diverging schema-validation implementation.

## Architecture Constraints

- **Extend the existing file, don't create a new one.** `check-pipeline-state-integrity.js` already owns this class of check (C6/C7/C8) and its self-test/fixture conventions -- a second, parallel schema-checking script would fragment the one place operators already know to look.
- **New checks only; zero changes to C1-C8's existing logic or severity.**
- **No new dependency.** Plain Node.js `fs`, matching the file's own documented "Zero external dependencies" contract.
- **Scope is the specific fields that have actually caused incidents**, not a full generic JSON-Schema Draft-7 engine -- narrower, lower-risk, and directly evidenced by the capture-log.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a flat `feature.stories[]` entry missing the schema-required `id` field, When the integrity check runs, Then it reports a new FAIL check (`C10`) naming the feature slug and the story's `slug` (if present) or index.

**AC2:** Given a feature entry missing the schema-required `track` field, When the integrity check runs, Then it reports a new FAIL check (`C11`) naming the feature slug.

**AC3:** Given a story or epic-nested story with `dodStatus` set to `null` or any value not in `not-started|complete`, When the integrity check runs, Then it reports a new FAIL check (`C12`) naming the feature/story and the invalid value.

**AC4:** Given a story or epic-nested story with `prStatus` set to any value not in `none|draft|open|merged`, When the integrity check runs, Then it reports a new FAIL check (`C13`) naming the feature/story and the invalid value.

**AC5:** Given a story or epic-nested story with `acVerified` present but not an integer (e.g. a string), When the integrity check runs, Then it reports a new FAIL check (`C14`) naming the feature/story and the actual type found.

**AC6:** Given a fully-valid feature/story fixture with none of the above defects, When the integrity check runs, Then none of C10-C14 fire (non-regression baseline).

## Out of Scope

- A full generic JSON-Schema Draft-7 validator (oneOf/allOf/$ref resolution, `format` enforcement, `additionalProperties: false` enforcement) -- narrower, evidence-driven scope only.
- Fixing the `python3` vs `python` naming issue on this Windows dev machine for CI's own `validate-trace.sh` -- unrelated, separate potential gap.
- Retroactively fixing any already-existing violations of C10-C14 found in the real `.github/pipeline-state.json` -- logged as a follow-up if found, not blocking this story's own DoR.

## NFRs

- **Consistency:** New checks must produce the exact same `{ code, level, message }` shape as C1-C9, so they render identically in the existing summary/exit-code logic.
- **Backward compatibility:** Existing C1-C9 self-tests must be unaffected.

## Complexity Rating

**Rating:** 2 -- five new, independent field-level checks; some ambiguity in exactly which nested locations (flat vs epic-nested) each field needs checking in.
**Scope stability:** Stable.
