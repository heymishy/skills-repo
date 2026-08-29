# NFR Profile: Fix p3.5 validate-trace timeout flake

**Feature:** 2026-08-30-fix-p35-validate-trace-timeout-flake
**Created:** 2026-08-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Increased pwsh spawn timeout must not mask a genuinely broken validate-trace.ps1 indefinitely | New timeout (90s) stays well within `run-all-tests.js`'s own 120s per-file outer timeout | Code review of the chosen constant against the outer harness's own timeout | p35tf-s1 |

**Source:** Story ACs — the tradeoff is explicit in the story's own NFR section.

---

## Security

Not applicable — this story touches one test file's own timeout configuration, no user-facing or data-handling surface.

---

## Data residency

Not applicable.

---

## Availability

Not applicable — test infrastructure, not a deployed service.

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None.
