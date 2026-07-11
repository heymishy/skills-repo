'use strict';

// flag-keys.js — bri-s1.5: shared constants for the 3 initial named feature flags
// wired across both PostHog projects (staging + prod).
//
// Every call site that evaluates one of these 3 flags MUST reference the constant
// exported here rather than re-typing the literal string, so a typo can never cause
// silent drift between the code's flag key and the real PostHog dashboard entry
// (this is the code-side half of AC4 — the dashboard-side half is a manual
// verification step, per the story's Out of Scope / test plan Coverage gaps).
//
// D37: this module holds no evaluation logic of its own — every flag check still
// goes through the shared isEnabled() helper (posthog-flags.js, bri-s1.1). This
// module exists purely to prevent literal-string drift, not as a second mechanism.

module.exports = {
  WIZARD_UI: 'wizard-ui',
  PRODUCT_KANBAN_VIEW: 'product-kanban-view',
  ORG_KANBAN_VIEW: 'org-kanban-view'
};
