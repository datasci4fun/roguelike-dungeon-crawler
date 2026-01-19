import ts from "typescript";
import { readJSON, readText, writeJSON } from "./util.mjs";

/**
 * Extract material preset names from materials.ts
 */
function extractMaterials(cfg) {
  const matSrc = readText(cfg.paths.materials);
  const sf = ts.createSourceFile(cfg.paths.materials, matSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let keys = [];

  function visit(n) {
    if (ts.isVariableDeclaration(n) && n.name.getText(sf) === "MATERIAL_PRESETS") {
      if (n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
        keys = n.initializer.properties
          .filter((p) => ts.isPropertyAssignment(p))
          .map((p) => {
            const name = p.name;
            if (ts.isIdentifier(name)) return name.text;
            if (ts.isStringLiteral(name)) return name.text;
            return name.getText(sf);
          });
      }
    }
    ts.forEachChild(n, visit);
  }

  visit(sf);
  return keys.filter(Boolean).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Extract existing models from MODEL_LIBRARY in index.ts
 * Parses entries like: { ...META, create: fn, version: 1, isActive: true, baseModelId: 'x' }
 */
function extractExistingModels(cfg) {
  const indexSrc = readText(cfg.paths.models_index);
  const models = [];

  // Find the MODEL_LIBRARY array content between markers
  const libStart = indexSrc.indexOf("// @model-generator:library:start");
  const libEnd = indexSrc.indexOf("// @model-generator:library:end");

  if (libStart === -1 || libEnd === -1) {
    return models; // No markers, return empty
  }

  const libContent = indexSrc.slice(libStart, libEnd);

  // Parse each entry - match { ...META_NAME, create: ..., [optional fields] }
  // We need to extract: META name, and any version/isActive/baseModelId fields
  const entryRegex = /\{\s*\.\.\.([A-Z_]+)\s*,\s*create:\s*[^,}]+(?:,\s*(\w+):\s*([^,}]+))*\s*,?\s*\}/g;

  // More robust: parse each object entry individually
  const entries = libContent.match(/\{[^{}]*\.\.\.([A-Z_]+)[^{}]*\}/g) || [];

  for (const entry of entries) {
    const metaMatch = entry.match(/\.\.\.([A-Z_]+)/);
    if (!metaMatch) continue;

    const metaName = metaMatch[1];

    // Extract optional fields
    const versionMatch = entry.match(/version:\s*(\d+)/);
    const isActiveMatch = entry.match(/isActive:\s*(true|false)/);
    const baseModelIdMatch = entry.match(/baseModelId:\s*['"]([^'"]+)['"]/);

    // Try to determine the model ID from the META name
    // Convention: GOBLIN_META -> goblin, BOSS_THRONE_META -> boss-throne
    const idFromMeta = metaName
      .replace(/_META$/, '')
      .toLowerCase()
      .replace(/_/g, '-');

    models.push({
      metaName,
      id: idFromMeta,
      version: versionMatch ? parseInt(versionMatch[1], 10) : 1,
      isActive: isActiveMatch ? isActiveMatch[1] === 'true' : true,
      baseModelId: baseModelIdMatch ? baseModelIdMatch[1] : idFromMeta,
    });
  }

  return models;
}

/**
 * Group models by baseModelId and find the highest version for each
 */
function getVersionInfo(models) {
  const byBase = {};

  for (const m of models) {
    const base = m.baseModelId;
    if (!byBase[base]) {
      byBase[base] = { versions: [], highestVersion: 0, activeVersion: null };
    }
    byBase[base].versions.push(m);
    if (m.version > byBase[base].highestVersion) {
      byBase[base].highestVersion = m.version;
    }
    if (m.isActive) {
      byBase[base].activeVersion = m.version;
    }
  }

  return byBase;
}

function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const outDir = cfg.paths.out_dir;
  const resultPath = cfg.paths.result_file;

  // Extract materials
  const materials = extractMaterials(cfg);

  // Extract existing models
  const existingModels = extractExistingModels(cfg);

  // Group by base model ID for version tracking
  const versionInfo = getVersionInfo(existingModels);

  const categories = ["structure", "furniture", "decoration", "interactive", "prop", "enemy"];

  // Output context for Claude and other tools
  writeJSON(`${outDir}/repo_context.json`, {
    materials,
    categories,
    existingModels,
    versionInfo,
  });

  // If no result.json exists yet, create a minimal ok stub (other steps will overwrite)
  writeJSON(resultPath, { ok: true, step: "analyze_repo", context_file: `${outDir}/repo_context.json` });
}

main();
