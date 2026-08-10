## Story: A completed stage's resumed history silently drops its final assistant message when nothing followed it

**Epic reference:** None — short-track (bug fix, found by the operator directly while live-validating drh-s1 on staging)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **product owner reviewing a completed stage's conversation history**,
I want **to see the skill's actual final message, even when I didn't type a reply to it**,
So that **the historical record shows what genuinely happened during this stage, not an empty conversation panel next to a populated artefact and diagram**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — the operator reported directly, immediately after confirming `drh-s1`'s diagram fix works correctly: visiting a completed `Definition` stage's history shows the artefact and diagram correctly, but the conversation panel (`#chat-messages`) is completely empty — confirmed via direct DOM inspection (`childCount: 0`) on the operator's own real staging journey.

**How:** Root-caused via direct source read. `handleGetJourneyStageView`'s `_priorQA`-building loop (`src/web-ui/routes/journey.js`, ~line 915-937) pairs an `assistant` turn with an immediately-following `user` turn into one displayed Q&A entry — but when an `assistant` turn has no following turn at all (the conversation's last recorded message came from the skill, not the operator), that turn is silently dropped entirely, per a comment citing dsh-s3's AC5 ("no live 'current question' affordance in this read-only view"). For a stage whose entire recorded history is a single, lone assistant turn — e.g. a single-shot "produce the full definition now" response that the operator immediately gate-confirmed without typing a reply — this drops 100% of the conversation, even though the stage is definitionally complete (this route is only ever reached for already-completed stages; `!artefactRelPath` redirects elsewhere earlier in the function). The original AC5 concern was about not showing a live, interactive "type your answer" affordance for a still-open question — but `readOnly: true` already fully suppresses the input form/textarea/submit button regardless of turn content (confirmed by `drh-s1`'s own AC4 test). The drop logic conflates "don't show an interactive prompt" with "don't show the message at all," discarding real historical content the interactivity-suppression already made safe to display.

Live-confirmed on the operator's own real journey: multi-turn stages (e.g. `/design`, which has genuine assistant-asks/operator-answers pairs) render their conversation correctly; a single-shot stage whose only turn is the final assistant message does not.

## Architecture Constraints

- **The fix applies only inside `_useChatSplit`'s `_priorQA`-building loop** — no change to `_dshTurns` fetching, `extractCanvasBlocksFromTurns`, or any other part of `handleGetJourneyStageView` untouched by this exact loop.
- **`readOnly: true` remains the sole mechanism preventing any interactive "type your answer" affordance** — this story does not touch that suppression; it only changes whether a trailing assistant turn's *content* is displayed as a read-only message.
- **A trailing assistant turn with no following user turn is now displayed as an answer-only entry** (`{ question: '', answer: <content>, modelResponse: '' }`), using the exact same shape already used for a lone leading `user` turn — no new rendering branch, no new CSS, reusing the existing pattern.
- **Multi-turn pairing behaviour is unchanged** — an assistant turn genuinely followed by a user turn still pairs into one `{question, answer}` entry exactly as today; this story only changes what happens to an assistant turn with *no* following turn.

## Dependencies

- **Upstream:** `drh-s1` (already merged) — this fix lives in the same function and view; not a blocking dependency, but directly adjacent and found during its own live validation.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a completed stage whose durable turns are exactly one `assistant` turn (no following turn at all), When the resume-history view renders, Then the conversation panel shows that assistant turn's content as a displayed message — not an empty panel.

**AC2:** Given a completed stage whose durable turns end with an `assistant` turn that IS followed by a `user` turn (the existing, already-working pairing case), When the resume-history view renders, Then that pair still displays as one paired Q&A entry exactly as today — no change to this already-correct behaviour.

**AC3:** Given a completed stage whose durable turns are `[assistant, user, assistant]` (a paired exchange followed by a second, trailing unanswered assistant turn), When the resume-history view renders, Then both the paired entry AND the trailing assistant-only entry display — no content is silently dropped anywhere in the sequence.

**AC4:** Given any of the above scenarios, When the resume-history view renders, Then no interactive input/textarea/submit-button control appears — the `readOnly: true` suppression this story explicitly does not touch remains fully intact.

**AC5:** Given a completed stage with zero durable turns at all (the existing `_useChatSplit` false / artefact-only fallback path), When the resume-history view renders, Then behaviour is completely unchanged — this story does not touch the no-turns-available case.

## Out of Scope

- **Any change to `readOnly` suppression of interactive elements** — untouched, per Architecture Constraints.
- **The live (non-historical) chat page's own turn rendering** — unaffected; this fix is scoped entirely inside `handleGetJourneyStageView`'s read-only split-view branch.
- **Distinguishing "genuinely still-open question" from "single-shot final message" by any means other than "is this a completed stage's history view"** — the route's own existing guard (redirects when the stage has no artefact yet) is already sufficient; no new heuristic is needed.

## NFRs

- **Correctness:** Closes a real, operator-confirmed gap where a completed stage's historical record silently hides genuine conversation content — directly undermines the "review what happened" purpose of the resume-history view `drh-s1` just fixed for diagrams.
- **Consistency:** The fix makes single-shot and multi-turn stages behave consistently — both now show their full recorded conversation, matching the operator's reasonable expectation that "the history view shows the history."

## Complexity Rating

**Rating:** 1 — small, well-understood, fully root-caused change to one loop; no new data sources, no new rendering branches.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
