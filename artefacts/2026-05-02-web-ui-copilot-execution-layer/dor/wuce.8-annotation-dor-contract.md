# Contract Proposal: Annotation and comment on artefact sections

**Story:** wuce.8
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `POST /artefact/:repo/:path/annotations` — submits annotation for a section
- Express route handler: `GET /artefact/:repo/:path/annotations` — returns all annotations for an artefact
- Annotation adapter: `src/adapters/annotation-writer.js` — `commitAnnotation(artefactPath, sectionHeading, annotationText, token)` — appends annotation to `## Annotations` section in markdown file; committer = authenticated user; handles 409 conflict via one retry
- Annotation reader: `listAnnotations(artefactPath, token)` — parses `## Annotations` section from markdown
- Server-side sanitisation: strip HTML tags and script content before commit — not delegated to client
- Server-side length validation: reject >2000 characters with HTTP 400
- 409 conflict resolution: fetch current SHA, retry commit once; if second attempt fails, return 409 to client (no silent data loss)
- Test fixtures: reuses `tests/fixtures/markdown/artefact-pending-signoff.md`, `tests/fixtures/markdown/artefact-signed-off.md`

## Components NOT built by this story

- Threaded replies or comment chains — out of scope
- Delete or edit annotations — out of scope
- Line-level (character-offset) annotation granularity — section-level only
- Approval or resolution workflows for annotations
- Mention/notification for annotation authors

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Annotation affordance rendered per section | `artefact view renders annotation button for each H2 section`, `button identifies target section heading` |
| AC2 | Annotation committed with name/section/text/timestamp | `POST /annotation commits markdown with annotator name`, `committed content includes section heading reference`, `committed content includes ISO 8601 timestamp` |
| AC3 | Existing annotations displayed | `GET /annotations returns parsed annotations from artefact`, `annotations rendered with author name and timestamp`, `annotations grouped by section` |
| AC4 | HTML script tags stripped | `annotation with <script> tag → stripped before commit`, `annotation with <b> tag → stripped before commit`, `sanitised content committed not raw HTML` |
| AC5 | >2000 chars → 400 | `2001 char annotation → HTTP 400 response`, `2000 char annotation → accepted`, `400 response includes descriptive error message` |
| AC6 | 409 conflict → retry once → conflict message | `409 on first attempt → retry with updated SHA`, `409 on retry → 409 returned to client`, `no silent data loss on persistent conflict` |

## Assumptions

- Section headings are H2 markdown headings (`## Heading`); H3+ sections are under the nearest H2
- Annotations are appended to a dedicated `## Annotations` section at the end of the artefact file (not inline with content)
- The annotation adapter re-reads the current file SHA from the GitHub API before each write attempt to handle concurrent edits

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/annotation.js` | Create | Annotation POST and GET route handlers |
| `src/adapters/annotation-writer.js` | Create | `commitAnnotation` adapter with sanitisation and retry |
| `src/utils/annotation-sanitiser.js` | Create | HTML tag stripping utility |
| `src/app.js` | Extend | Mount annotation routes |
| `tests/annotation.test.js` | Create | 22 Jest tests for wuce.8 |
| `tests/fixtures/markdown/artefact-pending-signoff.md` | Reuse | Already created by wuce.5 |
| `tests/fixtures/markdown/artefact-signed-off.md` | Reuse | Already created by wuce.5 |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, sanitisation and conflict-retry are server-side, no scope boundary violations identified.
