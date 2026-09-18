## Discovery: Comments Seeded Fixture

**Status:** Draft

## Summary

Used by dsa-s1's E2E AC7 populated-list scenario (artefact viewer restyle). Comments are seeded directly via `POST /api/artefact-comments` in test setup before this page is rendered, so the server-rendered Comments card can be checked for oldest-first ordering.
