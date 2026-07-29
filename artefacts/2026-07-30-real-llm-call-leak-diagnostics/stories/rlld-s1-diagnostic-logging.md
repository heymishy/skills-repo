## Story: Add temporary diagnostic logging to identify the real-LLM-call leak source

**Epic reference:** None — short-track (bug investigation, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **the next staging-deploy smoke-test run to actually reveal which code path is making unexpected real LLM API calls during @mocked E2E runs**,
So that **the still-unsolved leak documented in rlcc-s1 (2026-07-25) can finally be root-caused and fixed, unblocking `promote-to-prod`**.

## Background / Investigation

`ssr-s1`'s merge (fixing the rate-limit and redirect-mismatch issues blocking `bri-s3.2`) let smoke-test specs progress far enough to hit a deeper, already-known issue: `artefacts/2026-07-25-realllm-counter-isolation/stories/rlcc-s1-smoke-test-worker-isolation.md` documents this exact symptom ("3 extra real-looking calls" in `bri-s3.4`) and explicitly defers finding the actual source in its Out of Scope section, having fixed only the worker-concurrency race (`--workers=1`, already confirmed active).

Extensive static-code investigation (this session) ruled out: the admin runtime override (`_runtimeOverride`, confirmed untouched by any E2E test), `NODE_ENV`/`MOCK_LLM_GATEWAY` env-var mutation (no code path mutates either at runtime), and `meta.stage` propagation in the one newly-exercised code path (`_startReviewSessionForJourney`, which appears correctly wired). None of the leak's exact source could be conclusively identified from static reading alone, and live reproduction against staging was not possible without direct auth-stub secret access. The leak's magnitude scales roughly with story count per journey (bri-s3.2: 1 story, +1; bri-s3.3/bri-s3.4: apparently 2 stories, +2), suggesting a per-story leak somewhere in the review/test-plan/definition-of-ready sequence — but this is a hypothesis, not a confirmed finding.

## Architecture Constraints

- **Diagnostic only — this story does not fix the leak.** It adds a `console.warn` inside the existing `https.request` monkey-patch (`server.js` ~line 1484) that logs hostname, path, method, running call count, and a stack trace whenever a real-provider hostname match increments the counter. This is temporary instrumentation, to be removed once the real source is found and fixed in a follow-up story.
- No secrets are logged — `options.path`/`options.method` for an LLM API call are non-sensitive (e.g. `/v1/messages`, `POST`); the stack trace shows only this app's own function names/file paths, never headers or body content.
- No behavioural change to the underlying request — the wrapper still always forwards to the original `https.request` unmodified, exactly as before.

## Dependencies

- **Upstream:** ssr-s1 (merged) — this leak was only reachable once ssr-s1's fixes let `bri-s3.2` progress far enough to hit it.
- **Downstream:** A follow-up story to actually fix the identified leak source, and to remove this diagnostic logging once that fix ships.

## Acceptance Criteria

**AC1:** Given the `https.request` monkey-patch in `server.js`, When a real call to `api.anthropic.com` or a `githubcopilot.com`-hosted endpoint is made, Then a `console.warn` line is emitted containing the hostname, request path, method, running call count, and a stack trace.

**AC2:** Given this logging is added, When the existing behaviour of the wrapper is inspected, Then the call is still always forwarded to the original `https.request` unmodified — no behavioural change to any real or mocked request.

**AC3:** Given the next `staging-deploy` workflow run after this merges, When the smoke-test job fails on a real-LLM-call-count assertion again, Then `flyctl logs --app wuce-staging` (captured promptly, before the machine auto-suspends and the log buffer rotates) contains at least one `unexpected_real_llm_call` log entry identifying the actual calling code path via its stack trace.

## Out of Scope

- Actually fixing the leak once identified — that is a follow-up story, scoped once the diagnostic evidence is in hand.
- Removing this diagnostic logging — deferred to the same follow-up story, once no longer needed.
- Re-attempting the worker-concurrency fix — already correctly in place per rlcc-s1, confirmed unaffected.

## NFRs

- **Performance:** Negligible — one `JSON.stringify` and one `console.warn` call, only on the rare path where a real-provider hostname is matched (this should be zero times in normal mocked operation).
- **Security:** No secrets logged (see Architecture Constraints).
- **Accessibility:** Not applicable.
- **Audit:** This log line IS the audit mechanism for this story's purpose.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
