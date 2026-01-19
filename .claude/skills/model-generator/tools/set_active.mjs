/**
 * set_active.mjs - Set a specific model version as active
 *
 * Usage: node set_active.mjs --model-id <id>
 *
 * This will:
 * 1. Find the model by ID in MODEL_LIBRARY
 * 2. Set it to isActive: true
 * 3. Set all other versions with same baseModelId to isActive: false
 */

import { readJSON, readText, writeText, writeJSON } from "./util.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const indexPath = cfg.paths.models_index;
  const modelId = getArg("--model-id");

  if (!modelId) {
    console.error("Usage: node set_active.mjs --model-id <id>");
    process.exit(1);
  }

  let src = readText(indexPath);

  // Find the library section
  const libStart = src.indexOf("// @model-generator:library:start");
  const libEnd = src.indexOf("// @model-generator:library:end");

  if (libStart === -1 || libEnd === -1) {
    console.error("Could not find library markers in index.ts");
    process.exit(1);
  }

  // Parse all entries to find the target model and its baseModelId
  const libContent = src.slice(libStart, libEnd);

  // Find the target model's META name by matching the id
  // We need to look at the actual model files or infer from META names
  // For simplicity, we'll work with META names directly

  // Extract all entries with their properties
  const entries = [];
  const entryRegex = /\{\s*\.\.\.([A-Z0-9_]+)\s*,([^}]*)\}/gs;
  let match;

  while ((match = entryRegex.exec(libContent)) !== null) {
    const metaName = match[1];
    const propsStr = match[2];

    // Extract properties
    const versionMatch = propsStr.match(/version:\s*(\d+)/);
    const isActiveMatch = propsStr.match(/isActive:\s*(true|false)/);
    const baseModelIdMatch = propsStr.match(/baseModelId:\s*['"]([^'"]+)['"]/);

    // Infer ID from meta name (e.g., GOBLIN_V2_META -> goblin-v2)
    let inferredId = metaName
      .replace(/_META$/, '')
      .toLowerCase()
      .replace(/_/g, '-');

    // Handle version suffixes (V2, V3, etc.)
    inferredId = inferredId.replace(/-v(\d+)$/, '-v$1');

    entries.push({
      metaName,
      fullMatch: match[0],
      id: inferredId,
      version: versionMatch ? parseInt(versionMatch[1], 10) : 1,
      isActive: isActiveMatch ? isActiveMatch[1] === 'true' : true,
      baseModelId: baseModelIdMatch ? baseModelIdMatch[1] : inferredId.replace(/-v\d+$/, ''),
    });
  }

  // Find the target model
  const target = entries.find(e => e.id === modelId || e.metaName === modelId);
  if (!target) {
    console.error(`Model not found: ${modelId}`);
    console.error("Available models:", entries.map(e => e.id).join(", "));
    process.exit(1);
  }

  const baseId = target.baseModelId;
  console.log(`Setting ${target.metaName} (${target.id}) as active`);
  console.log(`Base model ID: ${baseId}`);

  // Find all versions of this model
  const versions = entries.filter(e => e.baseModelId === baseId);
  console.log(`Found ${versions.length} version(s) of this model`);

  // Update the source - set target to active, others to inactive
  let newSrc = src;

  for (const entry of versions) {
    const isTarget = entry.metaName === target.metaName;
    const newIsActive = isTarget;

    // Build the replacement entry
    let newEntry = `{\n    ...${entry.metaName},\n    create: `;

    // Find the create expression from original
    const createMatch = entry.fullMatch.match(/create:\s*([^,}]+)/);
    const createExpr = createMatch ? createMatch[1].trim() : entry.metaName.replace(/_META$/, '').toLowerCase();
    newEntry += `${createExpr},\n`;

    // Add version if it was there or if > 1
    if (entry.version > 1) {
      newEntry += `    version: ${entry.version},\n`;
    }

    // Always add isActive for versioned models
    if (versions.length > 1) {
      newEntry += `    isActive: ${newIsActive},\n`;
    }

    // Add baseModelId if different from id
    if (entry.baseModelId && entry.baseModelId !== entry.id.replace(/-v\d+$/, '')) {
      newEntry += `    baseModelId: '${entry.baseModelId}',\n`;
    } else if (versions.length > 1) {
      newEntry += `    baseModelId: '${baseId}',\n`;
    }

    newEntry += `  }`;

    // Replace in source
    newSrc = newSrc.replace(entry.fullMatch, newEntry);

    if (isTarget) {
      console.log(`  ✓ ${entry.metaName} -> active`);
    } else if (entry.isActive) {
      console.log(`  ✗ ${entry.metaName} -> inactive`);
    }
  }

  writeText(indexPath, newSrc);

  writeJSON(cfg.paths.result_file, {
    ok: true,
    step: "set_active",
    activated: target.id,
    baseModelId: baseId,
    changed: [indexPath],
  });

  console.log(`\nDone! ${target.id} is now the active version.`);
}

main();
