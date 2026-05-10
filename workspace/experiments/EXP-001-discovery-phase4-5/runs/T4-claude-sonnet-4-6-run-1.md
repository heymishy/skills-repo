# T4 — Scope too wide / claude-sonnet-4-6 / Run 1

**Date:** 2026-05-10
**Model:** claude-sonnet-4-6
**Case:** T4-scope-too-wide
**Experiment:** EXP-001-discovery-phase4-5
**Status:** CONFOUNDED — model read `product/mission.md`, `product/tech-stack.md`, `product/constraints.md` from this repo; domain context bled into response. Superseded by run-2 (fresh repo, no product context).

---

## Operator input

Make the API faster.

---

## Model response

Let me look at the workspace to understand what API exists here. 

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui)

Analyzing your answers...

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/server.js#1-1), lines 1 to 80

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/routes)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/server.js#80-80), lines 80 to 200

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/server.js#200-200), lines 200 to 400

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/server.js#400-400), lines 400 to 532

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/routes/features.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/adapters/feature-list.js#1-1), lines 1 to 80

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/adapters/artefact-list.js#1-1), lines 1 to 80

The main bottleneck is clear: every `/features` request makes a fresh network round-trip to the GitHub API for `pipeline-state.json` (and again for each artefact directory). There's no caching at all. I'll add a simple TTL in-memory cache wrapping both fetch adapters. 

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/server.js#82-82), lines 82 to 140

Replacing 48 lines with 81 lines in [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/server.js)


```

```
Now verify there are no syntax errors: 

Ran terminal command: cd "c:\Users\Hamis\code\skills repo"; node --check src/web-ui/server.js; echo "syntax OK"

Checked [](file:///c%3A/Users/Hamis/code/skills%20repo/src/web-ui/server.js), no problems found

Done. Here's what changed and why:

**Added a TTL in-memory cache** (`_githubApiCache`) wrapping both GitHub API fetch adapters in server.js:

| Fetcher | TTL | Reasoning |
|---|---|---|
| `pipeline-state.json` | 60 s | Changes only on PR merges — rarely mid-session |
| Artefact directory listing | 30 s | Changes on git commits — slightly more volatile |

Cache keys include the OAuth token so each user's responses are isolated. Only successful responses are cached — errors always fall through to a live request. The first request per user/repo still pays the network cost; every repeat within the TTL window is served instantly from memory.