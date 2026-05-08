# NFR Profile — Web UI Copilot Chat Parity

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Date:** 2026-05-09
**Status:** Active

---

## Performance Targets

- System prompt assembly (`buildSystemPrompt()` with context auto-loader) completes in under 500ms for repositories with up to 30 features in `pipeline-state.json` and `workspace/learnings.md` up to 500 lines (wucp.1)
- Skill SKILL.md load (slash command router) completes in under 100ms per invocation (wucp.2)
- Tool loop overhead per turn (marker detection + file read + turn injection) under 200ms for files up to 50KB (wucp.3)
- Tool read cap: 50KB per `read_file` call — truncated with notice if exceeded (wucp.3)

## Security Requirements

- **Path traversal guard (ADR-023, NFR-sec-pathtraversal):** All file reads in wucp.3 where the path is derived from model output must validate with `path.resolve` + `startsWith(repoRoot)`. Reject with HTTP 400 on violation. Mandatory test coverage for attack inputs. wucp.1 reads from static known paths — guard not required but noted.
- **Skill name injection guard (wucp.2):** Slash command skill names are validated against `fs.readdirSync` allowlist before any file read. Skill names containing `/`, `..`, or path separators are rejected with HTTP 400.
- **No credential leakage (wucp.1 AC5):** `context.yml` schema must be inspected and documented confirming no credential values are loaded into the system prompt. Inspection result saved to `reference/context-yml-schema-inspection.md` before wucp.1 merges.
- **Stub-throws rule (D37):** Any injectable adapter added in wucp.3 must have a stub that throws, not returns null/empty.
- **Session token field:** All new routes must use `req.session.accessToken` (not `req.session.token`).

## Data Classification

- **Public / Internal** — no personal data, no financial data, no regulated data processed by this feature. Pipeline state files (`pipeline-state.json`, `workspace/state.json`) contain project management information (story slugs, phase names, artefact paths) — no PII.
- `context.yml` may contain `secretRef` reference names (not values). Reference names are safe to surface per ADR-009.

## Data Residency

Not applicable — all data is local to the operator's repository and does not leave the Node.js server process.

## Availability SLA

Not defined — this is a local development tooling surface. No uptime commitment.

## Compliance Frameworks

None — feature is not in a regulated scope (`regulated: false` in pipeline-state.json).

## Accessibility

- wucp.3 tool result notifications in turn output must be readable as plain text (no colour-only indicators)
- wucp.2 capability notices in model responses are plain text — no WCAG-specific requirements for system-generated text
- No new interactive elements added to the UI in this feature (all changes are server-side or system prompt changes)

## Zero External npm Dependencies

Mandatory. Verified by the governance test suite (`check-dependency-versions.js` or equivalent). Node.js built-ins only: `fs`, `path`, `child_process` if needed for future script execution (not in this feature's scope).

## No SKILL.md or Artefact Modifications

Mandatory. This feature adds server-side capability only. No `.github/skills/` or `artefacts/` file is modified by any story in this feature.

## Browser Compatibility

Modern Chromium (Chrome 120+, Edge 120+). wucp.2 capability notices and wucp.3 tool result notifications are plain text rendered by the existing streaming turn renderer — no new browser APIs required.

---

*No NFRs identified beyond the above: reviewed 2026-05-09.*
