'use strict';

/**
 * csd-s6 hand-authored drift-comparison fixtures — pairs of as-designed /
 * as-built diagram sources exercising each type-specific drift rule
 * precisely, per this story's test plan
 * (artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s6-test-plan.md,
 * "Test Data Strategy": "Synthetic — pairs of as-designed/as-built diagram
 * fixtures, constructed to exercise each drift rule precisely").
 *
 * Mermaid syntax follows the SAME conventions this repo's own real modules
 * already use/document:
 *   - Data Model (erDiagram): src/modules/migration-schema-parser.js's
 *     generateErDiagram() output shape, and skills/design/SKILL.md's Data
 *     Model marker worked example.
 *   - Program Design / System Architecture (flowchart): csd-s5's
 *     src/modules/call-graph-extractor.js's generateFlowchartDiagram()
 *     output shape, and skills/design/SKILL.md's + skills/definition/
 *     SKILL.md's worked examples for these two marker types.
 */

// ---------------------------------------------------------------------------
// Data Model (AC1)
// ---------------------------------------------------------------------------

// Identical on both sides -- no drift expected.
const DATA_MODEL_IDENTICAL_AS_DESIGNED = [
  'erDiagram',
  '  CREDITS {',
  '    text tenant_id PK',
  '    integer balance',
  '    timestamptz updated_at',
  '  }'
].join('\n');
const DATA_MODEL_IDENTICAL_AS_BUILT = DATA_MODEL_IDENTICAL_AS_DESIGNED;

// As-built adds a table not present in as-designed -- no shape overlap with
// any existing entity, so this is a plain "table added" note, not a
// duplicate-entity flag.
const DATA_MODEL_ADDED_TABLE_AS_DESIGNED = DATA_MODEL_IDENTICAL_AS_DESIGNED;
const DATA_MODEL_ADDED_TABLE_AS_BUILT = [
  'erDiagram',
  '  CREDITS {',
  '    text tenant_id PK',
  '    integer balance',
  '    timestamptz updated_at',
  '  }',
  '  ORDERS_V2 {',
  '    uuid order_id PK',
  '    text customer_email',
  '    timestamptz placed_at',
  '  }'
].join('\n');

// As-built is missing a table that as-designed has.
const DATA_MODEL_REMOVED_TABLE_AS_DESIGNED = [
  'erDiagram',
  '  CREDITS {',
  '    text tenant_id PK',
  '    integer balance',
  '  }',
  '  STRIPE_EVENTS {',
  '    text stripe_event_id PK',
  '    text event_type',
  '  }'
].join('\n');
const DATA_MODEL_REMOVED_TABLE_AS_BUILT = [
  'erDiagram',
  '  CREDITS {',
  '    text tenant_id PK',
  '    integer balance',
  '  }'
].join('\n');

// ADR-026 case: as-built introduces USER_ROLES, a new table whose columns
// substantially duplicate the existing TEAM_MEMBERSHIPS entity already
// present in as-designed -- this must flag as non-optimal design, not a
// generic "table added" note.
const DATA_MODEL_DUPLICATE_AS_DESIGNED = [
  'erDiagram',
  '  TEAM_MEMBERSHIPS {',
  '    text tenant_id PK',
  '    text user_id FK',
  '    text role',
  '  }'
].join('\n');
const DATA_MODEL_DUPLICATE_AS_BUILT = [
  'erDiagram',
  '  TEAM_MEMBERSHIPS {',
  '    text tenant_id PK',
  '    text user_id FK',
  '    text role',
  '  }',
  '  USER_ROLES {',
  '    text tenant_id PK',
  '    text user_id FK',
  '    text role',
  '  }'
].join('\n');

// ---------------------------------------------------------------------------
// Program Design (AC2)
// ---------------------------------------------------------------------------

const PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED = [
  'flowchart LR',
  '  ROUTE[routes/feature.js]',
  '  ADAPTER[adapters/feature-store.js]',
  '  ROUTE --> ADAPTER'
].join('\n');
const PROGRAM_DESIGN_IDENTICAL_AS_BUILT = PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED;

// A genuinely restructured call stack: the call from routes/feature.js is
// re-routed through a new intermediate module, changing the actual
// file-tree/call-stack shape.
const PROGRAM_DESIGN_RESTRUCTURED_AS_DESIGNED = PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED;
const PROGRAM_DESIGN_RESTRUCTURED_AS_BUILT = [
  'flowchart LR',
  '  ROUTE[routes/feature.js]',
  '  HELPER[adapters/feature-helper.js]',
  '  ADAPTER[adapters/feature-store.js]',
  '  ROUTE --> HELPER',
  '  HELPER --> ADAPTER'
].join('\n');

// The as-built file/call structure is byte-for-byte identical to as-designed
// -- the flowchart representation never captures internal variable names, so
// a rename of a purely local variable inside adapters/feature-store.js (not
// reflected here at all) can never appear as a node/edge difference. This is
// the AC2 negative case: renaming a local variable inside an unchanged file
// structure must NOT flag as drift.
const PROGRAM_DESIGN_RENAMED_VAR_AS_DESIGNED = PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED;
const PROGRAM_DESIGN_RENAMED_VAR_AS_BUILT = PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED;

// ---------------------------------------------------------------------------
// System Architecture (AC3)
// ---------------------------------------------------------------------------

const SYSTEM_ARCHITECTURE_IDENTICAL_AS_DESIGNED = [
  'flowchart TD',
  '  WEBUI[Web UI]',
  '  POSTGRES[(Postgres)]',
  '  WEBUI --> POSTGRES'
].join('\n');
const SYSTEM_ARCHITECTURE_IDENTICAL_AS_BUILT = SYSTEM_ARCHITECTURE_IDENTICAL_AS_DESIGNED;

const SYSTEM_ARCHITECTURE_NEW_CALL_AS_DESIGNED = SYSTEM_ARCHITECTURE_IDENTICAL_AS_DESIGNED;
const SYSTEM_ARCHITECTURE_NEW_CALL_AS_BUILT = [
  'flowchart TD',
  '  WEBUI[Web UI]',
  '  POSTGRES[(Postgres)]',
  '  NEWSVC[New Service]',
  '  WEBUI --> POSTGRES',
  '  WEBUI --> NEWSVC'
].join('\n');

const SYSTEM_ARCHITECTURE_REMOVED_CALL_AS_DESIGNED = [
  'flowchart TD',
  '  WEBUI[Web UI]',
  '  POSTGRES[(Postgres)]',
  '  LEGACYSVC[Legacy Service]',
  '  WEBUI --> POSTGRES',
  '  WEBUI --> LEGACYSVC'
].join('\n');
const SYSTEM_ARCHITECTURE_REMOVED_CALL_AS_BUILT = [
  'flowchart TD',
  '  WEBUI[Web UI]',
  '  POSTGRES[(Postgres)]',
  '  LEGACYSVC[Legacy Service]',
  '  WEBUI --> POSTGRES'
].join('\n');

module.exports = {
  DATA_MODEL_IDENTICAL_AS_DESIGNED,
  DATA_MODEL_IDENTICAL_AS_BUILT,
  DATA_MODEL_ADDED_TABLE_AS_DESIGNED,
  DATA_MODEL_ADDED_TABLE_AS_BUILT,
  DATA_MODEL_REMOVED_TABLE_AS_DESIGNED,
  DATA_MODEL_REMOVED_TABLE_AS_BUILT,
  DATA_MODEL_DUPLICATE_AS_DESIGNED,
  DATA_MODEL_DUPLICATE_AS_BUILT,

  PROGRAM_DESIGN_IDENTICAL_AS_DESIGNED,
  PROGRAM_DESIGN_IDENTICAL_AS_BUILT,
  PROGRAM_DESIGN_RESTRUCTURED_AS_DESIGNED,
  PROGRAM_DESIGN_RESTRUCTURED_AS_BUILT,
  PROGRAM_DESIGN_RENAMED_VAR_AS_DESIGNED,
  PROGRAM_DESIGN_RENAMED_VAR_AS_BUILT,

  SYSTEM_ARCHITECTURE_IDENTICAL_AS_DESIGNED,
  SYSTEM_ARCHITECTURE_IDENTICAL_AS_BUILT,
  SYSTEM_ARCHITECTURE_NEW_CALL_AS_DESIGNED,
  SYSTEM_ARCHITECTURE_NEW_CALL_AS_BUILT,
  SYSTEM_ARCHITECTURE_REMOVED_CALL_AS_DESIGNED,
  SYSTEM_ARCHITECTURE_REMOVED_CALL_AS_BUILT
};
