import path from "node:path";
import { readJSON, readText, writeText, writeJSON, ensureMarkers, extractBetween, stableSortBy } from "./util.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function hasFlag(name) {
  return process.argv.includes(name);
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
  // Parse entries including version fields
  // { ...META, create: something, version: 1, isActive: true, baseModelId: 'x' },
  const entries = [];

  // Match complete object entries
  const objectMatches = block.match(/\{[^{}]*\.\.\.([A-Z0-9_]+)[^{}]*\}/g) || [];

  for (const obj of objectMatches) {
    const metaMatch = obj.match(/\.\.\.([A-Z0-9_]+)/);
    if (!metaMatch) continue;

    const meta = metaMatch[1];

    // Extract create expression
    const createMatch = obj.match(/create:\s*([^,}]+(?:\([^)]*\)\s*=>\s*[^,}]+)?)/);
    const createExpr = createMatch ? createMatch[1].trim() : meta.replace(/_META$/, '').toLowerCase();

    // Extract version fields (may not exist)
    const versionMatch = obj.match(/version:\s*(\d+)/);
    const isActiveMatch = obj.match(/isActive:\s*(true|false)/);
    const baseModelIdMatch = obj.match(/baseModelId:\s*['"]([^'"]+)['"]/);

    entries.push({
      meta,
      createExpr,
      version: versionMatch ? parseInt(versionMatch[1], 10) : null,
      isActive: isActiveMatch ? isActiveMatch[1] === 'true' : null,
      baseModelId: baseModelIdMatch ? baseModelIdMatch[1] : null,
    });
  }

  return entries;
}

function renderLibraryBlock(entries) {
  // Render in the same style as your file (2-space indents)
  // Include version fields only if they have non-default values
  const lines = [];
  for (const e of entries) {
    lines.push("  {");
    lines.push(`    ...${e.meta},`);
    lines.push(`    create: ${e.createExpr},`);

    // Only include version fields if explicitly set
    if (e.version !== null) {
      lines.push(`    version: ${e.version},`);
    }
    if (e.isActive !== null) {
      lines.push(`    isActive: ${e.isActive},`);
    }
    if (e.baseModelId !== null) {
      lines.push(`    baseModelId: '${e.baseModelId}',`);
    }

    lines.push("  },");
  }
  return lines.join("\n") + "\n";
}

function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const indexPath = cfg.paths.models_index;

  const modelId = requireArg("--model-id");
  const modelFile = requireArg("--model-file");
  const factory = requireArg("--factory");
  const meta = requireArg("--meta");
  const category = getArg("--category") ?? null;
  const enemyName = getArg("--enemy-name") ?? null;
  const createExprArg = getArg("--create-expr");

  // Version-related args
  const versionArg = getArg("--version");
  const isActiveArg = getArg("--is-active");
  const baseModelIdArg = getArg("--base-model-id");
  const autoVersion = hasFlag("--auto-version");

  const moduleSpec = normalizeRel(modelFile);
  const createExpr = createExprArg ? createExprArg : factory;

  const src = readText(indexPath);

  ensureMarkers(src, blockMarkers());

  // Load repo context for version auto-detection
  let repoContext = null;
  try {
    repoContext = readJSON(`${cfg.paths.out_dir}/repo_context.json`);
  } catch (e) {
    // Context may not exist yet
  }

  // Determine version fields
  let version = versionArg ? parseInt(versionArg, 10) : null;
  let isActive = isActiveArg !== null ? isActiveArg === 'true' : null;
  let baseModelId = baseModelIdArg ?? null;

  // Auto-version detection: if creating a new version of existing model
  if (autoVersion && repoContext?.versionInfo) {
    const baseId = baseModelId || modelId;
    const existingInfo = repoContext.versionInfo[baseId];

    if (existingInfo) {
      // Model exists - auto-increment version
      version = existingInfo.highestVersion + 1;
      baseModelId = baseId;
      // New versions are active by default, deactivate old ones
      if (isActive === null) {
        isActive = true;
      }
      console.log(`Auto-version: detected existing model '${baseId}' at v${existingInfo.highestVersion}, creating v${version}`);
    } else {
      // New model - version 1
      if (version === null) version = 1;
      if (isActive === null) isActive = true;
      console.log(`Auto-version: new model '${modelId}', creating v1`);
    }
  }

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

  // If auto-version and this is a new version, mark old versions as inactive
  if (autoVersion && version > 1 && isActive && baseModelId) {
    for (const e of existing) {
      // Find entries with same baseModelId (exact match only)
      // Or entries where the meta name matches the baseModelId pattern exactly
      // e.g., baseModelId='goblin' matches GOBLIN_META but NOT GOBLIN_KING_META
      const metaBase = e.meta.replace(/_META$/, '').toLowerCase().replace(/_/g, '-');
      const isExactMatch = e.baseModelId === baseModelId || metaBase === baseModelId;

      if (isExactMatch && e.meta !== meta) {
        if (e.isActive !== false) {
          e.isActive = false;
          console.log(`Auto-version: marking ${e.meta} as inactive`);
        }
      }
    }
  }

  // Upsert by meta symbol
  const map = new Map(existing.map((e) => [e.meta, e]));
  map.set(meta, { meta, createExpr, version, isActive, baseModelId });

  const merged = Array.from(map.values());
  const sorted = stableSortBy(merged, (e) => e.meta);

  const newLibMid = renderLibraryBlock(sorted);
  next = lib.pre + "\n" + newLibMid + lib.post;

  writeText(indexPath, next);

  // Update result.json (append info)
  writeJSON(cfg.paths.result_file, {
    ok: true,
    step: "register_model",
    model: {
      id: modelId,
      file: modelFile,
      factory,
      meta,
      category,
      enemyName,
      createExpr,
      version,
      isActive,
      baseModelId,
    },
    changed: [indexPath]
  });
}

main();
