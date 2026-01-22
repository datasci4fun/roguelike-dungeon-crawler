import ts from 'typescript';
import path from 'node:path';
import { AstChainGraph, GraphNode, StronglyConnectedComponent } from '../types.js';
import { buildFileDependencyGraph } from './buildGraph.js';
import { findTsConfig, loadTsConfig } from './loadTsConfig.js';
import { computeDagDepths } from './depth.js';
import { tarjanScc } from './scc.js';
import { toNodeId } from './pathUtils.js';

export interface AnalyzeOptions {
  rootAbsPath: string;
  tsconfigAbsPath?: string;
  includeNodeModules?: boolean;
  includeDts?: boolean;
}

export function analyzeProject(opts: AnalyzeOptions): AstChainGraph {
  const rootAbsPath = path.resolve(opts.rootAbsPath);
  const tsconfigAbsPath = opts.tsconfigAbsPath
    ? path.resolve(opts.tsconfigAbsPath)
    : findTsConfig(rootAbsPath) ?? undefined;

  if (!tsconfigAbsPath) {
    throw new Error(
      `No tsconfig.json (or jsconfig.json) found in ${rootAbsPath}. Pass --tsconfig to point at one.`
    );
  }

  const loaded = loadTsConfig(tsconfigAbsPath);
  const program = ts.createProgram({
    rootNames: loaded.fileNames,
    options: loaded.options
  });

  const { edges } = buildFileDependencyGraph({
    rootAbsPath,
    program,
    includeNodeModules: !!opts.includeNodeModules,
    includeDts: !!opts.includeDts
  });

  const nodeIds = new Set<string>();
  const nodeAbsById = new Map<string, string>();
  for (const sf of program.getSourceFiles()) {
    const abs = path.resolve(sf.fileName);
    if (!opts.includeNodeModules && abs.includes(`${path.sep}node_modules${path.sep}`)) continue;
    if (!opts.includeDts && abs.endsWith('.d.ts')) continue;
    const id = toNodeId(rootAbsPath, abs);
    nodeIds.add(id);
    nodeAbsById.set(id, abs);
  }
  for (const e of edges) {
    nodeIds.add(e.from);
    nodeIds.add(e.to);
  }

  const nodesList = [...nodeIds].sort();
  const edgePairs: Array<[string, string]> = edges.map(e => [e.from, e.to]);

  const { sccOf, components } = tarjanScc(nodesList, edgePairs);

  // Build SCC edges (condensed graph).
  const compIds = [...components.keys()].sort((a, b) => a - b);
  const compEdgeSet = new Set<string>();
  const compEdges: Array<[number, number]> = [];
  for (const [from, to] of edgePairs) {
    const cf = sccOf.get(from)!;
    const ct = sccOf.get(to)!;
    const key = `${cf}->${ct}`;
    if (cf !== ct && !compEdgeSet.has(key)) {
      compEdgeSet.add(key);
      compEdges.push([cf, ct]);
    }
  }

  const depthRes = computeDagDepths(compIds, compEdges);

  // Compute degrees.
  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  for (const id of nodesList) {
    inDeg.set(id, 0);
    outDeg.set(id, 0);
  }
  for (const e of edges) {
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    outDeg.set(e.from, (outDeg.get(e.from) ?? 0) + 1);
  }

  const graphNodes: GraphNode[] = nodesList.map(id => {
    const absPath = nodeAbsById.get(id) ?? path.resolve(rootAbsPath, id);
    const scc = sccOf.get(id) ?? 0;
    return {
      id,
      absPath,
      inDegree: inDeg.get(id) ?? 0,
      outDegree: outDeg.get(id) ?? 0,
      scc,
      depth: depthRes.depthOfComponent.get(scc) ?? 0,
      depthToLeaf: depthRes.depthToLeafOfComponent.get(scc) ?? 0
    };
  });

  const sccs: StronglyConnectedComponent[] = [...components.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, members]) => ({ id, members: [...members].sort() }));

  const rootNodeIds = graphNodes.filter(n => n.inDegree === 0).map(n => n.id);
  const leafNodeIds = graphNodes.filter(n => n.outDegree === 0).map(n => n.id);

  // Expand representative longest chain from components to nodes by choosing an arbitrary member per SCC.
  const longestChain: string[] = depthRes.longestChainComponents.map(cid => {
    const members = components.get(cid) ?? [];
    return [...members].sort()[0] ?? '';
  }).filter(Boolean);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    rootAbsPath,
    tsconfigAbsPath,
    nodes: graphNodes,
    edges,
    sccs,
    stats: {
      nodeCount: graphNodes.length,
      edgeCount: edges.length,
      sccCount: sccs.length,
      maxDepth: depthRes.maxDepth,
      maxDepthToLeaf: depthRes.maxDepthToLeaf,
      roots: rootNodeIds,
      leaves: leafNodeIds,
      longestChain,
      longestChainDepth: depthRes.maxDepth
    }
  };
}
