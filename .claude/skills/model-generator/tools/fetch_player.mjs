/**
 * fetch_player.mjs - Fetch canonical player character data from character guide API
 *
 * Usage:
 *   node fetch_player.mjs --race <id> --class <id>
 *   node fetch_player.mjs --list-races
 *   node fetch_player.mjs --list-classes
 *   node fetch_player.mjs --list
 *
 * This fetches the authoritative player race/class data from /api/character-guide
 * so Claude can use the canonical appearance/traits when generating player models.
 *
 * Output: .claude/skills/model-generator/out/player_data.json
 */

import { writeJSON, readJSON } from "./util.mjs";

const API_BASE = process.env.API_BASE || "http://localhost:8000";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

async function fetchCharacterGuide() {
  const response = await fetch(`${API_BASE}/api/character-guide`);
  if (!response.ok) {
    throw new Error(`Failed to fetch character guide: ${response.status}`);
  }
  return response.json();
}

async function fetchRace(raceId) {
  const response = await fetch(`${API_BASE}/api/character-guide/races/${raceId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch race: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) return null;
  return data;
}

async function fetchClass(classId) {
  const response = await fetch(`${API_BASE}/api/character-guide/classes/${classId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch class: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) return null;
  return data;
}

async function fetchCombination(raceId, classId) {
  const response = await fetch(`${API_BASE}/api/character-guide/combinations/${raceId}/${classId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch combination: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) return null;
  return data;
}

async function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const outDir = cfg.paths.out_dir;

  const raceId = getArg("--race");
  const classId = getArg("--class");
  const listAll = process.argv.includes("--list");
  const listRaces = process.argv.includes("--list-races");
  const listClasses = process.argv.includes("--list-classes");

  if (listAll || listRaces || listClasses) {
    console.log("Fetching character guide...");
    const guide = await fetchCharacterGuide();

    if (listRaces || listAll) {
      console.log("\n=== AVAILABLE RACES ===");
      for (const race of guide.races) {
        console.log(`  ${race.id.padEnd(12)} ${race.icon} ${race.name.padEnd(10)} HP:${race.stat_modifiers.health >= 0 ? '+' : ''}${race.stat_modifiers.health} ATK:${race.stat_modifiers.attack >= 0 ? '+' : ''}${race.stat_modifiers.attack} DEF:${race.stat_modifiers.defense >= 0 ? '+' : ''}${race.stat_modifiers.defense}`);
      }
    }

    if (listClasses || listAll) {
      console.log("\n=== AVAILABLE CLASSES ===");
      for (const cls of guide.classes) {
        console.log(`  ${cls.id.padEnd(12)} ${cls.icon} ${cls.name.padEnd(10)} HP:${cls.stat_modifiers.health >= 0 ? '+' : ''}${cls.stat_modifiers.health} ATK:${cls.stat_modifiers.attack >= 0 ? '+' : ''}${cls.stat_modifiers.attack} DEF:${cls.stat_modifiers.defense >= 0 ? '+' : ''}${cls.stat_modifiers.defense}`);
      }
    }

    if (listAll) {
      console.log("\n=== COMBINATIONS ===");
      console.log(`  Total: ${guide.combinations.length} race/class combinations`);
    }

    const summary = {
      races: guide.races.map(r => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        stat_modifiers: r.stat_modifiers,
        racial_trait: r.racial_trait.name,
      })),
      classes: guide.classes.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        stat_modifiers: c.stat_modifiers,
        equipment_type: c.equipment_type,
      })),
      combinations: guide.combinations.length,
    };

    writeJSON(`${outDir}/character_guide_summary.json`, summary);
    console.log(`\nWrote summary to ${outDir}/character_guide_summary.json`);

    writeJSON(cfg.paths.result_file, {
      ok: true,
      step: "fetch_player",
      mode: "list",
      races: guide.races.length,
      classes: guide.classes.length,
    });
    return;
  }

  if (!raceId || !classId) {
    console.error("Usage: node fetch_player.mjs --race <id> --class <id>");
    console.error("       node fetch_player.mjs --list");
    console.error("       node fetch_player.mjs --list-races");
    console.error("       node fetch_player.mjs --list-classes");
    console.error("");
    console.error("Examples:");
    console.error("  node fetch_player.mjs --race DWARF --class CLERIC");
    console.error("  node fetch_player.mjs --race ELF --class MAGE");
    console.error("  node fetch_player.mjs --race ORC --class WARRIOR");
    console.error("  node fetch_player.mjs --list");
    process.exit(1);
  }

  console.log(`Fetching player data for: ${raceId} ${classId}`);

  // Fetch race, class, and combination data
  const [race, playerClass, combination] = await Promise.all([
    fetchRace(raceId.toUpperCase()),
    fetchClass(classId.toUpperCase()),
    fetchCombination(raceId.toUpperCase(), classId.toUpperCase()),
  ]);

  if (!race) {
    console.error(`Race not found: ${raceId}`);
    console.error("Run with --list-races to see all available races.");
    writeJSON(cfg.paths.result_file, {
      ok: false,
      step: "fetch_player",
      error: `Race not found: ${raceId}`,
    });
    process.exit(1);
  }

  if (!playerClass) {
    console.error(`Class not found: ${classId}`);
    console.error("Run with --list-classes to see all available classes.");
    writeJSON(cfg.paths.result_file, {
      ok: false,
      step: "fetch_player",
      error: `Class not found: ${classId}`,
    });
    process.exit(1);
  }

  // Build comprehensive model context
  const modelContext = {
    // Identity
    model_id: `player-${raceId.toLowerCase()}-${classId.toLowerCase()}`,
    display_name: combination?.combination?.display_name || `${race.name} ${playerClass.name}`,

    // Race data
    race: {
      id: race.id,
      name: race.name,
      icon: race.icon,
      description: race.description,
      appearance: race.appearance, // CANONICAL - use this for the model
      lore: race.lore,
      base_height: race.base_height,
      skin_color: race.skin_color,
      eye_color: race.eye_color,
      stat_modifiers: race.stat_modifiers,
      racial_trait: race.racial_trait,
    },

    // Class data
    class: {
      id: playerClass.id,
      name: playerClass.name,
      icon: playerClass.icon,
      description: playerClass.description,
      playstyle: playerClass.playstyle,
      lore: playerClass.lore,
      stat_modifiers: playerClass.stat_modifiers,
      abilities: playerClass.abilities,
      starting_equipment: playerClass.starting_equipment,
      equipment_type: playerClass.equipment_type,
      primary_color: playerClass.primary_color,
      secondary_color: playerClass.secondary_color,
      glow_color: playerClass.glow_color,
    },

    // Combined stats
    combined_stats: combination?.combination?.combined_stats || {
      health: race.stat_modifiers.health + playerClass.stat_modifiers.health,
      attack: race.stat_modifiers.attack + playerClass.stat_modifiers.attack,
      defense: race.stat_modifiers.defense + playerClass.stat_modifiers.defense,
    },

    // Synergy notes
    synergy_notes: combination?.combination?.synergy_notes || null,
  };

  writeJSON(`${outDir}/player_data.json`, modelContext);

  console.log("");
  console.log("=== CANONICAL PLAYER DATA ===");
  console.log(`Model ID: ${modelContext.model_id}`);
  console.log(`Display Name: ${modelContext.display_name}`);
  console.log("");
  console.log("=== RACE: " + modelContext.race.name + " ===");
  console.log(`Icon: ${modelContext.race.icon}`);
  console.log(`Description: ${modelContext.race.description}`);
  console.log("");
  console.log("APPEARANCE (use this for body/face/proportions):");
  console.log(`  ${modelContext.race.appearance}`);
  console.log("");
  console.log("PHYSICAL ATTRIBUTES:");
  console.log(`  Base Height: ${modelContext.race.base_height}`);
  console.log(`  Skin Color: ${modelContext.race.skin_color}`);
  console.log(`  Eye Color: ${modelContext.race.eye_color}`);
  console.log("");
  console.log("RACIAL TRAIT:");
  console.log(`  ${modelContext.race.racial_trait.name}: ${modelContext.race.racial_trait.description}`);
  console.log(`  Effect: ${modelContext.race.racial_trait.effect}`);
  console.log("");
  console.log("=== CLASS: " + modelContext.class.name + " ===");
  console.log(`Icon: ${modelContext.class.icon}`);
  console.log(`Description: ${modelContext.class.description}`);
  console.log("");
  console.log("CLASS COLORS (use for armor/clothing/effects):");
  console.log(`  Primary: ${modelContext.class.primary_color}`);
  console.log(`  Secondary: ${modelContext.class.secondary_color}`);
  console.log(`  Glow: ${modelContext.class.glow_color}`);
  console.log("");
  console.log("EQUIPMENT (visual elements to include):");
  console.log(`  Type: ${modelContext.class.equipment_type}`);
  console.log(`  Starting: ${modelContext.class.starting_equipment}`);
  console.log("");
  console.log("ABILITIES (for pose/effect hints):");
  for (const ability of modelContext.class.abilities) {
    console.log(`  - ${ability.name} [${ability.ability_type}]: ${ability.description}`);
  }
  console.log("");
  console.log("PLAYSTYLE (stance/pose hints):");
  console.log(`  ${modelContext.class.playstyle}`);
  console.log("");
  if (modelContext.synergy_notes) {
    console.log("SYNERGY NOTES:");
    console.log(`  ${modelContext.synergy_notes}`);
    console.log("");
  }
  console.log("COMBINED STAT MODIFIERS:");
  console.log(`  HP: ${modelContext.combined_stats.health >= 0 ? '+' : ''}${modelContext.combined_stats.health}`);
  console.log(`  ATK: ${modelContext.combined_stats.attack >= 0 ? '+' : ''}${modelContext.combined_stats.attack}`);
  console.log(`  DEF: ${modelContext.combined_stats.defense >= 0 ? '+' : ''}${modelContext.combined_stats.defense}`);
  console.log("");
  console.log(`Output: ${outDir}/player_data.json`);

  writeJSON(cfg.paths.result_file, {
    ok: true,
    step: "fetch_player",
    race_id: raceId.toUpperCase(),
    class_id: classId.toUpperCase(),
    model_id: modelContext.model_id,
    display_name: modelContext.display_name,
    output_file: `${outDir}/player_data.json`,
  });
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
