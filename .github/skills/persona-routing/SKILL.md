---
name: persona-routing
description: >
  Routes DoR sign-off notifications to non-engineer approval channels configured
  in context.yml. Phase 2 supports the github-issue channel: a designated approver
  posts /approve-dor on the linked issue, triggering a GitHub Actions workflow that
  writes dorStatus: "signed-off" to pipeline-state.json. Channel targets are always
  read from context.yml — no hardcoded values (ADR-004).
triggers:
  - "route approval"
  - "non-engineer sign-off"
  - "approve-dor"
  - "approval channel"
  - "configure approval"
---

# Persona Routing Skill

## Purpose

Routes DoR sign-off notifications to non-engineer approval channels. When a story
reaches the `definition-of-ready` stage, the platform emits a notification to the
configured channel so a non-engineer approver (PM, risk lead, compliance lead) can
sign off without requiring VS Code access.

## Channel configuration

All channel targets are read from `context.yml` only. To configure the github-issue
channel, add to `.github/context.yml`:

```yaml
approval_channel: github-issue
channel_hints:
  ide: vscode
  approval:
    type: github-issue
    issueUrl: <read from context.yml — never hardcode>
```

**ADR-004:** No URLs, workspace IDs, issue numbers, or team names are hardcoded
in this skill or its implementation. All values are read from `context.yml`.

## Approval action (github-issue channel)

1. Platform emits notification payload to the configured issue URL (from context.yml).
2. Non-engineer approver posts `/approve-dor <story-slug>` as a comment.
3. GitHub Actions workflow (`.github/workflows/approve-dor-github-issue.yml`) detects
   the comment and runs `scripts/process-dor-approval.js`.
4. Script writes to `pipeline-state.json`:
   - `dorStatus: "signed-off"` — canonical evidence field (ADR-002)
   - `dorApprover: "<github-username>"` — username only, never email (MC-PII)
   - `dorChannel: "github-issue"` — permanent record, not overwritten (auditability)
   - `dorSignedOffAt: "<ISO 8601 timestamp>"`

## IDE channel regression guard (AC4)

Adding the approval channel does NOT suppress the VS Code IDE notification.
When both `channel_hints.ide` and `channel_hints.approval` are configured,
both notifications are dispatched.

## Fallback (AC5)

If `context.yml` has no `channel_hints.approval` entry, the platform:
1. Dispatches IDE-only notification.
2. Logs: "No approval channel configured — DoR sign-off defaulting to IDE.
   Set channel_hints.approval in context.yml to enable non-engineer approval."
3. Does **not** throw an error or block the sign-off action.

## Security constraints

- `dorApprover` stores GitHub username (or equivalent role identifier) **only**.
  Never stores full name or email address (MC-PII constraint).
- No credentials, tokens, or personal data written to `pipeline-state.json`.
- `dorChannel` is a permanent record — the first value is preserved.

## Phase 2 scope

Phase 2 implements the `github-issue` adapter only.
Phase 3 enterprise channels (jira-transition, confluence-comment, slack-reaction)
are out of scope for Phase 2.
