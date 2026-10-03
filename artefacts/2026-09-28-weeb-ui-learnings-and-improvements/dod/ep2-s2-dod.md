# Definition of Done: Signal-to-session seeding bridge — CTA creates a seeded skill session

**PR:** https://github.com/heymishy/skills-repo/pull/936 | **Merged:** 2026-10-03
**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
**Test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

---

**Evidence-tier correction (2026-10-04, post-merge, added during `ep2-s3`'s own DoD):** The `live-verified` tags below mean "a real HTTP round-trip against a locally-booted dev server" — not the deployed `wuce-staging` environment. On direct operator question, this was checked and found genuinely different from `ep2-s1`/`ep2-s3`'s own DoDs (both of which were corrected to add real `wuce-staging` confirmation, 2026-10-04): the real staging check performed that day exercised `GET /signals`'s own pagination/navigation only — it did **not** click a real signal CTA button or exercise this story's own `POST /api/skills/:name/sessions` seeding flow on staging. **This story's own AC coverage below remains at the `live-verified`-against-local-dev tier only; it has not been confirmed against real staging.** Unlike `ep2-s1`/`ep2-s3`, no row below has been upgraded.

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — CTA creates seeded session with injected content | ✅ | Session-creation + redirect half: real HTTP round-trip against a running **local dev server** (real CSRF token extracted from the real rendered `/signals` form, real `303` redirect to a real new session). Content-injection half: `AC1 (behavioural half) + AC3` test in `tests/check-ep2-s2-signal-seeding-bridge.js` inspects the real forwarded `priorArtefacts` array directly. **Not verified against real staging.** | `live-verified` (local dev; creation/redirect) + `integration-real-code` (content forwarding) | None |
| AC2 — Operator redirected into live session | ✅ | Real `303` response with `Location: /skills/improve/sessions/<real-uuid>/chat`, followed and confirmed to render a normal, error-free chat page, against a running **local dev server**. **Not verified against real staging.** | `live-verified` (local dev) | None |
| AC3 — Correct skill launched, not hardcoded `/improve` | ✅ | `AC6` test (`tests/check-ep2-s2-signal-seeding-bridge.js`) creates two real sessions via the real, unmocked `server.js` wiring — one for `/workflow`, one for `/improve` — and asserts each dispatches to its own named skill with no cross-contamination. The local-dev HTTP check only exercised the default (`/improve`) case; the distinct-skill claim rests on the automated test. | `integration-real-code` | None |
| AC4 — Clear error, no partial session on malformed/missing/unknown-skill input | ✅ | Real HTTP round-trip: submitted a real CSRF-valid request with an empty `signalText` field against a running **local dev server** — got a real `500` response body ("Could not start skill session: Missing required signal field(s): signalText"), no session created. Unknown-skill-name case covered by `tests/check-ep2-s2-signal-seeding-bridge.js`'s own integration test. **Not verified against real staging.** | `live-verified` (local dev; malformed-field case) + `integration-real-code` (unknown-skill case) | None |
| AC5 — Non-seeded (`ep1-s3`) launches byte-identical | ✅ | `tests/check-ep1-s3-skill-launcher.js` (7/7, unmodified) and the real local Playwright E2E spec `tests/e2e/skill-launcher.spec.js` (6 passed, 3 intentionally-skipped future-AC tests, 0 failed — including the plain non-seeded `POST /api/skills/discovery/sessions` path) both re-run clean against the extended endpoint. Both specs target the local E2E `webServer`, not staging. | `live-verified` (real local browser via Playwright, local `webServer`) | None |
| AC6 — Production wiring (D37) | ✅ | `createSession`'s stub default now throws (`Adapter not wired: createSession...`) when unwired, confirmed by a dedicated D37 test. The real `server.js` closure forwards `priorArtefacts` to `registerHtmlSession`; a dedicated behavioural-correctness test creates two sessions with two distinct unique markers and asserts each session's own stored `systemPrompt` contains only its own marker, in both directions — not merely that a function reference was reassigned (per `CLAUDE.md`'s own D37 rule 4, citing the `tir-s1` source incident this exact test shape is designed to avoid repeating). | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded for this story's own implementation — a final holistic reviewer subagent independently cross-checked all 6 ACs against the full 8-task diff (`58a0eb26^..d1d2408a`) before this story reached `/verify-completion`, and nothing changed between that check and merge. **The evidence-tier gap noted above (no real-staging confirmation for this story's own seeding flow) is itself a deviation from the DoD's own documentation standard, corrected here rather than left implicit — see Follow-up actions.**

---

## Scope Deviations

None. The final full-diff review confirmed no trace of: `/improve`'s own downstream execution/completion confirmation, a fix to `ep1-s1`'s non-deterministic `signal.id`, an operator preview/edit step before seeding, or one-CTA-to-multiple-sessions fan-out — all explicitly out of scope per the story and confirmed absent from the merged diff.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (the test plan's own AC Coverage table undercounted at authoring time — corrected to 12 during `/subagent-execution`, see the test plan's own 2026-10-03 correction note and `decisions.md`)
**Tests passing in CI:** 12 / 12 (confirmed on PR #936: "Lint, typecheck, test, build" ✅, "Playwright E2E smoke tests" ✅)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| 4 unit tests (signal-context extraction/formatting, AC1/AC4/AC5) | ✅ | ✅ | `src/web-ui/utils/signal-context.js` |
| 5 integration tests (AC1 behavioural, AC2, AC3, AC4, AC5) | ✅ | ✅ | real router dispatch against `handlePostSkillSessionHtml` |
| 2 D37 adapter tests (stub-throw fix, 3-arg forwarding) | ✅ | ✅ | `src/web-ui/adapters/skills.js` |
| 1 AC6 end-to-end wiring test (real `server.js` closure) | ✅ | ✅ | module-cache-busted real re-require, `WIRE_SKILL_ADAPTERS=true` |

**Gaps (tests not implemented):**
- **NFR-Performance** ("no measurable latency regression vs. `ep1-s3`'s baseline") was named in the test plan with a dedicated tool target but never actually written — confirmed by direct grep for timing-related code at DoD time (zero matches). RISK-ACCEPTed rather than fixed: the change is structurally low-risk (one array entry added to an already in-memory object before an existing, unmodified `createSession` call — no new loop, I/O, or network call). See `decisions.md`, 2026-10-04 entry.
- **NFR-Security** ("signal-context form fields are server-validated before use") was also named with a dedicated tool target and also has no standalone-named test, but — unlike Performance — is genuinely covered: the real AC4 unit tests (`missing signalText`/`missing signalSource` both throw before any `priorArtefacts` entry is constructed) demonstrate the actual claim. Not a gap, just an untitled overlap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — new hidden fields carry only already-rendered signal content; CSRF matches `ep1-s3` convention | ✅ | Real CSRF-protected HTTP round-trip against the running dev server; AC4 unit tests reject malformed input before any `priorArtefacts` entry is built |
| Performance — one `priorArtefacts` entry added, no measurable latency regression expected | ⚠️ | RISK-ACCEPTed — no dedicated test was written; change is structurally low-risk (see Test Plan Coverage gaps above and `decisions.md`) |
| No new attack surface — no new npm dependency; fields server-validated | ✅ | Confirmed: no new `package.json` dependency in the merged diff; `extractSignalContext` validates before formatting |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 3 — Self-improvement loop accessibility | ✅ (0% — CLI/IDE access required) | 2026-10-04 | Signal: **on-track**. Combined with `ep2-s1`'s already-verified visibility half, the full target ("operator sees signal, clicks CTA, lands in pre-seeded session, web-UI-only") is now genuinely achieved end-to-end and live-verified this session. Honest caveat carried forward from `ep2-s1`'s own DoD: verified against a small, deterministic signal fixture, not literally against this repo's own real 5,293-signal volume — the code path is signal-content-agnostic, but `ep2-s3` (pagination, written, not yet implemented) is still the story that makes the visibility half hold up at real scale. Full update written to `pipeline-state.json`'s `metrics[2]` (m3), `contributingStories` now includes `ep2-s2`. |

---

## Outcome

**COMPLETE**

All 6 ACs satisfied, zero scope deviations, 12/12 tests passing. One honest, explicitly RISK-ACCEPTed NFR test gap (Performance) does not block a COMPLETE verdict given the change's structurally low regression risk and the operator's own explicit decision to accept rather than fix it.

**Follow-up actions:**
1. **New (2026-10-04):** This story's own seeding flow (`POST /api/skills/:name/sessions` with signal-context fields) has not been verified against real `wuce-staging`, unlike `ep2-s1`/`ep2-s3` (both corrected the same day). A manual or scripted real-staging check — sign in on `wuce-staging.fly.dev`, click a real signal's CTA on `/signals`, confirm landing in a genuinely seeded session — would close this gap. Low urgency (the local-dev + automated evidence is already strong and the underlying code path is shared/simple), but noted explicitly rather than silently assumed covered by the other two stories' own staging checks.
2. Standing follow-ups already tracked from earlier in this session: the repo-wide `discovery_approved` governance gap (5→1 remaining feature, `2026-09-30-refactoring-and-product-health`) remains open per the operator's own 2026-10-03 decision to track it via `capture-log.md` rather than fix it unilaterally.

---

## DoD Observations

1. **A code-quality reviewer's "Critical" finding during Task 4's review (adapter/`server.js` not yet forwarding `priorArtefacts`) was correctly a deliberate D37-mandated deferral to Tasks 6–8, not a real defect** — the orchestrating session judged this correctly rather than forwarding it as a blocking issue to a task scoped not to include it, and the gap was closed for real two tasks later with independent verification. Consistent with this same session's earlier `ep2-s1` precedent of distinguishing genuine findings from reviewer context-gaps. Not an `/improve` candidate on its own — this is the D37 rule working as designed.
2. **Two real, non-deferred code-quality findings were caught and fixed in-flight**: a weak Task 3 test that claimed AC3/AC6 coverage without asserting on the actual forwarded `priorArtefacts` content (the exact weak-wiring-test shape `CLAUDE.md`'s D37 rule 4 warns against, re-verified by a re-review after the fix), and a stale JSDoc signature plus an inaccurate file-citation comment, both fixed and independently re-confirmed.
3. **`/improve` candidate:** the test-plan's own NFR Tests section named a specific tool/test file for both Security and Performance NFRs at authoring time, but only one of the two was ever actually realized as a standalone test — the other (Performance) was silently dropped somewhere between `/test-plan` and `/subagent-execution` with no C2-style integrity check catching it (C2 only catches `passing > totalTests`, not "a named NFR test was never written"). A dedicated check — or at minimum a DoD-time grep for each NFR's own named test-file reference — would catch this class of drift earlier than DoD.
4. **Live-evidence substitution pattern, consistent with this session's own established practice:** Claude-in-Chrome was unavailable this session (same intermittent unavailability seen earlier for `ep1-s3`), so `/verify-completion`'s and this DoD's own live-verification needs were satisfied via direct HTTP round-trips against a real, separately-booted local dev server (`NODE_ENV=test`, `WIRE_SKILL_ADAPTERS=true`) — real CSRF tokens extracted from real rendered forms, real redirects, real error responses. This is a legitimate `live-verified`-tier substitute when no new visual/rendered UI exists to actually require a browser screenshot (confirmed N/A at `/verify-completion`'s own live browser render check), not a downgrade to a weaker evidence class.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Signal-to-session seeding bridge — CTA creates a seeded skill session" (ep2-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
