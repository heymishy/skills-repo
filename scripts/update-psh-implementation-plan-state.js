'use strict';
// cdg.6 exception (b): named one-off script to set implementation-plan tasks
// for feature 2026-07-05-product-stds-hierarchy (psh-s1 through psh-s10).
// Run once, then validate with node scripts/check-pipeline-state-integrity.js
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.github', 'pipeline-state.json');
const TMP_FILE = STATE_FILE + '.tmp';

const raw = fs.readFileSync(STATE_FILE, 'utf8');
const ps = JSON.parse(raw);

const feat = ps.features.find(function(f) { return f.slug === '2026-07-05-product-stds-hierarchy'; });
if (!feat) { console.error('Feature not found'); process.exit(1); }

feat.stage = 'implementation-plan';

const PLAN_BASE = 'artefacts/2026-07-05-product-stds-hierarchy/plans';

const STORY_TASKS = {
  'psh-s1': [
    { id: 'task-1', name: 'write 8 failing tests — schema checks + integration (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s1-plan.md' },
    { id: 'task-2', name: 'add products/standards/journeys.product_id migration SQL to server.js (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s1-plan.md' }
  ],
  'psh-s2': [
    { id: 'task-1', name: 'write 7 failing tests — idempotency, per-tenant isolation, Default product (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s2-plan.md' },
    { id: 'task-2', name: 'create scripts/migrate-journeys-to-default-product.js — runMigration(pool, log) (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s2-plan.md' }
  ],
  'psh-s3': [
    { id: 'task-1', name: 'write 9 failing tests — solo plan, D37 throw, PostHog (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s3-plan.md' },
    { id: 'task-2', name: 'create src/web-ui/adapters/product-draft.js — D37 adapter (GREEN partial)', tddState: 'pending', file: PLAN_BASE + '/psh-s3-plan.md' },
    { id: 'task-3', name: 'create src/web-ui/routes/products.js — handlePostProductNew + handlePostProductConfirm (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s3-plan.md' },
    { id: 'task-4', name: 'wire setGenerateProductDraft in server.js — D37 mandatory separate wiring task', tddState: 'pending', file: PLAN_BASE + '/psh-s3-plan.md' }
  ],
  'psh-s4': [
    { id: 'task-1', name: 'write 7 failing tests — dashboard cards, product view, new feature, HTML escape (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s4-plan.md' },
    { id: 'task-2', name: 'add handleGetDashboard, handleGetProductView, handlePostProductFeature to products.js (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s4-plan.md' },
    { id: 'task-3', name: 'create tests/e2e/psh-s4-dashboard-layout.spec.js — Playwright layout test (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s4-plan.md' },
    { id: 'task-4', name: 'mount GET /dashboard, GET /products/:id, POST /products/:id/features in server.js', tddState: 'pending', file: PLAN_BASE + '/psh-s4-plan.md' }
  ],
  'psh-s5': [
    { id: 'task-1', name: 'write 9 failing tests — D37 throw, 5 sections, order, concurrent, DB error propagate (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s5-plan.md' },
    { id: 'task-2', name: 'create src/web-ui/product-context-adapter.js — D37 adapter (GREEN partial)', tddState: 'pending', file: PLAN_BASE + '/psh-s5-plan.md' },
    { id: 'task-3', name: 'add buildSystemPromptWithProductContext export to skills.js (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s5-plan.md' },
    { id: 'task-4', name: 'wire setProductContextAdapter in server.js — D37 mandatory separate wiring task', tddState: 'pending', file: PLAN_BASE + '/psh-s5-plan.md' }
  ],
  'psh-s6': [
    { id: 'task-1', name: 'write 7 failing tests — 8 stage columns, health labels, empty state, PostHog (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s6-plan.md' },
    { id: 'task-2', name: 'add handleGetProductKanban to products.js — 8-column kanban (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s6-plan.md' },
    { id: 'task-3', name: 'create tests/e2e/psh-s6-product-kanban.spec.js — Playwright 8-column layout test', tddState: 'pending', file: PLAN_BASE + '/psh-s6-plan.md' },
    { id: 'task-4', name: 'mount GET /products/:id/kanban in server.js', tddState: 'pending', file: PLAN_BASE + '/psh-s6-plan.md' }
  ],
  'psh-s7': [
    { id: 'task-1', name: 'write 7 failing tests — groups by product, filter, PostHog, cross-tenant (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s7-plan.md' },
    { id: 'task-2', name: 'add handleGetOrgKanban to products.js — org-level grouped kanban (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s7-plan.md' },
    { id: 'task-3', name: 'create tests/e2e/psh-s7-org-kanban.spec.js — Playwright layout test', tddState: 'pending', file: PLAN_BASE + '/psh-s7-plan.md' },
    { id: 'task-4', name: 'mount GET /org/kanban in server.js', tddState: 'pending', file: PLAN_BASE + '/psh-s7-plan.md' }
  ],
  'psh-s8': [
    { id: 'task-1', name: 'write 8 failing tests — POST/GET/PUT standards, org_id from session, XSS (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s8-plan.md' },
    { id: 'task-2', name: 'create src/web-ui/routes/standards.js — standardsPost, standardsList, standardsPut (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s8-plan.md' },
    { id: 'task-3', name: 'mount POST/GET /products/:id/standards and PUT /standards/:id in server.js', tddState: 'pending', file: PLAN_BASE + '/psh-s8-plan.md' }
  ],
  'psh-s9': [
    { id: 'task-1', name: 'write 8 failing tests — promote, cross-org block, public block, optout CRUD (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s9-plan.md' },
    { id: 'task-2', name: 'add standard_product_optouts migration to server.js CREATE TABLE IF NOT EXISTS', tddState: 'pending', file: PLAN_BASE + '/psh-s9-plan.md' },
    { id: 'task-3', name: 'add standardsPromote, optoutPost, optoutDelete to standards.js (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s9-plan.md' },
    { id: 'task-4', name: 'mount PUT /standards/:id/promote, POST/DELETE /standards/:id/optout in server.js', tddState: 'pending', file: PLAN_BASE + '/psh-s9-plan.md' }
  ],
  'psh-s10': [
    { id: 'task-1', name: 'write 8 failing tests — D37 throw, standards section order, empty list, null productId (RED)', tddState: 'pending', file: PLAN_BASE + '/psh-s10-plan.md' },
    { id: 'task-2', name: 'create src/web-ui/standards-adapter.js — D37 adapter (GREEN partial)', tddState: 'pending', file: PLAN_BASE + '/psh-s10-plan.md' },
    { id: 'task-3', name: 'extend buildSystemPromptWithProductContext in skills.js — add standards section (GREEN)', tddState: 'pending', file: PLAN_BASE + '/psh-s10-plan.md' },
    { id: 'task-4', name: 'wire setStandardsAdapter in server.js — D37 mandatory separate wiring task', tddState: 'pending', file: PLAN_BASE + '/psh-s10-plan.md' }
  ]
};

feat.epics.forEach(function(epic) {
  epic.stories.forEach(function(story) {
    var tasks = STORY_TASKS[story.slug];
    if (tasks) {
      story.stage = 'implementation-plan';
      story.tasks = tasks;
    }
  });
});

const updated = JSON.stringify(ps, null, 2) + '\n';
fs.writeFileSync(TMP_FILE, updated, 'utf8');
// Verify valid JSON
JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
fs.renameSync(TMP_FILE, STATE_FILE);
console.log('pipeline-state.json updated — feature and 10 stories advanced to implementation-plan');
