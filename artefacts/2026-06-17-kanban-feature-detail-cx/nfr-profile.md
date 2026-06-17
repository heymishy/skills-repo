# NFR Profile: Kanban Card and Detail Page CX (kfd1)

**Feature:** 2026-06-17-kanban-feature-detail-cx
**Story:** kfd1 — Kanban card title truncation, artefact-count indicator, design-system detail pages
**Date:** 2026-06-17
**Data classification:** Internal tooling — no PII, no PCI, no regulated data

---

## NFR Items

| ID | Category | Description | Status | Verification method |
|----|----------|-------------|--------|---------------------|
| NFR-PERF-BOARD | Performance | Local-first artefact listing must not add noticeable latency for a board of ≤25 features (filesystem reads only, no added network calls on the local-dev path) | not-assessed | Manual timing: load `/features?view=board` in local dev with full pipeline state; observe no perceptible delay |
| NFR-SEC-AUTH | Security | No change to auth guards on `/features/:slug` or `/artefact/:slug/:type` — both routes continue to redirect unauthenticated HTML requests to `/auth/github` exactly as today | met | Existing auth guard tests in `tests/check-wuce6-feature-navigation.js` and `tests/check-wuce2-read-render-artefact.js` pass unchanged |
| NFR-SEC-ESCAPE | Security | All rendered text remains HTML-escaped via `escHtml`; markdown renderer's existing `<script>`/`<iframe>` stripping (ADR-012) is unchanged | met | New AC3/AC4 tests confirm no raw unescaped text rendered; existing `check-wuce2-read-render-artefact.js` script-stripping tests pass |
| NFR-A11Y-TRUNCATION | Accessibility | Truncated card titles (AC1) must be accessible via native `title=` attribute tooltip — information not lost, only deferred to hover/focus | met | AC1e automated assertion confirms `title=` attribute always present with full text when truncation occurs |
| NFR-AUDIT-UNCHANGED | Audit | No change to existing audit log calls on `/features/:slug` (`feature_artefacts_accessed`) or `/features` (`feature_list_accessed`) | met | Existing audit-log assertions in `tests/check-wuce20-artefact-index-html.js` (T17.x) pass unchanged |

---

## Data Classification

**Classification:** Internal tooling
**PII in scope:** No
**PCI in scope:** No
**Regulated data in scope:** No
**Sensitive fields:** None — the web UI displays artefact content from the local filesystem and GitHub API; no personal or financial data is processed by this story's changes

---

## Compliance NFRs requiring regulatory clause sign-off

None — this story touches no regulated data or compliance frameworks.
