import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TscTraceLatency } from '../types.js';
import { looksLikeCodeFile } from '../analyzer/pathUtils.js';

function npxCmd(): string {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

export interface RunTscTraceOptions {
  rootAbsPath: string;
  tsconfigAbsPath: string;
  outDirAbsPath: string;
  forceNonIncremental?: boolean;
}

export function runTscGenerateTrace(opts: RunTscTraceOptions): { ok: boolean; stdout: string; stderr: string } {
  fs.mkdirSync(opts.outDirAbsPath, { recursive: true });

  // Following TypeScript team's recommendation: `tsc -p tsconfig --generateTrace traceDir --incremental false`
  const args = ['tsc', '-p', opts.tsconfigAbsPath, '--generateTrace', opts.outDirAbsPath];
  if (opts.forceNonIncremental ?? true) {
    args.push('--incremental', 'false');
  }

  const res = spawnSync(npxCmd(), args, {
    cwd: opts.rootAbsPath,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  return {
    ok: res.status === 0,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? ''
  };
}

function pickTraceFile(traceDirAbsPath: string): string | null {
  // Common non-build-mode layout: trace.json + types.json
  const direct = path.join(traceDirAbsPath, 'trace.json');
  if (fs.existsSync(direct)) return direct;

  // Build-mode layout: trace.1.json, trace.2.json, ... possibly with PIDs.
  const files = fs
    .readdirSync(traceDirAbsPath)
    .filter(f => /^trace\..*\.json$/i.test(f))
    .map(f => path.join(traceDirAbsPath, f));

  if (!files.length) return null;

  // Choose the largest; tends to correspond to the biggest project in build mode.
  files.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  return files[0];
}

type TraceEvent = {
  name?: string;
  ph?: string;
  dur?: number;
  args?: Record<string, unknown>;
};

function extractFilePath(args: Record<string, unknown> | undefined): string | undefined {
  if (!args) return undefined;

  const candidates = [
    args['fileName'],
    args['file'],
    args['path'],
    args['resolvedFileName'],
    args['sourceFile'],
    args['sourceFileName'],
    args['filename'],
    args['moduleName']
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && looksLikeCodeFile(c)) return c;
  }

  // Heuristic: any string value that looks like a TS/JS path.
  for (const v of Object.values(args)) {
    if (typeof v === 'string' && looksLikeCodeFile(v)) return v;
  }

  return undefined;
}

export function parseTscTraceDir(rootAbsPath: string, traceDirAbsPath: string): TscTraceLatency {
  const traceFileAbsPath = pickTraceFile(traceDirAbsPath);
  if (!traceFileAbsPath) {
    throw new Error(`No trace.json found in ${traceDirAbsPath}`);
  }

  const raw = fs.readFileSync(traceFileAbsPath, 'utf8');
  const parsed = JSON.parse(raw) as { traceEvents?: TraceEvent[] };
  const events = parsed.traceEvents ?? [];

  const perFileMs: Record<string, number> = {};
  const perFileBreakdownMs: Record<string, Record<string, number>> = {};
  const notes: string[] = [];

  // In Chrome trace format, `dur` is typically microseconds. Convert to milliseconds.
  const toMs = (dur: number) => dur / 1000;

  for (const e of events) {
    if (!e || typeof e !== 'object') continue;

    // Complete events in Chrome trace are typically `ph: "X"` and have `dur`.
    if (typeof e.dur !== 'number') continue;

    const file = extractFilePath(e.args);
    if (!file) continue;

    const abs = path.isAbsolute(file) ? file : path.resolve(rootAbsPath, file);
    const ms = toMs(e.dur);
    perFileMs[abs] = (perFileMs[abs] ?? 0) + ms;

    const name = typeof e.name === 'string' ? e.name : 'unknown';
    perFileBreakdownMs[abs] ??= {};
    perFileBreakdownMs[abs][name] = (perFileBreakdownMs[abs][name] ?? 0) + ms;
  }

  if (!Object.keys(perFileMs).length) {
    notes.push(
      'No per-file events were detected. The TypeScript trace format changes over time. ' +
        'You may need to tweak extractFilePath() heuristics for your TypeScript version.'
    );
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    rootAbsPath,
    traceDirAbsPath,
    perFileMs,
    perFileBreakdownMs,
    notes
  };
}
