# Decision Log: 2026-09-06-canonical-artefact-trace

**Feature:** Canonical Artefact Trace
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Last updated:** 2026-09-06

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-09-06 | ASSUMPTION | /clarify**
**Decision:** Disk-based artefact reads are confirmed safe for this deployment's own dogfooding case (container's own checkout, always present at deploy time); for the multi-tenant SaaS case (`WUCE_TENANT_ROOT_BASE`), no populator/sync mechanism was found in `src/` or `scripts/` — this remains genuinely unconfirmed, so the canonical builder must support a distinct "not yet synced" state rather than assuming disk is always ready.
**Alternatives considered:** Assume disk is always available everywhere (rejected — direct code inspection found no sync mechanism for the multi-tenant path, so this would be an unverified assumption baked into the design); block MVP scope until the multi-tenant sync mechanism is fully traced (rejected — out of proportion to this feature's own scope, which is the web-UI rendering slice; the multi-tenant sync question is a separate, pre-existing gap this feature doesn't need to resolve to ship).
**Rationale:** Direct grep of `WUCE_TENANT_ROOT_BASE` found only consumers (`as-built-diagrams.js`, `as-built-system-architecture.js`), no clone/sync job. Rather than guess, the design accommodates the uncertainty explicitly (a named "not yet synced" state) instead of assuming it away.
**Made by:** Hamish King — Platform Owner (via /clarify Q1, option C: "uncertain, worth a quick spike/check")
**Revisit trigger:** If a multi-tenant sync/clone mechanism is found or built elsewhere, revisit whether the "not yet synced" state is still needed or can be simplified away.
---

---
**2026-09-06 | ASSUMPTION | /clarify**
**Decision:** The canonical builder will attempt to infer story grouping from disk structure (filename/directory patterns) for a feature with zero `pipeline-state.json` registration, but will always show the "unregistered" visual flag regardless of whether inference succeeded.
**Alternatives considered:** Never attempt inference, just show an ungrouped flat list for any unregistered feature (rejected — throws away real, recoverable structure for features like `phase4` where filename patterns clearly indicate story grouping); attempt inference and treat a successful inference as equivalent to real registration, no flag (rejected — this is exactly the "false confidence" failure mode the assumption itself named as a risk).
**Rationale:** Inference is a best-effort UX improvement, not a substitute for real registration — conflating the two would recreate a milder version of the same "silently trust unverified structure" problem this whole feature exists to close.
**Made by:** Hamish King — Platform Owner (via /clarify Q2, option C)
**Revisit trigger:** If inference proves unreliable enough in practice to actively mislead operators, revisit toward the "always flat, never infer" alternative.
---

---
**2026-09-06 | ASSUMPTION | /clarify**
**Decision:** No performance safeguard (file-count cap, depth limit, etc.) is needed for the canonical builder's directory walk in the MVP.
**Alternatives considered:** Add a defensive file-count ceiling with a "truncated" fallback regardless of proven need (rejected as unnecessary insurance once measured) — considered as option C in the /clarify question but not chosen once B's empirical check produced a clear answer.
**Rationale:** Empirically measured directly against this repo: `phase4` (205 files, the single largest feature found in the audit) walks in 6ms; the *entire* `artefacts/` tree (4,955 files, every feature combined) walks in 229ms, and the canonical builder only ever walks one feature's subtree. This is not a close call — no safeguard is justified by the data.
**Made by:** Hamish King — Platform Owner (via /clarify Q3, option B: "needs a quick empirical check")
**Revisit trigger:** If a future feature's artefact directory grows by more than an order of magnitude beyond `phase4`'s 205 files, re-measure before assuming the same conclusion still holds.
---

---
**2026-09-06 | ARCH | /review**
**Decision:** Formalised "disk is canonical for artefact content" as a new repo-level ADR (**ADR-029**), correcting a citation error found during `cat-s1`'s own review: `feature-story-structure.js`'s code comment cites this principle as "ADR-023," but ADR-023 documents an unrelated topic (journey-stage handoff schema). No ADR for this principle existed before now — it had been an informally-followed convention since that file's original authorship. The same miscitation, propagated into this feature's own discovery.md, design.md, and `cat-s1`'s story, was corrected in place across all 4 affected files. Separately, "ADR-004 (no persistent agent runtime)" — also cited in the same 4 files — was found to be a second miscitation: ADR-004 documents an unrelated topic (`context.yml` as config source of truth); the actual source for "not a persistent agent runtime" is `product/mission.md`'s own "What the platform is not" section, not a numbered ADR at all. All references corrected to cite that source directly instead of a fabricated ADR number.
**Alternatives considered:** Leave "disk is canonical" as an informal convention and just remove the false ADR-023 citation from the code comment (rejected — would leave the principle itself uncitable anywhere, guaranteeing the same or a fresh miscitation recurs the next time a story needs to reference it); leave "no persistent agent runtime" attributed to a specific ADR number by finding or inventing one (rejected — `product/mission.md` is the real, verifiable source; citing a number that doesn't say this would repeat the exact error just found).
**Rationale:** Both principles are genuinely load-bearing across this session's own delivered work (`bsgm-s1`, `sri-s1`, `adlr-s1`, `fadm-s1` all depend on disk-canonicity reasoning) — they deserve correct, citable sources, not inherited miscitations. Caught only because `/review`'s own Category E (Architecture compliance) check requires verifying that a cited ADR/guardrail actually says what the story claims, rather than trusting the citation at face value.
**Made by:** Hamish King — Platform Owner (agent-identified during /review, operator informed)
**Revisit trigger:** None — this is a correction of fact, not a decision subject to reconsideration. `feature-story-structure.js`'s own code comment still has the original miscitation; correcting it is implementation work for `cat-s1`, not a `/definition`-stage or `/review`-stage action.
---

---
**2026-09-06 | RISK-ACCEPT | /definition-of-ready**
**Decision:** DoR Warning W4 ("verification script reviewed by a domain expert") is acknowledged as unmet, not resolved, for all 6 stories (`cat-s1` through `cat-s6`) at sign-off time. The 6 AC verification scripts were written this session alongside their technical test plans but have not yet been walked through by a human before coding begins.
**Alternatives considered:** Block DoR sign-off until each script is manually walked (rejected — the operator explicitly chose to proceed now and review later, and the scripts remain available as the pre-code sign-off artefact the operator can still exercise before or during implementation, per the AC verification script template's own "three moments" usage — pre-code, post-merge, demo — none of which require the pre-code moment to happen before DoR, only before coding is trusted as complete).
**Rationale:** All 6 scripts were derived directly from reviewed, PASSed story ACs and their own already-reviewed technical test plans — the risk of a script describing incorrect behaviour is low, since it's a plain-language restatement of already-verified AC/test-plan content, not independently authored. The operator (Hamish King) is both the platform owner and the story author here; a domain-expert walkthrough by a different person isn't available in this solo-repo context regardless.
**Made by:** Hamish King — Platform Owner (via /definition-of-ready, W4 handling option 1: "Acknowledge and proceed")
**Revisit trigger:** If post-merge smoke testing using any of these 6 scripts (per their own "post-merge smoke test" usage moment) finds a scenario that doesn't match shipped behaviour, treat that as evidence this RISK-ACCEPT should have been a "review now" instead for future stories of similar shape.
---

---
**2026-09-06 | SCOPE | /subagent-execution (cat-s1 Task 3 review)**
**Decision:** `cat-s1`'s new `walkDir` helper in `artefact-trace.js` duplicates `artefact-list.js`'s existing `walkMdFiles` recursion (same `fs.readdirSync(dir, {withFileTypes:true})` + directory/file branch + recurse pattern, differing only in output shape). Code-quality review flagged this as Important (a real ADR-028 instance) but explicitly recommended it as a follow-up, not a blocker. Accepted as a tracked follow-up rather than fixed inline in Task 3.
**Alternatives considered:** Extract a shared `walkFiles` util now and refactor `artefact-list.js` to use it (rejected for Task 3 specifically — `artefact-list.js` is outside this task's own file map/scope, and touching it risks destabilizing existing, working, tested code for a consolidation that `cat-s4`/`cat-s5` will make moot anyway once they wire `features.js`/`artefact-fetcher.js` consumers onto `buildArtefactTrace` directly, at which point `artefact-list.js`'s own walk logic becomes dead code to remove, not merely share).
**Rationale:** The duplication is pre-existing pattern debt (`walkMdFiles` already existed before this story), not a regression `cat-s1` introduced. Forcing the consolidation into `cat-s1` would expand Task 3's blast radius into a file `/implementation-plan`'s own file map never named, undermining "one clear responsibility per file, files that change together live together."
**Made by:** Hamish King — Platform Owner (agent-identified during subagent-execution's code-quality review, operator informed)
**Revisit trigger:** When `cat-s4`/`cat-s5` wire `features.js`/`artefact-fetcher.js` onto `buildArtefactTrace`, confirm whether `artefact-list.js`'s `walkMdFiles` becomes fully dead code (delete it) or still has a live caller (in which case, extract the shared util at that point).
---

## Architecture Decision Records

This feature's structural decisions were written directly as repo-level ADRs (not feature-scoped ones) since they constrain all future features, not just this one:
- **ADR-028** in `.github/architecture-guardrails.md` ("A derived structure needs exactly one canonical builder — every consumer reads from it, none re-derive it"), added 2026-09-06 during this feature's own discovery, at the operator's explicit request.
- **ADR-029** in `.github/architecture-guardrails.md` ("The local filesystem checkout is canonical for artefact content; `pipeline-state.json` is enrichment metadata, not the source of truth for what exists"), added 2026-09-06 during this feature's own `/review` pass, formalising a previously-uncited convention and correcting the miscitation logged above.

---
