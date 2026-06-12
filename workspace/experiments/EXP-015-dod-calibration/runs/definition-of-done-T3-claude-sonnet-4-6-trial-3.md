# /definition-of-done — Story apk.2

> **API Key Management** | Developer Platform — Security
> Evaluating against PR #231 (merged)

---

## ⚠️ Incomplete Artefact Warning

Before running a full DoD evaluation, I need to flag that the supporting artefacts appear to be **missing or incomplete**. I can see the story metadata, but I don't have access to:

| Missing Artefact | Impact on Evaluation |
|---|---|
| Story acceptance criteria (ACs) | Cannot verify AC coverage |
| PR #231 diff / file changes | Cannot assess implementation scope |
| Test results / CI output | Cannot confirm passing pipeline |
| Design/API spec (if applicable) | Cannot verify contract compliance |
| Linked tickets / sub-tasks | Cannot check for open blockers |

---

## What I Can Do Right Now

**Option A — Proceed with a structured DoD checklist template** scoped to API Key Management stories, flagging every gate as `UNVERIFIABLE` until you paste the artefacts.

**Option B — Pause and request artefacts first**, then run a complete, accurate evaluation.

---

## Recommended: Please Provide the Following

```
1. Acceptance Criteria  — the numbered ACs from the story card
2. PR diff or summary   — changed files, key logic, migrations
3. CI/CD status         — test run output or pipeline badge
4. API spec / contract  — OpenAPI snippet, Postman collection, etc. (if exists)
5. Any open sub-tasks   — Jira/Linear links or a bullet list
```

---

### Why this matters for apk.2 specifically

API Key Management stories typically carry **high security and compliance weight**. A DoD evaluation without full artefacts risks:

- Missing an unverified security AC (e.g. key hashing, rotation, expiry enforcement)
- Overlooking a missing audit-log entry for key lifecycle events
- Skipping rate-limit or scope-restriction test coverage

Merging without a clean DoD gate on this class of story is a material risk.

---

**Please paste the artefacts and I'll run the full evaluation immediately.** 🔄