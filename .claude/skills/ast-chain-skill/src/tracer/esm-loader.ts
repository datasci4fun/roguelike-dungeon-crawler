/*
  ESM loader for measuring per-module *evaluation* time.

  Usage:
    AST_CHAIN_TRACE_OUT=.ast-chain/runtime-trace.json \
      node --loader ./dist/tracer/esm-loader.mjs your-entry.mjs

  Notes:
    - This injects a tiny snippet into each loaded module under AST_CHAIN_ROOT.
    - If a module throws during evaluation, its timing may not be recorded.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ResolveContext = { parentURL?: string };
type ResolveResult = { url: string };

type LoadContext = Record<string, unknown>;
type LoadResult = { format: string; source: string | Uint8Array };

type Edge = { from: string; to: string };

const rootAbsPath = path.resolve(process.env.AST_CHAIN_ROOT || process.cwd());
const outAbsPath = path.resolve(
  process.env.AST_CHAIN_TRACE_OUT || path.join(rootAbsPath, '.ast-chain', 'runtime-trace.json')
);
const includeNodeModules = process.env.AST_CHAIN_INCLUDE_NODE_MODULES === '1';

const moduleEvalTimeMs: Record<string, number> = {};
const edges: Edge[] = [];

function shouldInclude(absPath: string): boolean {
  if (!includeNodeModules && absPath.includes(`${path.sep}node_modules${path.sep}`)) return false;
  return absPath.startsWith(rootAbsPath);
}

function urlToAbsPath(url: string): string | null {
  if (!url.startsWith('file://')) return null;
  try {
    return path.resolve(fileURLToPath(url));
  } catch {
    return null;
  }
}

(globalThis as any).__astChainRecordModuleEval ??= (url: string, ms: number) => {
  const abs = urlToAbsPath(url);
  if (!abs) return;
  if (!shouldInclude(abs)) return;
  moduleEvalTimeMs[abs] = (moduleEvalTimeMs[abs] ?? 0) + ms;
};

function recordEdge(parentURL: string, childURL: string): void {
  const pAbs = urlToAbsPath(parentURL);
  const cAbs = urlToAbsPath(childURL);
  if (!pAbs || !cAbs) return;
  if (!shouldInclude(pAbs) || !shouldInclude(cAbs)) return;
  edges.push({ from: pAbs, to: cAbs });
}

process.on('exit', () => {
  fs.mkdirSync(path.dirname(outAbsPath), { recursive: true });
  fs.writeFileSync(
    outAbsPath,
    JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        rootAbsPath,
        kind: 'node-runtime-esm',
        moduleEvalTimeMs,
        edges
      },
      null,
      2
    ),
    'utf8'
  );
});

export async function resolve(
  specifier: string,
  context: ResolveContext,
  defaultResolve: (specifier: string, context: ResolveContext, defaultResolve: any) => Promise<ResolveResult>
): Promise<ResolveResult> {
  const res = await defaultResolve(specifier, context, defaultResolve);
  if (context.parentURL) recordEdge(context.parentURL, res.url);
  return res;
}

export async function load(
  url: string,
  context: LoadContext,
  defaultLoad: (url: string, context: LoadContext, defaultLoad: any) => Promise<LoadResult>
): Promise<LoadResult> {
  const res = await defaultLoad(url, context, defaultLoad);

  const abs = urlToAbsPath(url);
  if (!abs) return res;
  if (!shouldInclude(abs)) return res;

  // Only inject into JS/TS-like modules.
  if (!['module', 'commonjs'].includes(res.format)) return res;

  const sourceText = typeof res.source === 'string' ? res.source : Buffer.from(res.source).toString('utf8');

  // IMPORTANT: We cannot wrap module bodies in try/finally because top-level import/export
  // statements must remain at the top level. We use a best-effort "append a call at the end".
  const prelude =
    "import { performance as __astChainPerf } from 'node:perf_hooks';\n" +
    'const __astChainT0 = __astChainPerf.now();\n';

  const epilogue =
    "\n;globalThis.__astChainRecordModuleEval?.(import.meta.url, __astChainPerf.now() - __astChainT0);\n";

  return {
    ...res,
    source: prelude + sourceText + epilogue
  };
}
