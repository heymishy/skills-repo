Slicing strategy: vertical-slice

## Epic 1 — Placeholder Epic — Artefact Splitter Test Context

Goal: A minimal test feature exists that exercises the web UI's definition → review → DoR artefact parsing flow without functional complexity, allowing verification of the splitter bugfix in a live session environment.

Out of scope:
- Any real product functionality
- Design system compliance or UX review
- Security, performance, or compliance audit
- Test coverage (throwaway feature)
- Multiple epics or stories beyond this single placeholder

Oversight: Low
Oversight rationale: Throwaway test feature, no production impact, trivial scope
Complexity: 1
Scope stability: Stable

### ep1-s1 — Add Placeholder Comment to Test File

Persona: Developer
Domain: 

As a developer, I need to add a placeholder file with a test comment so that the definition/review artefact splitter can be verified in a live session.

Benefit linkage: Placeholder Verification Signal — completing this story moves the metric from "splitter unverified in live environment" to "splitter correctly parses artefacts without error"

Architecture constraints: None identified — checked against .github/architecture-guardrails.md

Given the web UI's artefact parsing is complete,
When a session loads definition and review artefacts for this feature,
Then the splitter correctly separates both artefacts and renders them without parse error.

Out of scope:
- Any logic beyond a single-line comment
- Test coverage
- Real functionality

Dependencies: None
NFR: None
Complexity: 1
Scope stability: Stable