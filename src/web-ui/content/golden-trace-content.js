'use strict';

// golden-trace-content.js (lphf-s1) -- real, curated content for the landing
// page's golden-trace hero demo. Two real candidates are kept here so they
// can be compared before one is locked; ACTIVE_CANDIDATE selects which one
// renders. Per decisions.md D2, the losing candidate's content is deleted
// from this file entirely once a choice is made -- this is a one-time
// build-time selector, not a runtime toggle or CMS.

var ACTIVE_CANDIDATE = 'kanban'; // 'kanban' | 'diagram'

var CANDIDATES = {
  kanban: {
    prompt: '"I\'ve noticed the kanban boards are not styled along with everything else" -- plus the deeper problem underneath it: boards were read-only, every stage transition had to leave the board and go through the CLI.',
    discovery: 'Discovery (2026-07-24-interactive-kanban-boards): "The web UI has three kanban board routes today... But the boards themselves are visually out of step with the rest of the platform\'s current design language... More importantly, the boards are read-only: an operator can see which stage a feature/story is in, but cannot act on that view."',
    dor: 'DoR (s3.1-drag-to-advance): "H-E2E: AC1-AC4 ARE CSS-layout-dependent, but E2E tooling (Playwright) IS configured and used -- condition for blocking (no tooling) not met, PASSES without needing a RISK-ACCEPT." Contract review passed, 5/5 hard blocks.',
    shipped: 'Shipped: a real, working Trello-style board where dragging a ready card onto its valid next-stage column advances it for real -- calling the exact same /api/board/journey/:id/advance endpoint the click-to-advance path uses, with the same tenant-ownership and readiness checks.'
  },
  diagram: {
    prompt: '"The operator is currently too hands-off the actual code and data model shape. Decisions about structure get made in prose specs and in agent-authored code... this produces drift."',
    discovery: 'Discovery (2026-07-25-code-shape-diagrams): "Today, the outer loop\'s /design and /definition stages produce System Architecture and Program Design decisions as prose only -- no visual artefact the operator can inspect before implementation starts."',
    dor: 'DoR (csd-s2-canvas-diagram-rendering): "ADR-026: extends the same content-block mechanism proven in csd-s1 -- no parallel rendering path per diagram type." Contract review passed.',
    shipped: 'Shipped: a real System Architecture diagram rendered as a legible Mermaid SVG inside the canvas panel, with a visible type-label badge, non-overlapping node labels, and a distinct error box for malformed diagrams.'
  }
};

function renderGoldenTraceHtml() {
  var c = CANDIDATES[ACTIVE_CANDIDATE];
  return (
    '<section class="gt-section" aria-label="Golden trace demo">' +
      '<h2 class="gt-heading">From a plain-English ask to shipped, working code</h2>' +
      '<div class="gt-frames">' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">1. Prompt</span><p>' + c.prompt + '</p></div>' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">2. Discovery</span><p>' + c.discovery + '</p></div>' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">3. Definition of Ready</span><p>' + c.dor + '</p></div>' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">4. Shipped</span><p>' + c.shipped + '</p></div>' +
      '</div>' +
    '</section>'
  );
}

module.exports = { renderGoldenTraceHtml: renderGoldenTraceHtml, CANDIDATES: CANDIDATES, ACTIVE_CANDIDATE: ACTIVE_CANDIDATE };
