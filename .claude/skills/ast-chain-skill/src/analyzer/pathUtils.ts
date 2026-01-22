import path from 'node:path';

/**
 * Convert a file path to a stable node id (posix relative path from root).
 */
export function toNodeId(rootAbsPath: string, fileAbsPath: string): string {
  const rel = path.relative(rootAbsPath, fileAbsPath);
  // Normalize to posix so the dashboard is stable across OSes.
  return rel.split(path.sep).join('/');
}

export function isPathInside(childAbsPath: string, parentAbsPath: string): boolean {
  const rel = path.relative(parentAbsPath, childAbsPath);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

export function looksLikeCodeFile(p: string): boolean {
  return /\.(c|m)?(ts|tsx|js|jsx|d\.ts)$/i.test(p);
}
