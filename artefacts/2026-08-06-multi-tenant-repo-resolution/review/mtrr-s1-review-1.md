# Review Report: Resolve each product's own repo for SaaS export, tenant-scoped — Run 1

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
**Date:** 2026-08-06
**Categories run:** A, B, C, D, E
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C (AC quality) / E (Architecture compliance) — AC3 requires: "the error response must not differ observably between 'slug doesn't exist anywhere' and 'slug exists but you can't access it.'" This conflicts with `rb-s4`'s already-shipped error handling (`src/web-ui/routes/export.js`'s `ERROR_STATUS` map): `ExportNotFoundError` → 404, `ExportAccessDeniedError` → 403 — two genuinely different, already-tested status codes for these two cases. As literally worded, AC3 would require changing that shipped behavior (unifying both to one indistinguishable response), which is a bigger change than this story's own scope suggests and would need explicit reconciliation with `rb-s4`'s own AC3 ("returns a clear 403-equivalent error naming the access problem"), not a silent behavior change. Same class of issue as the `rb-s5` file-filtering conflict from the previous feature — an AC that, taken literally, requires changing an already-shipped, already-tested guarantee.
  Fix: Narrow AC3's actual security intent. The real risk being guarded against is leaking *which tenant/repo* a slug belongs to — not necessarily that not-found and access-denied must be byte-identical responses. Reword to something like: "the error response for both cases must not reveal which repo or tenant the slug belongs to (e.g., no repo/owner name in the message) — the existing 404-vs-403 status code distinction from `rb-s4` may remain." This preserves `rb-s4`'s shipped contract while still closing the real information-leakage concern.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** A (Traceability) — the "So that..." clause describes the outcome rather than literally naming a metric (same pattern already accepted as LOW in `rb-s1` from the previous feature). Consistent with prior precedent, not new — noting for completeness rather than treating as a fresh issue.

---

## LOW findings — note for retrospective

- **[1-L1]** D (Completeness) — the persona ("every real SaaS operator/user other than the one hardcoded-repo owner") is unusually long and defined by exclusion rather than a short label. It traces directly to the benefit-metric's own persona framing, so it's not a generic "a user," but future stories in this feature might consider a shorter working name (e.g. "a multi-product operator") for readability.

---

## Summary

1 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 4 | PASS |
| Architecture compliance | 3 | PASS |

**Verdict:** FAIL — AC quality scored below 3 due to 1-H1. This is a narrow, well-scoped fix (reword one AC), not a full story rework — AC1, AC2, and AC4 are solid, testable, and already correctly mirror the D37 behavioural-correctness lesson from `rb-s4`.
