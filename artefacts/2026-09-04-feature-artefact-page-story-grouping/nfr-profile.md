# NFR Profile: feature-artefact-page-story-grouping

**Feature:** 2026-09-04-feature-artefact-page-story-grouping
**Created:** 2026-09-04
**Last updated:** 2026-09-04
**Status:** Verified at 2026-09-04 (DoD)

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Local file read replaces a heavier Postgres query for this purpose | `fs.readFileSync` + `JSON.parse` of `.github/pipeline-state.json` (~1.36MB), no network round-trip | Code review — confirm no new query is added, and `fal-s1`'s own conditional Postgres taxonomy-scan is untouched | fapg-s1 |
| No behaviour change for the common (single-story) case | Single-story features skip all new logic entirely (early return to unchanged `renderArtefactIndexHtml`) | Automated test (AC2) | fapg-s1 |

**Source:** Story Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No new external input | Reads a file already fully accessible to this process via `repoRoot`, the same trust boundary `listLocalArtefacts` already operates within | N/A | fapg-s1 |

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
| Graceful degradation, not a new failure mode | When `pipeline-state.json` is absent locally, the page still renders (today's flat list) rather than erroring | Automated test (AC4) | |

---

## Accessibility

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| Keyboard- and screen-reader-operable accordion | Native `<details>`/`<summary>` elements, no custom JS state management | WCAG — native disclosure widget semantics | fapg-s1 |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-------------------------|---------------------|-------------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

_None identified at 2026-09-04 — both open design questions (query approach, single-story UX) were confirmed with the operator before this story was written._
