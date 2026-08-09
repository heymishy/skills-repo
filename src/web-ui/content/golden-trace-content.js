'use strict';

// golden-trace-content.js (lphf-s1, locked in by gtcl-s1) -- real, curated
// content for the landing page's golden-trace hero demo. Locked to a single
// candidate: interactive-kanban-boards/s3.1. Per decisions.md D2/D4, the
// losing candidate's content was compared behind a one-time build-time
// selector and deleted entirely once the choice was made -- this file is
// not a runtime toggle or CMS.

var CONTENT = {
  prompt: '"I\'ve noticed the kanban boards are not styled along with everything else" -- plus the deeper problem underneath it: boards were read-only, every stage transition had to leave the board and go through the CLI.',
  discovery: 'Discovery (2026-07-24-interactive-kanban-boards): "The web UI has three kanban board routes today... But the boards themselves are visually out of step with the rest of the platform\'s current design language... More importantly, the boards are read-only: an operator can see which stage a feature/story is in, but cannot act on that view."',
  dor: 'DoR (s3.1-drag-to-advance): "H-E2E: AC1-AC4 ARE CSS-layout-dependent, but E2E tooling (Playwright) IS configured and used -- condition for blocking (no tooling) not met, PASSES without needing a RISK-ACCEPT." Contract review passed, 5/5 hard blocks.',
  shipped: 'Shipped: a real, working Trello-style board where dragging a ready card onto its valid next-stage column advances it for real -- calling the exact same /api/board/journey/:id/advance endpoint the click-to-advance path uses, with the same tenant-ownership and readiness checks.'
};

function renderGoldenTraceHtml() {
  var c = CONTENT;
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

module.exports = { renderGoldenTraceHtml: renderGoldenTraceHtml, CONTENT: CONTENT };
