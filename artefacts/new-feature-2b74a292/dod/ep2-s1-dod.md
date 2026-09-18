# Definition of Done: Load Feature with Pod Collaborators and Present Presence Sidebar

**PR:** [#900](https://github.com/heymishy/skills-repo/pull/900) | **Merged:** 2026-09-18
**Story:** artefacts/new-feature-2b74a292/stories/ep2-s1.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep2-s1-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep2-s1-dor.md
**Assessed by:** Claude Sonnet 5 (Copilot)
**Date:** 2026-09-18

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (Team sidebar renders every collaborator with role) | ✅ | `tests/e2e/ep2-s1-presence-sidebar.spec.js` (AC1 block): real product→pod→feature creation flow, navigates to the real `/features/:featureSlug` page, asserts `#team-sidebar` visible, 3 `.presence-item` elements present with correct role text | `integration-real-code` + Playwright evidence (real DOM assertions via `toBeVisible`/`toContainText`, not just presence) — satisfies the UI-evidence gate | Real roster used (creator "You" + Hamish + Susan, roleIds `conductor`/`conductor`/`engineer`) rather than the AC's literal fictional 3-name example (Hamish/Susan/Darren) — see `decisions.md` Task 6 entry. Business intent (3 named collaborators with roles) is preserved exactly. |
| AC2 (offline transition within 30s, no refresh) | ✅ | `tests/e2e/ep2-s1-presence-sidebar.spec.js` (AC2 block): seeds a collaborator online then stale via the new `/test/seed-presence` endpoint, asserts `presence-offline` class appears within 8s via SSE, zero `page.reload()` calls in the spec | `integration-real-code` + Playwright evidence (`toHaveClass`, visible state, not DOM-only) | None from the AC's stated behaviour. Mechanism differs from the AC's literal "heartbeat" framing — presence is a client-poll model (12s heartbeat POST + 5s SSE broadcast), not a persistent server-tracked session heartbeat — functionally equivalent, see `decisions.md`. |
| AC3 (live-updating last-seen timestamp, no refresh) | ✅ | `tests/e2e/ep2-s1-presence-sidebar.spec.js` (AC3 block): polls real wall-clock time across a minute boundary, asserts displayed text changes, zero reload calls | `integration-real-code` + Playwright evidence | None. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**UI-evidence gate:** all 3 ACs describe browser-observable behaviour (sidebar visibility, live status transitions, live timestamp text). Gate satisfied via Playwright evidence (option 2 of 3) for every AC — no AC relies on `unit`/`integration-real-code` evidence alone. A genuine live-browser check (Claude-in-Chrome or equivalent, against the now-successfully-deployed staging environment) was not additionally performed — see DoD Observations below for why, and as a named follow-up if stronger evidence is later wanted.

**Architecture Constraints deviation (story artefact, not an AC):** the story's own Architecture Constraints line names "new feature_presence table with heartbeat logic." No such Postgres table was created — presence is a new in-memory module (`presence-store.js`) extending the existing pattern `journey.js` already ships for viewer tracking (`_viewerActivity`, same 30s threshold), not a database table. Fully documented and reasoned in `decisions.md` (2026-09-18, first Task-corrections entry) before any code was written. This is the single largest deviation in this story and is deliberate, not an oversight — flagged here explicitly since it's a named Architecture Constraint, not merely an implementation detail.

---

## Scope Deviations

None. Checked against the story's Out of Scope list (presence-based locking, online-arrival notifications, Do-Not-Disturb/custom status) — none of these were implemented. Checked against the epic's own out-of-scope section (`artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md`) — no violation found.

---

## Test Plan Coverage

**Tests from plan implemented:** 10/12 (2 NFR-latency tests explicitly RISK-ACCEPTed, not automated — see NFR Status below)
**Tests passing in CI:** 10/10 implemented (7 Node assertions + 1 consolidated E2E test covering AC1/AC2/AC3/a11y in one spec, rather than the plan's literal 3 separate E2E test blocks — see `decisions.md` Task 6 entry for why the actual test structure differs from the plan's literal file/test-count layout while preserving full coverage intent)

| Test (plan name) | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `presence.sidebar.collaborators-render-all` | ✅ | ✅ | `presence-store.js` unit tests (Task 1) + E2E AC1 block |
| `presence.heartbeat.timeout-after-30s` | ✅ | ✅ | `presence-store.js` unit tests + E2E AC2 block |
| `presence.timestamp.last-seen-live-update` | ✅ | ✅ | E2E AC3 block |
| `presence.integration.feature-load-with-sidebar-full-path` | ✅ | ✅ | `testFullPathPresenceLoad` (Task 5) |
| `presence.integration.presence-isolation-by-tenant` | ✅ | ✅ | `testPresenceIsolationByJourney` (Task 5) — adapted to journey-level isolation; tenant isolation is enforced structurally upstream by `requireJourneyAccess`, not directly testable at the presence-store layer (no `tenant_id` column there by design) |
| `presence.e2e.sidebar-renders-on-page-load` | ✅ | ✅ | E2E AC1 block |
| `presence.e2e.offline-status-updates-via-sse` | ✅ | ✅ | E2E AC2 block |
| `presence.e2e.last-seen-timestamp-live-calculation` | ✅ | ✅ | E2E AC3 block |
| `presence.nfr.sidebar-load-latency` | ❌ | N/A | RISK-ACCEPT, not automated — see NFR Status |
| `presence.nfr.sse-presence-update-latency` | ❌ | N/A | RISK-ACCEPT, not automated — see NFR Status |
| `presence.nfr.collaborators-list-completeness` | ✅ | ✅ | Covered by `testFullPathPresenceLoad`'s count assertion, not a separately-named test |
| `presence.nfr.sidebar-keyboard-navigation` | ✅ | ✅ | E2E a11y block (sequential Tab-focus assertions) |

**Gaps (tests not implemented):** the 2 NFR-latency tests above. RISK-ACCEPTed, matching this feature's own established precedent (ep1-s1/ep1-s2/ep1-s3 all RISK-ACCEPTed their own NFR-Perf-1 for the identical reason — low structural risk, single-query/small-payload operations with no plausible path to the stated threshold at this scale).

**Full CI evidence (merge commit `2a331adf`):** all 8 PR checks passed on PR #900, including "Lint, typecheck, test, build" (which runs `node tests/check-ep2-s1-presence-sidebar.js` and the full `npm test` suite), "Playwright E2E smoke tests," "Scenario A/B E2E (staging)," "Run assurance gate," "Validate traceability chain," "Watermark gate," and "Cross-tenant isolation spec (20x repeat, zero-tolerance)." Post-merge, master's own Staging Deploy workflow (run `35290076379`) successfully deployed to `wuce-staging`, ran its `@mocked` staging smoke test, and re-ran its own Scenario A/B E2E specs against the freshly-deployed app — all passed. Only the expected manual "Promote to production" gate remains pending (by design, per this repo's standing deploy policy — not an ep2-s1-specific block).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Presence updates within 30s (SSE heartbeat) | ✅ | `presence-store.js` unit tests prove the 30s threshold logic directly (`STALE_MS = 30000`); E2E AC2 confirms the real end-to-end transition (seed → SSE broadcast within 5s → visible offline state) within an 8s window, well inside the 30s requirement |
| Sidebar is always visible, not hidden behind a menu | ✅ | Sidebar markup (`<aside id="team-sidebar">`) is unconditionally rendered inline in the feature page's body (no collapse/toggle affordance exists in the implementation); E2E confirms `toBeVisible()` with no prior interaction needed |
| (NFR-Perf-1, story-level, not in a formal profile) Sidebar/SSE latency ≤500ms | ⚠️ RISK-ACCEPT | Not automated. Same reasoning as this feature's other 3 stories' own NFR-Perf-1 RISK-ACCEPTs: single indexed-column query (`getFeatureCollaborators`) plus in-memory map lookups, no plausible path to 500ms at demonstrated scale (single-digit collaborator counts). No feature-level `nfr-profile.md` exists for this feature (confirmed absent — falls back to story-level NFR fields per this skill's own Step 5 instruction). |

---

## Metric Signal

**Measurement-ready gate:** yes — structurally, for the first time in this feature's delivery.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Synchronous team access (`benefit-metric.md`: "A team of 3 people with different roles can each log in independently, access the same feature in real time, and see that other team members are present.") | ❌ — no `metrics[]` array exists yet in `pipeline-state.json` for this feature (same structural gap already flagged in ep1-s1/ep1-s2/ep1-s3's own DoDs — not re-fixing here, outside this story's scope) | **Capability now exists and is proven, but no real production usage has exercised it yet.** This is a meaningfully different status than ep1-s1/s2/s3's own DoDs recorded (each said "no UI exists yet"): ep2-s1 is the first story to put collaborator/presence information in front of a real browser, and the E2E test is itself a structural proof of the exact target statement — 3 differently-roled people (conductor/conductor/engineer), real-time, seeing each other present. What remains is genuine operator/production usage, not a further capability gap. | Signal recorded as `not-yet-measured`, not `on-track` — the E2E proof is `integration-real-code`/Playwright evidence, not a `production-observed` real-user session. `pipeline-state.json` has no `metrics[]` array to write this signal into structurally (same gap noted above); recorded narratively here per this skill's own fallback guidance. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **[Real, repo-wide, currently-broken] `trace-commit.yml`'s "Skip if trace-only commit" step interpolates `${{ github.event.head_commit.message }}` directly into an unquoted bash script** (`msg="${{ ... }}"` at the YAML level, not a bash variable assignment — GitHub Actions splices the raw commit message text into the script source before bash ever parses it). Discovered because this story's own CI-fix commit message (containing ordinary prose contractions like "don't") broke the resulting script (`line 106: does: command not found`, exit 127), confirmed via `gh run view 35290076370 --log-failed` on master's own post-merge run. This is a pre-existing workflow bug, not something ep2-s1's own commits introduced structurally — any future commit message with an apostrophe, unescaped quote, or shell metacharacter will hit the same failure. Owner: platform/CI maintainer. Not fixed as part of this DoD — `.github/workflows/*.yml` changes are CI/CD pipeline infrastructure, arguably covered by the artefact-first rule's intent even though not explicitly named in the exemption list, and is unrelated to any of ep2-s1's own ACs.
2. **[Pre-existing, unrelated, already logged]** `tests/e2e/feature-navigation.spec.js`'s hardcoded `localhost:3000` assertion vs. the real E2E server's configured port `3999` — found and logged during `/verify-completion`'s mandatory route-coverage check (`decisions.md`, 2026-09-18). Not fixed here (out of scope, confirmed unrelated to ep2-s1's diff via `git diff`).
3. **[Cross-cutting infra noise, informational only]** Three unrelated scheduled/post-merge workflows also failed on master around this merge — "Deploy dashboards to GitHub Pages" (repo/org Pages-API permission gap: `Resource not accessible by integration`), "Improvement Agent — Scheduled Dreaming" (its own push to `master` rejected by the same branch-protection ruleset that requires a PR — the dreaming cycle's token has no bypass configured), and "Fleet Aggregation" (`could not read Username for 'https://github.com': terminal prompts disabled` — a credentials/auth gap in that scheduled workflow). All three confirmed via direct log inspection to be pre-existing infrastructure/permissions gaps with zero relation to ep2-s1's code content — noted here only because this DoD's own due-diligence check on master's post-merge CI state surfaced them, not because they're this story's concern.
4. Populate `pipeline-state.json`'s feature-level `metrics[]` array for `new-feature-2b74a292` so the "Synchronous team access" signal can be structurally recorded rather than narratively noted in each story's own DoD (same gap flagged in 3 prior DoDs now; worth fixing once rather than a 5th time in a future story's DoD).
5. Optional, not blocking: a genuine live-browser check (Claude-in-Chrome or equivalent) against the now-live staging deployment, to upgrade AC1-3's evidence tier from `integration-real-code`/Playwright to `live-verified` — the existing Playwright evidence already satisfies the mandatory UI-evidence gate, so this is a strengthening opportunity, not an open gap.

---

## DoD Observations

1. **A genuine pre-merge bug was caught only by Task 6's real E2E run, not by any unit/integration test**: `presence-sidebar.js` (Task 4) was never served by any HTTP route — this codebase has no generic `/public/*` static file server. Fixed within the story (`decisions.md`, Task 6 entry). Same structural class of gap as `ep1-s3`'s own Task 7 vacuous-E2E-test finding: a component correct in isolation, never exercised through its real wired path until a real E2E run. **/improve candidate**: this is the second time in this same feature that only a genuinely real (not mocked-at-the-handler-level) E2E run caught a defect no other test tier could — worth considering whether this pipeline's `/implementation-plan` or `/subagent-execution` guidance should more strongly bias toward writing the real E2E test earlier in a story's task sequence (rather than last), specifically for any story that adds a new client-side asset.
2. **A CI-governance script gap was found and fixed mid-story, after PR open**: `scripts/ci-typecheck.js` had no concept of browser-only client scripts under `src/web-ui/public/`, causing a genuine post-open CI failure on PR #900 (not caught by `/verify-completion`'s pre-merge local run, since none of the local test/lint/build commands run the exact same `require()`-every-file check `ci-typecheck.js`'s CI job runs — actually they do; the gap was never running `npm run typecheck` locally during this story's own inner loop, only `npm test`/`node tests/check-*.js`, so this defect existed from Task 4's commit onward and was invisible for the rest of the story's implementation). Fixed and logged (`decisions.md`, 2026-09-18). **/improve candidate**: `/branch-setup`'s clean-baseline check and `/verify-completion`'s Step 1 both currently run `npm test`, not `npm run typecheck`/`npm run lint`/`npm run build` individually — none of this feature's 4 stories' local verification steps would have caught this class of gap pre-push. Worth considering whether `/verify-completion`'s Step 1 should explicitly also run `npm run typecheck` (and `lint`/`build`) when the diff adds any new file, not just re-run `npm test`.
3. **A two-hop hallucination chain occurred and was self-corrected within this story**, documented in full in `decisions.md` (2026-09-18) and `workspace/capture-log.md`. No production-code impact (comment-only), but flagged here since it's a process-quality finding this feature's delivery record should carry forward, not just a code fix.
4. **A false citation was caught before it shipped**: while writing this story's own `ci-typecheck.js` fix's `decisions.md` entry, I initially cited a specific prior decisions.md entry ("the `das-s2` NFR-test-rename entry under `ep1-s3`") that, on verification, does not actually exist in this file under that name — that specific finding was only ever recorded in a PR description, never committed to `decisions.md`. Caught and corrected before the commit was made (`decisions.md`, 2026-09-18, "PR #900 CI failure" entry). Recorded here as a second data point in the same session's pattern of unverified-citation risk, alongside observation 3 above.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Load Feature with Pod Collaborators and Present Presence Sidebar" (ep2-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the trace-commit.yml finding (Follow-up action #1) urgent enough to warrant an immediate standalone fix rather than a logged follow-up?
Report findings as HIGH / MEDIUM / LOW.
```
