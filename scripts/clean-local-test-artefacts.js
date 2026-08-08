'use strict';
// clean-local-test-artefacts.js — tdc-s1
//
// Finds and (optionally) removes local, disk-only clutter left behind by
// skill-pipeline test/dev runs:
//   1. UNTRACKED artefacts/*/ directories whose only file is a bare
//      discovery.md (a test run that exercised /discovery in isolation,
//      never continued through the rest of the pipeline, and never committed).
//   2. UNTRACKED workspace/test-tmp-* directories (test-harness scratch
//      trees, named by convention — see tests/check-inf5-trace-extension.js,
//      tests/check-mig4-trace-extension.js).
//
// A bare-discovery.md directory that IS tracked in git is a real, committed
// (if abandoned) discovery artefact for an actual feature -- not test
// cruft -- and must never be a candidate here, regardless of shape. Only
// untrackedness + the recognised shape together qualify a directory.
//
// Dry-run by default — prints what it would remove and changes nothing.
// Pass --delete to actually remove the listed candidates.
//
// Usage: node scripts/clean-local-test-artefacts.js [--delete]

var fs = require('fs');
var path = require('path');
var execFileSync = require('child_process').execFileSync;

var DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');
var shouldDelete = process.argv.includes('--delete');

function isTracked(repoRoot, dirPath) {
  var rel = path.relative(repoRoot, dirPath).split(path.sep).join('/');
  try {
    var out = execFileSync('git', ['ls-files', rel], { cwd: repoRoot, encoding: 'utf8' });
    return out.trim().length > 0;
  } catch (_) {
    // If git itself is unavailable, do not treat as safe-to-delete.
    return true;
  }
}

function findBareDiscoveryDirs(repoRoot) {
  repoRoot = repoRoot || DEFAULT_REPO_ROOT;
  var artefactsRoot = path.join(repoRoot, 'artefacts');
  var candidates = [];
  var entries;
  try { entries = fs.readdirSync(artefactsRoot, { withFileTypes: true }); } catch (_) { return candidates; }
  entries.forEach(function(entry) {
    if (!entry.isDirectory()) return;
    var dirPath = path.join(artefactsRoot, entry.name);
    var onlyFile = soleFileOrNull(dirPath);
    if (onlyFile && path.basename(onlyFile) === 'discovery.md' && !isTracked(repoRoot, dirPath)) {
      candidates.push(dirPath);
    }
  });
  return candidates;
}

// Returns the path of the directory's sole file if it contains EXACTLY one
// file across its whole subtree, or null otherwise -- stopping as soon as a
// second file is found instead of building the complete recursive listing
// first (cas-s1: the prior implementation always walked the full subtree
// via listFilesRecursive even when a second top-level file already
// disqualified the directory, an unbounded cost that grows with every file
// under every feature's stories/epics/test-plans/etc. subdirectories).
function soleFileOrNull(dirPath) {
  var entries;
  try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch (_) { return null; }

  // Check direct file entries first, regardless of filesystem readdir
  // order -- 2+ files at this level alone disqualifies the directory
  // without ever needing to look inside any subdirectory.
  var fileEntries = entries.filter(function(e) { return !e.isDirectory(); });
  if (fileEntries.length > 1) return null;

  var dirEntries = entries.filter(function(e) { return e.isDirectory(); });
  var found = fileEntries.length === 1 ? path.join(dirPath, fileEntries[0].name) : null;

  for (var i = 0; i < dirEntries.length; i++) {
    var full = path.join(dirPath, dirEntries[i].name);
    var nested = soleFileOrNull(full);
    if (nested === null) {
      if (hasAnyFile(full)) return null;
      // subdirectory is empty -- fine, keep looking
    } else {
      if (found !== null) return null;
      found = nested;
    }
  }
  return found;
}

function hasAnyFile(dirPath) {
  var entries;
  try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch (_) { return false; }
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].isDirectory()) {
      if (hasAnyFile(path.join(dirPath, entries[i].name))) return true;
    } else {
      return true;
    }
  }
  return false;
}

function findTestTmpDirs(repoRoot) {
  repoRoot = repoRoot || DEFAULT_REPO_ROOT;
  var workspaceRoot = path.join(repoRoot, 'workspace');
  var candidates = [];
  var entries;
  try { entries = fs.readdirSync(workspaceRoot, { withFileTypes: true }); } catch (_) { return candidates; }
  entries.forEach(function(entry) {
    if (entry.isDirectory() && entry.name.indexOf('test-tmp-') === 0 && !isTracked(repoRoot, path.join(workspaceRoot, entry.name))) {
      candidates.push(path.join(workspaceRoot, entry.name));
    }
  });
  return candidates;
}

function listFilesRecursive(dirPath) {
  var out = [];
  var entries;
  try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch (_) { return out; }
  entries.forEach(function(entry) {
    var full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(listFilesRecursive(full));
    } else {
      out.push(full);
    }
  });
  return out;
}

function removeDirRecursive(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function main() {
  var repoRoot = DEFAULT_REPO_ROOT;
  var candidates = findBareDiscoveryDirs(repoRoot).concat(findTestTmpDirs(repoRoot));

  if (candidates.length === 0) {
    console.log('[clean-local-test-artefacts] No stray test artefact directories found.');
    return;
  }

  console.log('[clean-local-test-artefacts] ' + (shouldDelete ? 'Removing' : 'Would remove') + ' ' + candidates.length + ' director' + (candidates.length === 1 ? 'y' : 'ies') + ':');
  candidates.forEach(function(c) { console.log('  ' + path.relative(repoRoot, c)); });

  if (!shouldDelete) {
    console.log('\nDry run only — pass --delete to actually remove these.');
    return;
  }

  candidates.forEach(function(c) { removeDirRecursive(c); });
  console.log('\nDone.');
}

module.exports = { findBareDiscoveryDirs: findBareDiscoveryDirs, findTestTmpDirs: findTestTmpDirs, listFilesRecursive: listFilesRecursive };

if (require.main === module) {
  main();
}
