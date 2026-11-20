# Decisions: collapsed group tab order (ctab-s1)

## D1. Hide collapsed group bodies with a delayed `visibility` rule, in CSS only (2026-11-20)

**Context:** a collapsed group on the product view is hidden only by `grid-template-rows: 0fr` and `overflow: hidden`, so its links and buttons stay in the tab order and the accessibility tree. A local probe found 6 of 78 Tab stops inside collapsed groups. Every script that opens or closes a group (`a4ToggleModule`, the search auto-expand, bulk assign) toggles the class `a4-module-body--collapsed`.
**Decision:** add `visibility: hidden` to `.a4-module-body--collapsed`, with `transition: grid-template-rows 0.25s ease, visibility 0s linear 0.25s` so it applies only after the collapse animation; the base `.a4-module-body` rule keeps `visibility: visible` and a zero-delay transition, so expanding shows the content at once. No markup or script change.
**Rationale:** one CSS rule covers all three scripts and any future one that toggles the class, keeps the animation, needs no change to the markup, and is supported everywhere. The header button stays outside the body, so it remains the way in.
**Alternatives rejected:** the `inert` attribute set by the three scripts (more code in three places, and a new script path to forget); `display: none` when collapsed (kills the height animation, which `a4-module-expand-collapse` measures); `tabindex="-1"` on each child (misses new children and leaves the content visible to screen readers); expanding groups by default (a product decision, not an accessibility fix).
**Operator go-ahead (2026-11-20, "1 then two"):** to short-track this story first, then the test-isolation story.
