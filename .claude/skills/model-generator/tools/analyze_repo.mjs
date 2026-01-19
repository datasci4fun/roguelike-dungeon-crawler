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

/**
 * Extract enemyName fields from model files to map models to bestiary entries
 */
function extractEnemyNames(cfg) {
  const indexSrc = readText(cfg.paths.models_index);
  const enemyModels = {};

  // Parse import statements to find model files
  const importRegex = /import\s*\{[^}]*\}\s*from\s*'\.\/(\w+)'/g;
  let match;

  while ((match = importRegex.exec(indexSrc)) !== null) {
    const fileName = match[1];
    const filePath = `web/src/models/${fileName}.ts`;

    try {
      const modelSrc = readText(filePath);

      // Extract enemyName field if present
      const enemyNameMatch = modelSrc.match(/enemyName:\s*['"]([^'"]+)['"]/);
      if (enemyNameMatch) {
        const enemyName = enemyNameMatch[1];

        // Extract isActive status
        const isActiveMatch = modelSrc.match(/isActive:\s*(true|false)/);
        const isActive = isActiveMatch ? isActiveMatch[1] === 'true' : true;

        // Extract version
        const versionMatch = modelSrc.match(/version:\s*(\d+)/);
        const version = versionMatch ? parseInt(versionMatch[1], 10) : 1;

        if (!enemyModels[enemyName]) {
          enemyModels[enemyName] = [];
        }
        enemyModels[enemyName].push({
          file: fileName,
          isActive,
          version,
        });
      }
    } catch {
      // File doesn't exist or can't be read, skip
    }
  }

  return enemyModels;
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

  // Extract enemy name mappings
  const enemyModels = extractEnemyNames(cfg);

  // Find enemy models specifically
  const enemyModelsList = existingModels.filter(m =>
    m.id.includes('goblin') ||
    m.id.includes('skeleton') ||
    m.id.includes('orc') ||
    m.id.includes('rat') ||
    m.id.includes('spider') ||
    m.id.includes('king') ||
    m.id.includes('queen')
  );

  const categories = ["structure", "furniture", "decoration", "interactive", "prop", "enemy"];

  // Output context for Claude and other tools
  writeJSON(`${outDir}/repo_context.json`, {
    materials,
    categories,
    existingModels,
    versionInfo,
    enemyModels,  // Maps enemy names to their procedural models
    hint: "For enemy models, run: node .claude/skills/model-generator/tools/fetch_enemy.mjs --enemy-id <id>",
  });

  // If no result.json exists yet, create a minimal ok stub (other steps will overwrite)
  writeJSON(resultPath, {
    ok: true,
    step: "analyze_repo",
    context_file: `${outDir}/repo_context.json`,
    enemyModelCount: Object.keys(enemyModels).length,
  });
}

main();
