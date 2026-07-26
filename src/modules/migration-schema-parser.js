'use strict';

/**
 * migration-schema-parser.js — csd-s5: static parser for this repo's real
 * `scripts/migrate-schema-*.js` migration files, producing an as-built Data
 * Model diagram (mermaid `erDiagram` syntax) via the SAME canvas
 * content-block shape csd-s1/csd-s2 already render (ADR-026 — reuse the
 * existing rendering mechanism, do not build a parallel path) and that
 * csd-s4 documents /design and /definition must emit for the as-designed
 * side (`skills/design/SKILL.md`, "Data Model diagram markers").
 *
 * Per ADR-027 ("live SaaS-user-facing mechanisms are ordinary application
 * code, not governed SKILL.md skills") and the decisions.md ARCH entry for
 * this feature ("as-built Data Model diagrams derive their ground truth
 * from static parsing of the repo's actual committed SQL/migration files,
 * not live-database introspection, for the MVP"), this module reads real
 * files directly — it never re-prompts an agent to describe from memory
 * what it built (the anti-pattern discovery explicitly rejected).
 *
 * Entity/column names in the generated diagram are taken verbatim from the
 * real migration file text (never paraphrased), so this diagram is directly
 * comparable to the as-designed diagram csd-s4 produces — that comparability
 * is what makes csd-s6's drift check meaningful.
 *
 * A malformed/unparseable migration file throws a MigrationParseError naming
 * the file and the specific parse problem (AC4) — this module never
 * silently produces an empty or incorrect diagram.
 */

const fs = require('fs');
const path = require('path');

/**
 * Thrown when a migration file cannot be statically parsed. Always names
 * the file and the specific reason (AC4) so the operator sees a clear,
 * actionable error rather than a generic failure.
 */
class MigrationParseError extends Error {
  constructor(file, reason) {
    super('Failed to parse migration file "' + file + '": ' + reason);
    this.name = 'MigrationParseError';
    this.file = file;
    this.reason = reason;
  }
}

// Audit logger (NFR — as-built generation events are logged: feature,
// diagram types, success/failure). Injectable so callers (the route wiring,
// tests) can supply a real logger; defaults to a no-op so importing this
// module never has a side effect on its own.
let _logger = {
  info: function() {},
  warn: function() {}
};
function setLogger(logger) {
  _logger = logger;
}
function _logEvent(eventName, data) {
  try {
    _logger.info(eventName, data);
  } catch (e) {
    // Logging must never break diagram generation.
  }
}

// SQL type -> mermaid erDiagram attribute-type token. Order matters (most
// specific patterns first). Falls through to a sanitised lowercase token for
// any type not explicitly listed, so an unrecognised-but-parseable type
// still renders (never blocks the whole diagram).
const TYPE_MAP = [
  [/^UUID$/i, 'uuid'],
  [/^(TEXT|VARCHAR|CHAR)/i, 'string'],
  [/^(INTEGER|INT|SMALLINT|BIGINT|SERIAL|BIGSERIAL)$/i, 'int'],
  [/^(TIMESTAMPTZ|TIMESTAMP|DATE)/i, 'timestamp'],
  [/^(BOOLEAN|BOOL)$/i, 'boolean'],
  [/^(JSONB|JSON)$/i, 'json'],
  [/^(NUMERIC|DECIMAL|REAL|DOUBLE)/i, 'float']
];

function mapType(rawType) {
  const t = String(rawType || '').trim();
  for (let i = 0; i < TYPE_MAP.length; i++) {
    if (TYPE_MAP[i][0].test(t)) return TYPE_MAP[i][1];
  }
  const fallback = t.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return fallback || 'string';
}

/**
 * Find every `scripts/migrate-schema-*.js` file under the given repo root,
 * sorted for deterministic output.
 * @param {string} repoRoot
 * @returns {string[]} absolute file paths
 */
function discoverMigrationFiles(repoRoot) {
  const scriptsDir = path.join(repoRoot, 'scripts');
  if (!fs.existsSync(scriptsDir)) return [];
  return fs.readdirSync(scriptsDir)
    .filter(function(f) { return /^migrate-schema-.*\.js$/.test(f); })
    .map(function(f) { return path.join(scriptsDir, f); })
    .sort();
}

// Locate every `CREATE TABLE IF NOT EXISTS <name> ( ... )` statement in the
// source text, respecting nested parentheses (e.g. `DEFAULT now()`,
// `NUMERIC(10, 2)`) when finding the matching close-paren.
function findCreateTableBlocks(source) {
  const blocks = [];
  const re = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gi;
  let m;
  while ((m = re.exec(source)) !== null) {
    const tableName = m[1];
    const openIdx = re.lastIndex - 1; // index of the statement's own '('
    let depth = 0;
    let bodyEnd = -1;
    let i = openIdx;
    for (; i < source.length; i++) {
      if (source[i] === '(') depth++;
      else if (source[i] === ')') {
        depth--;
        if (depth === 0) { bodyEnd = i; break; }
      }
    }
    if (bodyEnd === -1) {
      blocks.push({ tableName: tableName, unbalanced: true, body: null });
      break; // no reliable point to resume scanning from
    }
    blocks.push({ tableName: tableName, unbalanced: false, body: source.slice(openIdx + 1, bodyEnd) });
    re.lastIndex = bodyEnd + 1;
  }
  return blocks;
}

// Split a column-definition body on top-level commas only — a comma nested
// inside parens (e.g. `NUMERIC(10, 2)`) must not split the line.
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts.map(function(p) { return p.trim(); }).filter(Boolean);
}

// Parse a single column/constraint line from inside a CREATE TABLE body.
function parseColumnLine(line, tableName, file) {
  const trimmed = line.trim();

  const fkMatch = /^FOREIGN\s+KEY\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*REFERENCES\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/i.exec(trimmed);
  if (fkMatch) {
    return { kind: 'foreign-key', column: fkMatch[1], refTable: fkMatch[2], refColumn: fkMatch[3] };
  }

  if (/^PRIMARY\s+KEY\s*\(/i.test(trimmed)) {
    const pkMatch = /^PRIMARY\s+KEY\s*\(\s*([a-zA-Z0-9_,\s]+)\)/i.exec(trimmed);
    const cols = pkMatch ? pkMatch[1].split(',').map(function(c) { return c.trim(); }).filter(Boolean) : [];
    return { kind: 'table-primary-key', columns: cols };
  }

  if (/^(UNIQUE|CHECK|CONSTRAINT)\b/i.test(trimmed)) {
    return { kind: 'other-constraint' };
  }

  const nameMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)$/.exec(trimmed);
  if (!nameMatch) {
    throw new MigrationParseError(file, 'could not parse column definition in table "' + tableName + '": "' + trimmed + '"');
  }
  const name = nameMatch[1];
  const rest = nameMatch[2];

  const typeMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*(\(\s*\d+(?:\s*,\s*\d+)?\s*\))?/.exec(rest);
  if (!typeMatch) {
    throw new MigrationParseError(file, 'could not determine column type for "' + name + '" in table "' + tableName + '"');
  }
  const rawType = typeMatch[1];
  const afterType = rest.slice(typeMatch[0].length);

  const isPrimaryKey = /PRIMARY\s+KEY/i.test(afterType);
  const refMatch = /REFERENCES\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/i.exec(afterType);

  return {
    kind: 'column',
    name: name,
    rawType: rawType,
    isPrimaryKey: isPrimaryKey,
    references: refMatch ? { table: refMatch[1], column: refMatch[2] } : null
  };
}

/**
 * Statically parse one migration file into `{ tables: [...] }`. Throws
 * MigrationParseError (naming the file and the exact problem) on any
 * malformed/unsupported content — never returns a partial or empty result
 * silently (AC4).
 * @param {string} filePath
 * @returns {{tables: Array<{name:string, columns:Array, foreignKeys:Array, sourceFile:string}>}}
 */
function parseMigrationFile(filePath) {
  const file = path.basename(filePath);
  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    throw new MigrationParseError(file, 'could not read file: ' + e.message);
  }

  const blocks = findCreateTableBlocks(source);
  if (blocks.length === 0) {
    throw new MigrationParseError(file, 'no "CREATE TABLE IF NOT EXISTS" statement found — unsupported migration format');
  }

  const tables = [];
  blocks.forEach(function(block) {
    if (block.unbalanced) {
      throw new MigrationParseError(file, 'unbalanced parentheses in CREATE TABLE statement for "' + block.tableName + '"');
    }
    const lines = splitTopLevel(block.body);
    if (lines.length === 0) {
      throw new MigrationParseError(file, 'table "' + block.tableName + '" has no column definitions');
    }

    const columns = [];
    let tablePkCols = [];
    const foreignKeys = [];

    lines.forEach(function(line) {
      const parsed = parseColumnLine(line, block.tableName, file);
      if (parsed.kind === 'column') {
        columns.push(parsed);
        if (parsed.references) {
          foreignKeys.push({ column: parsed.name, refTable: parsed.references.table, refColumn: parsed.references.column });
        }
      } else if (parsed.kind === 'table-primary-key') {
        tablePkCols = tablePkCols.concat(parsed.columns);
      } else if (parsed.kind === 'foreign-key') {
        foreignKeys.push({ column: parsed.column, refTable: parsed.refTable, refColumn: parsed.refColumn });
      }
      // 'other-constraint' rows (UNIQUE/CHECK/CONSTRAINT) carry no
      // entity/column/relationship information for the diagram — ignored.
    });

    tablePkCols.forEach(function(pkCol) {
      columns.forEach(function(c) { if (c.name === pkCol) c.isPrimaryKey = true; });
    });

    if (columns.length === 0) {
      throw new MigrationParseError(file, 'table "' + block.tableName + '" produced no recognisable columns');
    }

    tables.push({ name: block.tableName, columns: columns, foreignKeys: foreignKeys, sourceFile: file });
  });

  return { tables: tables };
}

/**
 * Parse multiple migration files and combine them into one coherent schema.
 * Fails fast on the first unparseable file (propagates its
 * MigrationParseError as-is) — never silently drops a file and continues
 * with a partial diagram (AC4).
 * @param {string[]} filePaths
 * @returns {{tables: Array}}
 */
function parseMigrationFiles(filePaths) {
  const allTables = [];
  (filePaths || []).forEach(function(fp) {
    const result = parseMigrationFile(fp);
    result.tables.forEach(function(t) { allTables.push(t); });
  });
  return { tables: allTables };
}

/**
 * Render a parsed schema as mermaid `erDiagram` syntax, in the exact format
 * the canvas mechanism already renders (`content.mermaid`, ADR-026) and that
 * `skills/design/SKILL.md`'s as-designed Data Model markers use.
 * @param {{tables: Array}} schema
 * @returns {string}
 */
function generateErDiagram(schema) {
  const lines = ['erDiagram'];
  (schema.tables || []).forEach(function(table) {
    lines.push('  ' + table.name + ' {');
    table.columns.forEach(function(col) {
      const typeToken = mapType(col.rawType);
      const keyToken = col.isPrimaryKey ? ' PK' : (col.references ? ' FK' : '');
      lines.push('    ' + typeToken + ' ' + col.name + keyToken);
    });
    lines.push('  }');
  });
  (schema.tables || []).forEach(function(table) {
    (table.foreignKeys || []).forEach(function(fk) {
      lines.push('  ' + fk.refTable + ' ||--o{ ' + table.name + ' : "' + fk.column + '"');
    });
  });
  return lines.join('\n');
}

/**
 * Top-level orchestrator (AC1, AC2 scope for this story = Data Model only):
 * discover (or accept an explicit list of) migration files, parse them, and
 * produce the as-built Data Model canvas content-block — the SAME marker
 * shape the existing canvas mechanism already renders
 * (`{type:"data-model", title, content:{mermaid}}`, ADR-026) — so no
 * parallel rendering path is introduced.
 *
 * On any parse failure, logs a failure event (NFR — audit) and re-throws
 * (AC4) — this function never swallows a parse error into an empty/blank
 * diagram.
 * @param {{repoRoot?: string, migrationFiles?: string[], title?: string, featureSlug?: string}} [options]
 * @returns {{canvasBlock: object, schema: object, sourceFiles: string[]}}
 */
function generateAsBuiltDataModelDiagram(options) {
  options = options || {};
  const repoRoot = options.repoRoot || process.cwd();
  const filePaths = options.migrationFiles || discoverMigrationFiles(repoRoot);

  if (filePaths.length === 0) {
    const err = new MigrationParseError('(none)', 'no migration files found matching scripts/migrate-schema-*.js');
    _logEvent('as-built-diagram-generation-failed', {
      diagramType: 'data-model',
      featureSlug: options.featureSlug || null,
      error: err.message
    });
    throw err;
  }

  let schema;
  try {
    schema = parseMigrationFiles(filePaths);
  } catch (e) {
    _logEvent('as-built-diagram-generation-failed', {
      diagramType: 'data-model',
      featureSlug: options.featureSlug || null,
      file: e.file || null,
      error: e.message
    });
    throw e;
  }

  const mermaid = generateErDiagram(schema);
  const canvasBlock = {
    type: 'data-model',
    title: options.title || 'As-built: Data model',
    content: { mermaid: mermaid }
  };

  const sourceFiles = filePaths.map(function(f) { return path.basename(f); });
  _logEvent('as-built-diagram-generation-succeeded', {
    diagramType: 'data-model',
    featureSlug: options.featureSlug || null,
    tableCount: schema.tables.length,
    sourceFiles: sourceFiles
  });

  return { canvasBlock: canvasBlock, schema: schema, sourceFiles: sourceFiles };
}

/**
 * Write the generated canvas content-block to the feature's artefact folder
 * as a versioned file (AC3) — never held only in transient session memory.
 * Each call writes a new, timestamped file; existing versions are never
 * overwritten, consistent with the "point-in-time snapshot" framing in this
 * story's Out of Scope.
 * @param {string} featureSlug
 * @param {object} canvasBlock
 * @param {{repoRoot?: string, timestamp?: string}} [options]
 * @returns {string} absolute path to the written file
 */
function writeAsBuiltDiagramArtefact(featureSlug, canvasBlock, options) {
  options = options || {};
  if (!featureSlug || typeof featureSlug !== 'string') {
    throw new Error('writeAsBuiltDiagramArtefact requires a featureSlug string');
  }
  const repoRoot = options.repoRoot || process.cwd();
  const dir = path.join(repoRoot, 'artefacts', featureSlug, 'diagrams');
  fs.mkdirSync(dir, { recursive: true });

  const stamp = (options.timestamp || new Date().toISOString()).replace(/[:.]/g, '-');
  const fileName = 'as-built-data-model-' + stamp + '.json';
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(canvasBlock, null, 2) + '\n', 'utf8');
  return filePath;
}

module.exports = {
  MigrationParseError,
  discoverMigrationFiles,
  parseMigrationFile,
  parseMigrationFiles,
  generateErDiagram,
  generateAsBuiltDataModelDiagram,
  writeAsBuiltDiagramArtefact,
  setLogger,
  // exported for focused unit testing only
  mapType
};
