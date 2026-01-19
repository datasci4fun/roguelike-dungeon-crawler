import { spawnSync } from "node:child_process";
import { readJSON, writeJSON } from "./util.mjs";

function main() {
  const cfg = readJSON(".claude/skills/model-generator/config.json");
  const resultPath = cfg.paths.result_file;

  const p = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsc", "--noEmit", "--pretty", "false"],
    { cwd: "web", encoding: "utf8", shell: true }
  );

  const out = (p.stdout || "") + (p.stderr || "");
  // status can be null on some platforms if process was killed; treat as error
  const ok = p.status === 0;

  // Parse TypeScript errors (stable format when --pretty false)
  const errors = [];
  const re = /^(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/gm;
  let m;
  while ((m = re.exec(out)) !== null) {
    errors.push({
      file: m[1],
      line: Number(m[2]),
      col: Number(m[3]),
      code: m[4],
      message: m[5]
    });
  }

  writeJSON(resultPath, {
    ok,
    step: "validate_tsc",
    tsc_status: p.status,
    error_count: errors.length,
    errors
  });
}

main();
