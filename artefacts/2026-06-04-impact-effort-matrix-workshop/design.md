# Design: Impact/Effort Matrix Workshop Tool

**Status:** Draft
**Feature:** 2026-06-04-impact-effort-matrix-workshop
**Contributors:** [facilitator/operator name] — 2026-06-04
**Date:** 2026-06-04
**Prior artefacts:** discovery.md, benefit-metric.md

---

## Summary

A fully client-side React single-page application that gives workshop facilitators a live 2×2 impact/effort canvas during the session, then a post-session transcript import and Claude-API-powered auto-segmentation step that links recording excerpts to each card. The session state persists in localStorage; no server is required for MVP. The user holds their own Claude API key, stored in the browser.

---

## Solution Architecture

### Overview

The application is a static SPA (React + Vite) deployed to any static host. All processing — canvas interaction, file parsing, Claude API calls — happens in the browser. There are two natural workflow phases: (1) live canvas use during the workshop, and (2) post-session transcript import and auto-segmentation once the recording file is available. The same session state object spans both phases.

```
Browser (React SPA)
├── Canvas panel — 2×2 grid, draggable cards
├── Detail panel — active card, linked transcript segments
├── Toolbar — add card, import transcript, run segmentation, export
└── localStorage — session state, API key
         │
         └── Claude API (direct browser call, user-supplied key)
                 POST https://api.anthropic.com/v1/messages
```

### Integration points

| System | Interaction type | Direction | Notes |
|--------|-----------------|-----------|-------|
| Claude API | HTTPS REST | Out | Single batch call per segmentation run; user-supplied API key; never logged or stored beyond the call |
| Local filesystem | Browser File API | In | Transcript file upload (.txt, .srt, .vtt); processed entirely client-side |
| localStorage | Browser storage | In/Out | Session state persistence (survives page refresh); API key storage |

### Data and state

```
Session (persisted to localStorage)
├── cards: Card[]
│     ├── id: string (uuid)
│     ├── name: string
│     ├── label?: string
│     ├── impact: number (0–1, Y-axis, high = top)
│     └── effort: number (0–1, X-axis, high = right)
├── transcript: TranscriptSegment[]
│     ├── id: string
│     ├── text: string
│     ├── startTime: string
│     └── endTime: string
��── segmentLinks: SegmentLink[]
      ├── cardId: string
      ├── segmentId: string
      └── relevanceReason?: string
```

Session lifecycle: created on first card add → persists through page refreshes → exported on demand → cleared on explicit "new session" action. There is no server-side state.

### Hosting and runtime

Static file hosting — Vite build output. Any static host is valid (GitHub Pages, Netlify, Vercel, local file server). Zero runtime server required for MVP. The Claude API call originates from the browser using the user's own API key.

### Key technical decisions

| Decision | Choice made | Rationale |
|----------|-------------|-----------|
| UI framework | React + Vite | Canvas is stateful by nature (card positions, drag state, transcript links); React's component model handles this cleanly. Vite gives fast dev iteration and a clean production bundle. Vanilla JS would become complex quickly for this state surface. Natural upgrade path to multi-tenant future without rewrite. |
| Drag-and-drop library | @dnd-kit/core | Modern, accessible, React-native. Supports both pointer and keyboard interaction (required for WCAG 2.1 AA). Lighter than react-beautiful-dnd. |
| API key storage | localStorage | Acceptable for MVP where the user owns their own key. Risks (key visible in DevTools, no per-origin isolation) are user-accepted for single-author local use. Must move to server-side session in the multi-tenant future — this is a known architectural boundary. |
| Auto-segmentation call design | Single batch call (all cards + full transcript) | Simpler, avoids per-card rate limiting and token overhead from repeated system context. Claude's large context window makes this viable for typical transcript lengths (60–120 min sessions). Chunking strategy deferred — see open questions. |
| Session persistence | localStorage | No server needed. Survives page refresh. Single active session is sufficient for MVP. Named sessions / history deferred. |
| Markdown export format | Flat structured markdown (card → position → linked segments) | Sufficient for manual paste into outer loop discovery. Structured schema deferred pending clarification of outer loop consumption contract (see open questions). |

### Non-functional requirements

| Requirement | Target | Source |
|-------------|--------|--------|
| No server dependency | Zero server-side components for MVP | Discovery: no server-side persistence required |
| API key privacy | Key never transmitted except to Claude API; never logged | Security baseline for user-held credential |
| Transcript privacy | File processed entirely client-side; never uploaded to any server | Discovery: no API integrations in scope |
| Session durability | State survives page refresh via localStorage | Implicit from live-use workflow |
| Static deployability | Vite build output deployable to any static host | Discovery: no server required for MVP |
| Performance | Auto-segmentation call complete within 30s for typical workshop transcript | UX acceptability; longer = spinner required, see UX section |

---

## UX / Interaction Design

### Entry point

User opens the application URL (or local file). On first visit: empty canvas with axis labels and a prompt to add the first card. On return visit: previous session state restored from localStorage with a banner indicating the session was restored.

### Primary flow

**Phase 1 — Live canvas use (during workshop)**

1. Facilitator opens application before or at the start of the workshop session.
2. As a topic is introduced, facilitator clicks "Add card", enters a name, and optionally a short label — card appears at the canvas centre.
3. As debate reveals the group's positioning, facilitator drags the card to its position on the 2×2 grid (high/low impact on Y-axis, high/low effort on X-axis).
4. Steps 2–3 repeat for each topic discussed. Facilitator continues running the workshop; the tool captures positions without interruption.
5. At session end, the canvas represents the full workshop output with all cards positioned.

**Phase 2 — Post-session transcript linking (after recording is available)**

6. Facilitator exports the recording transcript from the meeting platform (Zoom, Teams, Loom) as a .txt, .srt, or .vtt file.
7. Facilitator clicks "Import transcript" and selects the file. The application parses the file into timestamped segments and stores them.
8. Facilitator enters their Claude API key (prompted if not already set; stored to localStorage).
9. Facilitator clicks "Auto-segment". A loading indicator appears. The application sends a single batch request to the Claude API: all card names/labels and the full transcript text.
10. Claude returns a structured mapping: for each card, the most relevant transcript segments (text excerpt, start/end timestamps, brief relevance reason).
11. The application displays linked segments in the card detail panel. Facilitator reviews — can dismiss false-positive links or manually add a missed segment.
12. When satisfied, facilitator clicks "Export". The application generates a structured markdown document and offers it as a file download.

### Edge cases and error states

| Scenario | User-facing behaviour |
|----------|-----------------------|
| Empty canvas on export | Export button disabled; tooltip "Add at least one card before exporting" |
| No transcript imported | Auto-segment button disabled; tooltip "Import a transcript file first" |
| API key not set | Clicking Auto-segment opens an inline key entry prompt; key saved on confirm |
| Claude API error (rate limit, network) | Error banner with message and retry button; partial results not shown |
| Transcript file format unrecognised | Error banner: "File format not recognised. Supported formats: .txt, .srt, .vtt" |
| Very long transcript (>60 min at high verbosity) | Loading indicator with estimated wait time; if call exceeds 60s, surfaced as a timeout with "Try reducing transcript length or splitting the session" guidance |
| Page refresh mid-session | State restored from localStorage; banner confirms restoration |
| localStorage unavailable | Warning banner on load: "Session persistence unavailable — your work will not be saved on page refresh" |

### Design system

MVP has no pre-existing design system dependency — component styles are bespoke. Design principles for implementation:

- Two-panel layout: canvas (left, 60% width) and detail panel (right, 40% width)
- Canvas: white background, light axis lines, quadrant labels (High Impact / Low Impact on Y; Low Effort / High Effort on X)
- Cards: rounded rectangles with name, optional label, drag handle
- Detail panel: card name heading, axis position summary (e.g. "High Impact / Low Effort"), then transcript segment list with timestamps and relevance note
- Toolbar: horizontal strip above canvas with action buttons
- Colour: minimal — accent colour for selected card and linked segments; neutral for unlinked segments

### Accessibility

WCAG 2.1 AA minimum. Key requirements:
- Drag-and-drop via @dnd-kit supports pointer (mouse/touch) and keyboard (arrow keys to move selected card). Keyboard interaction is required — drag-only is not acceptable.
- All interactive elements reachable by Tab; focus indicators visible.
- Canvas axis labels and card positions must be available to screen readers as text (not implied by visual position alone). Card detail panel shows explicit axis position as text.
- Colour contrast: all text meets 4.5:1 minimum; action buttons meet 3:1 for large text.

---

## Constraints

- Single-author for MVP — no multi-user session infrastructure in scope.
- No server-side components — all processing is client-side; Claude API called directly from browser.
- No platform integrations — transcript is a manually exported file; markdown is manually copied or downloaded.
- API key user-managed for MVP — security model shifts in multi-tenant future; this is a known architectural boundary, not a defect.
- Browser localStorage as sole persistence — no session history, no cross-device sync, no recovery beyond the current browser profile.

---

## Open questions

| # | Question | Owner | Blocking definition? |
|---|----------|-------|----------------------|
| 1 | Does the markdown export format need to conform to a specific schema for outer loop consumption, or is free-form markdown (card → position → segments) sufficient? (Flagged as unconfirmed assumption in discovery) | Facilitator / pipeline operator | No — default to structured free-form; schema can be added in a later story if outer loop integration is formalised |
| 2 | Is a manual correction/review step for auto-segmentation results required for MVP trust, or is facilitator accept/dismiss per segment sufficient? (Flagged as unconfirmed assumption in discovery) | Facilitator | No — accept/dismiss per segment is the default design; full manual correction is a later story |
| 3 | What is the expected maximum transcript length (hours, or approximate word count)? If transcripts regularly exceed ~2 hours at high verbosity, the single-batch Claude call may need a chunking strategy. | Facilitator | No — single-batch is the MVP default; chunking is a follow-up if limit is hit in practice |
| 4 | Should the application support multiple named sessions (session history), or is a single active session with explicit "new session" clearing sufficient for MVP? | Facilitator | No — single active session is the MVP default |

---

## Deferred decisions

- **Chunking strategy for long transcripts** — deferred to implementation; single-batch call is the MVP default. If the Claude API context limit is hit during delivery, chunking strategy will be decided as a task-level implementation choice.
- **Structured export schema for outer loop integration** — deferred to a post-MVP story once the outer loop consumption contract is confirmed via /clarify.
- **Multi-tenant API key architecture** — explicitly deferred to the future multi-tenant phase. The localStorage pattern is the MVP boundary; server-side session management is the future-state pattern.
- **Named session history** — deferred to post-MVP. localStorage single-session is sufficient for the identified use cases.
- **Claude model selection** — deferred to implementation. claude-3-5-haiku is the likely MVP default (speed + cost); claude-3-5-sonnet as fallback if segmentation quality is insufficient. Model should be configurable in a constants file to allow switching without a code change.