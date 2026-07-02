# Epic 1: Foundation — Auth Spike + Public Entry Point

**Feature:** 2026-07-01-landing-auth-billing
**Epic slug:** lab-e1-foundation
**Slicing strategy:** Risk-first — highest-risk unknown (ESM/CJS incompatibility with Better Auth) resolved in story 1 before any auth implementation commits to a path. Landing page is parallel low-risk work.
**Architecture guardrails:** Checked against `.github/architecture-guardrails.md` 2026-07-01. Relevant constraints: CJS-only (Style Guide); ADR-011 (Artefact-first for new `src/` modules); Injectable adapter rule D37 (CLAUDE.md); `rotateSessionId` mandatory after any provider login (CLAUDE.md sec-perf); ADR-018 (Playwright for browser-facing ACs). No regulated constraints apply.
**Human oversight level:** High (solo operator — all review and approval by Hamish King; W4 risk-accepted per `.github/architecture-guardrails.md` Operating Posture)
**Status:** Not started

---

## Rationale for grouping

Epic 1 contains the two work tracks that can proceed before any auth implementation choice is made: (1) the spike that produces the implementation choice, and (2) the landing page which has no dependency on auth internals. Story s1.3 (auth provider registry) is placed here because it is the direct implementation output of the spike — it consumes the spike recommendation and cannot begin until s1.1 is complete.

---

## Stories

| Slug | Title | Dependency | Metric |
|------|-------|------------|--------|
| lab-s1.1 | Auth tech spike — ESM/CJS path recommendation | None | Unblocks M1, M2 |
| lab-s1.2 | Landing page at `/` | None (parallel to s1.1) | M1 |
| lab-s1.3 | Multi-provider auth registry (GitHub primary) | lab-s1.1 complete | M1, M2 |

---

## Exit criteria

Epic 1 is complete when:
1. Spike recommendation (Path A, B, or C) is documented and approved
2. Landing page is live with CTA that correctly initiates the auth flow
3. Multi-provider auth registry is deployed, GitHub OAuth continues to work, and session rotation is verified
4. `decisions.md` ARCH-002 is updated with the chosen path
