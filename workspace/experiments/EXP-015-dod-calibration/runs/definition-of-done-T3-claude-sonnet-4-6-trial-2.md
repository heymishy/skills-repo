# Definition of Done Pipeline — `/definition-of-done`

**Story:** `apk.2` | **Feature:** API Key Management | **Epic:** Developer Platform — Security
**Trigger:** PR #231 merged

---

## ⚠️ Pipeline Blocked — Insufficient Artefacts

Before I can run a meaningful DoD assessment, I need to flag that the story artefact provided is **incomplete**. I have a Story ID, Feature, and Epic, but I'm missing the core content needed to evaluate completion.

---

## 📋 Required Artefacts Checklist

The following are **missing or not provided**:

| Artefact | Status | Required For |
|---|---|---|
| Story description / user story statement | ❌ Missing | Scope validation |
| Acceptance Criteria (ACs) | ❌ Missing | AC sign-off evaluation |
| Technical / implementation notes | ❌ Missing | Code review alignment |
| PR #231 contents / diff summary | ❌ Missing | Change verification |
| Test evidence (unit, integration, e2e) | ❌ Missing | Quality gates |
| Definition of Done checklist (team's) | ❌ Missing | Gate-by-gate assessment |
| Story point estimate & actuals | ⚠️ Optional | Velocity tracking |
| Linked tasks / sub-tasks | ⚠️ Optional | Completeness check |

---

## 🔁 What I Need From You

Please provide **at minimum**:

1. **The user story statement**
e.g. *"As a developer, I want to… so that…"*

2. **Acceptance Criteria**
The numbered or bulleted ACs as written at story kick-off

3. **Any of the following (helpful but not blocking):**
- PR #231 description or summary
- Test results / coverage output
- Your team's DoD checklist (if custom)
- Any known issues, flags, or exceptions raised during review

---

## 💡 Note on PR #231

The fact that **PR #231 has already been merged** means:

- Code review gate is likely passed ✅
- But merging ≠ DoD complete — I'll still need to verify ACs, test coverage, documentation, and any deployment/release gates depending on your team's definition

---

> **Pipeline status: `WAITING_FOR_INPUT`**
> Provide the missing artefacts above and I'll run the full DoD assessment immediately.