# Definition of Done Pipeline — `dash.6`

---

## ⚠️ BLOCKED — Insufficient Artefacts to Evaluate

Before I can run a meaningful DoD assessment, I need to flag that the story artefact provided is **critically incomplete**. I cannot make a reliable pass/fail determination against a Definition of Done without the core content.

---

## Missing Artefacts Checklist

The following are absent or not provided:

| # | Missing Item | Why It's Needed |
|---|---|---|
| 1 | **User Story / Acceptance Criteria** | Cannot verify functional completeness or AC sign-off |
| 2 | **PR #238 content / diff summary** | Cannot verify the implementation matches the story intent |
| 3 | **Test evidence** (unit, integration, E2E) | Cannot confirm test coverage requirements are met |
| 4 | **QA / review sign-off** | Cannot confirm peer review or QA approval |
| 5 | **Design artefacts / Figma ref** (if applicable) | Cannot confirm UI implementation matches design spec |
| 6 | **Definition of Done criteria** (team-level or project-level) | Cannot evaluate against agreed standards without knowing them |

---

## What I Can Confirm

| Item | Status | Notes |
|------|--------|-------|
| PR #238 merged | ✅ | As stated by operator |
| Story metadata present | ✅ | ID, Feature, Epic recorded |

---

## Next Steps

To proceed with the DoD pipeline, please provide **one or more** of the following:

1. **The full story** — including the "As a / I want / So that" statement and Acceptance Criteria
2. **PR #238 summary** — description, linked tickets, reviewer approvals
3. **Your team's Definition of Done** — the criteria list I should evaluate against
4. **Test and QA evidence** — results, coverage reports, or sign-off notes

---

> 🔁 Once artefacts are provided, I will re-run the full pipeline and produce a structured DoD evaluation with per-criterion status, risk flags, and a final `PASS / FAIL / CONDITIONAL` verdict.