# Decisions: broken percent-escape answers 404

**2026-11-16 | FINDING | Both URIError 500s in sweep 2 come from `decodeURIComponent` in the route table**
**Evidence:** `/journey/<x>/stage/%E0%A4%A` and `/products/<x>/playback-evidence/%E0%A4%A` returned 500 on production; PostHog showed `URIError` with code `request_error` for each (issues #1109 and #1108). `server.js` calls `decodeURIComponent` on a path segment in about twenty places; a broken escape makes it throw `URIError: URI malformed`, which the router catch turns into a 500.

**2026-11-16 | ARCH | Extend the uid-s1 helper, narrowly, rather than wrap each decode call**
**Context:** uid-s1 already routes "client mistake in the URL" failures to one 404 helper from both chokepoints (the router catch and `authGuard`).
**Decision:** `isInvalidIdError` also recognises `URIError` with message `URI malformed` when the request's own url cannot be decoded; both call sites and the 404 answer are unchanged.
**Rationale:** one change covers all ~20 decode sites and future ones; requiring the url itself to be undecodable keeps a `URIError` from a non-URL source a reported 500; the same 404 body keeps a broken link indistinguishable from an unknown page. 404 (not 400) matches uid-s1 and the existing unknown-page answer.
**Accepted cost:** the helper's name (`isInvalidIdError`) is now slightly narrower than its job; renaming would touch both call sites and is deferred rather than widening this story.
