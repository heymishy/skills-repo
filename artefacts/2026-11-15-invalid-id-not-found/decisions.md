# Decisions: invalid id answers 404

**2026-11-15 | FINDING | All six malformed-id 500s in the sweep are one database error**
**Evidence:** `/products/not-a-uuid`, `/products/%00`, `/products/%E0%A4%A`, `/products/<SQL-looking text>`, `/journeys/not-a-uuid`, `/journeys/%00` returned 500 on production v190. The server passes the raw path segment to a query on a uuid column (`req.params = { id: pathname.split('/')[2] }`, no decoding), so each reaches Postgres as written and fails with SQLSTATE 22P02, "invalid input syntax for type uuid".

**2026-11-15 | ARCH | Translate the one database error centrally, narrowly, not validate ids per route**
**Context:** many routes take a uuid id from the path or query; per-route validation is many edits and misses the next route.
**Decision:** a helper recognises "bad id from the URL" only when the error is 22P02 with the uuid message AND the quoted value is non-empty and appears in the request url; `authGuard`'s error handler and the router catch answer 404 `{"error":"not found"}` for a match and skip error reporting. Everything else is unchanged.
**Rationale:** one change covers every present and future id route (same lesson as ecg-s1: one chokepoint beats many sites); the value-in-url rule keeps genuine server bugs (which would produce the same SQLSTATE with a value that did not come from the request) as reported 500s; the 404 body matches the existing unknown-id answer so a malformed id is indistinguishable from an unknown one.
**Accepted cost:** depends on the driver's message text; proven against a real Postgres by the gated test P1 and failing safe (to 500 and a report) if the text ever changes.
