import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs';

export interface LoadedTsConfig {
  tsconfigAbsPath: string;
  options: ts.CompilerOptions;
  fileNames: string[];
}

/**
 * Load and parse a tsconfig.json (or jsconfig.json) file using TypeScript's own parser.
 */
export function loadTsConfig(tsconfigAbsPath: string): LoadedTsConfig {
  const readResult = ts.readConfigFile(tsconfigAbsPath, ts.sys.readFile);
  if (readResult.error) {
    const message = ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n');
    throw new Error(`Failed to read tsconfig at ${tsconfigAbsPath}: ${message}`);
  }

  const configDir = path.dirname(tsconfigAbsPath);
  const parsed = ts.parseJsonConfigFileContent(
    readResult.config,
    ts.sys,
    configDir,
    undefined,
    tsconfigAbsPath
  );

  if (parsed.errors?.length) {
    const message = parsed.errors
      .map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n'))
      .join('\n');
    throw new Error(`Failed to parse tsconfig at ${tsconfigAbsPath}:\n${message}`);
  }

  return {
    tsconfigAbsPath,
    options: parsed.options,
    fileNames: parsed.fileNames
  };
}

/**
 * Find a tsconfig.json starting from a root directory.
 */
export function findTsConfig(rootAbsPath: string): string | null {
  const candidates = ['tsconfig.json', 'jsconfig.json'];
  for (const name of candidates) {
    const candidate = path.join(rootAbsPath, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}
