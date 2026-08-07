# Retrospective Story: journey featureSlug priority over the response's SLUG marker, and the mock-gateway toggle's missing nav link

**Story ID:** alrf-s8 (nav fix tracked as alrf-s7 within this same story)
**Retrospective audit date:** 2026-07-26
**Risk classification:** MEDIUM (fixes a real, active data-correctness bug affecting every real feature created on staging; the nav addition is a pure additive UI fix)

**Epic reference:** none directly — found via operator manual staging testing, following on from the `alrf-s1`–`alrf-s6` artefact-listing work
**Parent signal:** `workspace/capture-log.md`, 2026-07-26, "post-alrf-s4 staging verification" entry

## What was delivered

The operator reported that a real feature's ("new-feature-d350e651") Resume page listed artefacts and working links (`alrf-s4` correctly surfacing Postgres-saved content), but the artefacts shown were visibly `mock-fixture-feature`'s discovery/benefit-metric/design/definition content, and clicking Resume failed with "Session not found."

**Root cause, in `src/web-ui/routes/skills.js`:** both turn-completion handlers (`htmlSubmitTurn`, non-streaming, and the streaming handler inside `handlePostTurnStreamHtml`) always preferred the response's own `---SLUG---` marker over `session.featureSlug` — even when the session was already linked to a real journey with its own, already-known, meaningful feature slug (set at journey-creation time via `linkSessionToJourney`). This bug is not mock-specific — it would misfire identically with a real model that, for any reason, echoed a different slug than the one it was told — but it was invisible until now because a real model has no reason to invent a conflicting slug, whereas every `mock-llm-gateway` fixture hardcodes the identical `---SLUG---\n2026-07-10-mock-fixture-feature` marker (needed for deterministic E2E fixtures), so every real feature's artefacts silently collapsed onto that one shared mock slug whenever `MOCK_LLM_GATEWAY=true`.

**Fix:** both call sites now compute `slug = session.featureSlug || (slugMatch ? ... : ...)` — the already-known journey slug wins when present; the response's own marker (or the date-based default) remains the deciding factor only for sessions with no journey (standalone `/skills` or CLI-style usage), preserving existing behaviour there.

**Separately (alrf-s7, same investigation, in response to the operator asking why they'd never seen a mock-gateway on/off toggle):** found `routes/admin-mock-gateway.js`'s `GET /admin/mock-gateway` toggle (amgt-s1) is fully implemented, `requireAdmin`-gated, and wired in `server.js` — but has zero `NAV_ITEMS` entry, so it was only ever reachable by typing the URL directly. Same "API shipped, UI never wired" pattern as the modules-taxonomy CRUD and admin-credits stories before their own fix-forward nav additions. Added a nav entry alongside "Admin credits."

## Benefit Linkage

**Metric moved:** closes the actual, currently-live data-correctness bug behind the operator's original bug report — every real feature created on staging while the mock gateway is on will now correctly keep its own artefacts, not collide with another feature's. The nav fix gives operators a real, discoverable way to turn the mock gateway off for manual testing (trading mock-content-determinism for real, uniquely-correct AI-generated content) without needing a code change or knowing the URL by heart.

## Acceptance Criteria

**AC1 — `htmlSubmitTurn` (non-streaming): a journey-linked session's real `featureSlug` wins over the response's `---SLUG---` marker**
Status: MET — `tests/check-alrf-s8-journey-slug-priority.js` AC1.

**AC2 — `htmlSubmitTurn`: a session with no known `featureSlug` still falls back to the marker (unchanged behaviour for standalone/CLI sessions)**
Status: MET — AC2.

**AC3 — the streaming handler (`handlePostTurnStreamHtml`) applies the same priority**
Status: MET — AC3.

**AC4 — the streaming handler falls back to the marker with no regression when no `featureSlug` is known**
Status: MET — AC4.

**AC5 — `/admin/mock-gateway` has a real, discoverable nav entry, admin-only**
Status: MET — `tests/check-b2-account-nav.js`'s new `alrf-s7` test case, plus the pre-existing AC3 dangling-link check (confirms the route genuinely resolves) still passing.

**AC6 — no regression to existing turn-completion / streaming / nav behaviour**
Status: MET — `check-dsq1-dynamic-next-question.js` (9/9), `check-dsq2-section-confirmation-loop.js` (10/10), `check-dsq4-section-artefact-assembly.js` (7/7), `check-srmw-s1-streaming-mock-gateway-wiring.js`, `check-stis-s1-guard-skill-turn-git-commit.js` (6/6), `check-wsm1-session-persistence.js` (23/23), `check-wuce26-per-answer-model-response.js` (14/14), `check-cmtt-s1-chat-message-text-truncation-fix.js` (8/8), `check-b1-nav-fix.js`, `check-kanban-consolidation.js`, `check-wuce18-html-shell.js` — all unchanged. (Two pre-existing `check-mfc1-model-first-chat-session.js` failures confirmed via `git stash` to predate this change — missing local `ANTHROPIC_API_KEY`, unrelated.)

## Out of Scope

- The "Session not found" symptom itself, once the slug fix lands, should mostly resolve naturally going forward (each feature's own session/journey stays correctly separated) — not independently investigated further, since it was a downstream symptom of the same root cause for any pre-existing collided sessions.
- Whether staging should ever make real Anthropic calls for manual operator testing by default (a cost/policy question, not a bug) — the nav fix gives the operator the *choice*, deliberately, rather than deciding it for them.

## Traceability Linkage

**DoR artefact:** not written — retrospective story
**Test plan:** `tests/check-alrf-s8-journey-slug-priority.js` (4 ACs), `tests/check-b2-account-nav.js`'s new alrf-s7 case (1 AC)
**DoD artefact:** not yet written
