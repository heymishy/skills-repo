'use strict';

/**
 * csd-s2 hand-authored Program Design diagram fixtures — Mermaid `flowchart`
 * syntax, used across csd-s2's unit/integration tests
 * (tests/check-csd-s2-canvas-diagram-rendering.js) and its Playwright E2E
 * spec (tests/e2e/csd-s2-canvas-diagram-rendering.spec.js).
 *
 * Both fixtures are hand-authored, not agent/skill-generated — same scope
 * note as system-architecture-fixtures.js.
 *
 * MINIMAL_PROGRAM_DESIGN_MERMAID — a 2-stage diagram (unit/integration
 * tests): just enough to prove the rendering dispatch works end to end.
 *
 * REALISTIC_PROGRAM_DESIGN_MERMAID — a flowchart of this repo's own
 * outer-loop pipeline stages (E2E legibility test), per CLAUDE.md's Pipeline
 * overview section (discovery through definition-of-done).
 */

const MINIMAL_PROGRAM_DESIGN_MERMAID = [
  'flowchart LR',
  '    A[Discovery]',
  '    B[Definition]',
  '    A --> B'
].join('\n');

const REALISTIC_PROGRAM_DESIGN_MERMAID = [
  'flowchart LR',
  '    DISCOVERY[Discovery]',
  '    BENEFITMETRIC[Benefit Metric]',
  '    DEFINITION[Definition]',
  '    REVIEW[Review]',
  '    TESTPLAN[Test Plan]',
  '    DOR[Definition of Ready]',
  '    CODINGLOOP[Inner Coding Loop]',
  '    DOD[Definition of Done]',
  '',
  '    DISCOVERY --> BENEFITMETRIC',
  '    BENEFITMETRIC --> DEFINITION',
  '    DEFINITION --> REVIEW',
  '    REVIEW --> TESTPLAN',
  '    TESTPLAN --> DOR',
  '    DOR --> CODINGLOOP',
  '    CODINGLOOP --> DOD'
].join('\n');

// Node labels expected to be legible/distinguishable in the realistic
// fixture's rendered diagram — used by the E2E spec to assert every stage
// name is actually visible as rendered text, not merely present in the
// source.
const REALISTIC_PROGRAM_DESIGN_NODE_NAMES = [
  'Discovery',
  'Benefit Metric',
  'Definition',
  'Review',
  'Test Plan',
  'Definition of Ready',
  'Inner Coding Loop',
  'Definition of Done'
];

module.exports = {
  MINIMAL_PROGRAM_DESIGN_MERMAID,
  REALISTIC_PROGRAM_DESIGN_MERMAID,
  REALISTIC_PROGRAM_DESIGN_NODE_NAMES
};
