# Decisions: artefact route answers not found quickly and never 503 for an impossible link

**2026-11-16 | FINDING | The 503 comes from the raw value being put into the GitHub URL, not from GitHub being down**
**Evidence:** `/artefact/%00/%00` and `/artefact/%E0%A4%A/...` returned 503 on production (issue #1110). `server.js` passes the second segment raw as the slug and decodes the third (falling back to the raw segment when decoding throws); `fetchArtefact` builds `https://api.github.com/repos/<repo>/contents/artefacts/<slug>/<type>.md` from them, the request fails or is rejected, and `handleArtefactRoute` shows every non-404 failure as "Unable to load artefact - please try again", which is wrong advice for a link that can never work.

**2026-11-16 | ARCH | Validate the reference in the route with an allow-list; keep the adapter's job to fetching**
**Context:** ADR-012 keeps GitHub access in the adapter; the route owns its own input.
**Decision:** `handleArtefactRoute` checks slug and type against an allow-list straight after the auth check and answers the existing 404 page without fetching. A block-list (`%00`, `..`) was rejected: it misses the next odd character.
**Rationale:** one place, same 404 as an unknown artefact (so a broken link and an unknown artefact are indistinguishable), and a traversal-shaped type never leaves the process.
**Accepted cost:** a directory name with an unusual character would be unreachable by this route; none exists (a test reads the real `artefacts/` listing).

**2026-11-16 | ARCH | Run the fallback probes concurrently instead of adding a time budget**
**Context:** a bare unknown name makes up to 22 sequential probe requests (3 s timeout each) after the 2 direct ones, about 6 s in production.
**Decision:** start all probes together and read the results back in priority order (`Promise.allSettled`); the first hit in order wins and an earlier non-404 failure still raises, as in the sequential loop.
**Rationale:** the answer is identical to today's for every input and the wait becomes one round trip. A time budget would change results (a slow hit could be skipped) and need tuning.
**Accepted cost:** a legacy bare-name hit now sends all probes at once (at most 24, today's worst-case ceiling) instead of stopping at the first hit. Not deduplicating or caching negatives: separate story if GitHub quota becomes a concern.
