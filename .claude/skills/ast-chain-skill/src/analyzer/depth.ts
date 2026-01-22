export interface DepthResult {
  depthOfComponent: Map<number, number>;
  depthToLeafOfComponent: Map<number, number>;
  roots: number[];
  leaves: number[];
  longestChainComponents: number[];
  maxDepth: number;
  maxDepthToLeaf: number;
}

/**
 * Compute depths on a DAG of SCC components.
 */
export function computeDagDepths(
  componentIds: number[],
  compEdges: Array<[number, number]>
): DepthResult {
  const adj = new Map<number, number[]>();
  const rev = new Map<number, number[]>();
  const indeg = new Map<number, number>();
  const outdeg = new Map<number, number>();

  for (const c of componentIds) {
    adj.set(c, []);
    rev.set(c, []);
    indeg.set(c, 0);
    outdeg.set(c, 0);
  }

  for (const [from, to] of compEdges) {
    if (from === to) continue;
    adj.get(from)!.push(to);
    rev.get(to)!.push(from);
    indeg.set(to, (indeg.get(to) ?? 0) + 1);
    outdeg.set(from, (outdeg.get(from) ?? 0) + 1);
  }

  const roots = componentIds.filter(c => (indeg.get(c) ?? 0) === 0);
  const leaves = componentIds.filter(c => (outdeg.get(c) ?? 0) === 0);

  // Topological order via Kahn.
  const q: number[] = [...roots];
  const indegWork = new Map(indeg);
  const topo: number[] = [];
  while (q.length) {
    const v = q.shift()!;
    topo.push(v);
    for (const w of adj.get(v) ?? []) {
      indegWork.set(w, (indegWork.get(w) ?? 0) - 1);
      if ((indegWork.get(w) ?? 0) === 0) q.push(w);
    }
  }

  // Longest path from any root.
  const depthOfComponent = new Map<number, number>();
  const pred = new Map<number, number | null>();
  for (const c of componentIds) {
    depthOfComponent.set(c, Number.NEGATIVE_INFINITY);
    pred.set(c, null);
  }
  for (const r of roots) depthOfComponent.set(r, 0);

  for (const v of topo) {
    const dv = depthOfComponent.get(v)!;
    if (!Number.isFinite(dv)) continue;
    for (const w of adj.get(v) ?? []) {
      if (dv + 1 > (depthOfComponent.get(w) ?? Number.NEGATIVE_INFINITY)) {
        depthOfComponent.set(w, dv + 1);
        pred.set(w, v);
      }
    }
  }

  let maxDepth = 0;
  let maxNode: number | null = null;
  for (const c of componentIds) {
    const d = depthOfComponent.get(c)!;
    if (Number.isFinite(d) && d >= maxDepth) {
      maxDepth = d;
      maxNode = c;
    }
  }

  // Reconstruct representative longest chain.
  const longestChainComponents: number[] = [];
  if (maxNode !== null) {
    let cur: number | null = maxNode;
    while (cur !== null) {
      longestChainComponents.push(cur);
      cur = pred.get(cur) ?? null;
    }
    longestChainComponents.reverse();
  }

  // Longest distance to any leaf (reverse topo).
  const depthToLeafOfComponent = new Map<number, number>();
  const succ = new Map<number, number | null>();
  for (const c of componentIds) {
    depthToLeafOfComponent.set(c, Number.NEGATIVE_INFINITY);
    succ.set(c, null);
  }
  for (const l of leaves) depthToLeafOfComponent.set(l, 0);

  for (const v of [...topo].reverse()) {
    const dv = depthToLeafOfComponent.get(v)!;
    if (!Number.isFinite(dv)) continue;
    for (const p of rev.get(v) ?? []) {
      if (dv + 1 > (depthToLeafOfComponent.get(p) ?? Number.NEGATIVE_INFINITY)) {
        depthToLeafOfComponent.set(p, dv + 1);
        succ.set(p, v);
      }
    }
  }

  let maxDepthToLeaf = 0;
  for (const c of componentIds) {
    const d = depthToLeafOfComponent.get(c)!;
    if (Number.isFinite(d) && d > maxDepthToLeaf) maxDepthToLeaf = d;
  }

  return {
    depthOfComponent,
    depthToLeafOfComponent,
    roots,
    leaves,
    longestChainComponents,
    maxDepth,
    maxDepthToLeaf
  };
}
