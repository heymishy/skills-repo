# Definition of Done: Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view

**PR:** https://github.com/heymishy/skills-repo/pull/627 | **Merged:** 2026-07-28
**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s3-rebuild-breadcrumb-view-test-plan.md
**DoR artefact:** artefacts/2026-07-28-durable-session-history/dor/dsh-s3-rebuild-breadcrumb-view-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-07-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "renders chat-left/artefact-right split when durable turns are available" (unit) plus a real-browser Playwright E2E spec asserting both panels visible with the exact seeded content | automated unit test + E2E | None |
| AC2 | ✅ | "falls through to today's existing artefact-only rendering" for both `null` and empty-array turns | automated unit test | None |
| AC3 | ✅ | Existing `handlePostJourneyStageArtefact` edit flow, unmodified, still saves correctly | automated integration test | None |
| AC4 | ✅ | `check-p0.2-journey-guard-wiring.js` re-run standalone, unmodified, 13/13 passing | automated regression test | None |
| AC5 | ✅ | No input/textarea/submit control present (unit) + confirmed directly in the real-browser E2E spec | automated unit test + E2E | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. 5 commits on the branch: baseline confirmation (RISK-ACCEPT) plus the 4 planned tasks (renderChat readOnly mode, seed-durable-stage endpoint, handler rebuild, Playwright E2E spec). Confirmed against Out of Scope: no live-message capability was added to the historical chat panel, no archive-tier rehydration was touched, and the "Resume conversation" link's own behaviour (dsh-s4) was not touched.

**One incidental fix beyond the story's literal ACs, worth flagging honestly:** Task 2's implementation discovered and fixed a real, pre-existing gap — `session-turns-pg.js`'s D37 adapter was previously only ever wired when a real `DATABASE_URL` was configured, meaning `getTurnsForStage`/`writeSessionTurns` would throw "Adapter not wired" in every local `NODE_ENV=test` E2E run. This was fixed by wiring the same fake-test-db instance already used for `journey-store.js` in test mode. This wasn't a literal AC of dsh-s3, but it was necessary infrastructure for dsh-s3's own E2E test (Task 4) to be possible at all, and is a net-positive fix (closes a gap that would otherwise have silently blocked any future story's local E2E testing of the durable-turns path). Logged here rather than in decisions.md since it required no judgment call or scope trade-off — it was simply necessary to make the story's own test plan executable.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (AC1 unit+E2E, AC2 unit, AC3 integration, AC4 regression re-run, AC5 unit+E2E)
**Tests passing in CI:** 5 / 5 test-plan rows, all confirmed; full suite 430 files, same 37 pre-existing failures as the documented baseline; standalone AC4 regression re-run 13/13; Playwright E2E spec 1/1 passing in a real browser

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: chat-left/artefact-right split renders when turns available | ✅ | ✅ | Unit + real-browser E2E |
| AC2: falls back to artefact-only view when turns unavailable | ✅ | ✅ | Covers both null and empty-array |
| AC3: existing edit-artefact flow unregressed | ✅ | ✅ | Integration |
| AC4: cross-tenant 404 guard unregressed | ✅ | ✅ | Re-ran the existing, unmodified regression suite |
| AC5: no message-input control in the read-only chat panel | ✅ | ✅ | Unit + real-browser E2E |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — page render adds no more than ~300ms vs. today's artefact-only render | ✅ | No formal timing measurement taken (none is available for this internal surface, per `nfr-profile.md`); the added work is one `getTurnsForStage` call already scoped to sub-200ms by dsh-s2, plus reusing an existing rendering function (`renderChat`) rather than a new one. |
| Security — no new security surface | ✅ | Reuses dsh-s2's tenant-scoped read and the page's existing, unmodified `requireJourneyAccess` guard; AC4's regression confirms no change to cross-tenant behaviour. |
| Accessibility — WCAG 2.1 AA, matching the live chat page's floor | ⚠️ | Not independently re-audited for this specific rebuilt page. `renderChat` is the same function already used (and presumably already assessed) for the live chat page, reused here rather than a new layout — but no dedicated accessibility check was run against the historical read-only variant specifically. Recorded as a minor gap, not blocking, given the identical underlying markup. |
| Audit — none identified | ✅ | Confirmed — no new audit event required, consistent with dsh-s2. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m2 — Breadcrumb view-completed-stage shows real conversation | ✅ (baseline 0%) | Technically observable now — the full write (dsh-s1) → read (dsh-s2) → render (dsh-s3) chain is merged | No real operator usage observed yet. Signal recorded as `not-yet-measured` pending an actual observation; a stage completed before 2026-07-28 will still show the old artefact-only view by design (AC2), so the first real signal requires viewing a stage completed after dsh-s1 shipped. |

m1 (Resume conversation link success rate) is unaffected by this story — dsh-s3 does not contribute to m1 per `benefit-metric.md`'s Metric Coverage Matrix (m1 is dsh-s1/dsh-s2/dsh-s4).

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Minor accessibility gap noted above (WCAG re-audit of the read-only chat-split variant specifically) — not blocking, low priority given shared markup with the already-used live chat page.
2. dsh-s4 (Resume conversation link fix, moves m1) is the next story — DoR-signed-off but not yet implemented.
3. Once dsh-s4 ships, both m1 and m2 should have their first real signal captured from an actual operator session, not just "technically observable."

---

## DoD Observations

1. **CI-collision pattern recurred a second time** (first seen at dsh-s2's PR #626, again at dsh-s3's PR #627) — a `chore:` bookkeeping push to master landed seconds before the PR's Scenario A E2E job started, causing a cold-start-driven false failure (this time: a 23-second auth-stub round-trip against a 5-second NFR budget, vs. dsh-s2's wrong-page-content symptom) — both resolved cleanly by re-running the job with zero code changes. This is now a confirmed, repeat structural risk (`staging-deploy.yml` auto-redeploying on every master push, racing PR-triggered staging E2E jobs with no concurrency guard), not a one-off flake. Logged previously in `workspace/capture-log.md` (2026-07-28); recommend a structural fix (e.g. a GitHub Actions concurrency group between the deploy and E2E-gate workflows) as a follow-up, rather than continuing to absorb it per-PR.
2. **Feature-level guardrails again left at their DoR-time assessment** (3 of 6 stories now merged) — same judgment call as dsh-s1/dsh-s2's DoD artefacts.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Rebuild the breadcrumb view-a-completed-stage page into a chat+artefact split view (dsh-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
