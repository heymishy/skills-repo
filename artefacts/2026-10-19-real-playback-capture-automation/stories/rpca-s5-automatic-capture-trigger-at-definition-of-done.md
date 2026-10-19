## Story: Playback capture triggers automatically when a feature reaches Definition of Done, not via a manually-issued CLI per feature

**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Discovery reference:** artefacts/2026-10-19-real-playback-capture-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-19-real-playback-capture-automation/benefit-metric.md
**Domain:** [none identified — skill-process wiring (`skills/definition-of-done/SKILL.md`, `skills/feature-playback/SKILL.md`) plus one gate-logic fix in `scripts/playback-capture.js`, not new application code]

## User Story

As a **platform operator**,
I want **a feature's own playback package to be generated automatically the moment every story in it reaches DoD, rather than me having to remember to separately run `/feature-playback` (or the underlying CLI) for every feature**,
So that **M1's own real-capture coverage climbs as a side effect of normal delivery, not as a manual chore someone has to remember to do, and never does, at scale**.

## Benefit Linkage

**Metric moved:** M1 — Real capture coverage on new DoD-complete features; M2 — Manual capture time per feature
**How:** `rpca-s1`-`rpca-s4` built and documented a real capture mechanism, but every prior story in this epic still assumed a human (or agent) explicitly invokes it per feature. At ~270 features, a manual-invocation-per-feature step is exactly the pattern that let the *original* mocked-Playwright gap (the reason this whole epic exists) go unnoticed across 5 `fpd-*` stories. Removing the manual trigger is what actually makes M1's target (≥50% coverage within 30 days) achievable without relying on operator memory.

## Architecture Constraints

- **Platform change policy (CLAUDE.md)** — `skills/definition-of-done/SKILL.md`, `skills/feature-playback/SKILL.md`, and `scripts/playback-capture.js` are all governed; this change must merge via PR, not a direct push to master.
- **Step 4 of `/feature-playback` (editorial review) is a mandatory human gate and must not be bypassed** — per that skill's own existing design ("Automated capture never sets this status itself"). This story automates the *trigger* for Steps 1-3 (walkthrough generation + screenshot capture) only; the package stays `"pending-review"` until a human confirms, exactly as today.
- **DoD sign-off must not block on an external dependency** — `/definition-of-done`'s own completion verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) is about the story's own ACs, tests, and NFRs. A capture failure (staging unreachable, secret not configured in this session) is a downstream concern, not a reason to withhold DoD sign-off — same principle CLAUDE.md already applies to RISK-ACCEPTed external-dependency gaps elsewhere in this epic (`rpca-s1`'s own AC1/AC2).
- **Fixes a found latent gate bug, does not route around it:** `checkDodGate` in `scripts/playback-capture.js` currently checks `feature.dodStatus !== 'complete'` — a top-level field that `/definition-of-done`'s own documented mandatory state-update step never writes (it writes story-level `dodStatus` and epic `status` only). Confirmed empirically: only 7 of 330 features in `.github/pipeline-state.json` have a top-level `dodStatus` field at all, and `feature-playback-demo` itself has none — so `/feature-playback`'s own entry gate is unreachable for the feature it was built for unless invoked right after one of the 7 features' own unrelated, undocumented convention. This story corrects `checkDodGate` to evaluate "every story across every epic in this feature has `dodStatus: complete`" directly — the same check `/definition-of-done`'s own "Feature-completion trace check" already performs correctly — rather than a field nothing sets.
- **ADR-002 (Governance gates must use evidence fields, not stage-proxy)** — the corrected `checkDodGate` reads each story's own `dodStatus` evidence field directly, consistent with ADR-002's own named example fields (`reviewStatus`, `dorStatus`, `dodStatus`); it does not introduce a new stage-proxy check or a new top-level field that would itself need a skill to maintain.

## Dependencies

- **Upstream:** `rpca-s1` — needs the real, working CLI to trigger. Sequenced after `rpca-s4` (not a hard technical blocker, but both touch `skills/feature-playback/SKILL.md`; doing `rpca-s4`'s documentation-accuracy fix first avoids a conflicting edit).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `checkDodGate(state, featureSlug)` is called, When every story across every epic in that feature has `dodStatus: "complete"`, Then it returns `{ ok: true, feature }` — regardless of whether a top-level `feature.dodStatus` field exists or what value it holds.

**AC2:** Given `checkDodGate(state, featureSlug)` is called, When at least one story in that feature does not have `dodStatus: "complete"`, Then it throws an error naming the specific incomplete story (not just "feature dodStatus is not complete") — a clearer failure message than today's.

**AC3:** Given a story's own `/definition-of-done` run reaches its "Feature-completion trace check" and determines every story in the feature is now `dodStatus: "complete"`, When that check passes, Then `/definition-of-done` automatically runs `/feature-playback`'s own Steps 1-3 (generate walkthrough, capture screenshots) for that feature — without the operator separately invoking "make a playback package" — and Step 4's own editorial-review gate is left exactly as-is (package status starts `"pending-review"`, unchanged).

**AC4:** Given the automatic capture run in AC3 fails for any reason (staging unreachable, `E2E_STAGING_AUTH_STUB_SECRET` not set in this session, network error, or any other exception), When the failure occurs, Then `/definition-of-done` still reports its own correct completion verdict for the story (COMPLETE / COMPLETE WITH DEVIATIONS, based on that story's own ACs/tests/NFRs, unaffected by the capture failure), and records a named follow-up action identifying the feature and the capture failure reason in `pendingActions` — it does not downgrade the DoD verdict and does not silently swallow the failure.

**AC5:** Given an operator or agent still wants to manually invoke `/feature-playback` directly (e.g. to re-run after a UI change, or for a feature predating this story), When they say "make a playback package" as today, Then it continues to work unchanged — this story adds an automatic trigger, it does not remove or gate the existing manual entry point.

## Out of Scope

- **Automating staging wake-up or secret provisioning itself** (e.g. auto-pinging a suspended Fly machine, or storing the secret in a CI secret store so no session-level configuration is ever needed) — this story wires the *trigger*, not the underlying infrastructure/secrets-availability problem. If the secret isn't configured in the session running `/definition-of-done`, AC4's own non-blocking failure path is what happens; a fully hands-off secret/infra story, if wanted, is a separate future story.
- **Bypassing or auto-confirming Step 4's editorial review** — stays a mandatory human gate, unchanged.
- **Retroactively running this for every already-DoD-complete feature** — epic-level Out of Scope (no retroactive capture pass), consistent with every prior `rpca-*` story.
- **Changing `/feature-playback`'s own per-story AC-screenshot mechanism** (`captureAcScreenshots`, still the existing DoD-evidence-driven approach) — out of this story; it only changes *when* that mechanism fires, not *what* it does.

## NFRs

- **Performance:** The automatic trigger only fires once per feature (at the point every story in it reaches DoD), not once per story — adds at most one capture run's own wall-clock time to the *last* story's DoD completion in a feature, not to every story.
- **Security:** No new NFR beyond what `rpca-s1` already established — the automatic trigger reuses the same CLI, same secret-handling convention, same auth mechanism. No new input surface.
- **Accessibility:** Not applicable — skill-process wiring, no new UI surface.
- **Audit:** The follow-up action recorded in AC4 is itself an audit improvement — a capture failure is now a tracked, named item rather than something nobody notices because nobody was expected to check.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
