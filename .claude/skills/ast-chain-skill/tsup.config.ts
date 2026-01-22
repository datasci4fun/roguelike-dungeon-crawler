import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    target: 'node20',
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.cjs' })
  },
  {
    entry: ['src/server.ts'],
    format: ['cjs'],
    target: 'node20',
    sourcemap: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.cjs' })
  },
  {
    entry: ['src/tracer/cjs-hook.ts'],
    format: ['cjs'],
    target: 'node20',
    sourcemap: true,
    outDir: 'dist/tracer',
    outExtension: () => ({ js: '.cjs' })
  },
  {
    entry: ['src/tracer/esm-loader.ts'],
    format: ['esm'],
    target: 'node20',
    sourcemap: true,
    outDir: 'dist/tracer',
    outExtension: () => ({ js: '.mjs' })
  }
]);
