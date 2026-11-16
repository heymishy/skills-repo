# Decisions: commit result page

**2026-11-16 | FINDING | The result page has been unreachable since it was built: the adapter was never wired**
**Evidence:** `GET /skills/:name/sessions/:id/result` answered 500 for every request on production in sweep 2 (events reached PostHog; ecf-s1 later made them group). `server.js` wires `setGetCommitPreview` and `setCommitSession` but not `setGetCommitResult`, so the D37 stub throws "Adapter not wired: getCommitResult" and the handler prints that text. `handlePostCommitHtml` redirects 303 to this page after every successful commit.

**2026-11-16 | ARCH | Derive the result from the session; do not add a store**
**Context:** the result page needs the committed path, slug and type; the commit already used the session's `artefactPath`.
**Decision:** `htmlGetCommitResult` reads the session (with the Redis fallback every other skills route uses) and derives slug and type from `artefactPath`; the commit handler stamps `committedAt` after a successful commit so an uncommitted draft never shows "Committed.".
**Rationale:** no new storage, no change to the adapter or the view, and the type has exactly the shape `/artefact/:slug/:type` links already use (adlr-s1).
**Accepted cost:** if a restart loses `committedAt`, the page answers 404 "Commit result not found" for that session (W5). No owner check, same as `getCommitPreview` (W6).

**2026-11-16 | PROCESS | Do not merge or deploy before the ecf-s1 live check**
**Context:** the ecf-s1 live check needs one real 5xx from a named route and this route is the only reliable one.
**Decision:** build and open the draft PR now; the operator merges after the check.
