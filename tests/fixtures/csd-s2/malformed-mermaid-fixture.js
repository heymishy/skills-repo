'use strict';

/**
 * csd-s2 (AC2) — a deliberately broken mermaid fixture, used to drive the
 * error-box test coverage. This is not valid mermaid syntax for any diagram
 * type (missing a diagram-type declaration keyword, unbalanced structure) —
 * intended to trigger mermaid's own parse failure in a real browser, and used
 * to exercise this story's client-side render-error handling
 * (markDiagramRenderError in src/web-ui/routes/skills.js) in jsdom via a
 * rejecting mermaid.run() stub.
 */
const MALFORMED_MERMAID_SYNTAX = 'not a real diagram type\n    ((( unbalanced [[ syntax';

module.exports = {
  MALFORMED_MERMAID_SYNTAX
};
