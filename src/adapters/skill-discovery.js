'use strict';
const fs   = require('fs');
const path = require('path');

const SKILL_NAME_RE = /^[a-z0-9-]+$/;

let _logger = { warn: function(msg) { process.stderr.write('[skill-discovery] ' + msg + '\n'); } };

function setLogger(logger) { _logger = logger; }

/**
 * listAvailableSkills(repoPath) -> [{name, path}]
 *
 * Scans the skills directory for subdirectories containing a SKILL.md file.
 * Default skills dir: <repoPath>/.github/skills/
 * Override: COPILOT_SKILLS_DIRS env var
 *
 * Returns an empty array (not an error) when the directory is missing or empty.
 * Only includes directories whose names match [a-z0-9-].
 * Returned paths are relative to repoPath (e.g. ".github/skills/discovery").
 */
function listAvailableSkills(repoPath) {
  var skillsDirRel = process.env.COPILOT_SKILLS_DIRS || path.join('.github', 'skills');
  var skillsDir = path.isAbsolute(skillsDirRel)
    ? skillsDirRel
    : path.join(repoPath, skillsDirRel);

  if (!fs.existsSync(skillsDir)) {
    _logger.warn('skills directory not found: ' + skillsDir);
    return [];
  }

  var entries;
  try {
    entries = fs.readdirSync(skillsDir);
  } catch (e) {
    _logger.warn('could not read skills directory: ' + e.message);
    return [];
  }

  if (entries.length === 0) {
    _logger.warn('skills directory is empty: ' + skillsDir);
    return [];
  }

  var results = [];
  for (var i = 0; i < entries.length; i++) {
    var name = entries[i];
    if (!SKILL_NAME_RE.test(name)) {
      _logger.warn('skill name does not match [a-z0-9-], excluded: ' + name);
      continue;
    }
    var skillPath = path.join(skillsDir, name);
    var stat;
    try { stat = fs.statSync(skillPath); } catch (e) { continue; }
    if (!stat.isDirectory()) { continue; }
    var skillMdPath = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) { continue; }
    // Return path relative to repoPath
    var relPath = path.relative(repoPath, skillPath);
    results.push({ name: name, path: relPath });
  }
  return results;
}

/**
 * validateSkillName(name, discoveredList) -> boolean
 *
 * Returns true only if name exists in the discovered skills list.
 * Name must also match [a-z0-9-] pattern.
 */
function validateSkillName(name, discoveredList) {
  if (!SKILL_NAME_RE.test(name)) { return false; }
  for (var i = 0; i < discoveredList.length; i++) {
    if (discoveredList[i].name === name) { return true; }
  }
  return false;
}

module.exports = { listAvailableSkills, validateSkillName, setLogger };
