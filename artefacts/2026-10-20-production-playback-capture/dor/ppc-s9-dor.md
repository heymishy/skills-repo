# Definition of Ready: Move capture execution to a GitHub Actions worker, retiring the in-process Chromium launch

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s9-github-actions-capture-worker.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s9-test-plan.md
**Track:** Standard-track architecture correction (full DoR treatment given architectural significance), scoped within the existing `ppc-self-service-capture` epic.
**Assessed by:** Claude (session)
**Date:** 2026-10-26

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Tenant Product Owner |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 8 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1-AC8 all covered, `ppc-s9-test-plan.md` |
| H4 | Out-of-scope populated | ✅ | 4 named exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m1, m3 |
| H6 | Complexity rated | ✅ | 3 — genuine architecture change, new credential-exchange surface |
| H7 | No unresolved HIGH findings | ✅ (N/A) | No separate `/review` run — this story's own architecture rationale is fully recorded in `decisions.md` (mandatory per `CLAUDE.md` for architectural choices) in lieu of a standalone review pass, consistent with how `ppc-s8`'s own RCA-driven fixes were handled |
| H8 | No uncovered ACs in test plan | ✅ | No gap-table entries against the 8 ACs (AC3/AC8's manual-verification classification is explicit, not a silent gap) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Full credential-boundary threat model documented in the story and `decisions.md`; explicitly reduces (does not expand) the existing `accessToken` exposure surface |
| H-E2E | Layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC — this story is backend/infra, not rendering (the in-progress/failure state text reuses existing rendering conventions, no new layout claim) |
| H-NFR | NFR profile exists | ✅ | This story's own NFRs (Performance, Security, Reliability, Cost, Design-system) recorded directly in the story, consistent with `ppc-s8`'s own convention |
| H-NFR3 | Data classification not blank | ✅ (inherited) | Same "Confidential" classification already recorded for this feature |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank, non-engineering-only entry | ✅ (inherited) | Same feature-level discovery approval already on file |
| H-ADAPTER | New injectable adapter requires a wiring AC | ✅ | This story introduces at least 2 new D37 adapters (a GitHub-dispatch adapter mirroring `artefact-commit-writer.js`'s own convention; a nonce-store adapter over Redis mirroring `check-p3.2-redis-session-adapter.js`'s own injectable-stub convention) — each needs: (a) stub defaults that throw, not silently no-op, (b) a dedicated production-wiring AC, (c) wiring named as its own implementation-plan task distinct from the handler work, (d) a wiring test asserting real behavioural correctness, not just that a function reference was assigned. These four D37 requirements must be satisfied explicitly in the implementation plan, not assumed from this DoR alone — **flagged here as a required elaboration at `/implementation-plan` time**, since the story's own ACs describe behaviour, not adapter wiring mechanics. |
| H-INF | Infra-plan gate | ✅ | This story IS an infra change (new GitHub Actions workflow, new internal endpoint, Dockerfile reversion) — `hasInfraTrack: true` set on this story's `pipeline-state.json` entry, same as `ppc-s8`'s own precedent |
| H-MIG | Migration-review gate | ✅ (N/A) | No schema/data migration (the `capture-in-progress`/failure-state fields are new journey fields, additive, not a migration of existing data) |
| H-DESIGN | Design-token compliance | ✅ (N/A) | No new UI/rendering — `hasDesignSystemTrack` not applicable |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | |
| W2 | Scope stability declared | ✅ | Stable (design itself fully specified); exact GitHub API response shapes for artifact listing/correlation carry real empirical risk, named explicitly in the story's own Complexity rating rather than hidden | |
| W3 | MEDIUM review findings acknowledged | ✅ (N/A) | No separate `/review` run for this story (see H7) | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No named second reviewer exists in this solo-operator repo — same standing acceptance as every prior `ppc` story (`decisions.md`, 2026-10-21/22 and onward) | RISK-ACCEPT — operator awareness stands in, same standing convention |
| W5 | GitHub Actions dispatch-to-completion latency (30s-2min) is a real UX regression vs. the old (when-working) ~15-60s synchronous path | ⚠️ | Acceptable at current pre-launch volume (no live tenants yet); may need revisiting once real tenant usage exists | RISK-ACCEPT — Hamish King (Platform Owner), accepted as an explicit, deliberate tradeoff for reliability/cost (see `decisions.md`'s own Revisit trigger naming the on-demand-Fly-Machine alternative if this proves unacceptable later) |

**Outstanding decisions logged:** Both W4 and W5's RISK-ACCEPTs are recorded in `decisions.md`'s own 2026-10-26 ARCHITECTURE entry (W5) and the standing `ppc` convention (W4) — not deferred.

---

## Oversight level

**Medium** (inherited from parent epic `ppc-self-service-capture`) — a genuine architecture change to already-shipped infrastructure, touching the production Dockerfile, a new internal endpoint, and a new external dependency (GitHub Actions as a compute backend) — Medium is appropriate, not Low, given the credential-handling surface specifically. No named tech lead configured in this solo-operator repo — operator awareness stands in.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Move capture execution to a GitHub Actions worker, retiring the in-process Chromium launch -- artefacts/2026-10-20-production-playback-capture/stories/ppc-s9-github-actions-capture-worker.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s9-test-plan.md

Goal:
Make all 8 ACs true, verified by the test plan's unit/integration suite plus the
2 manual/live verification scenarios. Do not add scope beyond the ACs -- no
real-time progress UI, no alternative compute backend beyond GitHub Actions.

Touch-points (new):
- .github/workflows/ (new workflow_dispatch workflow, modelled on
  scripts/playback-capture.js's own CLI orchestration shape -- do not duplicate
  its logic, invoke/wrap it)
- A new nonce-exchange internal endpoint (new route file or added to
  playback-evidence.js -- engineer's own judgement at implementation-plan time),
  modelled on src/web-ui/routes/auth-stub.js's shared-secret-header pattern
  (crypto.timingSafeEqual, double-gated by an env var never committed)
- A new Redis-backed nonce-store adapter, modelled on session-redis.js's own
  TTL'd-key pattern (client.set(key, value, { ex: TTL })) and
  check-p3.2-redis-session-adapter.js's own injectable-stub test convention
- A new GitHub-dispatch adapter (D37, mirroring artefact-commit-writer.js's
  own setArtefactCommitAdapter/stub-throws convention)
- src/web-ui/routes/playback-evidence.js: handlePostCaptureTrigger,
  handlePostCaptureAll (replace synchronous capture calls with dispatch +
  in-progress marking), handleGetPlaybackEvidence (add artifact-check +
  finalise-via-existing-commitArtefact logic)

Touch-points (removal -- part of this story's own scope, not a follow-up):
- src/web-ui/adapters/session-page-adapter.js (entire file)
- tests/check-ppc-s1-session-page-adapter.js (entire file)
- Dockerfile: revert the ppc-s8 Alpine chromium/ca-certificates/ttf-freefont
  apk install, the playwright-core production install step, and the
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var (git revert the 3 ppc-s8 PRs'
  own Dockerfile hunks, or hand-edit to the equivalent pre-ppc-s8 state --
  confirm via `git log -- Dockerfile` which exact commits to target)
- playback-evidence.js: _captureOneAc, _captureVideoForAcIds's own CURRENT
  bodies (the capture logic they orchestrated moves into the new workflow's
  own script, reusing src/utils/capture-video.js / capture-screenshots.js
  UNCHANGED -- do not rewrite those utils, only change their caller)

Existing tests requiring migration (not deletion) -- rewrite their
setSessionPageAdapter mocks against the new dispatch/artifact-check adapters,
preserving every existing assertion:
- tests/check-ppc-s1-playback-evidence-route.js
- tests/check-ppc-s1-ui-layer.js
- tests/check-ppc-s2-capture-all-route.js
- tests/check-ppc-s3-capture-rate-limit.js
- tests/check-ppc-s5-video-capture.js

Constraints:
- D37 (CLAUDE.md, mandatory) applies to BOTH new adapters (GitHub-dispatch,
  nonce-store): stub defaults MUST throw, not silently no-op; a dedicated
  wiring AC/task separate from handler work; a wiring test asserting real
  behavioural correctness (e.g. "two different nonces resolve to two
  different, individually-correct session_id values," not "a lookup function
  got wired")
- The nonce-exchange endpoint must NEVER log the real session_id value, even
  on failure paths (mirrors the existing path-traversal guard rule's own
  "do not log the raw resolved path on failure" convention already used
  elsewhere in this file)
- req.session.accessToken must never be referenced by the new workflow script
  at any point -- verify this with the AC3 unit test (captureWorkerScript_
  neverReferencesAccessToken) before considering the workflow script complete
- Reuse src/utils/capture-video.js / capture-screenshots.js UNCHANGED from
  the new workflow script -- do not fork or duplicate their logic
- Architecture standards: read .github/architecture-guardrails.md before
  implementing -- ADR-018 (Playwright/E2E, unit test chain must never invoke
  it) and ADR-025 (tenant scoping) both still apply, now via the new adapters'
  own injectable boundaries rather than the retired session-page-adapter.js
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests (especially
  GitHub's own workflow_dispatch/artifact API response shapes): add a PR
  comment describing it and do not mark ready for review

## Applicable standards

### web-ui (.github/standards/web-ui/web-ui-patterns.md)
[Full text attached per Standards injection -- key points most relevant here:
Injectable adapter pattern (D37) -- directly triggered twice by this story,
see Constraints above; Shared shell module rule -- not touched; HTML render
function unit test pattern -- the in-progress/failure state's own render
fragment needs the same minimum coverage (happy path, XSS, empty/null) as any
other render fragment in this file.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Operator awareness stands in for tech-lead sign-off (no named tech lead configured, solo-operator repo).
**Signed off by:** Hamish King (Platform Owner), via direct chat instruction ("write it up properly and do a thorough design so we can ensure nothing's missed and we've removed any unused code or functions"), 2026-10-26.

**Definition of ready: PROCEED**
