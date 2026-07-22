## Story: Assert full session close/resume mid-SSE-stream for the ideate canvas

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **close the browser mid-`/ideate` session (including mid-SSE-stream) and reopen it to find the canvas, turn history, and in-flight state restored exactly as before**,
So that **the `wusl-s1`/`wusl-s2` session-restore fix this session just hardened has a permanent, automated regression guard, moving the E2E CI gate metric (m1) toward its target**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** This story directly re-creates the exact SSE session-state-dropped-on-resume bug (`wusl-s2`) that shipped undetected this session — without an automated assertion here, the very regression this feature was triggered by could silently reappear on a future refactor.

## Architecture Constraints

- **ADR-023:** handoff schema between journey stages is artefact content injection (B-iii) — the resumed session must be verified to have re-loaded from the real persisted artefact/session-store content, not from a stale in-memory assumption.
- Guardrail (this session's own hardening): `mergeRedisSessionData` (see `src/web-ui/routes/skills.js`) restores session state via a denylist, not an allowlist — this story's assertions should include at least one canvas/session field that did not exist in the original 8-field allowlist (e.g. `canvasBlocks`), to prove the restore is structurally complete, not coincidentally passing on already-covered fields.
- None else identified — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** A3 (product/feature/ideate creation) — this story resumes the exact session A3 established.
- **Downstream:** A5 (CI gate wiring) depends on this story's assertions existing and passing reliably.

## Acceptance Criteria

**AC1:** Given an active `/ideate` session with canvas content from A3, When the spec closes the browser tab/context mid-way through a new turn's SSE stream (before the stream completes), Then the server's session store still contains a `pendingSectionDraft` (or equivalent in-progress marker) for the interrupted turn, queryable via the same session-state read path AC2-AC4 use.

<!-- [1-M1, resolved 2026-07-23]: reworded from the negative/vague "is not silently lost" to a concrete, positive, queryable assertion. -->

**AC2:** Given the closed session, When the spec reopens the same session URL in a fresh browser context, Then the canvas renders with the exact same blocks/markers that existed before closing, and the turn history (chat log) matches what existed before closing.

**AC3:** Given the resumed session, When the spec sends a new turn, Then the first new response uses the restored context (prior turns, canvas state) — verified by asserting the new response's content is coherent with the pre-close conversation (e.g. references a specific detail only present in a prior turn), not a fresh/blank context.

**AC4:** Given the resumed session, When the spec inspects the restored session's `canvasBlocks` field specifically, Then it is present and populated — this field was not in `mergeRedisSessionData`'s original 8-field allowlist, so its correct restoration proves the fix is structural (per `wusl-s2`'s AC4 test design), not another narrow allowlist.

## Out of Scope

- Resuming a session on a different device/browser than where it was closed — same-context resume only, per discovery's scope
- Testing every possible mid-stream close timing (this story picks one representative "mid-stream" point, not an exhaustive sweep)
- The story-map canvas resume behaviour — that is B1 (Epic B), a separate skill/session type

## NFRs

- **Performance:** Session resume (reload + first restored render) completes within a bounded Playwright wait matching normal page-load expectations — no special resume-specific latency budget.
- **Security:** The resumed session must only be reachable by the same authenticated user who created it (tenant/ownership scoping per ADR-025) — the spec should assert an unauthenticated or different-tenant request to the same session URL is rejected.
- **Accessibility:** Not applicable — this story is test infrastructure, not user-facing UI.
- **Audit:** None identified beyond existing session audit logging.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
