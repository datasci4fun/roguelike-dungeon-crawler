export type EdgeType = 'import' | 'dynamic-import' | 'require' | 'export-from';

export interface GraphNode {
  id: string;              // relative path from root (posix)
  absPath: string;         // absolute path
  inDegree: number;
  outDegree: number;
  scc: number;             // strongly connected component id
  depth: number;           // depth in SCC-condensed DAG (roots depth=0)
  depthToLeaf: number;     // reverse depth (leaves depth=0)
  latencyMs?: number;      // optional compile/runtime latency
  latencyBreakdownMs?: Record<string, number>;
}

export interface GraphEdge {
  from: string; // node id
  to: string;   // node id
  type: EdgeType;
  specifier: string;
}

export interface StronglyConnectedComponent {
  id: number;
  members: string[]; // node ids
}

export interface AstChainGraph {
  version: 1;
  generatedAt: string;
  rootAbsPath: string;
  tsconfigAbsPath?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  sccs: StronglyConnectedComponent[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    sccCount: number;
    maxDepth: number;
    maxDepthToLeaf: number;
    roots: string[];
    leaves: string[];
    longestChain: string[]; // list of node ids (representative chain through SCC DAG)
    longestChainDepth: number;
    totalLatencyMs?: number;
  };
}

export interface TscTraceLatency {
  version: 1;
  generatedAt: string;
  rootAbsPath: string;
  traceDirAbsPath: string;
  // Keyed by absolute path
  perFileMs: Record<string, number>;
  perFileBreakdownMs: Record<string, Record<string, number>>;
  notes: string[];
}

export interface AstChainDataset {
  version: 1;
  generatedAt: string;
  graph: AstChainGraph;
  tscTrace?: TscTraceLatency;
}
