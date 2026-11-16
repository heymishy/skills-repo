# Decisions: commit preview and commit with nothing to commit

**2026-11-16 | FINDING | The preview renders a commit form for nothing, and the commit POST would call GitHub with an empty path**
**Evidence:** production sweep 3 (2026-11-16): `GET /skills/discovery/sessions/<unknown id>/commit-preview` answered 200 "Review & commit". `htmlGetPreview` returns empty strings for an unknown session (pinned by dsq4 T5.1 and T5.7), `htmlCommitSession` passes them to `commitArtefact`, which sends `PUT .../contents/` with the user's token; the answer is an error shown as a 500 page, a production 5xx that opens a GitHub issue. The same page and the result page say "on a new branch", but `scm-adapter.js` sends no branch, so the file goes to the repository's default branch.

**2026-11-16 | ARCH | A new checked function, wired in server.js; `htmlGetPreview` untouched**
**Context:** existing tests pin `htmlGetPreview` for the unknown-session case.
**Decision:** `htmlGetCommitPreviewChecked` (async, restore-aware, 404 on missing, empty or wrong-skill sessions) is what the server wires as the preview adapter and what `htmlCommitSession` calls before any GitHub request. The handlers' existing `err.status` rendering turns it into the 404 page.
**Rationale:** smallest change that makes both routes safe without editing handlers or pinned tests; restore-awareness also stops a session that only exists in Redis (after a restart) from previewing as empty.
**Accepted cost:** two functions for "the preview" exist (one permissive, kept for its tests, one checked, wired); a later cleanup can retire the permissive one.

**2026-11-16 | DECISION | Fix the wording, not the behaviour, of "new branch"**
**Decision:** the interface now says the file is added to the repository's default branch, which is what the code does. Whether a commit should instead use a branch or open a pull request is a product decision for the operator and is out of scope.
