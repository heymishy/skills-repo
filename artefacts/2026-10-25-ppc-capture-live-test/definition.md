Slicing strategy: vertical-slice

## Epic 1 — Live Capture Verification

Goal: The ppc-s1/s2/s3 playback-evidence capture mechanism has been confirmed to work end-to-end under real production conditions. At least one durable, structurally valid capture record exists in the configured GitHub repository storage path, written during a live session by the authenticated operator, and retrievable via both the GitHub repository API and the tenant-scoped screenshot route in the web UI. The improvement loop can now rely on capture output as a production signal source.
Out of scope:
- Performance or load testing of the capture mechanism
- Evaluation of capture content quality or completeness beyond structural validity
- Any new feature development, code changes, or configuration modifications
- Verification of edge cases, error paths, or failure modes beyond the happy path

Oversight: Low
Oversight rationale: Solo operator; verification-only exercise with no code changes; binary pass/fail outcome; W4 RISK-ACCEPT applies per operating posture.
Complexity: 1
Scope stability: Stable

### ep1-s1 — Run Live Capture Session and Confirm Durable Record
Persona: Platform operator / maintainer
Domain: None

So that I can trust the capture pipeline as a production signal source for the improvement loop, I need to run a live production session against the deployed playback-evidence capture mechanism and confirm that at least one structurally valid capture record is written to the configured GitHub repository storage path and is retrievable after the session completes.

Benefit linkage: Capture record exists and is structurally valid post-session — completing this story produces the first confirmed production evidence that the capture pipeline functions end-to-end, moving the baseline from 0 records to ≥ 1.

Architecture constraints: ADR-020 — the capture mechanism writes to GitHub repository storage using the authenticated user's OAuth token (implemented in ppc-s1/s2/s3; this story does not modify that path). ADR-029 — the GitHub repository storage path is the canonical record; verification reads from there, not from an in-memory or session-local copy.

Given I am authenticated as the platform operator in the live production web UI and the ppc-s1/s2/s3 capture mechanism is deployed,
When I complete a discovery skill session that triggers the capture pipeline,
Then at least one file is written to the configured artefacts path in the GitHub repository, the file is a non-empty well-formed PNG image, and the GitHub commit completed successfully with no partial or failed write.

Given the capture record has been written to GitHub repository storage,
When I access the tenant-scoped screenshot route in the web UI,
Then the route returns and renders the same PNG file that was committed, confirming the record is retrievable via both verification surfaces.

Out of scope:
- Verifying capture records for any session other than the one run during this verification exercise
- Evaluating the visual or semantic content of the captured screenshot
- Testing failure paths, retry logic, or error handling in the capture pipeline

Dependencies: None — ppc-s1/s2/s3 already deployed to production
NFR: None
Complexity: 1
Scope stability: Stable