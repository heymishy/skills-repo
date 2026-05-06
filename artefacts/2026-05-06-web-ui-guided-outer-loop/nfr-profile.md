# NFR Profile — 2026-05-06-web-ui-guided-outer-loop

**Feature:** Web UI Guided Outer Loop Journey
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Created by:** /definition-of-ready (deferred from /definition)
**Date:** 2026-05-14

---

## Data Classification

**Classification:** Internal tooling — operator-authored pipeline artefacts only.
**PII handled:** None. Session content is operator-typed markdown text (discovery problem statements, story ACs, etc.). No user identifiers, no credentials, no regulated data.
**Regulated scope:** Non-regulated (see `.github/context.yml: regulated: false`).
**Data residency:** In-process memory and local filesystem only. No external persistence for MVP.

---

## Compliance NFRs

None. No named regulatory clauses apply. No human compliance sign-off required.

---

## NFR Items

| ID | Category | Description | Coverage | Status |
|----|----------|-------------|----------|--------|
| NFR-perf-buildsystemprompt | Performance | `buildSystemPrompt` with `priorArtefacts` is synchronous CPU-only string concatenation. No noticeable latency (no I/O). | ougl.1 AC8 (regression test); no dedicated perf test required — function is CPU-only per design. | Met by design |
| NFR-sec-pathtraversal | Security | Gate-confirm handler (ougl.5) MUST verify the resolved disk write path starts with the repo root before any `fs.writeFileSync` call. Rejects with HTTP 400 if path escapes repo root. | ougl.5 AC11 + T5.11 | Met by test |
| NFR-sec-eschtml | Security | All values interpolated into HTML (journeyId, skillName, artefactPath) must be passed through `escHtml` before use in attribute or text content positions. Applies to ougl.4 chat button and ougl.7 completion screen. | ougl.4 AC7; ougl.7 NFR | Met by test |
| NFR-sec-nohiddenstate | Security | Journey entry form (ougl.3) must not expose internal server IDs (sessionId, journeyId) in hidden `<input>` elements. Redirect target is constructed server-side only. | ougl.3 AC6 + T3.6 | Met by test |
| NFR-sec-slugvalidation | Security | Story slugs submitted via form (ougl.6) must pass allowlist regex `/^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i` before storage or use. | ougl.6 AC8 + T6.8 | Met by test |
| NFR-sec-journeyid | Security | `journeyId` values are server-generated UUIDs (`crypto.randomUUID()` — Node built-in). Never derived from user input. | ougl.2 NFR | Met by design |
| NFR-perf-journeystore | Performance | All journey store functions are synchronous O(1) Map lookups. No performance concern. | ougl.2 NFR | Met by design |
| NFR-perf-journey-entry | Performance | `GET /journey` is a static HTML render with no external calls. Response under 100ms. | ougl.3 NFR | Met by design |
| NFR-obs-journeycompleted | Observability | Structured info-level log event `{event: 'journey_completed', journeyId, stageCount}` emitted when completion screen renders (ougl.7). This is the M1 metric instrumentation. | ougl.7 NFR + AC5 | Met by test |
| NFR-obs-artefactsaved | Observability | Structured info-level log event `{event: 'artefact_saved_to_disk', journeyId, skillName, artefactPath}` emitted after each successful disk write (ougl.5). | ougl.5 NFR | Met by implementation |
| NFR-access-button | Accessibility | Gate-confirm button (ougl.4) must be `<button type="submit">` inside `<form>` — not an `<a>` tag styled as a button. Ensures keyboard navigability. | ougl.4 NFR | Met by test (T4.1 checks form element) |
| NFR-atomicity-gateconfirm | Atomicity | If disk write fails in gate-confirm handler, HTTP 500 is returned and `completeStage` is NOT called (journey state not advanced). | ougl.5 NFR | Met by design |
| NFR-nodeps | Zero new npm dependencies | All stories: zero new npm packages added. Node built-ins only (`fs`, `path`, `crypto`, `os`). | All story architecture constraints | Met by constraint |

---

## Sign-off

**Compliance review required:** No — non-regulated scope.
**Security review:** NFR-sec items are verifiable by automated test (ACs explicitly require them).
**Data classification sign-off:** Hamis — 2026-05-14 (sole operator, non-regulated personal repo).
