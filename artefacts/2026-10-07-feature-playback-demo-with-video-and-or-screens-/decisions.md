# Decisions: Feature Playback Demo Package

---

**2026-10-15 | SCOPE | /definition D2-platform gate (fpd-s2)**
**Decision:** Video output format corrected from MP4 (via an `ffmpeg` encoding step) to `.webm` directly — Playwright's own native `recordVideo` output, shipped as-is.
**Context:** `/definition`'s own mandatory D2-platform gate requires verifying any platform/tool dependency before writing an AC around it. `ffmpeg` was confirmed unavailable in this session's own delivery sandbox (`ffmpeg -version` → command not found), with no confirmation it exists in any other real delivery environment this skill would run in.
**Rationale:** The discovery's own Constraints section already permits this — "MP4 or equivalent" — and `.webm` is a standard, patent-unencumbered, universally browser-playable web video format, satisfying the same requirement MP4 was chosen for (native `<video>` element playback, no plugin). Dropping the encoding step removes a tool dependency entirely rather than carrying a deferred, unconfirmed one forward into the story.
**Made by:** Claude (session), per `/definition`'s own mandatory D2-platform gate — no operator judgment call needed, the platform-availability check is unambiguous.
**Revisit trigger:** If a future need arises for MP4 specifically (e.g. an external tool or integration that doesn't accept `.webm`), confirm `ffmpeg`'s real availability in the actual delivery environment first, then reinstate the encoding step as its own story.

---

**2026-10-15 | ARCHITECTURE | /definition (fpd-s3, ADR-028)**
**Decision:** Before building a new feature/epic/story/AC traversal for the viewer (`fpd-s3`), the story's own Architecture Constraints require checking whether `/trace`'s own chain-walking logic or `dashboards/pipeline-viz.html`'s own feature-card rendering already provides a reusable traversal — per ADR-028 ("a derived structure needs exactly one canonical builder"). This check is a story-level task, not resolved at `/definition` itself (which does not produce implementation detail) — named here so it is not missed at implementation time.
**Context:** Carried forward from the discovery's own amendment (2026-10-15, per operator CX direction) naming this exact check.
**Rationale:** Same rationale as every other ADR-028 application this session (`jae-s5`) — avoid a second independent derivation of "walk the feature/epic/story/AC structure" if one already exists.
**Made by:** Claude (session), consistent with the discovery's own already-logged direction.
**Revisit trigger:** None — this is a standing implementation-time check, resolved when `fpd-s3` is actually built.

---

**2026-10-15 | RISK-ACCEPT | W4 — solo-operator, no second reviewer (first log for this feature)**
**Decision:** W4 (verification script reviewed by a domain expert) is risk-accepted for every story in this feature, per `architecture-guardrails.md`'s own "Solo operator / W4 RISK-ACCEPT posture" — a uniform, repo-wide posture, not a per-story judgment. First W4 log for `2026-10-07-feature-playback-demo-with-video-and-or-screens-`.
**Context:** `fpd-s1` through `fpd-s4`'s own `/definition-of-ready` run surfaced W4 as applicable.
**Rationale:** Same uniform posture already applied to every other feature this session — the operator is also the reviewer and final approver.
**Made by:** Established repo-wide posture (`architecture-guardrails.md`), applied here per `/definition-of-ready`'s own W4 check.
**Revisit trigger:** A second operator onboarding, or regulated-enterprise adoption.

---

**2026-10-15 | SCOPE (collateral fix) | fpd-s1 /verify-completion**
**Decision:** `tests/check-md-2-skill-contracts.js`'s own T1.3 assertion was converted from a hardcoded exact match (`"41 skill(s)"`) to the same tolerant `>=` threshold its sibling assertion T1.2 already uses, for the same reason (`s3fw-s1`).
**Context:** `fpd-s1` Task 7 registers a new `feature-playback` entry in `check-skill-contracts.js`'s `CONTRACTS` array (required by this story's own AC5 entry-condition structural check), which legitimately bumps the real skill count from 41 to 42. `check-md-2-skill-contracts.js` T1.3 hardcoded the exact prior count, and failed on the full regression run as a direct, expected consequence of this story's own Task 7 — not a defect in Task 7's own implementation. T1.2 in the same file already carries a comment explaining it was converted away from this exact brittleness for the identical reason, after breaking 3 times in one prior session (`evcg-s1`, `psms-s1`).
**Rationale:** This is not new scope — it is a one-line fix to a pre-existing test's own brittleness, directly and unavoidably triggered by this story's own named Task 7, following the exact precedent already established in the same file for the same failure mode. Fixing it inline (rather than working around it) keeps the regression suite's "0 failures" evidence genuine rather than papering over a real, if trivial, defect in a sibling test.
**Made by:** Claude (session), during `fpd-s1` `/verify-completion` — surfaced by a fresh full-suite run (756 files), fixed, re-verified (756/756, 0 failures) before any completion claim.
**Revisit trigger:** None — this closes the gap; any future new skill registration is now tolerated by all three assertions in this file (T1.2, T1.3, T3.2).

---

**2026-10-16 | RISK-ACCEPT | fpd-s1 AC3 — real-capture execution cannot run in this sandbox**
**Decision:** AC3 (Acceptance Criterion 3: Playwright captures one screenshot per AC at that AC's own key, stable, repeatable UI state, embedded into the walkthrough document) is RISK-ACCEPTed for live execution. The capture script's own logic (selector/path/AC mapping) is fully unit-tested against a mocked Playwright `page` and passes. The genuine real-browser claim — that the captured frame shows a stable state, not a loading spinner or mid-interaction frame — is covered by a real E2E spec (`tests/e2e/fpd-s1-walkthrough-capture.spec.js`), confirmed syntactically valid only (`node --check`), not executed.
**Context:** This session's sandbox has no reachable Postgres, so the local `webServer` (and therefore any real page render) cannot start — the same pre-existing gap already logged as `decisions.md` D5 and hit identically by `jcx-s6`, `jae-s5`, and `cnsf-s1` this cycle. This RISK-ACCEPT was named in `fpd-s1-test-plan.md` and `fpd-s1-dor.md` prose before coding started, but was not logged as its own dedicated `decisions.md` entry until this `/definition-of-done` pass surfaced the gap via the UI-evidence gate check — a minor process-timing deviation (the RISK-ACCEPT should have been logged here at DoR time, not retroactively at DoD), not a coding defect.
**Rationale:** Closing this formally (decisions.md entry + the verification script's own Scenario 3 + a post-deployment smoke-test `pendingActions` item) satisfies CLAUDE.md's B2 three-part requirement for a browser-dependent AC that has neither a real check nor automated visual-regression coverage, consistent with how every other story this cycle hitting the same D5 gap was handled.
**Made by:** Claude (session), during `fpd-s1` `/definition-of-done`'s own UI-evidence gate check.
**Revisit trigger:** Once a reachable Postgres/staging environment is available in-session, run the post-deployment smoke test named in `workspace/state.json` `pendingActions` and record the result here.
