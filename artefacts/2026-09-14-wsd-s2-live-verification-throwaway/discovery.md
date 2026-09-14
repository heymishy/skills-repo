# Discovery: wsd-s2 Live Verification Throwaway

**Status:** Approved
**Date:** 2026-09-14
**Feature slug:** 2026-09-14-wsd-s2-live-verification-throwaway

---

## Problem statement

This is a throwaway test feature created to live-verify that the wsd-s2 GitHub API pipeline-state writer correctly writes stage advancement to `pipeline-state.json` on `origin/master`. There is no real problem being solved — this discovery artefact exists solely to satisfy the pipeline stage requirement so the downstream write can be triggered and verified.

---

## Who it affects

The platform operator (Hamish) running the live verification of wsd-s2 in production.

---

## Why now

wsd-s2 has been implemented and needs a real end-to-end write verification against `origin/master` to confirm the GitHub Contents API write path is working correctly in the deployed environment.

---

## MVP scope

Produce a discovery artefact. Advance the stage in `pipeline-state.json`. Confirm the write lands on `origin/master`.

---

## Out of scope

- Any real feature delivery
- Any real problem solving
- Keeping this artefact or feature beyond the verification window

---

## Assumptions and risks

No real risks. This feature will be discarded after verification is confirmed.

---

## Success indicators

**Baseline:** wsd-s2 write path unverified in production.
**Target:** A confirmed commit to `origin/master` updating `pipeline-state.json` with `stage: "discovery"` for this feature slug.
**Measurement:** GitHub commit history on `origin/master`.

---

## Constraints

None — this is a test-only throwaway.

---

## Attribution

**Contributors:**
- Hamish King — Platform operator — 2026-09-14

**Approved By:**
- Hamish King — Platform operator — 2026-09-14

<!-- eval-mode: false -->