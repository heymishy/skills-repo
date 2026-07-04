# AC Verification Script: psh-s5 — Product context injection into skill sessions

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s5.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s5-test-plan.md
**Date:** 2026-07-05

---

## Setup

Context injection happens at session initialisation — there is no dedicated UI for it. Verification is done by starting a skill session and inspecting the system prompt in server logs. Enable verbose logging (`LOG_LEVEL=debug`) before starting the server.

```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
$env:LOG_LEVEL = "debug"
node src/web-ui/server.js
```
```bash
export $(grep -v '^#' .env | xargs) && LOG_LEVEL=debug node src/web-ui/server.js
```

Also run the automated test suite:
```
node tests/check-psh-s5-context-injection.js
```

---

## Scenario 1 — 5 product context sections appear in skill session system prompt (AC1)

1. Log in. Navigate to a feature that belongs to a product with all 5 context files set.
2. Start a skill session (e.g. click "Run Discovery" or equivalent).
3. In the server log, find the line that logs the assembled system prompt (look for `systemPrompt` or `buildSystemPrompt`).

**Expected:** The system prompt contains these five headings, in this order, before the SKILL.md content:
- `## Product Context — Mission`
- `## Product Context — Tech Stack`
- `## Product Context — Constraints`
- `## Product Context — Roadmap`
- `## Product Context — Architecture Guardrails`

Each heading is followed by the content you set when creating the product.

**Broken behaviour:** Some sections missing, sections appear after the SKILL.md content, or sections show empty content.

---

## Scenario 2 — DB content used, not session cache (AC2)

1. While the session is running, directly update a product's `mission` field in Postgres to a new value.
2. Start a NEW skill session for the same product's feature.

**Expected:** The new session's system prompt contains the updated mission value — not the old one from any cache.

**Broken behaviour:** New session still shows the old mission value (session cache used instead of DB read).

---

## Scenario 3 — Unassociated feature starts without product context (AC3)

1. Find a feature with `product_id = NULL` (e.g. a pre-migration journey in the Default product with no context set).
2. Start a skill session for it.

**Expected:** Session starts normally. No "Product Context" sections appear in the system prompt. No error is shown to the user.

**Broken behaviour:** Session fails to start, or an error about missing product context is logged.

---

## Scenario 4 — Two simultaneous sessions use correct contexts (AC6)

1. Open two browser tabs, each logged in as the same user.
2. In Tab A, start a skill session for a feature in Product A.
3. Immediately in Tab B, start a skill session for a feature in Product B.

**Expected:** Tab A's session log shows Product A's context. Tab B's shows Product B's context. Neither session shows the other product's content.

**Broken behaviour:** One session receives the other product's context, or the context is mixed.
