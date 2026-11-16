# Verification script: cpv-s1 (commit preview and commit refuse when there is nothing to commit)

Steps 1 to 7 are covered by `node tests/check-cpv-s1-commit-preview-unknown-session.js`, the existing preview, commit and result tests and the full suite; step 8 needs a signed-in session on each app after deploy.

1. T1: an unknown session's preview is a 404 "Nothing to commit" page with no form.
2. T2: a session with no drafted artefact, or the wrong skill in the URL, gets the same 404.
3. T3: a drafted session still previews, the copy says "default branch", and neither page says "new branch".
4. T4: the commit POST for an unknown or empty session answers 404 and makes no request to GitHub.
5. T5: the commit POST for a drafted session makes exactly one PUT and redirects to the result page, as before.
6. T6, T7: `htmlGetPreview` is unchanged; the checked function only ever throws the 404 error.
7. Full suite: only the known local-environment failures.
8. **Live (read-only GETs, nothing is committed):** on staging and then production from a signed-in tab, request `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/commit-preview`; expect 404 and the "Nothing to commit for this session" page, and no new GitHub issue.
