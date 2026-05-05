# Benefit Metric: Web UI Model-First Chat Architecture

**Feature:** 2026-05-05-web-ui-model-first-chat
**Discovery reference:** artefacts/2026-05-05-web-ui-model-first-chat/discovery.md
**Status:** Active
**Created:** 2026-05-05
**Baseline set by:** Hamish King — 2026-05-05

---

## Metric M1 — Discovery artefact template conformance rate

**Definition:** Percentage of web UI discovery sessions whose committed artefact has all 11 required H2 sections from `.github/templates/discovery.md` in order.

**Baseline:** 0% — current implementation produces wrong sections derived from SKILL.md operational headings. No session produces a conforming artefact.

**Target:** 100% — every web UI discovery session produces a conforming artefact.

**Measurement:** Run `/trace` against a committed web UI artefact. Count H2 sections present vs required template sections.

**Signal:** Not yet measured.

**Evidence (M1):** _(to be filled post-merge by /definition-of-done)_

---

## Metric M2 — Model-driven question adaptation visible in session transcript

**Definition:** Percentage of sessions where the model's questions visibly build on prior answers (not a fixed SKILL.md list). Assessed by reviewing the conversation `turns[]` in session state for a sample of 5 sessions.

**Baseline:** 0% — all questions come from a fixed scraped list; none adapt to operator answers.

**Target:** ≥ 80% of sessions show at least one model question that references content from a prior answer.

**Measurement:** Manual review of session turns in the browser network tab or server log for 5 consecutive sessions after merge.

**Signal:** Not yet measured.

---

## Metric M3 — Test suite health after rewrite

**Definition:** npm test passes with 0 failures after the 7 test file rewrites land. This is a binary gate — not a percentage.

**Baseline:** Before this story: all 7 test files test scrape-first behaviour that will be replaced.

**Target:** npm test: 0 failures, all tests cover model-first chat behaviour.

**Signal:** on-track

**Evidence (M3):** npm test: 0 failures. All 25 tests in check-mfc1-model-first-chat-session.js pass. 7 rewritten test files pass. Governance 70/70. Commit d793217. Date: 2026-05-06.
