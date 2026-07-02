# DoR Contract — lab-s1.1 — Auth tech spike: ESM/CJS path recommendation

**Story:** lab-s1.1
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

A time-boxed (1 operator day) technical investigation producing one artefact: `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md`. The document will contain: (1) the chosen path (A, B, or C), (2) rationale, (3) for Path B: migration cost estimate, (4) for Path A/B: go/no-go on Better Auth with Neon Postgres adapter, (5) session schema migration strategy, (6) list of stories unblocked.

`artefacts/2026-07-01-landing-auth-billing/decisions.md` ARCH-002 entry will be updated from "DEFERRED to spike exit" to the chosen path.

## What will NOT be built

- No new `src/` modules or route handlers
- No Better Auth installation committed to master (test-only, local branch)
- No implementation of any auth provider flow
- No deployment or production wiring changes

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read `research/auth-spike-outcome.md` — assert all 5 required sections present | Document verification (unit) |
| AC2 | Time-box constraint — verified by spike start/end timestamps in the artefact | Document verification (unit) |
| AC3 | If Path C: run proof-of-concept against GitHub OAuth test endpoint | Manual (conditional) |
| AC4 | If Path A/B: confirm Neon adapter compatibility documented in artefact | Document verification (conditional) |
| AC5 | Read `decisions.md` — assert ARCH-002 no longer reads "DEFERRED" | Document verification (unit) |

## Assumptions

- No prior art artefact or existing spike output exists (clean start)
- Better Auth npm package is available for local test installation
- GitHub OAuth test credentials are available in `.env` for Path C proof-of-concept if needed
- The spike exits with a decision regardless of remaining open questions

## Estimated touchpoints

Files: `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md` (new), `artefacts/2026-07-01-landing-auth-billing/decisions.md` (modified — ARCH-002 update)
Services: none
APIs: GitHub OAuth endpoint (if Path C proof-of-concept is required)

## schemaDepends

None — lab-s1.1 has no upstream story dependencies.
