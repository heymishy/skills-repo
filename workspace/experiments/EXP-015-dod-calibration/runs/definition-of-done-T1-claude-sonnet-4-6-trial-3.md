# Definition of Done Pipeline — `/definition-of-done`

**Story:** ham.9 | **Feature:** Hamilton Core Banking — Webhook Notifications | **PR:** #214 (merged)

---

## ⚠️ PIPELINE BLOCKED — INSUFFICIENT ARTEFACTS

Before I can run a meaningful Definition of Done assessment, I need to flag a critical problem:

> **The story artefact submitted is a shell. It contains a title and metadata only.**

No DoD evaluation can be responsibly completed or signed off against a stub. Here is exactly what is missing:

---

## 🔴 Missing Artefacts Checklist

| # | Required Item | Status | Why It Matters |
|---|---------------|--------|----------------|
| 1 | **Acceptance Criteria** | ❌ Not provided | Cannot verify the story is functionally complete without knowing what "done" looks like |
| 2 | **Story description / user narrative** | ❌ Not provided | No basis to assess scope coverage |
| 3 | **Technical design / API contract** | ❌ Not provided | Webhooks require endpoint spec, payload schema, retry logic, auth — unverifiable |
| 4 | **PR #214 diff / description** | ❌ Not provided | Cannot confirm implementation matches intent |
| 5 | **Test evidence** | ❌ Not provided | Unit, integration, contract tests — pass/fail status unknown |
| 6 | **NFR / SLA targets** | ❌ Not provided | Webhook reliability, latency, retry policy — no targets to check against |
| 7 | **Security review notes** | ❌ Not provided | Webhook endpoints are a common attack surface (SSRF, spoofing, secret exposure) |
| 8 | **Definition of Done criteria (team-level)** | ❌ Not provided | Assumed standard, but team-specific gates may exist |

---

## What I Can Do Right Now

I can run the pipeline in one of two modes once you supply the missing items:

### Mode A — Full DoD Audit *(recommended)*
Provide all or most of the artefacts above and I will produce:
- Line-by-line AC verification
- PR coverage gap analysis
- Test coverage assessment
- Security & NFR gate checks
- A signed-off or blocked verdict with clear remediation actions

### Mode B — Partial / Risk-Flagged Assessment
Provide what you have and I will run the pipeline with explicit **ASSUMED** and **UNVERIFIED** flags on every gate I cannot close, giving you a risk-rated incomplete report suitable for a team review conversation.

---

## Immediate Actions Required

```
ACTION REQUIRED — Story Owner / Tech Lead
─────────────────────────────────────────
1. Supply Acceptance Criteria for ham.9
2. Supply PR #214 description or diff summary
3. Supply test run results (CI output or summary)
4. Confirm whether a team-level DoD checklist applies

Pipeline will resume immediately upon receipt.
```

---

**Pipeline status:** 🔴 `BLOCKED — awaiting artefacts`
**PR #214 merge noted** — merge does not constitute DoD sign-off.

---
*Ping me with the artefacts and I'll run the full assessment.*