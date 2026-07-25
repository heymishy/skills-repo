'use strict';

/**
 * csd-s2 hand-authored System Architecture diagram fixtures — Mermaid
 * `flowchart` syntax, used across csd-s2's unit/integration tests
 * (tests/check-csd-s2-canvas-diagram-rendering.js) and its Playwright E2E
 * spec (tests/e2e/csd-s2-canvas-diagram-rendering.spec.js).
 *
 * Both fixtures are hand-authored, not agent/skill-generated — per the
 * story's own scope, csd-s2 only proves the rendering mechanism works for
 * all three diagram types; generating diagram content from a skill is
 * csd-s3/csd-s4's job.
 *
 * MINIMAL_SYSTEM_ARCHITECTURE_MERMAID — a 2-node diagram (unit/integration
 * tests): just enough to prove the rendering dispatch works end to end.
 *
 * REALISTIC_SYSTEM_ARCHITECTURE_MERMAID — a components/services + connections
 * diagram (E2E legibility test), loosely modelled on this repo's own real
 * web-ui/skills-engine/postgres/redis architecture (structure only — node
 * names mirror the real components in src/web-ui/server.js; no real
 * configuration or credentials).
 */

const MINIMAL_SYSTEM_ARCHITECTURE_MERMAID = [
  'flowchart TD',
  '    WEBUI[Web UI]',
  '    POSTGRES[(Postgres)]',
  '    WEBUI --> POSTGRES'
].join('\n');

const REALISTIC_SYSTEM_ARCHITECTURE_MERMAID = [
  'flowchart TD',
  '    BROWSER[Browser]',
  '    WEBUI[Web UI - http.createServer]',
  '    SKILLSENGINE[Skills Engine]',
  '    SESSIONSTORE[Session Store]',
  '    POSTGRES[(Postgres)]',
  '    REDIS[(Redis)]',
  '    GITHUB[GitHub API]',
  '',
  '    BROWSER --> WEBUI',
  '    WEBUI --> SKILLSENGINE',
  '    WEBUI --> SESSIONSTORE',
  '    SESSIONSTORE --> REDIS',
  '    WEBUI --> POSTGRES',
  '    SKILLSENGINE --> POSTGRES',
  '    WEBUI --> GITHUB'
].join('\n');

// Node labels expected to be legible/distinguishable in the realistic
// fixture's rendered diagram — used by the E2E spec to assert every node
// name is actually visible as rendered text, not merely present in the
// source.
const REALISTIC_ARCHITECTURE_NODE_NAMES = [
  'Browser',
  'Web UI - http.createServer',
  'Skills Engine',
  'Session Store',
  'Postgres',
  'Redis',
  'GitHub API'
];

module.exports = {
  MINIMAL_SYSTEM_ARCHITECTURE_MERMAID,
  REALISTIC_SYSTEM_ARCHITECTURE_MERMAID,
  REALISTIC_ARCHITECTURE_NODE_NAMES
};
