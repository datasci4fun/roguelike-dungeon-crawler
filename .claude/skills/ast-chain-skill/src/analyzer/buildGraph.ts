import ts from 'typescript';
import path from 'node:path';
import { GraphEdge } from '../types.js';
import { looksLikeCodeFile, toNodeId } from './pathUtils.js';

export interface BuildGraphOptions {
  rootAbsPath: string;
  program: ts.Program;
  includeNodeModules: boolean;
  includeDts: boolean;
}

function shouldIncludeFile(absPath: string, opts: BuildGraphOptions): boolean {
  if (!looksLikeCodeFile(absPath)) return false;
  if (!opts.includeDts && absPath.endsWith('.d.ts')) return false;
  if (!opts.includeNodeModules && absPath.includes(`${path.sep}node_modules${path.sep}`)) return false;
  // Exclude TypeScript's built-in lib files.
  if (absPath.includes(`${path.sep}typescript${path.sep}lib${path.sep}lib.`)) return false;
  return true;
}

/**
 * Build an import graph (file -> file) using TypeScript AST + module resolution.
 */
export function buildFileDependencyGraph(opts: BuildGraphOptions): {
  nodesAbsPaths: Set<string>;
  edges: GraphEdge[];
} {
  const { rootAbsPath, program } = opts;
  const checker = program.getTypeChecker();
  void checker; // currently unused, but we keep it here if you extend to symbol-level deps.

  const nodesAbsPaths = new Set<string>();
  const edges: GraphEdge[] = [];

  const sourceFiles = program
    .getSourceFiles()
    .map(sf => sf.fileName)
    .filter(p => shouldIncludeFile(p, opts));

  for (const fileAbsPath of sourceFiles) {
    nodesAbsPaths.add(path.resolve(fileAbsPath));
    const sf = program.getSourceFile(fileAbsPath);
    if (!sf) continue;

    const addEdge = (toAbsPath: string, specifier: string, type: GraphEdge['type']) => {
      if (!shouldIncludeFile(toAbsPath, opts)) return;
      const fromId = toNodeId(rootAbsPath, path.resolve(fileAbsPath));
      const toId = toNodeId(rootAbsPath, path.resolve(toAbsPath));
      edges.push({ from: fromId, to: toId, type, specifier });
      nodesAbsPaths.add(path.resolve(toAbsPath));
    };

    const resolve = (moduleName: string): string | null => {
      const resolved = ts.resolveModuleName(
        moduleName,
        fileAbsPath,
        program.getCompilerOptions(),
        ts.sys
      );
      return resolved.resolvedModule?.resolvedFileName ?? null;
    };

    const visit = (node: ts.Node) => {
      // import ... from 'x'
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        const resolved = resolve(spec);
        if (resolved) addEdge(resolved, spec, 'import');
      }

      // export ... from 'x'
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        const resolved = resolve(spec);
        if (resolved) addEdge(resolved, spec, 'export-from');
      }

      // dynamic import('x')
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const [arg] = node.arguments;
        if (arg && ts.isStringLiteral(arg)) {
          const spec = arg.text;
          const resolved = resolve(spec);
          if (resolved) addEdge(resolved, spec, 'dynamic-import');
        }
      }

      // require('x') for CJS projects
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        const [arg] = node.arguments;
        if (arg && ts.isStringLiteral(arg)) {
          const spec = arg.text;
          const resolved = resolve(spec);
          if (resolved) addEdge(resolved, spec, 'require');
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sf);
  }

  return { nodesAbsPaths, edges };
}
