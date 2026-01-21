#!/usr/bin/env node
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';

function readJson(p: string): unknown {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function fileExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

const app = express();

const rootAbsPath = path.resolve(process.env.AST_CHAIN_PROJECT_ROOT || process.cwd());
const dataPath = path.resolve(rootAbsPath, process.env.AST_CHAIN_DATA_PATH || '.ast-chain/data.json');
const port = Number(process.env.AST_CHAIN_PORT || 4837);

const staticDir = path.resolve(__dirname, '../dashboard');

app.get('/api/data', (_req, res) => {
  if (!fileExists(dataPath)) {
    res.status(404).json({
      error: 'Dataset not found',
      expected: dataPath,
      hint: 'Run: ast-chain run --with-tsc-trace (or ast-chain analyze + build-dataset)'
    });
    return;
  }
  res.json(readJson(dataPath));
});

app.use('/', express.static(staticDir));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AST Chain dashboard serving:`);
  console.log(`  Project root: ${rootAbsPath}`);
  console.log(`  Dataset:      ${dataPath}`);
  console.log(`  URL:          http://localhost:${port}`);
});
