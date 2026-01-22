/**
 * fetch_enemy.mjs - Fetch canonical enemy data from bestiary API
 *
 * Usage: node fetch_enemy.mjs --enemy-id <id>
 *
 * This fetches the authoritative enemy data from /api/bestiary/creature/{id}
 * so Claude can use the canonical appearance/behavior when generating models.
 *
 * Output: .claude/skills/model-generator/out/enemy_data.json
 */

import { writeJSON, readJSON } from "./util.mjs";

const API_BASE = process.env.API_BASE || "http://localhost:8000";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

async function fetchBestiary() {
  const response = await fetch(`${API_BASE}/api/bestiary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch bestiary: ${response.status}`);
  }
  return response.json();
}

async function fetchCreature(creatureId) {
  const response = await fetch(`${API_BASE}/api/bestiary/creature/${creatureId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch creature: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    return null;
  }
  return data;
}

async function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const outDir = cfg.paths.out_dir;

  const enemyId = getArg("--enemy-id");
  const listAll = process.argv.includes("--list");

  if (listAll) {
    // Fetch all creatures and output summary
    console.log("Fetching bestiary...");
    const bestiary = await fetchBestiary();

    const summary = {
      total: bestiary.total,
      categories: bestiary.categories,
      creatures: bestiary.creatures.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        floors: c.floors,
        threat_level: c.threat_level,
      })),
    };

    writeJSON(`${outDir}/bestiary_summary.json`, summary);
    console.log(`Wrote ${bestiary.total} creatures to ${outDir}/bestiary_summary.json`);

    writeJSON(cfg.paths.result_file, {
      ok: true,
      step: "fetch_enemy",
      mode: "list",
      total: bestiary.total,
    });
    return;
  }

  if (!enemyId) {
    console.error("Usage: node fetch_enemy.mjs --enemy-id <id>");
    console.error("       node fetch_enemy.mjs --list");
    console.error("");
    console.error("Examples:");
    console.error("  node fetch_enemy.mjs --enemy-id wraith");
    console.error("  node fetch_enemy.mjs --enemy-id goblin_king");
    console.error("  node fetch_enemy.mjs --list");
    process.exit(1);
  }

  console.log(`Fetching enemy data for: ${enemyId}`);

  const creature = await fetchCreature(enemyId);

  if (!creature) {
    console.error(`Enemy not found: ${enemyId}`);
    console.error("");
    console.error("Run with --list to see all available enemies.");

    writeJSON(cfg.paths.result_file, {
      ok: false,
      step: "fetch_enemy",
      error: `Enemy not found: ${enemyId}`,
    });
    process.exit(1);
  }

  // Extract the fields most relevant for model generation
  const modelContext = {
    // Identity
    id: creature.id,
    name: creature.name,
    title: creature.title || null,
    category: creature.category,

    // Visual guidance (CANONICAL - use these for the model)
    appearance: creature.appearance,
    icon: creature.icon,

    // Behavior hints (for animations/poses)
    behavior: creature.behavior,

    // Stats (for scale/threat visualization)
    health: creature.health,
    damage: creature.damage,
    speed: creature.speed,
    threat_level: creature.threat_level,

    // Elemental/abilities (for colors/effects)
    abilities: creature.abilities,
    weaknesses: creature.weaknesses,
    resistances: creature.resistances,

    // Context
    floors: creature.floors,
    description: creature.description,

    // Loot hints (optional visual elements)
    loot: creature.loot,
  };

  writeJSON(`${outDir}/enemy_data.json`, modelContext);

  console.log("");
  console.log("=== CANONICAL ENEMY DATA ===");
  console.log(`Name: ${modelContext.name}${modelContext.title ? ` - ${modelContext.title}` : ''}`);
  console.log(`Category: ${modelContext.category}`);
  console.log(`Threat Level: ${modelContext.threat_level}`);
  console.log("");
  console.log("APPEARANCE (use this for the 3D model):");
  console.log(`  ${modelContext.appearance}`);
  console.log("");
  console.log("BEHAVIOR (animation/pose hints):");
  console.log(`  ${modelContext.behavior}`);
  console.log("");
  if (modelContext.abilities?.length > 0) {
    console.log("ABILITIES:");
    for (const ability of modelContext.abilities) {
      console.log(`  - ${ability.name}: ${ability.description}${ability.effect ? ` [${ability.effect}]` : ''}`);
    }
    console.log("");
  }
  if (modelContext.weaknesses?.length > 0) {
    console.log(`WEAKNESSES: ${modelContext.weaknesses.join(', ')}`);
  }
  if (modelContext.resistances?.length > 0) {
    console.log(`RESISTANCES: ${modelContext.resistances.join(', ')}`);
  }
  console.log("");
  console.log(`Output: ${outDir}/enemy_data.json`);

  writeJSON(cfg.paths.result_file, {
    ok: true,
    step: "fetch_enemy",
    enemy_id: enemyId,
    name: creature.name,
    output_file: `${outDir}/enemy_data.json`,
  });
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
