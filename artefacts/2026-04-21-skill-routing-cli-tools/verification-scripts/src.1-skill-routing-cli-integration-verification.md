# AC Verification Script: src.1 — Integrate CLI observability tools into skill routing

**Story:** artefacts/2026-04-21-skill-routing-cli-tools/stories/src.1-skill-routing-cli-integration.md
**Audience:** Platform operator (BA / QA / domain expert)
**Serves:** Pre-code sign-off confirmation, post-merge smoke test, delivery review

---

## How to use this script

Read each scenario and confirm that the described behaviour is correct before the coding agent implements. After the PR is merged, re-read each scenario and verify the live SKILL.md files match. Each scenario should take under 2 minutes to complete.

---

## Scenario 1 — `/workflow` session start surfaces the daily status report tool

**AC:** AC1

**What to check:**
Open `.github/skills/workflow/SKILL.md` in a text editor. Search for the text `generate-status-report.js`.

**Expected result:** The text appears in a section that describes what to do at session start when there are active (non-done) features. The callout should read something like: "To see a detailed status report: `node scripts/generate-status-report.js --daily`" and it should appear before the prompt asking which feature to work on.

**Broken behaviour looks like:** The string `generate-status-report.js` does not appear anywhere in the file, or it appears only in a comment or out-of-context location that operators would not see during normal flow.

---

## Scenario 2 — `/workflow` includes both --daily and --weekly flag variants

**AC:** AC2

**What to check:**
In `.github/skills/workflow/SKILL.md`, search for `--daily` and `--weekly`. Also look for trigger phrases like "daily report", "weekly report", or "status report" in the triggers section or session start routing logic.

**Expected result:** Both `--daily` and `--weekly` appear as explicit flag options. At least one trigger phrase (daily report, weekly report, pipeline status report) appears so that operators who ask for a status report are routed to the correct command.

**Broken behaviour looks like:** Only `--daily` is mentioned and `--weekly` is absent, or the flag variants are present but no trigger phrase routes the operator to them.

---

## Scenario 3 — `/improve` completion section includes benefit comparison callout

**AC:** AC3

**What to check:**
Open `.github/skills/improve/SKILL.md`. Search for `record-benefit-comparison.js`. Find the section where the benefit comparison callout appears relative to the standard learning extraction steps (Categories A–E).

**Expected result:** A `## Benefit Measurement` section (or equivalent heading) appears in the improve skill's completion output block. It provides the command `node scripts/record-benefit-comparison.js --feature <slug>` with a note that this records delivery actuals for EXP-001. The `--feature` flag and the EXP-001 reference are both present.

**Broken behaviour looks like:** `record-benefit-comparison.js` appears in the file but `EXP-001` is not mentioned, or the `--feature` flag is absent, or the callout appears before Category A findings rather than in the completion section.

---

## Scenario 4 — `/improve` benefit comparison is explicitly non-blocking

**AC:** AC4

**What to check:**
In the benefit comparison section of `.github/skills/improve/SKILL.md`, look for language indicating that the comparison run can be deferred or skipped without blocking the skill from completing.

**Expected result:** The section uses at least one of: "defer", "skip", "optional", "non-blocking" to indicate that an operator can proceed to learning extraction even if they choose not to run the comparison now.

**Broken behaviour looks like:** The benefit comparison section implies the operator must run the script before the skill will continue — no skip or defer path is offered.

---

## Scenario 5 — Both SKILL.md changes use the correct node invocation prefix

**AC:** AC5

**What to check:**
In workflow/SKILL.md, verify the invocation reads `node scripts/generate-status-report.js` (not just `generate-status-report.js` or `./scripts/generate-status-report.js`). In improve/SKILL.md, verify the invocation reads `node scripts/record-benefit-comparison.js`.

**Expected result:** Both invocations use the `node scripts/` prefix exactly, matching the documented CLI usage for both tools.

**Broken behaviour looks like:** The script is shown as `./scripts/generate-status-report.js` (missing `node`), or as `generate-status-report --daily` (missing `node scripts/`), or with a different path prefix.

---

## Sign-off

| Reviewer | Role | Date | Confirmed |
|----------|------|------|-----------|
| | | | |
