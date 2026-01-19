import ts from "typescript";
import { readJSON, readText, writeJSON } from "./util.mjs";

function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const outDir = cfg.paths.out_dir;
  const resultPath = cfg.paths.result_file;

  // Materials
  const matSrc = readText(cfg.paths.materials);
  const mats = (() => {
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
    keys = keys.filter(Boolean).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return keys;
  })();

  const categories = ["structure", "furniture", "decoration", "interactive", "prop", "enemy"];

  // Lightweight output (don't overwrite final run result; store context separately)
  writeJSON(`${outDir}/repo_context.json`, {
    materials: mats,
    categories
  });

  // If no result.json exists yet, create a minimal ok stub (other steps will overwrite)
  writeJSON(resultPath, { ok: true, step: "analyze_repo", context_file: `${outDir}/repo_context.json` });
}

main();
