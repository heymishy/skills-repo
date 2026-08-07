# Decisions: Persist the kanban Ideas backlog in Postgres instead of an ephemeral file

---

**Decision:** GAP — no discovery artefact for this feature
**Date:** 2026-07-29
**Context:** Short-track path (per CLAUDE.md) intentionally skips `/discovery` through `/review` for bugs, small fixes, and bounded refactors.
**Decision:** Proceed without a discovery artefact. H-GOV is acknowledged as a structural short-track exception, not an oversight.
**Rationale:** This story is a bounded storage-layer bug fix matching the short-track profile exactly (Complexity 2, Stable scope, no cross-team dependency). The scope and rationale are fully captured in the story's own Benefit Linkage section, which cites the exact mechanism of the bug (no Fly volume + redeploy-on-every-merge).

---

**Decision:** D37 default-adapter deviation — file-based fallback kept as the default, not a throw-stub
**Date:** 2026-07-29
**Context:** CLAUDE.md's D37 rule mandates that injectable-adapter stub defaults MUST throw, not return a safe-looking value, to prevent silent misconfiguration from masking a real problem.
**Decision:** This story's new `_ideasStore` injectable in `routes/features.js` keeps the existing, already-working file-based read/write logic as its default — it does not throw when unwired.
**Alternatives considered:** Make the default throw (matching D37's literal wording) — rejected, because this would break every existing local-dev and most test-suite usage of `/api/ideas` (none of which set `DATABASE_URL`), for no safety benefit: the file-based fallback is not a stub masking a real problem, it is the intentional, already-correct behaviour for any environment without a real Postgres database, exactly mirroring `journey-store.js`'s own disk-adapter-as-default shape.
**Rationale:** D37's throw-on-unwired rule exists to catch cases where a *silent* stub would let production code proceed with a *wrong* result (e.g. a credits adapter silently no-crediting an account). Here, the file-based default's result is *not wrong* — it's a legitimate, already-shipped, already-tested storage mechanism for the no-DB case. Throwing would be a regression, not a safety improvement.
**Made by:** Claude (agent), during DoR, 2026-07-29
**Revisit trigger:** If a future change makes the file-based fallback itself unsafe or undesirable in some environment, reconsider this default.
