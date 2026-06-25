# NFR Profile — Skill Robustness Improvements (Consumer-Reported)

**Feature:** 2026-05-18-skill-robustness-improvements
**Date:** 2026-06-25
**Status:** Active — written at /definition

---

## Scope Note

All three stories (sri.1, sri.2, sri.3) are changes to existing `.github/skills/*.md` files only. No new scripts, templates, or schema files are introduced. NFRs are correspondingly lightweight — there is no runtime code, no data storage, and no service to operate.

---

## Performance

- **sri.1:** The git fetch fallback must activate within 5 seconds of a fetch failure or timeout — operators wait no longer than 5 seconds before the skill continues with the local copy.
- **sri.3:** Step 6 completes for a `not-yet-measured` story in under 30 seconds — operator answers the gate question and supplies an evidence note; the skill moves on without further prompts.
- No other performance targets identified.

## Security

- **sri.1:** The warning message logged when `origin` is not reachable must not include the remote URL, authentication credentials, or any content from the failed command output. The message must be a plain-text explanation only.
- No user-supplied content is read or rendered by any of these changes.
- No credentials, tokens, or personal data are written to any file.

## Audit

- **sri.3:** The `not-yet-measured` outcome must be recorded in the DoD artefact with the operator-supplied evidence note — not blank, not "N/A", and not an error state. This ensures a clear audit trail for why measurement was deferred on a given story.

## Data Classification

Not applicable — these are SKILL.md instruction text changes. No data is produced, stored, or transmitted by the implementation.

## Data Residency

Not applicable — no data is stored.

## Availability SLA

Not defined — the skills platform is a local/offline tool. No uptime requirement.

## Compliance Frameworks

None — no regulatory clause NFRs identified. Standard medium-oversight PR review applies (per epic human oversight level).

---

## NFR Coverage per Story

| Story | Performance | Security | Audit | Notes |
|-------|-------------|----------|-------|-------|
| sri.1 | Fallback activates within 5 seconds | Warning must not expose remote URL or credentials | None | SKILL.md text change; 3 files |
| sri.2 | None | None | None | Text-only change to entry condition block |
| sri.3 | Step 6 completes in <30 seconds on not-yet-measured path | None | `not-yet-measured` + evidence note recorded in DoD artefact | SKILL.md text change; 1 file |
