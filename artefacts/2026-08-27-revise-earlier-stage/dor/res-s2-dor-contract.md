# Contract Proposal: Overwrite a reopened stage's artefact in place on revision

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md
**Date:** 2026-08-28
**Revised:** 2026-08-28 (pre-implementation-plan correction — see note below)

---

> **Correction note (ADR-008):** this contract's original "Estimated touch points" named `src/web-ui/routes/journey.js` as the chat-turn handler file. Direct code investigation at `/implementation-plan` time found this was wrong — the real artefact-completion/disk-write/`completeStage()` logic lives in `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml` (the SSE streaming turn endpoint the live chat page actually uses; `journey.js` only handles journey-level routing and step-nav rendering). Per ADR-008 ("when the contract and reality conflict, the contract is the authoring defect — update the contract to match"), this file corrects that touch point and two other details discovered during the same investigation, before the implementation plan is written. No AC changed; only the "where" and two previously-unidentified mechanisms below.

## What will be built

In `handlePostTurnStreamHtml` (`src/web-ui/routes/skills.js`), inside the existing `if (done && _artefactText)` artefact-completion block, when the session belongs to a reopened stage (res-s1) and the model's response signals a revised artefact (reusing the existing `---ARTEFACT-START---`/`---ARTEFACT-END---` detection already in that block — no new detection logic):

1. **Path traversal guard (was step 2 in the original contract, corrected for SSE):** before any write, validate the resolved path: `path.resolve(...)` must `startsWith(repoRoot + path.sep)`. This function is a streaming SSE response, not a traditional request/response endpoint, so "reject with HTTP 400" (as originally written) isn't achievable mid-stream — the SSE-appropriate equivalent is to write an SSE `{error: ...}` event and end the stream, matching the mechanism in point 4 below.
2. **Pre-revision content capture (AC5):** read the *existing* file at the resolved path into memory, *before* the write executes — this is the only point at which "before" content is still readable from disk.
3. Overwrite the file at that path with the new content — no new file, no dated copy (unchanged from original contract).
4. **Write-failure surfacing (AC4 — closes an existing gap, not new scope):** the current code already catches a write failure but only logs it (`console.warn`) — it never reaches the operator. Fix: on catch, write an SSE `{error: ...}` event and end the stream, matching the existing error-signalling convention already used elsewhere in this same function (e.g. the "Model error" and "No response received" cases).
5. **Duplicate-completion guard (newly identified — necessary for AC1/AC3, not in the original contract):** the existing code calls `_journeyStore.completeStage(...)` unconditionally the first time any session completes an artefact (guarded only by a per-session `_stageDone` flag). For a *reopened* session (a fresh session object, per res-s1), this flag starts unset — so a revision turn would call `completeStage()` again, which unconditionally `push`es a *new* entry onto `journey.completedStages`. That directly violates AC3 ("no entry is added, removed, or reassigned"). Fix: before calling `completeStage()`, check whether `journey.completedStages` already has an entry for this `skillName`. If yes (a revision of an already-completed stage), do **not** call `completeStage()` — instead, fire the materiality-check hook (point 6) with the pre/post content captured above.
6. **Materiality-check hook (AC5, the "hand forward" mechanism):** a new injectable adapter, `_materialityCheckHook` / `setMaterialityCheckHook()`, following the exact same D37-exception pattern already established by `_skillTurnGitCommit` (same file, ~line 1435) — a **documented, deliberate exception to the "stub must throw" rule**, because res-s3 (which will wire the real implementation) doesn't exist yet, and this hook's whole purpose is to be safely inert until something wires into it. Default: a no-op function. Called only on the revision path (point 5's `else` branch) with `{journeyId, skillName, preRevisionContent, postRevisionContent}`.
7. Log the overwrite event with `journeyId`, `skillName` (stage name), `timestamp` (unchanged from original contract).

## What will NOT be built

- Any versioning, diffing, or dated-copy mechanism.
- The materiality judgment itself — that's res-s3, which will call `setMaterialityCheckHook()` to wire a real implementation into the seam this story creates.
- Any change to `handlePostTurnHtml`/`htmlSubmitTurn` (the non-streaming `/turn` endpoint) — investigated and confirmed it does not write to disk or call `completeStage()` at all, so it has no equivalent duplicate-completion risk. Out of scope; not touched.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Overwrite-in-place test on a revision turn for a reopened stage; regression test that the duplicate-completion guard doesn't affect first-time completion | unit |
| AC2 | Downstream read (simulated `/trace`-style disk re-read) after overwrite returns new content | integration |
| AC3 | No-revision turn (question-only) leaves the artefact byte-identical; `completedStages` entry unchanged | unit |
| AC4 | Simulated write failure surfaces an SSE `{error: ...}` event, stream ends, no partial file | unit |
| AC5 | Pre-revision content captured before the write; materiality hook receives correct pre/post pair; hook is a no-op by default (D37 exception, matches `_skillTurnGitCommit` precedent) | unit |
| AC1/AC3 (new) | Duplicate-completion guard: revising an already-completed stage does NOT push a second `completedStages` entry | unit |

## Assumptions

- The chat-turn handler already has a clear "this turn produced an artefact" signal (the same `---ARTEFACT-START---`/`---ARTEFACT-END---` detection the initial stage-completion flow uses) — this story reuses it rather than inventing new detection logic. (Unchanged from original contract.)
- `path.resolve`/`startsWith(repoRoot)` guard follows the exact pattern established in the `ougl` decisions.md path-traversal ADR, adapted for SSE (see point 1).
- res-s1's reopen flow already sets `session.featureSlug`/`session.skillName` identically to the stage's original session, so `session.artefactPath`'s existing computation naturally reproduces the same path on a reopened session — no new path-construction logic needed, only the guard.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` (`handlePostTurnStreamHtml` — corrected from the original contract's `journey.js`)
Services: none new
APIs: none new — no new route, only new adapter setter functions (`setMaterialityCheckHook`) exported from the existing `skills.js` module

## Schema dependency (H8-ext)

This story's Dependencies block names res-s1 as upstream (not "None").
`schemaDepends: ["prStatus", "dodStatus"]` — the coding agent should confirm res-s1's `prStatus` and `dodStatus` fields in `pipeline-state.json` before assuming res-s1's reopen mechanism is available to build on.
