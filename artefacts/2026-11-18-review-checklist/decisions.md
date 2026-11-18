# Decisions: a diff-triggered review checklist (rvc-s1)

**2026-11-18 | DECISION | Advisory first; blocking is a separate decision**
**Context:** the checklist lists items a diff is likely to need. A block on merge would turn a false positive into a stuck pull request, and no false-positive rate is known yet.
**Decision:** the script prints and exits 0 when items match. `--check` fails only on an invalid checklist file.
**Rationale:** measure the listings in real pull requests first; a block can follow once the items have proved useful.

**2026-11-18 | DECISION | An entry must cite a tracked source**
**Context:** a checklist item with no defect behind it is an opinion, and one whose source was deleted is a rule nobody can explain.
**Decision:** every entry names a `source` path, and `--check` fails if git does not track it.
**Rationale:** the source is what makes the item worth reading in a review.

**2026-11-18 | DECISION | Match on added lines, not only on paths**
**Context:** a path alone fires on every edit to a file. Most of `src/web-ui/routes/skills.js` has nothing to do with the continue-turn loop.
**Decision:** an entry may carry a `match` pattern; it fires only when an added line matches it in a matching file.
**Rationale:** the listing then points at the line that made the change relevant.

**2026-11-18 | DECISION | Glob support is limited to `*` and `**`**
**Context:** entries need path patterns only; a pattern library would be a new dependency for that.
**Decision:** convert the two wildcards to a regular expression in-house.
**Rationale:** no dependency, and the behaviour is small enough to test in full.
