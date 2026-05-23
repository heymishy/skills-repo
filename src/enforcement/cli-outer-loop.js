// cli-outer-loop.js — skills validate: artefact structural validation
// Implements H1-H9 DoR gate checks. Returns { exitCode, stdout, stderr }.
// Pure function — no process.exit(), no file writes, no network calls.

'use strict';

const fs   = require('fs');
const path = require('path');

const SUPPORTED_GATES = ['definition-of-ready'];

// Exit code constants — first-failing category determines the exit code.
const EXIT = {
  OK: 0,
  H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6, H7_THROUGH_H9: 7, SYSTEM: 8,
};

// H1: embedded scan — matches artefacts/<feature-slug>/stories/<story-slug>.md
const STORY_REF_RE = /artefacts\/[^/\s\n]+\/stories\/([^/\s\n.]+)\.md/g;

// H2-H9: header-metadata extraction from DoR content
const STORY_REF_HEADER_RE    = /\*\*Story reference:\*\*\s+(\S+\.md)/;
const TESTPLAN_REF_HEADER_RE = /\*\*Test plan reference:\*\*\s+(\S+\.md)/;
const REVIEW_REF_HEADER_RE   = /\*\*Review artefact:\*\*\s+(\S+\.md)/;

/**
 * Validate an artefact against a gate.
 *
 * @param {string} artefactPath - Path to the artefact (absolute or relative to repoRoot)
 * @param {string} gateName     - Gate to validate against (e.g. 'definition-of-ready')
 * @param {string} repoRoot     - Absolute path to the repository root
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function validate(artefactPath, gateName, repoRoot) {
  // ── Path traversal guard (OWASP A01) ───────────────────────────────────────
  const resolved = path.isAbsolute(artefactPath)
    ? path.resolve(artefactPath)
    : path.resolve(repoRoot, artefactPath);

  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  if (!resolved.startsWith(rootWithSep)) {
    return {
      exitCode: EXIT.SYSTEM,
      stdout: '',
      stderr: 'Error: artefact path resolves outside repository root. Path traversal prevented (OWASP A01).',
    };
  }

  // ── Gate validation ─────────────────────────────────────────────────────────
  if (!SUPPORTED_GATES.includes(gateName)) {
    return {
      exitCode: EXIT.SYSTEM,
      stdout: '',
      stderr: `UNSUPPORTED_GATE: '${gateName}' is not a recognised gate. Supported gates: ${SUPPORTED_GATES.join(', ')}`,
    };
  }

  // ── H1: story artefact exists (embedded scan) ───────────────────────────────
  let content;
  try {
    content = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    return {
      exitCode: EXIT.H1,
      stdout: '',
      stderr: `H1 FAIL: could not read artefact (file not found or unreadable)`,
    };
  }

  let match;
  STORY_REF_RE.lastIndex = 0;
  while ((match = STORY_REF_RE.exec(content)) !== null) {
    const relStoryPath = match[0];
    const absStoryPath = path.join(repoRoot, relStoryPath);
    if (!fs.existsSync(absStoryPath)) {
      return {
        exitCode: EXIT.H1,
        stdout: '',
        stderr: `H1 FAIL: story artefact not found at ${relStoryPath} (slug: ${match[1]})`,
      };
    }
  }

  // ── H2-H9: header-metadata checks ──────────────────────────────────────────
  // If no header-format story reference exists, H2-H9 are not applicable.
  const storyHeaderMatch = STORY_REF_HEADER_RE.exec(content);
  if (!storyHeaderMatch) {
    return {
      exitCode: EXIT.OK,
      stdout: `validate OK: ${gateName} — 0 violations found`,
      stderr: '',
    };
  }

  const relStory = storyHeaderMatch[1];
  const absStory = path.resolve(repoRoot, relStory);
  if (!absStory.startsWith(rootWithSep)) {
    return {
      exitCode: EXIT.SYSTEM,
      stdout: '',
      stderr: 'Error: story header path resolves outside repository root. Path traversal prevented (OWASP A01).',
    };
  }

  let storyContent;
  try {
    storyContent = fs.readFileSync(absStory, 'utf8');
  } catch (_) {
    return {
      exitCode: EXIT.H1,
      stdout: '',
      stderr: `H1 FAIL: story artefact not found at ${relStory}`,
    };
  }

  // ── H2: AC count and Given/When/Then format ─────────────────────────────────
  {
    const acMarkers = [];
    const markerRe = /\*\*AC(\d+):\*\*/g;
    let m;
    while ((m = markerRe.exec(storyContent)) !== null) {
      acMarkers.push({ n: parseInt(m[1], 10), pos: m.index });
    }

    if (acMarkers.length < 3) {
      return {
        exitCode: EXIT.H2,
        stdout: '',
        stderr: `H2 FAIL: minimum 3 ACs required, found ${acMarkers.length}`,
      };
    }

    for (let i = 0; i < acMarkers.length; i++) {
      const start = acMarkers[i].pos;
      const end   = i + 1 < acMarkers.length ? acMarkers[i + 1].pos : storyContent.length;
      const block = storyContent.slice(start, end).toLowerCase();
      const missing = [];
      if (!block.includes('given')) missing.push('Given');
      if (!block.includes('when'))  missing.push('When');
      if (!block.includes('then'))  missing.push('Then');
      if (missing.length > 0) {
        return {
          exitCode: EXIT.H2,
          stdout: '',
          stderr: `H2 FAIL: AC${acMarkers[i].n} does not follow Given/When/Then format (missing: ${missing.join(', ')})`,
        };
      }
    }
  }

  // ── H3: test plan existence and AC coverage ─────────────────────────────────
  let tpContent;
  {
    const tpHeaderMatch = TESTPLAN_REF_HEADER_RE.exec(content);
    if (!tpHeaderMatch) {
      return {
        exitCode: EXIT.H3,
        stdout: '',
        stderr: 'H3 FAIL: no test plan reference found in DoR (**Test plan reference:** <path>)',
      };
    }

    const relTp = tpHeaderMatch[1];
    const absTp = path.resolve(repoRoot, relTp);
    if (!absTp.startsWith(rootWithSep)) {
      return {
        exitCode: EXIT.SYSTEM,
        stdout: '',
        stderr: 'Error: test plan path resolves outside repository root. Path traversal prevented (OWASP A01).',
      };
    }
    if (!fs.existsSync(absTp)) {
      return {
        exitCode: EXIT.H3,
        stdout: '',
        stderr: `H3 FAIL: test plan not found at ${relTp}`,
      };
    }

    tpContent = fs.readFileSync(absTp, 'utf8');
    const acMarkerRe = /\*\*AC(\d+):\*\*/g;
    let m;
    while ((m = acMarkerRe.exec(storyContent)) !== null) {
      const acLabel = `AC${m[1]}`;
      if (!tpContent.includes(acLabel)) {
        return {
          exitCode: EXIT.H3,
          stdout: '',
          stderr: `H3 FAIL: ${acLabel} not covered in test plan`,
        };
      }
    }
  }

  // ── H4: Out-of-scope section ────────────────────────────────────────────────
  {
    const oosSectionRe = /^#{1,3}\s+out[\s-]of[\s-]?scope\s*$/im;
    const oosMatch = oosSectionRe.exec(storyContent);
    if (!oosMatch) {
      return {
        exitCode: EXIT.H4,
        stdout: '',
        stderr: 'H4 FAIL: story has no "Out of Scope" section',
      };
    }

    const bodyStart = oosMatch.index + oosMatch[0].length;
    const nextHeadingMatch = /^#{1,3}\s+/m.exec(storyContent.slice(bodyStart));
    const oosBody    = nextHeadingMatch
      ? storyContent.slice(bodyStart, bodyStart + nextHeadingMatch.index)
      : storyContent.slice(bodyStart);
    const oosTrimmed = oosBody.trim();

    if (!oosTrimmed) {
      return {
        exitCode: EXIT.H4,
        stdout: '',
        stderr: 'H4 FAIL: Out of Scope section body is blank',
      };
    }

    const oosLower = oosTrimmed.toLowerCase();
    if (oosLower === 'n/a' || oosLower === 'none' || oosLower === 'na') {
      return {
        exitCode: EXIT.H4,
        stdout: '',
        stderr: 'H4 FAIL: Out of Scope section is only "N/A" or "None" — populate with explicit constraints',
      };
    }
  }

  // ── H5: Benefit linkage ─────────────────────────────────────────────────────
  {
    const blSectionRe = /^#{1,3}\s+benefit[\s-]?linkage\s*$/im;
    const blMatch = blSectionRe.exec(storyContent);
    if (!blMatch) {
      return {
        exitCode: EXIT.H5,
        stdout: '',
        stderr: 'H5 FAIL: story has no "Benefit Linkage" section',
      };
    }

    const bodyStart = blMatch.index + blMatch[0].length;
    const nextHeadingMatch = /^#{1,3}\s+/m.exec(storyContent.slice(bodyStart));
    const blBody    = nextHeadingMatch
      ? storyContent.slice(bodyStart, bodyStart + nextHeadingMatch.index)
      : storyContent.slice(bodyStart);
    const blTrimmed = blBody.trim();

    if (!/M\d+|[Mm]etric/.test(blTrimmed)) {
      return {
        exitCode: EXIT.H5,
        stdout: '',
        stderr: 'H5 FAIL: Benefit Linkage section does not reference a named metric (M[0-9]+ or "Metric")',
      };
    }

    const blLower = blTrimmed.toLowerCase();
    const disqualifyingPhrases = ['technical dependency', 'unblocks', 'needed for'];
    const found = disqualifyingPhrases.find(phrase => blLower.includes(phrase));
    if (found) {
      return {
        exitCode: EXIT.H5,
        stdout: '',
        stderr: `H5 FAIL: Benefit Linkage section describes a technical dependency ("${found}")`,
      };
    }
  }

  // ── H6: Complexity rating ───────────────────────────────────────────────────
  {
    if (!/complexity/i.test(storyContent)) {
      return {
        exitCode: EXIT.H6,
        stdout: '',
        stderr: 'H6 FAIL: story has no Complexity Rating section or field',
      };
    }

    if (!/(?:complexity|rating)[^\n]*?(?::\s*|is\s+)[1-3]\b/i.test(storyContent)) {
      return {
        exitCode: EXIT.H6,
        stdout: '',
        stderr: 'H6 FAIL: Complexity rating value must be 1, 2, or 3',
      };
    }

    if (!/scope\s+stability/i.test(storyContent)) {
      return {
        exitCode: EXIT.H6,
        stdout: '',
        stderr: 'H6 FAIL: Scope stability field is missing',
      };
    }
  }

  // ── H7: Review findings ─────────────────────────────────────────────────────
  let rvContent;
  {
    const rvHeaderMatch = REVIEW_REF_HEADER_RE.exec(content);
    if (!rvHeaderMatch) {
      return {
        exitCode: EXIT.H7_THROUGH_H9,
        stdout: '',
        stderr: 'H7 FAIL: no review artefact reference found in DoR (**Review artefact:** <path>)',
      };
    }

    const relRv = rvHeaderMatch[1];
    const absRv = path.resolve(repoRoot, relRv);
    if (!absRv.startsWith(rootWithSep)) {
      return {
        exitCode: EXIT.SYSTEM,
        stdout: '',
        stderr: 'Error: review artefact path resolves outside repository root. Path traversal prevented (OWASP A01).',
      };
    }
    if (!fs.existsSync(absRv)) {
      return {
        exitCode: EXIT.H7_THROUGH_H9,
        stdout: '',
        stderr: `H7 FAIL: review artefact not found at ${relRv}`,
      };
    }

    rvContent = fs.readFileSync(absRv, 'utf8');
    if (/\|\s*HIGH\b/i.test(rvContent)) {
      return {
        exitCode: EXIT.H7_THROUGH_H9,
        stdout: '',
        stderr: 'H7 FAIL: review artefact contains unresolved HIGH findings',
      };
    }
  }

  // ── H8: Test plan completeness ──────────────────────────────────────────────
  {
    if (!/coverage/i.test(tpContent)) {
      return {
        exitCode: EXIT.H7_THROUGH_H9,
        stdout: '',
        stderr: 'H8 FAIL: test plan has no AC coverage section',
      };
    }

    const acMarkerRe = /\*\*AC(\d+):\*\*/g;
    let m;
    while ((m = acMarkerRe.exec(storyContent)) !== null) {
      const acLabel = `AC${m[1]}`;
      if (!tpContent.includes(acLabel)) {
        return {
          exitCode: EXIT.H7_THROUGH_H9,
          stdout: '',
          stderr: `H8 FAIL: ${acLabel} not in test plan coverage section`,
        };
      }
    }
  }

  // ── H8-ext: Schema dependency check ────────────────────────────────────────
  {
    const depSectionRe = /^#{1,3}\s+dependencies\s*$/im;
    const depMatch = depSectionRe.exec(storyContent);
    if (depMatch) {
      const bodyStart  = depMatch.index + depMatch[0].length;
      const nextHeading = /^#{1,3}\s+/m.exec(storyContent.slice(bodyStart));
      const depBody    = nextHeading
        ? storyContent.slice(bodyStart, bodyStart + nextHeading.index)
        : storyContent.slice(bodyStart);
      const depTrimmed = depBody.trim().toLowerCase();
      const hasUpstreamDeps = depTrimmed && depTrimmed !== 'none' && depTrimmed !== 'n/a';

      if (hasUpstreamDeps && !/schemadepends:/i.test(content)) {
        return {
          exitCode: EXIT.H7_THROUGH_H9,
          stdout: '',
          stderr: 'H8-ext FAIL: story has upstream dependencies but DoR has no schemaDepends: declaration',
        };
      }
    }
  }

  // ── H9: Architecture constraints ────────────────────────────────────────────
  {
    const archRe = /^#{1,3}\s+architecture\s+constraints/im;
    const archMatch = archRe.exec(storyContent);
    if (!archMatch) {
      return {
        exitCode: EXIT.H7_THROUGH_H9,
        stdout: '',
        stderr: 'H9 FAIL: story has no Architecture Constraints section',
      };
    }

    const bodyStart  = archMatch.index + archMatch[0].length;
    const nextHeading = /^#{1,3}\s+/m.exec(storyContent.slice(bodyStart));
    const archBody   = nextHeading
      ? storyContent.slice(bodyStart, bodyStart + nextHeading.index)
      : storyContent.slice(bodyStart);
    const archTrimmed = archBody.trim();

    if (!archTrimmed) {
      return {
        exitCode: EXIT.H7_THROUGH_H9,
        stdout: '',
        stderr: 'H9 FAIL: Architecture Constraints section is blank',
      };
    }

    if (!/ADR-\d+|guardrail|constraint/i.test(archTrimmed)) {
      return {
        exitCode: EXIT.H7_THROUGH_H9,
        stdout: '',
        stderr: 'H9 FAIL: Architecture Constraints section does not reference an ADR, guardrail, or named constraint',
      };
    }
  }

  // ── All checks passed ───────────────────────────────────────────────────────
  return {
    exitCode: EXIT.OK,
    stdout: `validate OK: ${gateName} — 0 violations found`,
    stderr: '',
  };
}

module.exports = { validate };
