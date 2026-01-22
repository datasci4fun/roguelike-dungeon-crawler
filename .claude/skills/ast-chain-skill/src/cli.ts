#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeProject } from './analyzer/analyzeProject.js';
import { parseTscTraceDir, runTscGenerateTrace } from './trace/tscTrace.js';
import { attachTscLatencyToGraph, buildDataset } from './mergeDataset.js';

function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(p: string, value: unknown): void {
  fs.writeFileSync(p, JSON.stringify(value, null, 2), 'utf8');
}

const program = new Command();
program
  .name('ast-chain')
  .description('AST Chain dependency analysis + latency dashboard dataset generator')
  .version('0.1.0');

program
  .command('analyze')
  .description('Generate a static dependency graph from a TypeScript project')
  .option('-r, --root <path>', 'Project root directory', process.cwd())
  .option('-p, --tsconfig <path>', 'Path to tsconfig.json (defaults to <root>/tsconfig.json)')
  .option('--include-node-modules', 'Include dependencies under node_modules', false)
  .option('--include-dts', 'Include .d.ts files', false)
  .option('-o, --out <path>', 'Output graph json path', '.ast-chain/graph.json')
  .action((opts) => {
    const rootAbsPath = path.resolve(opts.root);
    const outAbsPath = path.resolve(rootAbsPath, opts.out);
    ensureDir(path.dirname(outAbsPath));

    const graph = analyzeProject({
      rootAbsPath,
      tsconfigAbsPath: opts.tsconfig ? path.resolve(opts.tsconfig) : undefined,
      includeNodeModules: !!opts.includeNodeModules,
      includeDts: !!opts.includeDts
    });

    writeJson(outAbsPath, graph);
    process.stdout.write(`Wrote graph to ${outAbsPath}\n`);
  });

program
  .command('trace-tsc')
  .description('Run tsc --generateTrace and summarize per-file latency from the trace')
  .option('-r, --root <path>', 'Project root directory', process.cwd())
  .option('-p, --tsconfig <path>', 'Path to tsconfig.json (defaults to <root>/tsconfig.json)')
  .option('-d, --trace-dir <path>', 'Directory to write trace output', '.ast-chain/tsc-trace')
  .option('--keep-going', 'Do not fail if tsc exits non-zero', true)
  .option('-o, --out <path>', 'Output trace summary json path', '.ast-chain/tsc-latency.json')
  .action((opts) => {
    const rootAbsPath = path.resolve(opts.root);
    const tsconfigAbsPath = opts.tsconfig
      ? path.resolve(opts.tsconfig)
      : path.resolve(rootAbsPath, 'tsconfig.json');

    const traceDirAbsPath = path.resolve(rootAbsPath, opts.traceDir);
    ensureDir(traceDirAbsPath);

    const res = runTscGenerateTrace({ rootAbsPath, tsconfigAbsPath, outDirAbsPath: traceDirAbsPath });
    if (!res.ok && !opts.keepGoing) {
      process.stderr.write(res.stderr);
      process.exit(1);
    }

    const summary = parseTscTraceDir(rootAbsPath, traceDirAbsPath);
    const outAbsPath = path.resolve(rootAbsPath, opts.out);
    ensureDir(path.dirname(outAbsPath));
    writeJson(outAbsPath, summary);

    process.stdout.write(`tsc exited ${res.ok ? '0' : 'non-zero'}, wrote latency summary to ${outAbsPath}\n`);
  });

program
  .command('build-dataset')
  .description('Merge graph.json + tsc-latency.json into a single dataset file used by the dashboard')
  .option('-r, --root <path>', 'Project root directory', process.cwd())
  .option('--graph <path>', 'Path to graph.json', '.ast-chain/graph.json')
  .option('--tsc <path>', 'Path to tsc-latency.json (optional)', '.ast-chain/tsc-latency.json')
  .option('-o, --out <path>', 'Output dataset json path', '.ast-chain/data.json')
  .action((opts) => {
    const rootAbsPath = path.resolve(opts.root);
    const graphPath = path.resolve(rootAbsPath, opts.graph);
    const tscPath = path.resolve(rootAbsPath, opts.tsc);
    const outAbsPath = path.resolve(rootAbsPath, opts.out);
    ensureDir(path.dirname(outAbsPath));

    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8')) as any;
    let finalGraph = graph;
    let tscTrace: any = undefined;

    if (fs.existsSync(tscPath)) {
      tscTrace = JSON.parse(fs.readFileSync(tscPath, 'utf8')) as any;
      finalGraph = attachTscLatencyToGraph(graph, tscTrace);
    }

    const dataset = buildDataset(finalGraph, tscTrace);
    writeJson(outAbsPath, dataset);
    process.stdout.write(`Wrote dashboard dataset to ${outAbsPath}\n`);
  });

program
  .command('run')
  .description('One-shot: analyze + (optional) tsc trace + dataset build')
  .option('-r, --root <path>', 'Project root directory', process.cwd())
  .option('-p, --tsconfig <path>', 'Path to tsconfig.json')
  .option('--include-node-modules', 'Include dependencies under node_modules', false)
  .option('--include-dts', 'Include .d.ts files', false)
  .option('--with-tsc-trace', 'Also run tsc --generateTrace and merge compiler latency', false)
  .option('--trace-dir <path>', 'Directory to write trace output', '.ast-chain/tsc-trace')
  .action((opts) => {
    const rootAbsPath = path.resolve(opts.root);
    const outDir = path.resolve(rootAbsPath, '.ast-chain');
    ensureDir(outDir);

    const graph = analyzeProject({
      rootAbsPath,
      tsconfigAbsPath: opts.tsconfig ? path.resolve(opts.tsconfig) : undefined,
      includeNodeModules: !!opts.includeNodeModules,
      includeDts: !!opts.includeDts
    });
    writeJson(path.join(outDir, 'graph.json'), graph);

    let tscTrace: any = undefined;
    let finalGraph = graph;

    if (opts.withTscTrace) {
      const tsconfigAbsPath = graph.tsconfigAbsPath ?? path.resolve(rootAbsPath, 'tsconfig.json');
      const traceDirAbsPath = path.resolve(rootAbsPath, opts.traceDir);
      ensureDir(traceDirAbsPath);

      const res = runTscGenerateTrace({ rootAbsPath, tsconfigAbsPath, outDirAbsPath: traceDirAbsPath });
      process.stdout.write(`tsc exited ${res.ok ? '0' : 'non-zero'}\n`);
      tscTrace = parseTscTraceDir(rootAbsPath, traceDirAbsPath);
      writeJson(path.join(outDir, 'tsc-latency.json'), tscTrace);

      finalGraph = attachTscLatencyToGraph(graph, tscTrace);
    }

    const dataset = buildDataset(finalGraph, tscTrace);
    writeJson(path.join(outDir, 'data.json'), dataset);
    process.stdout.write(`Wrote .ast-chain/data.json (ready for the dashboard)\n`);
  });

program.parse(process.argv);
