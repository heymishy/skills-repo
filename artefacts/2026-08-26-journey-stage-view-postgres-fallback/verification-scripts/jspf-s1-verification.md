# AC Verification Script: Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites

**Story reference:** artefacts/2026-08-26-journey-stage-view-postgres-fallback/stories/jspf-s1-postgres-fallback-for-stage-view.md
**Technical test plan:** artefacts/2026-08-26-journey-stage-view-postgres-fallback/test-plans/jspf-s1-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story's changes live in one file: `src/web-ui/routes/journey.js` (new helper + 4 call-site edits).
2. Run the automated checks with: `node tests/check-jspf-s1-journey-postgres-fallback.js`
3. For a real, hands-on check on staging/production: you need a journey whose disk artefact is genuinely missing (e.g. any journey created before the most recent redeploy, or a repo-less feature).

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: Resuming a conversation shows real content, not "No artefact content found"

**Covers:** AC1

**Steps:**
1. On the deployed app, find a feature created some time ago (ideally one that predates the most recent deploy, or has no repo connected).
2. Click "Resume conversation" (or navigate to `/journey/:id/stage/:stage` for a completed stage).

**Expected outcome:**
> The real completed-stage content is shown — not "No artefact content found."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The story-list page still auto-populates from the definition artefact

**Covers:** AC2

**Steps:**
1. For a journey with a completed `definition` stage (ideally disk-missing, per Scenario 1's setup), navigate to the story-list entry page.

**Expected outcome:**
> The textarea is pre-filled with the story IDs from the definition content, not empty.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Starting review after story-list submission carries forward real prior context

**Covers:** AC3 (highest severity — this is an AI-context correctness check, not just a visual one)

**Steps:**
1. Submit the story-list form for a journey whose earlier stages' disk content is missing.
2. Once the review session starts, ask it something that requires knowledge of an earlier stage's content (e.g. "what was the discovery scope again?").

**Expected outcome:**
> The review session correctly references real prior-stage content — it does not behave as if no discovery/definition content exists.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A live conversation is completely unaffected

**Covers:** AC5 (regression guard)

**Steps:**
1. Start a brand-new conversation and complete a stage in the same session (disk content is fresh, not missing).
2. Resume it, view the story-list page, and start review as normal.

**Expected outcome:**
> Everything behaves exactly as it did before this fix — no visible change for the common, same-deploy-lifetime case.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Post-merge smoke test note

Scenario 1 is the direct fix for the operator-reported bug and the most important real-world check. Scenarios 2 and 3 confirm the audit-found sites are genuinely fixed, not just theoretically. Scenario 4 confirms no regression to the common working case.
