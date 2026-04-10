#!/usr/bin/env node
/**
 * surface-adapter/index.js
 *
 * execute(surface, context) → result interface definition.
 *
 * The execute function is a pure dispatcher — it does not branch on surface type
 * internally. Each surface type is handled by a separately registered adapter.
 * Path A (EA registry) can be added in Phase 2 by implementing a resolver that
 * returns a surface type string and passes it to execute() — no signature change.
 *
 * Interface:
 *   registerAdapter(surfaceType: string, adapter: { execute(context) → result }) → void
 *   execute(surface: string, context: object) → AdapterResult
 *
 * AdapterResult shape:
 *   { status: 'pass'|'fail'|'error', surface: string, findings: string[], trace: string, adapterVersion: string }
 *
 * Reference: artefacts/2026-04-09-skills-platform-phase1/stories/p1.2-surface-adapter-model-foundations.md
 */
'use strict';

/** @type {Object.<string, { execute: function }>} */
const adapterRegistry = {};

/**
 * Register a surface adapter for a given surface type.
 * Calling registerAdapter again for the same type replaces the existing adapter.
 *
 * @param {string} surfaceType - Surface type identifier (e.g. 'git-native')
 * @param {{ execute: function }} adapter - Adapter with an execute(context) method
 */
function registerAdapter(surfaceType, adapter) {
  adapterRegistry[surfaceType] = adapter;
}

/**
 * Execute the registered adapter for the given surface type.
 * The surface parameter is resolved before this call — execute does not branch
 * on resolution path (Path A or Path B). Both paths produce a surface type
 * string and call this function with it.
 *
 * @param {string} surface - Surface type identifier
 * @param {object} context - Execution context (from context.yml or caller)
 * @returns {{ status: string, surface: string, findings: string[], trace: string, adapterVersion: string }}
 */
function execute(surface, context) {
  const adapter = adapterRegistry[surface];

  if (!adapter) {
    const trace = `trace-error-${Date.now()}-no-adapter`;
    return {
      status: 'error',
      surface,
      findings: [`No adapter registered for surface type: ${surface}`],
      trace,
      adapterVersion: 'unknown',
    };
  }

  const result = adapter.execute(context);
  // Guarantee surface is echoed from the input parameter regardless of adapter output
  return Object.assign({}, result, { surface });
}

module.exports = { execute, registerAdapter, _registry: adapterRegistry };
