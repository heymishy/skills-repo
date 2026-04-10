#!/usr/bin/env node
/**
 * surface-adapter/resolver.js
 *
 * Path B surface type resolver.
 *
 * Reads context.yml for surface.path: "explicit-declaration" and selects the
 * matching registered adapter. Short-circuits before any Path A (EA registry)
 * lookup — no outbound registry calls are made during Path B resolution.
 *
 * Path A (EA registry) is Phase 2: a separate resolver function will call an
 * EA registry, receive a surface type string, and pass it to execute() — no
 * changes to this file or to execute() will be required.
 *
 * Reference: artefacts/2026-04-09-skills-platform-phase1/stories/p1.2-surface-adapter-model-foundations.md
 */
'use strict';

const fs = require('fs');

/**
 * Remove surrounding quotes from a string only when the opening and closing
 * quote characters match (both single or both double). Prevents mismatched
 * quote removal (e.g. `'test"` should not be stripped).
 *
 * @param {string} s
 * @returns {string}
 */
function stripMatchingQuotes(s) {
  if (s.length >= 2) {
    if ((s[0] === "'" && s[s.length - 1] === "'") ||
        (s[0] === '"' && s[s.length - 1] === '"')) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/**
 * Extract the surface configuration block from a YAML string.
 * Handles the Path B explicit-declaration format used in context.yml.
 * Parses only the subset of YAML used in context.yml surface blocks:
 *   - key: value pairs (string values)
 *   - key: followed by a list of - items
 *
 * @param {string} yamlText - Raw YAML content
 * @returns {{ path?: string, type?: string, types?: string[] } | null}
 */
function extractSurfaceConfig(yamlText) {
  const lines = yamlText.split('\n');
  let inSurface = false;
  let surfaceLineIndent = 0;
  const surface = {};
  let currentArray = null;

  for (const rawLine of lines) {
    // Strip inline comments and trailing whitespace
    const stripped = rawLine.replace(/\s*#.*$/, '').trimEnd();
    if (stripped.trim() === '') continue;

    const indent = stripped.match(/^(\s*)/)[1].length;
    const content = stripped.trim();

    if (!inSurface) {
      if (content === 'surface:') {
        inSurface = true;
        surfaceLineIndent = indent;
      }
      continue;
    }

    // Leaving the surface block: back to top level (same or lesser indent, not an array item)
    if (indent <= surfaceLineIndent && !content.startsWith('-')) {
      break;
    }

    // Array item within the current key
    if (content.startsWith('- ')) {
      if (currentArray !== null) {
        currentArray.push(stripMatchingQuotes(content.slice(2).trim()));
      }
      continue;
    }

    // Key: value pair
    const colonIdx = content.indexOf(':');
    if (colonIdx < 0) continue;

    const key = content.slice(0, colonIdx).trim();
    const rawVal = content.slice(colonIdx + 1).trim();
    const val = stripMatchingQuotes(rawVal);

    currentArray = null; // reset array collector for previous key

    if (rawVal === '') {
      // Empty value — array or nested object follows
      currentArray = [];
      surface[key] = currentArray;
    } else {
      surface[key] = val;
    }
  }

  return Object.keys(surface).length > 0 ? surface : null;
}

/**
 * Resolve surface types from a context.yml file using Path B (explicit-declaration).
 * Short-circuits before any Path A (EA registry) lookup.
 *
 * For each declared surface type, returns the matching adapter from the registry
 * (or null if no adapter is registered for that type).
 *
 * @param {string} contextYmlPath - Absolute path to context.yml file
 * @param {Object.<string, { execute: function }>} adapterRegistry - Map of surfaceType → adapter
 * @returns {{ surfaceType: string, adapter: object|null }[]}
 */
function resolvePathB(contextYmlPath, adapterRegistry) {
  const content = fs.readFileSync(contextYmlPath, 'utf8');
  const surface = extractSurfaceConfig(content);

  if (!surface) {
    throw new Error('No surface block found in context.yml — add a surface: declaration block');
  }

  if (surface.path !== 'explicit-declaration') {
    throw new Error(
      `Surface resolution path "${surface.path}" is not supported in Phase 1. ` +
      'Path B requires surface.path: explicit-declaration. ' +
      'Path A (EA registry) is Phase 2 scope.'
    );
  }

  // Collect declared surface types (single type or types array)
  let types;
  if (Array.isArray(surface.types) && surface.types.length > 0) {
    types = surface.types;
  } else if (surface.type && typeof surface.type === 'string') {
    types = [surface.type];
  } else {
    throw new Error(
      'No surface type(s) declared under surface.path: explicit-declaration. ' +
      'Add surface.type: <type> or surface.types: [<type>, ...]'
    );
  }

  return types.map(surfaceType => ({
    surfaceType,
    adapter: adapterRegistry[surfaceType] || null,
  }));
}

module.exports = { resolvePathB, extractSurfaceConfig };
