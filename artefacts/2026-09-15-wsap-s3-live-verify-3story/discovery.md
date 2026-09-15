# Discovery: Live Verification Harness — 3-Story wsap-s3 Test Feature

**Status:** Approved
**Date:** 2026-09-15
**Feature slug:** 2026-09-15-wsap-s3-live-verify-3story

---

## Problem statement

wsap-s3 (web UI story advance pipeline — story 3) introduced fixes to two specific behaviours in the pipeline web UI: (1) multi-story GitHub commit gating, where advancing multiple stories in a single session should produce one batched commit rather than N individual ones; and (2) eliminating unnecessary per-story review re-runs when the operator advances through a story set. These fixes cannot be verified in isolation against mocked data — they require a real multi-story feature with real pipeline-state transitions driven through the live web UI to confirm the gate and commit logic behaves correctly end-to-end.

---

## Who it affects

**Primary:** Hamish King (solo operator) — running the live verification session to confirm wsap-s3 fixes before closing that story's DoD.

---

## Why now

wsap-s3 is ready for DoD. The DoD requires live verification of the multi-story commit gating and per-story review re-run suppression. This throwaway feature is the vehicle for that verification — it exists only to create a controlled 3-story pipeline-state set that can be driven through the relevant transitions.

---

## MVP scope

Three minimal, independent stories under a single "hello world status endpoint" theme:
- **Story 1:** Add a `GET /status` route that returns `{ status: "ok" }`
- **Story 2:** Add a `version` field to the status response
- **Story 3:** Add an `uptime` field to the status response

Each story is independently advanceable through pipeline stages. The feature produces no real product value — it is discarded after wsap-s3 verification is complete.

---

## Out of scope

- Any real product functionality beyond the minimal 3-story scaffold
- Test coverage, review artefacts, or DoR sign-off (not needed for verification purposes)
- Persistence beyond the wsap-s3 DoD session

---

## Assumptions and risks

- [ASSUMPTION] The 3-story structure is sufficient to exercise the multi-story commit gating logic — assumes wsap-s3's fix applies to any N≥2 story set, not a specific story count.
- Risk: if wsap-s3's fix is story-count-sensitive, a different N may be needed.

---

## Directional success indicators

**Verification passes** if:
- Advancing all 3 stories through one or more stages produces a single batched GitHub commit, not 3 separate commits
- No per-story review re-run is triggered during multi-story advancement
- The web UI story advance panel reflects correct state after each transition

Baseline: pre-fix behaviour produced N commits for N stories and triggered redundant review re-runs.
Target: 1 commit per advance batch; 0 spurious review re-runs.
Measured via: GitHub commit history inspection + browser network tab during the verification session.

---

## Constraints

- Feature is throwaway — do not invest in artefact quality beyond what's needed for verification
- Solo operator context; no second reviewer
- Must be completable in a single session alongside wsap-s3 DoD

---

## Attribution

**Contributors:**
- Hamish King — Operator / Solo Engineer — 2026-09-15

**Approved By:**
- Hamish King — Solo Operator — 2026-09-15