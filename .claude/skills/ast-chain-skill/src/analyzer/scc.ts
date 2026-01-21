/**
 * Tarjan's strongly connected components algorithm.
 *
 * Nodes are identified by string ids.
 */
export function tarjanScc(nodes: string[], edges: Array<[string, string]>): {
  sccOf: Map<string, number>;
  components: Map<number, string[]>;
} {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n, []);
  for (const [from, to] of edges) {
    adj.get(from)?.push(to);
  }

  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];

  const sccOf = new Map<string, number>();
  const components = new Map<number, string[]>();
  let sccId = 0;

  const strongConnect = (v: string) => {
    indices.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) ?? []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const members: string[] = [];
      while (true) {
        const w = stack.pop();
        if (!w) break;
        onStack.delete(w);
        sccOf.set(w, sccId);
        members.push(w);
        if (w === v) break;
      }
      components.set(sccId, members);
      sccId++;
    }
  };

  for (const v of nodes) {
    if (!indices.has(v)) strongConnect(v);
  }

  return { sccOf, components };
}
