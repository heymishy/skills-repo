# Definition of Done — Pipeline Skill

## Running checks for: `ham.9` | Webhook Notifications | PR #214

---

> ⚠️ **BLOCKED — Definition of Done FAILED**
>
> I cannot complete this pipeline run. **Critical artefacts are missing.**

---

## What I received

| Artefact | Status |
|---|---|
| Story ID | ✅ `ham.9` |
| Feature name | ✅ Hamilton Core Banking — Webhook Notifications |
| Epic | ✅ Notification and Reporting |
| PR reference | ✅ PR #214 (merged) |
| Story body / acceptance criteria | ❌ **Not provided** |
| Supporting artefacts | ❌ **Not provided** |

---

## What I need to run this properly

To execute the Definition of Done pipeline I require **at minimum**:

### 1. 📋 Story Body
- User story statement (`As a… I want… So that…`)
- Acceptance Criteria (AC line items)
- Any noted assumptions or out-of-scope items

### 2. 🔗 Supporting Artefacts (as available)
| Artefact | Purpose |
|---|---|
| PR #214 diff / description | Verify implementation matches AC |
| Test evidence (unit, integration, e2e) | Confirm coverage |
| API / webhook schema docs | Confirm spec completeness |
| QA sign-off or test run results | Confirm functional verification |
| Security / compliance notes | Relevant for banking-grade webhooks (payload signing, retry policy, auth) |
| Observability / logging evidence | Confirm operational readiness |

---

## Why this matters for `ham.9` specifically

Webhook Notifications in a **core banking context** carry elevated DoD risk across several dimensions that I would specifically interrogate:

- 🔐 **Payload security** — HMAC signing, TLS enforcement
- 🔁 **Retry & idempotency** — duplicate delivery handling
- 📨 **Event schema versioning** — consumer contract stability
- 🏦 **Regulatory / audit trail** — delivery receipts, failure logging
- 🚦 **Rate limiting & failure modes** — dead-letter handling

These cannot be assessed without the story AC and artefacts.

---

## Next step

Please re-run `/definition-of-done` and include:

```
- [ ] Story body with acceptance criteria
- [ ] PR #214 description or diff summary
- [ ] Test evidence
- [ ] Any additional supporting artefacts
```

Once provided, I will produce the full structured DoD report with a **PASS / FAIL / PARTIAL** verdict per criterion.