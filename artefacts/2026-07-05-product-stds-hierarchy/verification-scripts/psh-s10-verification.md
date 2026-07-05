# AC Verification Script: psh-s10 — Standards injection into skill sessions

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s10.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s10-test-plan.md
**Date:** 2026-07-05

---

## Setup

```
node tests/check-psh-s10-standards-injection.js
```

Standards injection happens at session initialisation — no dedicated UI. Verification is via server logs with `LOG_LEVEL=debug`.

```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
$env:LOG_LEVEL = "debug"
node src/web-ui/server.js
```
```bash
export $(grep -v '^#' .env | xargs) && LOG_LEVEL=debug node src/web-ui/server.js
```

---

## Scenario 1 — Standards appear in skill session system prompt (AC1)

1. Log in. Navigate to a feature in a product that has at least one standard defined (psh-s8 complete).
2. Start a skill session for that feature.
3. In the server log, find the assembled system prompt.

**Expected:** The system prompt contains a `## Standards and Patterns` section. Under it, each standard appears as its own subsection named `### [standard name]`, followed by its content.

**Broken behaviour:** No "Standards and Patterns" section in the prompt, or subsections missing.

---

## Scenario 2 — Opted-out standard not injected (AC2)

1. For a product that has an org-level standard opted out (psh-s9 complete), start a skill session for a feature in that product.
2. Find the system prompt in the log.

**Expected:** The opted-out standard does not appear in the `## Standards and Patterns` section.

**Broken behaviour:** Opted-out standard still appears in the prompt.

---

## Scenario 3 — No section when product has no active standards (AC3)

1. For a product with no standards (all opted out, or none created), start a skill session.
2. Check the system prompt.

**Expected:** No `## Standards and Patterns` section appears at all — not even an empty one.

**Broken behaviour:** An empty `## Standards and Patterns` section appears.

---

## Scenario 4 — Section order: Product Context → Standards → SKILL.md (AC6)

1. Start a skill session for a feature in a product with both context files and standards set.
2. In the system prompt log, verify the order of sections.

**Expected:** The system prompt reads in this order:
1. `## Product Context — Mission` (and the other 4 Product Context sections)
2. `## Standards and Patterns`
3. The SKILL.md content (e.g. `# Discovery Skill`)

**Broken behaviour:** Standards section appears before product context, or after the SKILL.md content.
