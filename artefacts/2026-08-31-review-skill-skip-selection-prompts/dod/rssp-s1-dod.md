# Definition of Done: Remove /review's story-selection and category-selection prompts

**PR:** https://github.com/heymishy/skills-repo/pull/799 | **Merged:** 2026-08-30 (`e25bff4d1bbf0fb05655cc1f235b2b8611d46ffa`)
**Story:** artefacts/2026-08-31-review-skill-skip-selection-prompts/stories/rssp-s1-remove-review-selection-prompts.md
**Test plan:** artefacts/2026-08-31-review-skill-skip-selection-prompts/test-plans/rssp-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Step 1 selection prompt removed, direct statement present): `"Review all stories, or a specific one?"` absent from `skills/review/SKILL.md`; a direct, non-interrogative "Reviewing all N stories, all 5 categories" statement present instead | `tests/check-rssp-s1-review-skill-no-selection-prompts.js`, content-assertion test | None |
| AC2 | ✅ | AC2 (Step 2 category-selection menu removed): `"Which review categories should I run?"` and its numbered reply-menu block are absent — Step 2 no longer exists as a decision point | Same test file | None |
| AC3 | ✅ | AC3 (explicit-instruction exception preserved): the carve-out language — respecting an operator-named specific story rather than ignoring it — is still present, unmodified in substance | Same test file | None |
| AC4 | ⚠️ | AC4 (Session recovery / already-reviewed exclusion logic unchanged): the "Session recovery check" language is present and unmodified in substance | Same test file | This AC only proves the text is unchanged, not that the runtime skipping behavior it describes still works end-to-end — no runtime code path exists for a markdown instruction file to test that against (per the test plan's own Coverage gaps note), so a content-level assertion is the correct and complete verification type here, not a partial one |

---

## Scope Deviations

None to the story's own scope. AC4's ⚠ above is a test-methodology note carried over verbatim from the test plan's Coverage gaps section, not an implementation gap — the story only ever committed to a content-level fix and content-level verification for a markdown instruction file (no runtime code path exists to test more deeply, matching this repo's own precedent for SKILL.md content tests).

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4 (AC1–AC4)
**Tests passing in CI:** 4/4, plus the full suite (576/576 at merge time) confirming no other governance/contract check regressed

**Gaps (tests not implemented):** The test plan's own declared Out of Scope item — "a live end-to-end run of `/review` (CLI or web UI) confirming the model actually follows the updated instruction without asking" — is explicitly untestable pre-merge (model instruction-following is not deterministic) and was deferred to a manual post-merge confirmation, per the test plan's Test Gaps and Risks table.

**Layout gap audit:** N/A.

---

## NFR Status

No NFRs applicable — text-only change to a markdown instruction file (per story and test plan).

---

## Metric Signal

No formal benefit-metric artefact — short-track. This is the third confirmation of the same underlying operator preference (first two: 2026-08-06 `multi-tenant-repo-resolution`, 2026-08-07 `cross-surface-state-sync`), now finally written into the governed `SKILL.md` file itself rather than surviving only as an agent's own in-session behavioral adaptation. The real signal — no `/review` session (CLI or web UI) asking the removed questions again — is exactly what the test plan deferred to manual post-merge confirmation, and what the operator is running now (production journey `af17f555`, post-promotion).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Deviation:** AC4's verification is a content-assertion, not a runtime behavioral test (see AC Coverage table) — an accepted, pre-declared limitation of testing a markdown instruction file, not a shortfall discovered late.

**Follow-up actions:**
1. Manual confirmation of the test plan's declared Out-of-Scope item — a live `/review` session (CLI or web UI) proceeding without either removed prompt — is in progress now (operator retesting against production journey `af17f555` following prod promotion). Not yet observed as of this DoD; update this artefact or capture-log.md once confirmed.

---

## DoD Observations

1. **Root-cause misattribution, corrected same-day.** This fix was originally believed to be the full explanation for a live "review asks which stories" incident report. Re-investigating the operator's original URL after this fix merged revealed a second, unrelated bug (`daep-s1`) in a completely different code path (a hardcoded story-list form, not this skill's own chat prompt). Both fixes were real and necessary — the lesson is procedural: when a bug report includes a specific URL, fetch and read that URL's actual rendering code before considering a fix complete, rather than stopping at the first plausible-looking root cause.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Remove /review's story-selection
and category-selection prompts (rssp-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable
   behaviour, or CI run)?
2. Is AC4's ⚠ status justified as a methodology limitation, not a silently
   under-tested AC?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE)
   consistent with the AC and deviation rows?
4. Is Follow-up action #1 (live manual confirmation) tracked somewhere an
   operator will actually see it, not just buried in this file?
Report findings as HIGH / MEDIUM / LOW.
```
