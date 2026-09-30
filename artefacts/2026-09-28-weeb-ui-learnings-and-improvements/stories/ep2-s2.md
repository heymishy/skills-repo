## Story: Signal-to-session seeding bridge — CTA creates a seeded skill session
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signal-seeding-improve-loop-closure.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **clicking a signal's CTA (rendered by `ep2-s1`) to start a new skill session for that signal's `cta.skill`, with the signal's own content injected as context**,
So that **I can act on a real improvement signal without retyping or re-explaining it — closing the seeding half of the self-improvement loop (Metric 3)**.
## Benefit Linkage
Metric 3 — Self-improvement loop accessibility (benefit-metric.md): this story delivers the "seeding" half of the loop ("CTA pre-populating a new session with the signal as context"). Combined with `ep2-s1` (visibility), this closes Metric 3's full 100% target — "an operator can see a signal, click its CTA, and land in a pre-populated new skill session," which this epic deliberately stops at (see epic's own 2026-10-01 scope correction: confirming `/improve`'s full execution to a completed proposal is explicitly out of `discovery.md`'s MVP scope).
## Architecture Constraints
**Handoff mechanism — ADR-023 (artefact content injection, B-iii), confirmed active per `.github/architecture-guardrails.md`:** the signal's content must be injected as a named section via the real `priorArtefacts` mechanism (`registerHtmlSession(sessionId, sessionPath, skillName, {priorArtefacts: [...]})`, confirmed by direct code read at `src/web-ui/routes/skills.js:2467` — `priorArtefacts` is an array of `{path, content}` objects threaded into `buildSystemPrompt`). Do not use full Q&A replay (B-i) or a model-synthesised summary (B-ii) — both explicitly deferred per ADR-023.
**Session model — ADR-022 (Option B, one session per skill stage):** this creates one fresh, standalone session for `signal.cta.skill` — never a persistent multi-skill orchestration or an attempt to resume/extend an existing session.
**Known non-determinism constraint — do not re-look-up the signal by `id` server-side.** `ep1-s1`'s aggregator generates `signal.id` via `Math.random()` and a fresh `new Date().toISOString()` per `parse-error` signal (confirmed live, non-deterministic across successive real `GET /api/signals` calls — documented in `ep1-s2-dod.md`'s own AC5 deviation and this feature's `decisions.md`). A design that re-fetches `/api/signals` server-side and searches for "the signal with this id" would silently seed the wrong (or no) signal. Instead: `ep2-s1`'s rendered CTA form must carry the signal's full needed content (`source`, `type`, `text`, `timestamp`) as hidden form fields, submitted directly in this story's POST body — no server-side re-lookup by id at all.
**Endpoint:** extend the existing `POST /api/skills/[name]/sessions` handler (`ep1-s3`'s own skill-launcher convention, same no-JS `<form method="POST">` mechanism) to accept the optional hidden signal-context fields described above. When present, format them into exactly one `priorArtefacts` entry (e.g. `{path: 'signal:<source>', content: '<formatted source/type/text/timestamp>'}`) and pass it through to session creation. When absent (the existing `ep1-s3` skill-launcher primary/advanced CTAs), behaviour is byte-identical to today — this must not regress `ep1-s3`'s own 9 passing tests.
**Adapter signature (D37):** `skillsAdapter`'s `setCreateSession`/`_createSession` gains an additional optional `priorArtefacts` parameter. Per D37, the stub default must still throw if called unwired; the DoR must include an explicit AC for the new parameter's production wiring; the wiring test must assert behavioural correctness (a session created with signal context has that content in its own `priorArtefacts`/system prompt — not merely that a function reference was reassigned).
No new npm runtime dependencies (discovery.md Constraints).
## Dependencies
`ep2-s1` (signals panel) — this story's CTA form fields are rendered by `ep2-s1`'s own signal list items; `ep2-s1` must exist first so its form markup can be extended here rather than guessed.
`ep1-s3` (skill launcher) — this story extends the same `POST /api/skills/[name]/sessions` endpoint `ep1-s3` already wired; must not regress `ep1-s3`'s own 9 passing tests (`tests/check-ep1-s3-skill-launcher.js`, `tests/e2e/ep1-s3-launcher-layout.spec.js`).
## Acceptance Criteria

**AC1 — Clicking a signal's CTA creates a seeded session:**
Given the operator clicks a signal's CTA button on the signals panel (`ep2-s1`),
When the POST request completes,
Then a new session is created for the signal's `cta.skill` (e.g. `/improve`), with the signal's `source`, `type`, `text`, and `timestamp` injected as a single named `priorArtefacts` section — confirmed by inspecting the created session's own system prompt / `priorArtefacts` array, not merely that the request returned 200.

**AC2 — Operator is redirected into the live session:**
Given the seeded session was created successfully,
When the response is returned,
Then the operator is redirected into that session's chat view, matching the existing redirect behaviour of a non-seeded skill launch (`ep1-s3`'s own primary/advanced CTAs).

**AC3 — The correct skill is launched, not hardcoded `/improve`:**
Given a signal specifies a `cta.skill` other than `/improve` (the `cta` field is per-signal, not a global default, per `_makeSignal`'s own real signature),
When its CTA is clicked,
Then the session is created for that signal's own named skill, not hardcoded `/improve`.

**AC4 — Seeding failure produces a clear error, no partial session:**
Given the signal-context form fields are missing, malformed, or the named skill does not exist,
When the POST request is handled,
Then a clear error response is returned and no session is created — never a partial/broken session an operator could stumble into.

**AC5 — Non-seeded (ep1-s3) skill launches are byte-identical to today:**
Given the operator clicks a primary or advanced-section CTA on the existing `/skills` launcher (`ep1-s3`, no signal context involved),
When the session is created,
Then behaviour is unchanged from `ep1-s3`'s own merged implementation — confirmed by `ep1-s3`'s own 9 existing tests still passing unmodified against this story's extended endpoint.

**AC6 — Production wiring (D37):**
Given `skillsAdapter`'s `setCreateSession`/`_createSession` gains an additional optional `priorArtefacts` parameter,
When the real implementation is wired in `server.js` (where `setCreateSession` is currently called),
Then that real implementation accepts and forwards `priorArtefacts` through to `registerHtmlSession`, and a dedicated wiring test confirms **behavioural correctness, not merely that a function reference was reassigned**: two sessions created with two different signal contexts produce two different, individually-correct `priorArtefacts`/system-prompt contents (matching the standard set by `CLAUDE.md`'s own D37 rule and its `tir-s1` source incident — a test that only checks "`setX` was called" would pass even if the wired function ignored its new argument entirely). Also fixes this adapter's own pre-existing D37 non-conformance: the current stub default (`defaultCreateSession`) silently returns `{id: ''}` rather than throwing — confirmed by direct code read this session (`src/web-ui/routes/skills.js` adapter defaults) — corrected to throw `Error('Adapter not wired: createSession. Call setCreateSession() with a real implementation before use.')`, matching every other adapter default in this same file.
## Out of Scope
- Confirming `/improve`'s own downstream execution/completion behaviour once seeded — explicitly out of this epic's own MVP scope per `discovery.md` ("the MVP seeds a new session; it does not execute the full improvement agent loop from the browser")
- Fixing `ep1-s1`'s non-deterministic `signal.id` generation at its source — explicitly not needed by this story's own design (full content passed client-side, no server-side id lookup), and remains a separate, already-documented follow-up candidate for `ep1-s1` itself if a future story needs stable ids for an unrelated reason
- Editing or refining the injected signal content before session creation (e.g. an operator preview/edit step) — deferred; this story injects the signal's real content as-is
- Signal-to-multiple-skill fan-out (one CTA seeding more than one session) — one CTA, one session, per ADR-022
## NFRs
- Security: the new hidden form fields carry only signal content already rendered to the authenticated operator by `ep2-s1` on the same page load — no new data exposure; CSRF protection matches the existing `ep1-s3` skill-launcher form convention
- Performance: seeding adds one `priorArtefacts` array entry to an otherwise-identical session-creation path; no measurable latency regression expected versus `ep1-s3`'s own baseline
- No new attack surface: no new npm dependency; form fields are server-validated (non-empty, matching a known signal source/type) before being formatted into `priorArtefacts`
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
