'use strict';

const fs = require('fs');
const path = require('path');

// jcx-s1 -- slugifies a placeholder name into a safe feature-slug directory
// name. Lowercase, hyphenate, strip anything that isn't alphanumeric/hyphen.
function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates artefacts/[feature-slug]/ and seeds discovery.md's own Section 1
 * (Problem Statement) with the journey stage's own context. Only Section 1
 * is seeded -- confirmed via /clarify (Option A), 2026-10-11.
 *
 * jcx-s1 -- mandatory path-traversal guard (web-ui-patterns.md's own
 * established convention): path.resolve + startsWith(repoRoot + sep).
 *
 * @param {object} stage - { name, description, emotion, pain_points, opportunities, touchpoints }
 * @param {string} placeholderName - the operator-provided placeholder name
 * @param {string} repoRoot - absolute repo root to guard against traversal
 * @returns {{ featureSlug: string } | { error: string }}
 */
function seedDiscoveryFromStage(stage, placeholderName, repoRoot) {
  // jcx-s1 -- allowlist validation ahead of the resolve+startsWith guard
  // below, matching web-ui-patterns.md's own convention (the guard is
  // required in addition to, not instead of, this check). Without this,
  // slugify's own sanitization would silently neutralise a traversal
  // attempt rather than rejecting it, which would mask the NFR from ever
  // being exercised.
  if (/[\\/]|\.\./.test(String(placeholderName))) {
    return { error: 'invalid characters in placeholder name' };
  }

  var dated = new Date().toISOString().slice(0, 10);
  var featureSlug = dated + '-' + slugify(placeholderName);

  var resolvedRepoRoot = path.resolve(repoRoot);
  var artefactDir = path.resolve(resolvedRepoRoot, 'artefacts', featureSlug);
  if (!artefactDir.startsWith(resolvedRepoRoot + path.sep)) {
    return { error: 'artefact path escapes repo root' };
  }

  fs.mkdirSync(artefactDir, { recursive: true });

  var problemStatement = 'Stage: ' + stage.name + '\n\n' +
    (stage.description ? stage.description + '\n\n' : '') +
    'Emotion: ' + (stage.emotion || 'Not set') + '\n' +
    'Pain points: ' + (stage.pain_points || 'Not set') + '\n' +
    'Opportunities: ' + (stage.opportunities || 'Not set') + '\n' +
    'Touchpoints: ' + (stage.touchpoints || 'Not set');

  var discoveryMd = '# Discovery: ' + placeholderName + '\n\n' +
    '**Status:** Draft — awaiting approval\n' +
    '**Created:** ' + dated + '\n' +
    '**Approved by:** [pending]\n' +
    '**Author:** Claude (seeded from journey stage "' + stage.name + '")\n\n' +
    '---\n\n' +
    '## Problem Statement\n\n' +
    problemStatement + '\n';

  fs.writeFileSync(path.join(artefactDir, 'discovery.md'), discoveryMd, 'utf8');

  return { featureSlug: featureSlug };
}

module.exports = { seedDiscoveryFromStage, slugify };
