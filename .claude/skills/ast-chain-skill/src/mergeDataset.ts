import path from 'node:path';
import { AstChainDataset, AstChainGraph, TscTraceLatency } from './types.js';
import { toNodeId } from './analyzer/pathUtils.js';

export function attachTscLatencyToGraph(graph: AstChainGraph, tsc: TscTraceLatency): AstChainGraph {
  const root = graph.rootAbsPath;
  const latencyById = new Map<string, { total: number; breakdown?: Record<string, number> }>();

  for (const [abs, ms] of Object.entries(tsc.perFileMs)) {
    const absNorm = path.resolve(abs);
    // Ignore files outside root.
    if (!absNorm.startsWith(root)) continue;
    const id = toNodeId(root, absNorm);
    latencyById.set(id, { total: ms, breakdown: tsc.perFileBreakdownMs[abs] });
  }

  let totalLatencyMs = 0;
  const newNodes = graph.nodes.map(n => {
    const l = latencyById.get(n.id);
    if (!l) return n;
    totalLatencyMs += l.total;
    return {
      ...n,
      latencyMs: l.total,
      latencyBreakdownMs: l.breakdown
    };
  });

  return {
    ...graph,
    nodes: newNodes,
    stats: {
      ...graph.stats,
      totalLatencyMs
    }
  };
}

export function buildDataset(graph: AstChainGraph, tscTrace?: TscTraceLatency): AstChainDataset {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    graph,
    tscTrace
  };
}
