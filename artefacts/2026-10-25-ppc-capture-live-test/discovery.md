# Discovery: Live Test — Playback-Evidence Capture Mechanism

**Status:** Approved
**Date:** 2025-10-25
**Feature slug:** 2026-10-25-ppc-capture-live-test

---

## Problem Statement

The playback-evidence capture mechanism (ppc-s1/s2/s3) has been built and unit-tested but has not been verified against real production traffic. Without a live verification run, we cannot confirm that the capture pipeline behaves correctly end-to-end — from user action through to durable evidence record — under actual runtime conditions.

## Who It Affects

**Primary persona:** Platform operator / maintainer — the person responsible for confirming that governance evidence records are being produced reliably before relying on them for audit or improvement-loop purposes.

## Why Now

The ppc-s1/s2/s3 stories are complete. Live verification is the final gate before the mechanism can be trusted as a production signal source. Deferring this risks discovering a silent failure in production after the improvement loop has already started depending on the capture output.

## MVP Scope

A minimal, generic discovery session run against the live production environment that produces at least one durable capture record, confirming the end-to-end path is functional. Success is binary: the record exists and is structurally valid, or it does not.

## Out of Scope

- Performance or load testing of the capture mechanism
- Verification of capture content quality or completeness beyond structural validity
- Any new feature development — this is a verification-only exercise

## Assumptions and Risks

[ASSUMPTION] The production environment is reachable and the capture mechanism is deployed — unconfirmed at discovery time, requires confirmation before proceeding.

[ASSUMPTION] A structurally valid capture record is sufficient evidence of end-to-end function — the content of the record is not being evaluated here.

## Directional Success Indicators

**Capture record exists post-session:** Baseline: 0 records (mechanism unverified in production). Target: ≥ 1 durable record written to the configured capture destination. Measured via: direct inspection of the capture destination after the session completes.

## Constraints

- Minimal scope — no new code, no new stories, no pipeline overhead beyond what is needed for live verification
- Uses the active production environment only (no staging bypass)

---

## Attribution

**Contributors:**
- Operator — Platform maintainer — 2026-10-25

**Approved By:**
- Operator — Platform maintainer — 2026-10-25

---