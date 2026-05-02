# NFR Profile: Web UI + Copilot Execution Layer

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Date:** 2026-05-02
**Architecture guardrails reference:** .github/architecture-guardrails.md

---

## Cross-cutting NFRs (apply to all stories)

### Security

| NFR | Applies to | Constraint |
|-----|-----------|-----------|
| OAuth state parameter (CSRF protection) | wuce.1 | Required — no OAuth callback without state validation |
| Tokens server-side only | wuce.1, wuce.9 | Access tokens in HttpOnly Secure SameSite=Strict session cookies. Never in localStorage, never in browser JS scope |
| Committer identity = authenticated user | wuce.3, wuce.8, wuce.15 | Server must not write under its own identity or a service account; user's OAuth token is the commit author |
| Server-side input validation | wuce.3, wuce.8, wuce.13, wuce.15 | All form inputs, artefact paths, skill names, and annotation content validated server-side before any write or subprocess spawn |
| Path traversal mitigation | wuce.3, wuce.8, wuce.13, wuce.15 | Artefact paths validated against allowlist patterns before any GitHub Contents API call |
| Command injection mitigation | wuce.9, wuce.11, wuce.13 | Skill names validated against discovered allowlist only. No shell=true subprocess spawning. User prompt content sanitised before CLI assembly |
| Session isolation (Phase 2) | wuce.10, wuce.16 | Per-user `COPILOT_HOME` paths isolated and cleaned up post-session. Session state bound to authenticated user identity. Abandoned sessions (no activity for >30 minutes) must be garbage collected on a scheduled basis. Container restart must clean up all session directories from the previous instance lifecycle — no carry-over of prior-lifecycle `COPILOT_HOME` directories. |
| HTML sanitisation (XSS) | wuce.2, wuce.14 | All markdown-to-HTML conversion sanitised server-side before browser rendering. No raw innerHTML from untrusted content |
| Secrets out of logs | wuce.1, wuce.9, wuce.12 | OAuth tokens, session secrets, and `COPILOT_PROVIDER_API_KEY` must not appear in any log line |
| Container non-root | wuce.4 | Dockerfile must use a dedicated non-root user |
| Secrets out of image layers | wuce.4, wuce.12 | No secrets in Docker build args or image layer history |
| Repository access validation | wuce.5, wuce.6, wuce.7 | Server validates GitHub API read access per repository before surfacing any content — no cross-user data exposure |

### Accessibility

All browser-rendered views must meet **WCAG 2.1 AA** unless a story explicitly narrows this. Specific per-story requirements are noted on each story artefact. Common cross-cutting requirements:

- Colour is never the sole indicator of status — icon or text label used alongside colour (wuce.7)
- Multi-step forms announce progress to screen readers (wuce.13, wuce.16)
- Live regions (`aria-live="polite"`) for incrementally updating content (wuce.14)
- Keyboard-accessible modals with focus trapping (wuce.3, wuce.8, wuce.15)

### Plain language (non-technical surfaces)

All user-facing labels, button text, status messages, error messages, and form prompts in the web UI use plain language. Engineering vocabulary (`pipeline stage`, `skill`, `artefact`, `DoR`, `SKILL.md`) is not permitted in browser-rendered content. Acceptable in server logs, developer documentation, and API response field names only.

**Applies to:** wuce.2, wuce.3, wuce.5, wuce.6, wuce.7, wuce.8, wuce.13, wuce.14, wuce.15, wuce.16

---

### Audit logging

All user-initiated actions (login, artefact read, sign-off attempt, annotation submit, skill session start, write-back) must be logged with: user ID (or hash where noted), action type, target artefact/skill, and ISO 8601 timestamp. No sensitive content (OAuth tokens, annotation text, prompt content) in logs.

---

## Performance targets

| Story | Operation | Target |
|-------|-----------|--------|
| wuce.1 | OAuth redirect + callback | < 2 seconds |
| wuce.2 | Single artefact render | < 3 seconds |
| wuce.3 | Sign-off commit | < 5 seconds |
| wuce.4 | Container cold start to /health 200 | < 10 seconds |
| wuce.5 | Action queue load (≤50 items, 10 repos) | < 3 seconds |
| wuce.6 | Feature list (≤50 features, 10 repos) | < 4 seconds |
| wuce.7 | Programme status board (≤30 features) | < 5 seconds |
| wuce.8 | Annotation commit | < 5 seconds |
| wuce.9 | Subprocess invocation overhead (excl. CLI time) | < 500ms |
| wuce.10 | Session dir create / delete | < 100ms each |
| wuce.11 | Skill discovery filesystem scan (≤50 skills) | < 200ms |
| wuce.13 | Question form render / answer round-trip | < 3 seconds |
| wuce.14 | Preview panel update after answer | < 1 second |
| wuce.15 | Artefact write-back commit | < 5 seconds |
| wuce.16 | Session restore (state + form re-render) | < 2 seconds |

---

## Phase 2 preview caveat

The ACP (Agent Client Protocol) server is in public preview as of 2026-05-02. Stories that reference ACP (wuce.16 session persistence, wuce.13 guided flow) must carry the note:

> "Reinstate/remove preview caveat when ACP reaches GA."

The primary stable execution path for all Phase 2 stories is the `-p` subprocess flag. ACP multi-turn is the preferred path post-GA.

---

## Scope accumulator summary

**MVP scope items from discovery.md:** 14 distinct items across Phase 1 and Phase 2.
**Stories written:** 16 (wuce.1–wuce.16).
**Coverage:** All 14 MVP items covered.
**Additional stories:** wuce.7 (programme status view, grounded in P4 metric) and wuce.8 (annotation, grounded in P3 metric and sign-off requirement from discovery). Both are traceable to named metrics — not scope creep.
**Out-of-scope items preserved:** Real-time co-editing, push notifications, non-GitHub SCM, admin console, SKILL.md authoring. None introduced into stories.

**Verdict: No scope drift detected.**
