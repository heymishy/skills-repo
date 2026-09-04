# NFR Profile: dockerignore-artefacts-and-github-exclusion-fix

**Feature:** 2026-09-04-dockerignore-artefacts-and-github-exclusion-fix
**Created:** 2026-09-04
**Last updated:** 2026-09-04
**Status:** Verified at 2026-09-04 (DoD)

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Negligible image size increase | ~38MB combined (`artefacts/` 36MB + `.github/` 2.4MB), confirmed via `du -sh` before writing this story | Direct measurement | daga-s1 |
| Negligible startup cost for the writer's own new check | One `fs.existsSync` call at factory-creation time (server startup), not per-request | Code review | daga-s1 |

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No secrets baked into the image | `artefacts/` and `.github/` spot-checked for API-key/token/password patterns before this story was written — all matches confirmed false positives | Direct investigation, documented in the story's own Benefit Linkage | daga-s1 |
| `.env`/`.env.*` remain excluded | Unaffected by this story — a separate, already-correct exclusion | Code review | daga-s1 |
| No silent data-loss regression | `pipelineStateWriter`'s own safe-failure behaviour in a non-checkout deployment is preserved via Fix 2, not accidentally inverted by Fix 1 | Automated test (AC4/AC5) | daga-s1 |

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|--------------------|-------------------|-----------------|
| Not applicable | — | — | — |

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| No new failure mode | The writer's own new precondition preserves today's exact safe-failure behaviour in production, just derived from a more precise signal | Automated test (AC4) | |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-------------------------|---------------------|-------------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

_None identified at 2026-09-04 — the one real risk found during DoR preparation (the `owle.6` writer's own precondition inverting) was investigated, confirmed, and resolved with the operator via `AskUserQuestion` before finalizing this story, not left open._
