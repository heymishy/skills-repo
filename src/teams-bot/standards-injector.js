'use strict';
// src/teams-bot/standards-injector.js
// p4-nta-standards-inject — Sidecar standards injection for Teams bot
//
// C5: reads standards from hash-verified sidecar; no HTTP/HTTPS fetch
// ADR-004: no hardcoded standards file paths; sidecarRoot injected by caller
// MC-SEC-02: no standards content in external log calls

const fs   = require('fs');
const path = require('path');

// Role → sidecar discipline directory mapping
// Roles not in this map fall back to no content (standardsInjected: false)
const ROLE_DISCIPLINE_MAP = {
  'product-manager': ['product'],
  'business-analyst': ['product', 'software-engineering'],
  'risk-reviewer':  ['quality-assurance'],
  'engineer':       ['software-engineering', 'security-engineering'],
};

/**
 * Reads discipline-specific standards from the sidecar directory.
 * Returns standardsContent (string) and standardsInjected (boolean).
 * Never throws — returns gracefully with standardsInjected: false if sidecar unavailable.
 *
 * @param {{ step: string, role: string, sidecarRoot: string, question?: string }} opts
 * @returns {{ standardsContent: string|null, standardsInjected: boolean, note?: string, question?: string }}
 */
function injectStandards({ step, role, sidecarRoot, question } = {}) {
  // Check sidecar availability
  if (!sidecarRoot || !fs.existsSync(sidecarRoot)) {
    return {
      standardsContent:  null,
      standardsInjected: false,
      note: 'Sidecar not installed. Run: skills-repo init to set up the standards sidecar.',
      question: question || undefined,
    };
  }

  const disciplines = ROLE_DISCIPLINE_MAP[role] || [];
  const parts = [];

  for (const discipline of disciplines) {
    const stdFile = path.join(sidecarRoot, discipline, 'standards.md');
    if (fs.existsSync(stdFile)) {
      try {
        const content = fs.readFileSync(stdFile, 'utf8');
        if (content && content.trim()) {
          parts.push(content.trim());
        }
      } catch (_) {
        // skip unreadable files silently
      }
    }
  }

  if (parts.length === 0) {
    return {
      standardsContent:  null,
      standardsInjected: false,
      note: 'Sidecar not installed. Run: skills-repo init to set up the standards sidecar.',
      question: question || undefined,
    };
  }

  return {
    standardsContent:  parts.join('\n\n---\n\n'),
    standardsInjected: true,
    question:          question || undefined,
  };
}

module.exports = { injectStandards };
