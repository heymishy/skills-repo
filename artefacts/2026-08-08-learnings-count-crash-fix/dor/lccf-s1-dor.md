## Definition of Ready: lccf-s1 — Make the landing page's learnings counter fail open instead of crashing the server

**Story:** artefacts/2026-08-08-learnings-count-crash-fix/stories/lccf-s1-fail-open-learnings-count.md
**Review artefact:** artefacts/2026-08-08-learnings-count-crash-fix/review/lccf-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-08-learnings-count-crash-fix/test-plans/lccf-s1-test-plan.md
**Date:** 2026-08-08

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/content/learnings-count.js` — wrap the `fs.readFileSync` in `getLearningsCount()` in a try/catch, returning a fallback integer (`0`) on any read failure instead of propagating the exception.
- `tests/check-lccf-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `Dockerfile` — not fixing the deploy-artifact mismatch as part of this story (see story Out of Scope); the correct shape is a server that tolerates the file's absence.
- `src/web-ui/routes/public.js` — no change needed; it already just interpolates whatever `getLearningsCount()` returns, and will work correctly once that function stops throwing.
- `src/web-ui/templates/landing.html` — no change; the `<!--LEARNINGS_COUNT-->` placeholder and its surrounding copy are unaffected.

### Architecture Constraints

No structural or architectural decision is introduced by this fix (single function, defensive error handling only) — `.github/architecture-guardrails.md` guardrails for shared surface modules are not implicated, and no ADR is required. This is a bug fix (D40-adjacent defensive-programming correction), not a new pattern.

### Human oversight

**Low** — single-function fix, root cause independently confirmed via source inspection, Dockerfile inspection, AND live production log output (three independent confirmations, not speculation), complexity 1, no upstream/downstream dependency beyond unblocking `lphf-s5`. No sign-off required beyond this DoR artefact. Elevated priority given active outage, but oversight level (process rigor) is unaffected — the fix is small and low-risk.

### Coding Agent Instructions

1. In `src/web-ui/content/learnings-count.js`, wrap the body of `getLearningsCount()` in try/catch:
   ```javascript
   function getLearningsCount() {
     try {
       var filePath = path.join(__dirname, '..', '..', '..', 'workspace', 'learnings.md');
       var raw = fs.readFileSync(filePath, 'utf8');
       var matches = raw.match(/^## /gm) || [];
       return matches.length;
     } catch (e) {
       return 0;
     }
   }
   ```
2. Do not touch `public.js` or `landing.html` — they already handle whatever numeric value `getLearningsCount()` returns.
3. Write the 3 new unit tests per the test plan (missing-file fallback, require-succeeds-when-missing, happy-path-unchanged).
4. Re-run `tests/check-lphf-s4-self-improving-card.js` to confirm AC4 — zero regressions.
5. This fix must ship as fast as safely possible — staging is actively down. Follow full TDD (RED before GREEN) but do not add scope beyond the try/catch.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — this fix has no layout-dependent AC)

**PROCEED: Yes**
