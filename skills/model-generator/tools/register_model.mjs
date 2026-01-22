import path from "node:path";
import { readJSON, readText, writeText, writeJSON, ensureMarkers, extractBetween, stableSortBy } from "./util.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function requireArg(name) {
  const v = getArg(name);
  if (!v) throw new Error(`Missing required arg: ${name}`);
  return v;
}

function normalizeRel(p) {
  // Keep './fooBar' style module specifiers in index.ts
  const rel = p.replace(/\\/g, "/");
  const noExt = rel.replace(/\.tsx?$/, "");
  const base = path.posix.basename(noExt);
  return `./${base}`;
}

function upsertLines(block, makeKey, makeLine, newItem) {
  const lines = block.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
  const map = new Map();
  for (const l of lines) map.set(makeKey(l), l);

  map.set(makeKey(makeLine(newItem)), makeLine(newItem));

  const items = [];
  for (const l of map.values()) items.push(l);

  const sorted = stableSortBy(items, (l) => makeKey(l));
  return sorted.join("\n") + "\n";
}

function blockMarkers() {
  return [
    { start: "// @model-generator:imports:start", end: "// @model-generator:imports:end" },
    { start: "// @model-generator:exports:start", end: "// @model-generator:exports:end" },
    { start: "// @model-generator:library:start", end: "// @model-generator:library:end" }
  ];
}

function makeImportLine({ factory, meta, moduleSpec }) {
  return `import { ${factory}, ${meta} } from '${moduleSpec}';`;
}
function makeExportLine({ factory, meta, moduleSpec }) {
  return `export { ${factory}, ${meta} } from '${moduleSpec}';`;
}
function importKey(line) {
  // key by module specifier
  const m = line.match(/from\s+'([^']+)'/);
  return m ? m[1] : line;
}

function parseLibraryEntries(block) {
  // Parse entries of the form:
  // { ...META, create: something, },
  // We key by META identifier.
  const entries = [];
  const re = /\{\s*\.\.\.([A-Z0-9_]+)\s*,\s*create:\s*([^,}]+(?:\([^)]*\)\s*=>\s*[^,}]+)?)\s*,?\s*\}/gms;
  let m;
  while ((m = re.exec(block)) !== null) {
    entries.push({ meta: m[1], createExpr: m[2].trim() });
  }
  return entries;
}

function renderLibraryBlock(entries) {
  // Render in the same style as your file (2-space indents)
  const lines = [];
  for (const e of entries) {
    lines.push("  {");
    lines.push(`    ...${e.meta},`);
    lines.push(`    create: ${e.createExpr},`);
    lines.push("  },");
  }
  return lines.join("\n") + "\n";
}

function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const indexPath = cfg.paths.models_index;

  const modelId = requireArg("--model-id"); // currently unused in index, but kept for result.json
  const modelFile = requireArg("--model-file");
  const factory = requireArg("--factory");
  const meta = requireArg("--meta");
  const category = getArg("--category") ?? null;
  const enemyName = getArg("--enemy-name") ?? null;
  const createExprArg = getArg("--create-expr");

  const moduleSpec = normalizeRel(modelFile);
  const createExpr = createExprArg ? createExprArg : factory;

  const src = readText(indexPath);

  ensureMarkers(src, blockMarkers());

  // Imports
  const imp = extractBetween(src, "// @model-generator:imports:start", "// @model-generator:imports:end");
  const newImpMid = upsertLines(
    imp.mid,
    importKey,
    makeImportLine,
    { factory, meta, moduleSpec }
  );

  let next = imp.pre + "\n" + newImpMid + imp.post;

  // Exports
  const exp = extractBetween(next, "// @model-generator:exports:start", "// @model-generator:exports:end");
  const newExpMid = upsertLines(
    exp.mid,
    importKey,
    makeExportLine,
    { factory, meta, moduleSpec }
  );
  next = exp.pre + "\n" + newExpMid + exp.post;

  // Library entries
  const lib = extractBetween(next, "// @model-generator:library:start", "// @model-generator:library:end");
  const existing = parseLibraryEntries(lib.mid);

  // Upsert by meta symbol
  const map = new Map(existing.map((e) => [e.meta, e]));
  map.set(meta, { meta, createExpr });

  const merged = Array.from(map.values());
  const sorted = stableSortBy(merged, (e) => e.meta);

  const newLibMid = renderLibraryBlock(sorted);
  next = lib.pre + "\n" + newLibMid + lib.post;

  writeText(indexPath, next);

  // Update result.json (append info)
  writeJSON(cfg.paths.result_file, {
    ok: true,
    step: "register_model",
    model: { id: modelId, file: modelFile, factory, meta, category, enemyName, createExpr },
    changed: [indexPath]
  });
}

main();
