# AC Verification Script: sar.1 — Audit record slug resolution fix

**Story:** Fix audit record to resolve feature slug from PR body, not pipeline-state heuristic
**For use at:** Pre-code sign-off · Post-merge smoke test · Delivery review

---

## Setup

You need: a local clone with `npm` available, and a GitHub PR open against this repo (or a recently merged PR).

Reset between scenarios: no shared state — each scenario is independent.

---

## Scenario 1 — Slug extracted from a standard PR body (AC1, AC3, AC5)

**What you are checking:** When a PR body contains artefact paths in the Chain references table, the audit record shows artefacts from the correct feature — not from an unrelated one.

1. Find a merged PR that used the standard PR template (e.g. any p11.x PR).
2. Open the PR on GitHub and scroll to the "Governed Delivery Audit Record" comment posted by the assurance gate bot.
3. Look at the "What was delivered" table header line.
4. **Expected:** The header includes `Source: PR body (Chain references)` and the artefact paths in the table all start with the feature slug matching the "Chain references" table in the PR body.
5. **Broken behaviour:** Header shows no source label, OR artefact paths are from a different feature (e.g. CAA artefacts on a p11.x PR).

---

## Scenario 2 — Fallback notice when PR body has no artefact paths (AC2, AC4)

**What you are checking:** When a minimal stub PR body is used (no Chain references table), the audit record shows a warning rather than silently displaying wrong artefacts.

1. Find a PR opened with a minimal stub body (no "Chain references" section) or open a test PR with a blank body.
2. Open the "Governed Delivery Audit Record" comment.
3. Look at the "What was delivered" section header.
4. **Expected:** The header includes `⚠️ slug auto-resolved from pipeline-state — verify artefacts are correct`.
5. **Broken behaviour:** No warning shown, OR the artefacts shown are from a completely wrong feature with no indication of the issue.

---

## Scenario 3 — Empty/null body does not crash the workflow (AC2)

**What you are checking:** The extraction function handles edge cases without throwing.

1. Run: `node -e "const {extractPRSlug} = require('./scripts/extract-pr-slug'); console.log(JSON.stringify(extractPRSlug(null))); console.log(JSON.stringify(extractPRSlug('')));"`
2. **Expected:** Prints `""` twice. No error, no crash.
3. **Broken behaviour:** Uncaught exception or process exits with code 1.

---

## Scenario 4 — CLI invocable from shell (AC3)

**What you are checking:** The script works when called from the bash step in the workflow.

1. Run: `PR_BODY="| Discovery | \`artefacts/2026-04-29-audit-slug-resolution/discovery.md\` |" node scripts/extract-pr-slug.js`
2. **Expected:** Prints `2026-04-29-audit-slug-resolution` (just the slug, no extra output).
3. **Broken behaviour:** Empty output, an error message, or a slug from a different feature.
