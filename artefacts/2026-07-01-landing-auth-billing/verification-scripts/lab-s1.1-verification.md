# AC Verification Script — lab-s1.1 — Auth tech spike: ESM/CJS path recommendation

**Story:** lab-s1.1
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / domain expert reviewing the spike exit deliverable

---

## Purpose

This script is used for three moments:
1. **Pre-code sign-off** — confirm the spike exit document and decisions.md update are correct before implementation stories begin.
2. **Post-spike smoke test** — confirm the spike output meets AC1–AC5 after the investigation concludes.
3. **Delivery review** — structured walkthrough confirming the spike has exited with a concrete recommendation.

---

## Setup

No server required. Open a terminal in the repo root. Have the following files open in an editor or viewer:
- `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md`
- `artefacts/2026-07-01-landing-auth-billing/decisions.md`

---

## Scenarios

### Scenario AC1 — Spike outcome document is complete

1. Open `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md`.
2. Confirm the document exists and is not empty.
3. Check the document contains all of the following sections (in any order):
   - A clear statement of which path is recommended: "Path A", "Path B", or "Path C"
   - A rationale section explaining why that path was chosen over the others
   - If Path B: a migration cost estimate listing files to change and estimated time
   - If Path A or B: confirmation that the Neon Postgres adapter is compatible (or the specific configuration required)
   - If Path A or B: the session schema migration strategy (transparent vs forced re-auth)
   - A list of implementation stories that are now unblocked (at minimum "lab-s1.3")
4. **Expected:** All applicable sections are present. A section labelled "needs more investigation" without a concrete recommendation is a FAIL.

**Run check:** `node tests/check-lab-s1.1-auth-spike.js`
Expected output: all T1.1–T1.6, T2.1–T2.2 pass. Zero failures.

---

### Scenario AC2 — Spike completed within one time-box (process gate, manual)

1. Check the date of the first commit that adds `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md`.
2. Compare it to the date the spike was declared started (recorded in `workspace/state.json` or the sprint board).
3. **Expected:** The time between spike start and spike outcome commit is no more than 1 operator working day (8 hours). A spike that took more than 1 day is not a FAIL of the artefact, but should be captured in `workspace/capture-log.md` as a learning signal.

---

### Scenario AC3 — Path C proof-of-concept (conditional — only if Path C was chosen)

*Skip this scenario if Path A or B was chosen.*

1. Locate the proof-of-concept referenced in the spike outcome document.
2. Run it against GitHub's OAuth endpoint in test mode (requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` set locally).
3. **Expected:** The GitHub OAuth exchange (authorise → callback → token → user identity) completes. The final step prints the GitHub user's login name. No Better Auth package is used — only `fetch()` calls.

---

### Scenario AC4 — Neon Postgres adapter compatibility (conditional — only if Path A or B was chosen)

*Skip this scenario if Path C was chosen.*

1. Locate the Neon adapter test results in the spike outcome document.
2. Confirm the document states either: (a) "Neon Postgres adapter initialises with existing `DATABASE_URL` without additional pooling configuration" OR (b) a specific pooling requirement is documented.
3. **Expected:** One of (a) or (b) is present. A statement of "untested" is a FAIL.

---

### Scenario AC5 — decisions.md ARCH-002 is updated

1. Open `artefacts/2026-07-01-landing-auth-billing/decisions.md`.
2. Find the ARCH-002 entry.
3. Confirm the status is NOT "DEFERRED to spike exit".
4. Confirm the chosen path name ("Path A", "Path B", or "Path C") appears in the ARCH-002 entry with a one-sentence rationale.
5. **Expected:** ARCH-002 is updated. If it still says "DEFERRED to spike exit", the spike is not complete.

---

## Reset instructions

No shared state between scenarios — each reads from the file system only. No reset needed.
