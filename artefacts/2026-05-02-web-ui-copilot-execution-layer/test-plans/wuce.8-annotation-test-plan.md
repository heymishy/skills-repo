# Test Plan: wuce.8 — Annotation and comment on artefact sections

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.8-annotation.md
**Epic:** wuce-e2
**Framework:** Jest + Node.js (backend unit + integration; DOM-state assertions for render functions)
**Test data strategy:** Static fixtures committed to `tests/fixtures/`

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | Annotation affordance appears per section heading (mouse hover, keyboard focus, click) | Unit (DOM-state: keyboard focus + click) | Hover-triggered visibility is CSS/interaction-dependent; keyboard focus tested as DOM-state |
| AC2 | Annotation committed under user identity in `## Annotations` section with name, target section, text, ISO 8601 timestamp | Unit + integration | None |
| AC3 | Existing annotations displayed below their section: name, date, text | Unit (parse + render) + integration | None |
| AC4 | HTML/script content stripped server-side before commit | Unit + integration | None |
| AC5 | >2000 chars → 400 rejection, no partial commit | Unit + integration | None |
| AC6 | 409 conflict → fetch current SHA, retry once; if retry fails → error to client; no data silently lost | Integration (retry sequence) | Atomic "no partial commit" guarantee is behavioural; retry sequence tested via IT4/IT5 |

---

## Named fixtures (from E2 shared set — defined in wuce.5 test plan)

| Fixture path | Purpose |
|---|---|
| `tests/fixtures/markdown/artefact-pending-signoff.md` | Base artefact markdown WITHOUT existing `## Annotations` section — used as the target artefact for new annotation commits |
| `tests/fixtures/markdown/artefact-signed-off.md` | Artefact WITH sign-off but WITHOUT `## Annotations` section — verifies signed artefacts can also receive annotations |

**Additional fixtures (wuce.8 only):**

| Fixture path | Content |
|---|---|
| `tests/fixtures/github/annotation-commit-success.json` | GitHub Contents API write success response: `{ "content": { "name": "discovery.md", "sha": "newsha456" }, "commit": { "sha": "commitabc789", "author": { "name": "Test Stakeholder", "date": "2026-05-02T10:00:00Z" } } }` |
| `tests/fixtures/github/annotation-commit-conflict.json` | GitHub Contents API 409 response: `{ "message": "409: Conflict" }` |
| `tests/fixtures/markdown/artefact-with-annotations.md` | Artefact content that already contains an `## Annotations` section with one existing entry — used for AC3 parse tests |

**`tests/fixtures/markdown/artefact-with-annotations.md` canonical content:**
```markdown
## Story: Validate pipeline artefact

## Acceptance Criteria

**AC1:** The review is complete.

## Annotations

### On section: Acceptance Criteria

**Jane Stakeholder** — 2026-05-01T09:30:00Z

This looks good to me. The acceptance criterion is clear and testable.
```

---

## Unit tests

### T1 — `sanitiseAnnotationContent(content: string): string` (AC4)

**T1.1 — strips `<script>` tags**
- Input: `"Good comment <script>alert('xss')</script> end"`
- Expected: `"Good comment  end"` (or similar; script tags removed)
- Verifies AC4 XSS prevention

**T1.2 — strips arbitrary HTML tags**
- Input: `"<b>Bold</b> and <a href='evil.com'>link</a>"`
- Expected: `"Bold and link"` (or text without HTML elements)
- Verifies AC4 general HTML stripping

**T1.3 — preserves plain text unchanged**
- Input: `"This is a normal annotation with no HTML."`
- Expected: same string returned
- Rationale: sanitisation must not corrupt legitimate content

**T1.4 — handles empty string without throwing**
- Input: `""`
- Expected: `""` or empty string; no thrown exception

### T2 — `validateAnnotationLength(content: string): boolean` (AC5)

**T2.1 — returns `false` for content exceeding 2000 characters**
- Input: string of 2001 characters
- Expected: `false`

**T2.2 — returns `true` for exactly 2000 characters**
- Input: string of exactly 2000 characters
- Expected: `true`
- Rationale: boundary condition; 2000 chars must be accepted

**T2.3 — returns `true` for content under 2000 characters**
- Input: `"Short annotation."`
- Expected: `true`

### T3 — `buildAnnotationBlock(annotatorName, sectionHeading, annotationText, timestamp): string` (AC2)

**T3.1 — produces correctly structured markdown block with all required fields**
- Input: `annotatorName: "Jane Stakeholder"`, `sectionHeading: "Acceptance Criteria"`, `annotationText: "LGTM."`, `timestamp: "2026-05-02T10:00:00Z"`
- Expected: returned string contains `"Jane Stakeholder"`, `"Acceptance Criteria"`, `"LGTM."`, `"2026-05-02T10:00:00Z"`
- Verifies AC2 field requirements

**T3.2 — timestamp must be ISO 8601 format**
- Input: any valid inputs with a timestamp from `new Date().toISOString()`
- Expected: output contains a string matching ISO 8601 pattern `YYYY-MM-DDTHH:mm:ssZ`

**T3.3 — appends to existing `## Annotations` section rather than creating a second one**
- Setup: call `buildAnnotationBlock` twice with the same sectionHeading
- Expected: second call's output does NOT contain a second `## Annotations` heading; annotations are sequential entries under one heading

### T4 — `parseExistingAnnotations(artefactContent: string)` (AC3)

**T4.1 — extracts annotations from artefact with `## Annotations` section**
- Input: contents of `tests/fixtures/markdown/artefact-with-annotations.md`
- Expected: array containing one item with `annotatorName: "Jane Stakeholder"`, `date: "2026-05-01T09:30:00Z"`, `text` containing the annotation body

**T4.2 — returns empty array when no `## Annotations` section exists**
- Input: contents of `tests/fixtures/markdown/artefact-pending-signoff.md`
- Expected: `[]`; no thrown exception

**T4.3 — handles artefact with empty `## Annotations` section without throwing**
- Input: artefact markdown ending in `## Annotations\n`
- Expected: `[]`; no thrown exception

### T5 — `renderAnnotations(artefact)` DOM-state (AC1, AC3)

**T5.1 — annotation affordance present for each section heading (keyboard focus)**
- Input: rendered artefact HTML with at least two section headings
- Expected DOM: each section heading has an associated focusable element (e.g. button with `tabindex="0"`) for the annotation affordance
- Verifies AC1 keyboard-accessible affordance

**T5.2 — existing annotations rendered below their section**
- Input: artefact with `## Annotations` section containing one entry
- Expected DOM: annotation entry appears after its target section heading; annotator name, date, and text all present in DOM
- Verifies AC3 display

**T5.3 — artefact with no annotations renders cleanly with no orphaned annotation UI**
- Input: artefact content from `artefact-pending-signoff.md`
- Expected DOM: no empty annotations container visible; section headings still render correctly

---

## Integration tests

### IT1 — `POST /api/artefacts/:path/annotations` with valid payload → annotation committed (AC2)

- Setup: authenticated session; mock `commitAnnotation` SCM adapter spy; payload: `{ sectionHeading: "Acceptance Criteria", annotationText: "LGTM.", artefactPath: "artefacts/test/discovery.md" }`
- Request: `POST /api/artefacts/artefacts%2Ftest%2Fdiscovery.md/annotations`
- Expected: `200`; `commitAnnotation` called with correct args including `annotationText: "LGTM."` and `token` matching authenticated user
- Verifies AC2 committer identity (adapter called with user's token, not a server token)

### IT2 — `POST` with script content → sanitised content committed, not rejected (AC4)

- Setup: authenticated session; mock `commitAnnotation` spy; payload `annotationText: "Good <script>xss()</script> comment"`
- Request: `POST /api/artefacts/:path/annotations`
- Expected: `200`; `commitAnnotation` called with `annotationText` that does NOT contain `<script>` tag; contains `"Good"` and `"comment"`
- Verifies AC4: sanitised text committed when content remains after stripping

### IT3 — `POST` with >2000 character annotation → 400 rejection (AC5)

- Setup: authenticated session; payload `annotationText` of 2001 characters
- Request: `POST /api/artefacts/:path/annotations`
- Expected: `400`; `commitAnnotation` NOT called (no partial commit)
- Verifies AC5

### IT4 — `POST` with 409 on first commit → fetch SHA + retry succeeds (AC6 success path)

- Setup: authenticated session; mock `commitAnnotation` to throw 409 on first call, succeed on second (returns `annotation-commit-success.json`)
- Request: `POST /api/artefacts/:path/annotations`
- Expected: `200`; `commitAnnotation` called exactly twice; response indicates success
- Verifies AC6 retry logic

### IT5 — `POST` with 409 on both attempts → error returned to client (AC6 failure path)

- Setup: authenticated session; mock `commitAnnotation` to throw 409 on both calls
- Request: `POST /api/artefacts/:path/annotations`
- Expected: `409` or `503`; response body contains message to reload and retry; no partial annotation persisted (commitAnnotation called exactly twice, no third attempt)
- Verifies AC6 failure path: "no annotation data is silently lost or partially committed"

### IT6 — `POST` requires authentication

- Setup: no session cookie
- Request: `POST /api/artefacts/:path/annotations`
- Expected: `401`

---

## NFR tests

### NFR1 — Audit log on annotation submission

- Setup: authenticated session; spy on audit logger
- Action: `POST /api/artefacts/:path/annotations` with valid payload
- Expected: audit log call with `userId`, `artefactPath`, `sectionHeading`, `timestamp`; annotation text NOT logged in full (privacy)

### NFR2 — Committer identity is authenticated user

- Setup: authenticated session with `user-identity.json` user (`login: "test-stakeholder"`)
- Action: `POST /api/artefacts/:path/annotations`
- Expected: `commitAnnotation` called with `token` from the authenticated user's session (not a server-level token)
- Verifies security constraint: committer identity must be the authenticated user

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC1 — hover-triggered affordance visibility | CSS `:hover` pseudo-state is layout/interaction-dependent; not testable in Jest DOM | Keyboard focus affordance tested in T5.1; hover is manual verification step |
| AC6 — "no data silently lost" atomicity guarantee | The retry is a server-side operation; whether partial state was written between retries is a GitHub API property | IT4/IT5 verify retry count and outcome; the no-partial-commit guarantee is documented as a manual verification requirement (verify no annotation file written on conflict) |

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 14 |
| Integration tests | 6 |
| NFR tests | 2 |
| **Total** | **22** |

**acTotal: 6**
