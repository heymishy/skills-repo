'use strict';

/**
 * s5 hand-authored Sequence diagram fixture -- Mermaid `sequenceDiagram`
 * syntax, used by tests/check-s5-sequence-diagram-type.js.
 *
 * Hand-authored, not agent/skill-generated -- per the story's own scope, S5
 * only proves the rendering mechanism works for this 4th diagram type;
 * whether the model correctly chooses when to emit one is a live-model
 * judgment call covered by the AC1/AC2 manual verification scenario, not
 * this fixture.
 *
 * MINIMAL_SEQUENCE_MERMAID -- a 2-participant, 2-message exchange: just
 * enough to prove the rendering dispatch works end to end.
 */

const MINIMAL_SEQUENCE_MERMAID = [
  'sequenceDiagram',
  '    participant Client',
  '    participant Server',
  '    Client->>Server: Request',
  '    Server-->>Client: Response'
].join('\n');

module.exports = {
  MINIMAL_SEQUENCE_MERMAID
};
