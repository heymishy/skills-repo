## Epic: Live Capture Verification

**Discovery reference:** artefacts/2026-10-25-ppc-capture-live-test/discovery.md
**Benefit-metric reference:** artefacts/2026-10-25-ppc-capture-live-test/benefit-metric.md
**Slicing strategy:** vertical-slice

## Goal

The ppc-s1/s2/s3 playback-evidence capture mechanism has been confirmed to work end-to-end under real production conditions. At least one durable, structurally valid capture record exists in the configured GitHub repository storage path, written during a live session by the authenticated operator, and retrievable via both the GitHub repository API and the tenant-scoped screenshot route in the web UI. The improvement loop can now rely on capture output as a production signal source.

## Out of Scope

- Performance or load testing of the capture mechanism
- Evaluation of capture content quality or completeness beyond structural validity
- Any new feature development, code changes, or configuration modifications
- Verification of edge cases, error paths, or failure modes beyond the happy path

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-10-25-ppc-capture-live-test/benefit-metric.md]

## Stories in This Epic

- [ ] Run Live Capture Session and Confirm Durable Record — artefacts/2026-10-25-ppc-capture-live-test/stories/ep1-s1.md

## Human Oversight Level

**Oversight:** Low
**Rationale:** Solo operator; verification-only exercise with no code changes; binary pass/fail outcome; W4 RISK-ACCEPT applies per operating posture.

## Complexity Rating

**Rating:** 1

## Scope Stability

**Stability:** Stable
