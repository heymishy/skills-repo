# Definition of Done Pipeline — `/definition-of-done`

## Story: prf.3 | User Profile Management | Profile and Account Settings

> **Trigger:** PR #227 merged
> **Pipeline Status:** Running full DoD evaluation...

---

## ⚠️ BLOCKED — Insufficient Artefacts to Complete Evaluation

Before I can run a meaningful DoD assessment, I need to flag a critical issue:

**The story artefact provided is incomplete.** A DoD pipeline requires the following inputs and none were supplied beyond the Story ID, Feature name, and Epic label.

---

## 📋 Missing Artefacts Checklist

| Artefact | Status | Why It's Needed |
|---|---|---|
| **Acceptance Criteria (ACs)** | ❌ Missing | Core pass/fail gates for the story |
| **Story description / user story statement** | ❌ Missing | Defines scope and intent |
| **PR #227 diff / summary** | ❌ Missing | Verify implementation matches ACs |
| **Test evidence** | ❌ Missing | Unit, integration, E2E coverage confirmation |
| **Design artefacts / Figma link** | ❌ Missing | UI implementation verification |
| **API contracts / schema changes** | ❌ Missing | If applicable to this story |
| **QA sign-off record** | ❌ Missing | Manual testing confirmation |
| **Accessibility check results** | ❌ Missing | WCAG compliance for profile UI |
| **Security review notes** | ❌ Missing | Profile management is a security-sensitive area |

---

## 🔍 What I Can Infer (and Why It's Not Enough)

From the label **"User Profile Management"** under **"Profile and Account Settings"** I can reasonably infer this story *likely* involves one or more of:

- Viewing/editing profile fields (name, email, avatar, etc.)
- Password or credential changes
- Account deletion or data export
- Notification preferences

However, **inferring scope is not a substitute for defined ACs.** Running a DoD check against assumed scope would produce a false pass/fail result — which is worse than no result.

---

## ✅ How to Unblock This Pipeline

Please supply **at minimum**:

### 🔴 Hard Requirements (pipeline cannot run without these)
1. **Acceptance Criteria** — the explicit pass/fail conditions agreed at story kick-off
2. **Story statement** — *"As a [user], I want to [action], so that [outcome]"*

### 🟡 Soft Requirements (will produce a partial report without these)
3. PR #227 summary or key changed files
4. Test coverage report or summary
5. QA sign-off status

---

## 📌 Suggested Next Action

> Reply with the missing artefacts and I will immediately re-run the full DoD evaluation, producing:
> - ✅ / ❌ / ⚠️ gate-by-gate verdict
> - Blockers vs. observations breakdown
> - Clear **PASS / CONDITIONAL PASS / FAIL** overall verdict
> - Any actions required before release

---

*Pipeline halted at pre-check stage. Awaiting artefact input. — `/definition-of-done` v1*