# NFR Profile — 2026-05-07-web-ui-outer-loop-extensions

**Feature:** Web UI Outer Loop Extensions (owle.1–owle.6)
**Discovery reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Created by:** /definition-of-ready
**Date:** 2026-05-08

---

## Data Classification

**Classification:** Internal tooling — operator-authored pipeline artefacts only.
**PII handled:** None. Form inputs are pipeline metadata (titles, question text, hours). No user identifiers, no credentials, no regulated data.
**Regulated scope:** Non-regulated (`.github/context.yml: regulated: false`).
**Data residency:** In-process memory and local filesystem only.

---

## Compliance NFRs

None. No named regulatory clauses apply. No human compliance sign-off required.

---

## NFR Items

| ID | Category | Description | Coverage | Status |
|----|----------|-------------|----------|--------|
| NFR-sec-pathtraversal-owle | Security | All file write handlers (owle.2 decisions, owle.5 spike, owle.6 pipeline-state) MUST validate the resolved disk write path starts with the repo root before any write. Rejects with HTTP 400 if path escapes repo root. | owle.2 AC5, owle.5 AC6, owle.6 via env var only | Met by test |
| NFR-sec-serverside-slug | Security | Feature slug and all path components used in file writes are derived server-side from the journey session, never from client request body or URL params. | owle.2, owle.4, owle.5, owle.6 architecture constraints | Met by design |
| NFR-sec-no-token-log | Security | Access tokens (req.session.accessToken) must never appear in any log output produced by owle.6 (pipeline-state auto-write). | owle.6 AC6 + T6 | Met by test |
| NFR-sec-spike-slug-sanitise | Security | Spike title-slug derivation must strip `..`, `/`, `\` from the input before use in any path. Empty slug (all special characters) returns 400. | owle.5 AC6 + T5/T6 | Met by test |
| NFR-perf-trace | Performance | owle.3 trace logic completes within 2 seconds for a feature with up to 10 stories and 50 artefact files. | owle.3 T8 | Met by test |
| NFR-perf-sidetripopen | Performance | owle.1 side-trip session opens (first model turn starts) within 3 seconds of button click. | owle.1 NFR | Smoke test |
| NFR-atomicity-pipelinestate | Atomicity | owle.6 pipeline-state.json write uses temp-file-then-rename pattern. No partial writes left on disk if process crashes mid-write. | owle.6 AC5 + T5 | Met by test |
| NFR-schema-pipelinestate | Data integrity | owle.6 validates the post-modification state against pipeline-state.schema.json before writing. Invalid state → reject + error message, no write. | owle.6 AC4 + T4 | Met by test |
| NFR-nodeps-owle | Zero new npm dependencies | All owle stories: zero new npm packages. Node built-ins only (`fs`, `path`, `crypto`, `os`). | All story architecture constraints | Met by constraint |

---

## Sign-off

**Compliance review required:** No — non-regulated scope.
**Security review:** NFR-sec items verified by automated test (ACs explicitly require them).
**Data classification sign-off:** Hamis — 2026-05-08 (sole operator, non-regulated personal repo).
