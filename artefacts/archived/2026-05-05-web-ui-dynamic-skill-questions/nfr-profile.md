# NFR Profile: Web UI Dynamic Skill Questions

**Feature:** 2026-05-05-web-ui-dynamic-skill-questions
**Created:** 2026-05-05
**Stories covered:** dsq.1, dsq.1.5, dsq.2, dsq.3, dsq.4

---

## Data Classification

**Classification:** Internal operational data
No PII, PCI, or regulated data processed by any story in this feature. Session content (operator answers to skill questions) is transient in-memory state, not persisted to disk, not transmitted externally other than to the Copilot API (already established via wuce.26 with accessToken). No new data classification concerns introduced.

---

## Compliance NFRs

**None.** No regulatory clauses apply to this feature. All model API calls use the existing `req.session.accessToken` mechanism established in wuce.26.

---

## Performance NFRs (consolidated across stories)

| Story | NFR | Threshold |
|-------|-----|-----------|
| dsq.1 | `_nextQuestionExecutor` timeout | ≤ 10 000 ms — silent fallback to static list on timeout |
| dsq.2 | `_sectionDraftExecutor` timeout | ≤ 15 000 ms — silent fallback (session advances without confirmation step) on timeout |
| dsq.1.5 | `extractSections` must parse synchronously | < 10 ms for any SKILL.md of normal length |
| dsq.3 | Complete page render | Static HTML — no model call, no additional latency budget required |
| dsq.4 | `htmlGetPreview` section assembly | Synchronous string operations — no I/O, no additional latency budget required |

---

## Security NFRs (consolidated across stories)

- `req.session.accessToken` is the canonical token field across all stories — never `req.session.token`, never logged, never surfaced in error messages or HTML responses.
- Session content (operator answers) must not appear in the HTML of the complete page (dsq.3).
- No new external endpoints introduced by any story in this feature.

---

## Resilience NFRs (consolidated across stories)

- dsq.1: Any exception from `_nextQuestionExecutor` is caught at call site — silent fallback, no propagation to HTTP response.
- dsq.2: Any exception from `_sectionDraftExecutor` is caught at call site — silent fallback, session advances normally.
- All adapter stub defaults must throw (not return null/empty) — misconfiguration is loud, not silent.

---

## Accessibility NFRs

- dsq.3: "Commit artefact" and "Run /clarify first" must be rendered as `<a>` or `<button>` elements — keyboard-navigable.

---

## Human Sign-Off Required

**None** — no compliance NFR with a named regulatory clause. H-NFR2 passes.
