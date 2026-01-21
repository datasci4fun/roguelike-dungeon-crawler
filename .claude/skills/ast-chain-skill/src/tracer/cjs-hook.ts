/*
  CJS preload hook for measuring per-module require() latency.

  Usage:
    AST_CHAIN_TRACE_OUT=.ast-chain/runtime-trace.json \
      node --require ./dist/tracer/cjs-hook.cjs your-entry.js
*/

import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import Module from 'node:module';

type Edge = { from: string; to: string };

const rootAbsPath = path.resolve(process.env.AST_CHAIN_ROOT || process.cwd());
const outAbsPath = path.resolve(process.env.AST_CHAIN_TRACE_OUT || path.join(rootAbsPath, '.ast-chain', 'runtime-trace.json'));
const includeNodeModules = process.env.AST_CHAIN_INCLUDE_NODE_MODULES === '1';

const moduleTimeMs: Record<string, number> = {};
const edges: Edge[] = [];

const origLoad = (Module as any)._load as Function;
const origResolve = (Module as any)._resolveFilename as Function;

function shouldInclude(absPath: string): boolean {
  if (!includeNodeModules && absPath.includes(`${path.sep}node_modules${path.sep}`)) return false;
  return absPath.startsWith(rootAbsPath);
}

(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  const t0 = performance.now();
  const exports = origLoad.apply(this, arguments as any);
  const t1 = performance.now();

  try {
    const resolved = origResolve.call(this, request, parent, isMain);
    const abs = path.resolve(resolved);
    if (shouldInclude(abs)) {
      moduleTimeMs[abs] = (moduleTimeMs[abs] ?? 0) + (t1 - t0);
      if (parent?.filename) {
        const pAbs = path.resolve(parent.filename);
        if (shouldInclude(pAbs)) edges.push({ from: pAbs, to: abs });
      }
    }
  } catch {
    // ignore resolution failures
  }

  return exports;
};

process.on('exit', () => {
  fs.mkdirSync(path.dirname(outAbsPath), { recursive: true });
  fs.writeFileSync(
    outAbsPath,
    JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        rootAbsPath,
        kind: 'node-runtime-cjs',
        moduleTimeMs,
        edges
      },
      null,
      2
    ),
    'utf8'
  );
});
