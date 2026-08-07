'use strict';

/**
 * csd-s1 hand-authored data-model diagram fixtures — Mermaid `erDiagram`
 * syntax, used across csd-s1's unit/integration tests
 * (tests/check-csd-s1-derisk-canvas-mermaid.js) and its Playwright E2E spec
 * (tests/e2e/csd-s1-data-model-diagram.spec.js).
 *
 * Both fixtures are hand-authored, not agent/skill-generated — per the
 * story's own scope, csd-s1 only proves the rendering mechanism works;
 * generating diagram content from a skill is csd-s3/csd-s4's job.
 *
 * MINIMAL_DATA_MODEL_MERMAID — a 2-entity diagram (AC1/AC3/AC4 unit tests):
 * just enough to prove the rendering dispatch works end to end.
 *
 * REALISTIC_DATA_MODEL_MERMAID — a 6-entity diagram with relationships
 * (AC2 E2E legibility test), modelled loosely on this repo's own real
 * `people` / `person_identities` / `team_memberships` / `credits` /
 * `tenant_plan` / `products` table shapes (structure only — column names and
 * relationships mirror the real schema in src/web-ui/server.js and
 * src/web-ui/modules/identity-links.js; no real data).
 */

const MINIMAL_DATA_MODEL_MERMAID = [
  'erDiagram',
  '    PRODUCTS ||--o{ FEATURES : "has"',
  '    PRODUCTS {',
  '        uuid product_id PK',
  '        string name',
  '    }',
  '    FEATURES {',
  '        uuid feature_id PK',
  '        uuid product_id FK',
  '        string slug',
  '    }'
].join('\n');

const REALISTIC_DATA_MODEL_MERMAID = [
  'erDiagram',
  '    PEOPLE ||--o{ PERSON_IDENTITIES : "has"',
  '    PEOPLE ||--o{ TEAM_MEMBERSHIPS : "belongs to"',
  '    TEAM_MEMBERSHIPS }o--|| TENANT_PLAN : "scoped by tenant_id"',
  '    TEAM_MEMBERSHIPS }o--|| CREDITS : "scoped by tenant_id"',
  '    TENANT_PLAN ||--o{ PRODUCTS : "tenant owns"',
  '',
  '    PEOPLE {',
  '        int id PK',
  '        timestamptz created_at',
  '    }',
  '    PERSON_IDENTITIES {',
  '        string identity_key PK',
  '        int person_id FK',
  '        string provider',
  '    }',
  '    TEAM_MEMBERSHIPS {',
  '        string tenant_id PK',
  '        int person_id FK',
  '        string role',
  '    }',
  '    CREDITS {',
  '        string tenant_id PK',
  '        int balance',
  '        timestamptz updated_at',
  '    }',
  '    TENANT_PLAN {',
  '        string tenant_id PK',
  '        string plan',
  '        string status',
  '    }',
  '    PRODUCTS {',
  '        uuid product_id PK',
  '        string tenant_id FK',
  '        string name',
  '        string description',
  '    }'
].join('\n');

// Entity names expected to be legible/distinguishable in the realistic
// fixture's rendered diagram (AC2) — used by the E2E spec to assert every
// entity name is actually visible as rendered text, not merely present in
// the source.
const REALISTIC_ENTITY_NAMES = [
  'PEOPLE',
  'PERSON_IDENTITIES',
  'TEAM_MEMBERSHIPS',
  'CREDITS',
  'TENANT_PLAN',
  'PRODUCTS'
];

module.exports = {
  MINIMAL_DATA_MODEL_MERMAID,
  REALISTIC_DATA_MODEL_MERMAID,
  REALISTIC_ENTITY_NAMES
};
