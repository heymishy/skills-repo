# Definition of Done: Lock the golden-trace demo to one candidate and delete the other

**PR:** https://github.com/heymishy/skills-repo/pull/694 | **Merged:** 2026-08-09
**Story:** artefacts/2026-08-09-golden-trace-candidate-lockin/stories/gtcl-s1-delete-losing-candidate.md
**Test plan:** artefacts/2026-08-09-golden-trace-candidate-lockin/test-plans/gtcl-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-golden-trace-candidate-lockin/dor/gtcl-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (selection decision logged in decisions.md) | ✅ | `artefacts/2026-08-08-landing-page-hero-features/decisions.md` D4 — `kanban` confirmed as winner, D2's revisit trigger closed | manual write, direct file read | None — DoR's recommendation (`kanban`) accepted with the reasoning it proposed |
| AC2 (losing candidate's content fully deleted) | ✅ | `goldenTraceContent_losingCandidateContentFullyRemoved` — searches source for `diagram`-distinguishing strings, none found | automated test | None |
| AC3 (ACTIVE_CANDIDATE/CANDIDATES mechanism removed) | ✅ | `goldenTraceContent_noActiveCandidateSelectorRemains` | automated test | None |
| AC4 (existing lphf-s1 suite passes, updated) | ✅ | `tests/check-lphf-s1-golden-trace-demo.js` — 8/8 passing; old "flip between two candidates" test replaced with a single-candidate regression guard | automated test re-run | None |
| AC5 (rendered output byte-identical, incl. live deploy) | ✅ | Local: `renderGoldenTraceHtml_outputByteIdenticalToPreChange` against a pre-change golden fixture, passing. Live: confirmed 2026-08-09 via `curl https://wuce-staging.fly.dev/` — the golden-trace section renders the `kanban` content only (prompt/discovery/DoR/shipped frames all match), no `diagram`/System Architecture/Mermaid content anywhere in the response | automated test (local) + manual live check (post-deploy) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — this story delivered exactly as scoped.

---

## Scope Deviations

None. `landing.html`'s 4-frame structure and CSS were untouched, as required; no other hero card was affected.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 planned automated, plus 1 manual write (AC1)
**Tests passing in CI:** 4 / 4 new, 8 / 8 total in the updated `check-lphf-s1-golden-trace-demo.js`

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| goldenTraceContent_losingCandidateContentFullyRemoved | ✅ | ✅ | |
| goldenTraceContent_noActiveCandidateSelectorRemains | ✅ | ✅ | |
| renderGoldenTraceHtml_outputByteIdenticalToPreChange | ✅ | ✅ | Golden fixture captured from real pre-change output |
| existingLphfS1Suite_passesWithUpdatedAC2 | ✅ | ✅ | Full file re-run, 8/8 |
| Real deployed page shows byte-identical content (manual) | ✅ **executed 2026-08-09** | `curl https://wuce-staging.fly.dev/` | Confirmed — see AC5 evidence above |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ (negligible, as stated) | Removing a lookup/branch, no measurable impact |
| Security | N/A | No new input handling |
| Accessibility | N/A | No markup/structure change — enforced by AC5's byte-identical requirement |
| Audit | ✅ (improves) | Closes D2's open revisit trigger, which had sat unresolved since `lphf-s1` merged |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **This closes a gap that survived one full review/DoR/merge cycle undetected.** `lphf-s1`'s own AC3 required this deletion before merge; it shipped anyway, and only surfaced during `/definition-of-done` for that story, over 24 hours later. The gap wasn't a missing test — it was a commitment made in `decisions.md` that nothing mechanically checked against the shipped code. No process change proposed here beyond what `/definition-of-done`'s existing "check against live/deployed state, not just tests" discipline already caught.
2. **The DoR's candidate recommendation was accepted as written**, with its own reasoning (kanban's live-since-merge track record and more concrete "real, working software" framing) carried forward verbatim into the decisions.md entry — the coding agent found no basis to override it.
