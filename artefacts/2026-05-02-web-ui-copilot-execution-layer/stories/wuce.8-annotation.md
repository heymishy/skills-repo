## Story: Annotation and comment on artefact sections

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e2-phase1-full-surface.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **subject-matter expert (SME) reviewer**,
I want to add a named comment or annotation on a specific section of a pipeline artefact,
So that my input is captured alongside the artefact in the repository under my identity — creating a permanent record of my review contribution without requiring me to use GitHub pull requests or edit markdown files.

## Benefit Linkage

**Metric moved:** P3 — Non-technical attribution rate
**How:** Annotations committed under the SME's GitHub identity extend the attribution record beyond sign-offs to cover review contributions — increasing the proportion of governance records that carry non-technical stakeholder attribution.

## Architecture Constraints

- Mandatory security constraint: annotation content must be validated and sanitised server-side before being committed — length limit enforced (max 2000 characters per annotation), HTML/script content stripped
- ADR-012: the commit operation for annotation persistence must use the SCM adapter (`commitAnnotation(artefactPath, sectionHeading, annotationText, token)`) — not inline GitHub API calls
- Mandatory security constraint: the committer identity must be the authenticated user — same constraint as wuce.3

## Dependencies

- **Upstream:** wuce.2 (annotation overlay renders on top of the artefact view from wuce.2), wuce.3 (same write-back mechanism reused)
- **Downstream:** wuce.5 (annotation requests appear in the action queue once this story is implemented)

## Acceptance Criteria

**AC1:** Given an authenticated user is viewing a pipeline artefact, When they hover over or click a section heading, Then an "Add annotation" affordance appears allowing them to type a comment of up to 2000 characters and submit it.

**AC2:** Given a user submits an annotation on a section, When the commit succeeds, Then the annotation is appended to the artefact file in a structured `## Annotations` section with the user's GitHub display name, the target section heading, the annotation text, and an ISO 8601 timestamp — committed under the user's identity.

**AC3:** Given an artefact has existing annotations, When the artefact view loads, Then each annotation is displayed beneath its corresponding section with the annotator's name, date, and the annotation text visible — not only in the raw markdown.

**AC4:** Given a user attempts to submit an annotation containing HTML script tags, When the server validates the input, Then the script tags are stripped and the sanitised text (if any remains) is committed — no raw HTML is persisted in the artefact.

**AC5:** Given a user submits an annotation exceeding 2000 characters, When the server receives the request, Then it rejects the request with a 400 error and an appropriate message — no partial annotation is committed.

## Out of Scope

- Replying to or threading annotations — post-MVP; annotations are standalone comments
- Deleting or editing a previously submitted annotation — post-MVP; annotations are append-only in Phase 1
- Annotating at the line level (below section granularity) — section-level granularity is sufficient for Phase 1
- Annotation approval workflows (accept/reject an annotation) — post-MVP

## NFRs

- **Security:** Server-side sanitisation of all annotation content. Max length enforced server-side, not only client-side. Committer identity is authenticated user only.
- **Performance:** Annotation commit completes within 5 seconds.
- **Accessibility:** Annotation affordance and text input meet WCAG 2.1 AA — keyboard-accessible, focus management after submission, success/error states announced to screen readers.
- **Audit:** Annotation submission events logged with user ID, artefact path, section heading, and timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
