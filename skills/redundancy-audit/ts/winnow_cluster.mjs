import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function readJSON(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function sha1(s) { return crypto.createHash("sha1").update(s).digest("hex"); }

function readJSONL(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
}

function kgramHashes(tokens, k) {
  const hashes = new Array(Math.max(0, tokens.length - k + 1));
  for (let i = 0; i + k <= tokens.length; i++) {
    hashes[i] = sha1(tokens.slice(i, i + k).join("\u0001"));
  }
  return hashes;
}

function winnow(tokens, k, w) {
  const h = kgramHashes(tokens, k);
  const fps = [];
  let lastPick = -1;
  for (let i = 0; i + w <= h.length; i++) {
    let min = h[i];
    let minPos = i;
    for (let j = i; j < i + w; j++) {
      const v = h[j];
      if (v < min || (v === min && j > minPos)) { // deterministic tie-break: rightmost
        min = v; minPos = j;
      }
    }
    if (minPos !== lastPick) {
      fps.push({ hash: min, pos: minPos });
      lastPick = minPos;
    }
  }
  return fps;
}

function extendExact(aToks, bToks, aPos, bPos) {
  let i = 0;
  while (aPos - i - 1 >= 0 && bPos - i - 1 >= 0 && aToks[aPos - i - 1] === bToks[bPos - i - 1]) i++;
  const left = i;
  i = 0;
  while (aPos + i < aToks.length && bPos + i < bToks.length && aToks[aPos + i] === bToks[bPos + i]) i++;
  const right = i;
  return { startA: aPos - left, endA: aPos + right, startB: bPos - left, endB: bPos + right, len: left + right };
}

function containsSpan(A, B) {
  // A contains B
  return A.startTok <= B.startTok && A.endTok >= B.endTok;
}

function main() {
  const cfgPath = process.argv[2];
  if (!cfgPath) throw new Error("Usage: node winnow_cluster.mjs <config.json>");
  const cfg = readJSON(cfgPath);

  const outDir = path.resolve(cfg.paths.out_dir);
  const reportPath = path.join(outDir, "report.json");

  const pyTokens = readJSONL(path.join(outDir, "py_tokens.jsonl"));
  const tsTokens = readJSONL(path.join(outDir, "ts_tokens.jsonl"));
  const all = [...pyTokens, ...tsTokens];

  const tokenCfg = cfg.token_clone;
  const results = [];

  // Build fingerprint index for type2 (you can duplicate this block for type1 too)
  for (const mode of ["type2"]) {
    const idx = new Map(); // hash -> list of {fileIndex, pos}
    const fpsByFile = [];

    for (let fi = 0; fi < all.length; fi++) {
      const row = all[fi];
      const toks = row[`${mode}_tokens`];
      const fps = winnow(toks, tokenCfg.k, tokenCfg.w);
      fpsByFile[fi] = fps;
      for (const fp of fps) {
        if (!idx.has(fp.hash)) idx.set(fp.hash, []);
        idx.get(fp.hash).push({ fi, pos: fp.pos });
      }
    }

    // Candidate matches from shared fingerprints
    const seenPair = new Set();
    for (const [h, occs] of idx.entries()) {
      if (occs.length < 2) continue;
      for (let i = 0; i < occs.length; i++) {
        for (let j = i + 1; j < occs.length; j++) {
          const A = occs[i], B = occs[j];
          if (A.fi === B.fi) continue;
          const key = `${A.fi}:${B.fi}:${A.pos}:${B.pos}`;
          if (seenPair.has(key)) continue;
          seenPair.add(key);

          const aRow = all[A.fi], bRow = all[B.fi];
          const aToks = aRow[`${mode}_tokens`], bToks = bRow[`${mode}_tokens`];
          const ext = extendExact(aToks, bToks, A.pos, B.pos);
          if (ext.len < tokenCfg.min_tokens) continue;

          const aLines = aRow[`${mode}_lines`];
          const bLines = bRow[`${mode}_lines`];

          results.push({
            kind: "token-clone",
            norm: mode,
            size_tokens: ext.len,
            occurrences: [
              {
                path: aRow.path,
                startTok: ext.startA,
                endTok: ext.endA,
                startLine: aLines[Math.min(ext.startA, aLines.length - 1)],
                endLine: aLines[Math.min(ext.endA - 1, aLines.length - 1)]
              },
              {
                path: bRow.path,
                startTok: ext.startB,
                endTok: ext.endB,
                startLine: bLines[Math.min(ext.startB, bLines.length - 1)],
                endLine: bLines[Math.min(ext.endB - 1, bLines.length - 1)]
              }
            ]
          });
        }
      }
    }
  }

  // AST subtree clones (exact hash groups)
  const pyAst = readJSONL(path.join(outDir, "py_ast.jsonl"));
  const tsAst = readJSONL(path.join(outDir, "ts_ast.jsonl"));
  const astAll = [...pyAst, ...tsAst];

  const groups = new Map(); // hash -> list of occ
  for (const r of astAll) {
    if (r.sizeNodes < cfg.ast_clone.min_nodes) continue;
    if (!groups.has(r.hash)) groups.set(r.hash, []);
    groups.get(r.hash).push(r);
  }
  for (const [h, occs] of groups.entries()) {
    if (occs.length < 2) continue;
    results.push({
      kind: "ast-subtree",
      norm: "type2",
      size_nodes: occs[0].sizeNodes,
      occurrences: occs.map(o => ({
        path: o.path,
        startLine: o.startLine,
        endLine: o.endLine
      }))
    });
  }

  // Maximality filter (simple containment pruning for token clones)
  let filtered = results;
  if (cfg.maximality.drop_contained) {
    const tokenClones = results.filter(r => r.kind === "token-clone");
    const others = results.filter(r => r.kind !== "token-clone");

    tokenClones.sort((a, b) => b.size_tokens - a.size_tokens);
    const kept = [];
    for (const c of tokenClones) {
      let contained = false;
      for (const k of kept) {
        // containment check on first two occurrences only (deterministic, cheap)
        const A = c.occurrences[0], B = c.occurrences[1];
        const KA = k.occurrences[0], KB = k.occurrences[1];
        if (A.path === KA.path && B.path === KB.path &&
            containsSpan(KA, A) && containsSpan(KB, B)) {
          contained = true; break;
        }
      }
      if (!contained) kept.push(c);
    }
    filtered = [...kept, ...others];
  }

  // Rank by estimated savings
  for (const r of filtered) {
    const occ = r.occurrences.length;
    const size = r.size_tokens ?? r.size_nodes ?? 0;
    r.estimated_savings = size * Math.max(0, occ - 1);
  }
  filtered.sort((a, b) => (b.estimated_savings ?? 0) - (a.estimated_savings ?? 0));

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ generated_at: new Date().toISOString(), results: filtered }, null, 2));
}

main();
