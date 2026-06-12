# Definition of Done Pipeline — `/definition-of-done`

**Story:** `apk.2` | **Feature:** API Key Management | **Epic:** Developer Platform — Security
**Trigger:** PR #231 merged

---

## ⚠️ PIPELINE BLOCKED — Insufficient Artefacts

Before I can run a meaningful Definition of Done assessment, I need to flag a critical issue:

**The story artefact provided is incomplete.** I have the Story ID, Feature, and Epic — but the actual story content is missing.

---

## 📋 Required Inputs Checklist

To run `/definition-of-done` properly, I need the following. Please provide what is missing:

### 1. Story Detail *(missing)*
- [ ] User story statement (`As a... I want... So that...`)
- [ ] Acceptance Criteria (ACs) — the specific, testable conditions
- [ ] Story description / background context
- [ ] Definition of Ready notes (if any)

### 2. PR #231 Content *(missing)*
- [ ] PR description / summary of changes
- [ ] Files changed (or a summary)
- [ ] Linked test evidence (test run results, coverage report)
- [ ] Reviewer approvals noted

### 3. Supporting Artefacts *(missing)*
- [ ] Test plan or test cases mapped to ACs
- [ ] QA sign-off or exploratory testing notes
- [ ] Design artefacts / API contract (e.g. OpenAPI spec changes)
- [ ] Security review sign-off *(especially relevant for API Key Management)*
- [ ] Documentation updates (API docs, runbooks, changelogs)

---

## 🔍 Why This Matters for `apk.2` Specifically

Given this story sits within **Developer Platform — Security**, I would apply heightened scrutiny to:

| Area | Risk if Skipped |
|---|---|
| Security review | Key generation, storage, or transmission flaws |
| Rotation / revocation logic | Orphaned keys, privilege persistence |
| Secrets exposure in logs/responses | Compliance and data breach risk |
| Rate limiting & scope enforcement | Abuse vectors |
| Documentation | Developer misuse of the API |

These aren't box-ticking concerns — they are genuine risk vectors for a security feature.

---

## ✅ Next Step

**Please paste the missing artefacts** — story body, ACs, and PR #231 details — and I will immediately run the full DoD assessment, scoring each criterion and flagging any gaps before this story is marked complete.