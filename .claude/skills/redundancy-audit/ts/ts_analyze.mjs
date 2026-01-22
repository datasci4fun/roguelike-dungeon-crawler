import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import ts from "typescript";

function readJSON(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function sha1(s) { return crypto.createHash("sha1").update(s).digest("hex"); }

function shouldExclude(rel, excludeDirs) {
  const parts = rel.split(path.sep);
  return parts.some(p => excludeDirs.includes(p));
}

function walk(root, cfg) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const d = stack.pop();
    const ents = fs.readdirSync(d, { withFileTypes: true });
    for (const e of ents) {
      const p = path.join(d, e.name);
      const rel = path.relative(root, p);
      if (shouldExclude(rel, cfg.exclude_dirs)) continue;
      if (e.isDirectory()) stack.push(p);
      else {
        const ext = path.extname(p);
        if (cfg.include_ext.includes(ext)) out.push(p);
      }
    }
  }
  return out;
}

function tokenNorm(kind, text, mode) {
  // mode: "type1" keeps identifiers/literals; "type2" normalizes them.
  if (mode === "type1") return `${kind}:${text}`;
  // type2:
  if (kind === "Identifier") return "Identifier:ID";
  if (kind.endsWith("Literal") || kind === "NumericLiteral" || kind === "StringLiteral" || kind === "NoSubstitutionTemplateLiteral")
    return `${kind}:LIT`;
  return `${kind}:${text}`;
}

function scanTokens(sf, mode) {
  const src = sf.getFullText();
  const scanner = ts.createScanner(
    sf.languageVersion,
    /*skipTrivia*/ true,
    sf.languageVariant,
    src
  );
  const toks = [];
  const tokLines = [];
  while (true) {
    const t = scanner.scan();
    if (t === ts.SyntaxKind.EndOfFileToken) break;
    const kind = ts.SyntaxKind[t];
    const text = scanner.getTokenText();
    const pos = scanner.getTokenPos();
    const { line } = sf.getLineAndCharacterOfPosition(pos);
    toks.push(tokenNorm(kind, text, mode));
    tokLines.push(line + 1);
  }
  return { toks, tokLines };
}

function astHashSubtrees(sf) {
  const results = [];
  function canonNode(n) {
    const k = ts.SyntaxKind[n.kind];
    // Normalize identifiers and literals
    if (ts.isIdentifier(n)) return ["Identifier", "ID"];
    if (ts.isStringLiteral(n) || ts.isNumericLiteral(n) || ts.isBigIntLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
      return [k, "LIT"];
    return [k];
  }
  function hashNode(n) {
    const parts = canonNode(n);
    const childHashes = [];
    n.forEachChild(ch => childHashes.push(hashNode(ch)));
    const h = sha1(JSON.stringify([parts, childHashes]));
    // size proxy: number of children + 1 (rough but deterministic)
    const size = 1 + childHashes.length;
    const s = sf.getLineAndCharacterOfPosition(n.getStart(sf, false));
    const e = sf.getLineAndCharacterOfPosition(n.getEnd());
    results.push({ hash: h, startLine: s.line + 1, endLine: e.line + 1, sizeNodes: size });
    return h;
  }
  hashNode(sf);
  return results;
}

function main() {
  const cfgPath = process.argv[2];
  if (!cfgPath) throw new Error("Usage: node ts_analyze.mjs <config.json>");
  const cfg = readJSON(cfgPath);

  const root = process.cwd();
  const files = walk(root, cfg);

  const outDir = path.resolve(cfg.paths.out_dir);
  fs.mkdirSync(outDir, { recursive: true });

  const tokenOut = path.join(outDir, "ts_tokens.jsonl");
  const astOut = path.join(outDir, "ts_ast.jsonl");
  fs.writeFileSync(tokenOut, "");
  fs.writeFileSync(astOut, "");

  for (const file of files) {
    const ext = path.extname(file);
    if (!(ext === ".ts" || ext === ".tsx")) continue;

    const src = fs.readFileSync(file, "utf8");
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ext === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

    const type1 = scanTokens(sf, "type1");
    const type2 = scanTokens(sf, "type2");
    const ast = astHashSubtrees(sf);

    fs.appendFileSync(tokenOut, JSON.stringify({
      path: path.relative(root, file),
      lang: "ts",
      type1_tokens: type1.toks,
      type1_lines: type1.tokLines,
      type2_tokens: type2.toks,
      type2_lines: type2.tokLines
    }) + "\n");

    for (const r of ast) {
      fs.appendFileSync(astOut, JSON.stringify({
        path: path.relative(root, file),
        lang: "ts",
        ...r
      }) + "\n");
    }
  }
}

main();
