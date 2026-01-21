---
name: ast-chain
description: AST-based dependency chain analysis for TypeScript projects. Generates a local dashboard showing dependency depth (SCC-aware) plus per-file latency from TypeScript compiler traces (tsc --generateTrace).
argument-hint: "[--with-tsc-trace] [--include-node-modules] [--include-dts] [--tsconfig <path>]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(ls:*), Bash(cat:*), Bash(rg:*), Bash(find:*), Bash(git:*), Bash(node:*), Bash(npm:*), Bash(npx:*), Bash(pnpm:*), Bash(yarn:*)
---

# AST Chain Dashboard (TypeScript)

This skill builds an **AST-derived dependency graph** of your TypeScript codebase (import/export/dynamic-import/require), then computes **chain metrics** (depth, SCC cycles, roots/leaves, representative longest chain). Optionally, it overlays **latency (ms)** using the TypeScript compiler’s performance tracing (`tsc --generateTrace`).

It outputs an interactive local dashboard.

## What you get

- **Dependency depth**
  - SCC-aware depth (cycles collapsed) + reverse depth to leaf
  - roots/leaves
  - representative longest chain (visualize with "Show Chain" button)
- **Latency in ms (optional)**
  - per-file compiler cost extracted from a `tsc --generateTrace` trace
  - top slowest files
  - chain cumulative latency (sum along the representative longest chain)
- **Issue detection**
  - **Circular dependencies** (orange nodes) - files in multi-node SCCs
  - **Hub files** (red nodes) - files with ≥10 dependents, potential bottlenecks
  - **Orphan files** (purple nodes) - files with 0 dependents, potential dead code
- **Dashboard features**
  - Interactive directed graph with color-coded nodes
  - Directory filtering dropdown
  - Text search with `/` keyboard shortcut
  - **Path Finder** - find import chain between any two files
  - **Change Impact** - see what rebuilds if a file changes
  - **External Dependencies** - most-imported npm packages
  - **Export** - PNG image or CSV data
  - Keyboard shortcuts: `/` (search), `Esc` (reset), `C` (show chain)

## Usage

Invoke from your project root:

- `/ast-chain`  
  Generate `.ast-chain/graph.json` and `.ast-chain/data.json` (depth-only).

- `/ast-chain --with-tsc-trace`  
  Also runs `tsc --generateTrace` and merges compiler latency into the dashboard.

### Arguments

Everything after `/ast-chain` is passed as `$ARGUMENTS`.

Supported flags (forwarded to the CLI):

- `--with-tsc-trace`
- `--include-node-modules`
- `--include-dts`
- `--tsconfig <path>` (default: `<root>/tsconfig.json`)

## How to run (what I will do when invoked)

1. **Locate the skill directory**
   - Look for `./.claude/skills/ast-chain-skill` (project skill)
   - Else fall back to `~/.claude/skills/ast-chain-skill` (personal skill)

2. **Build the skill toolchain (only if needed)**
   - If `dist/cli.cjs` is missing, run in the skill directory:
     - `npm install`
     - `npm run build`

3. **Find the correct tsconfig** (IMPORTANT)
   - If `--tsconfig` not provided, search for one:
     - First check `<root>/tsconfig.json`
     - If that has `"files": []` with `"references"` (project references), use the referenced config instead (usually `tsconfig.app.json`)
     - For monorepos, look in common locations: `web/`, `packages/*/`, `apps/*/`
   - The tsconfig must have `"include"` or `"files"` that actually reference source files

4. **Generate the dataset**
   - From the project root, run:

     ```bash
     node <SKILL_DIR>/dist/cli.cjs run --root . $ARGUMENTS
     ```

   - This writes:
     - `.ast-chain/graph.json`
     - `.ast-chain/data.json`
     - and if `--with-tsc-trace`:
       - `.ast-chain/tsc-trace/` (raw trace output)
       - `.ast-chain/tsc-latency.json`

5. **Serve the dashboard**

   **Unix/Mac/Git Bash:**
   ```bash
   AST_CHAIN_PROJECT_ROOT="$PWD" node <SKILL_DIR>/dist/server.cjs
   ```

   **Windows (cmd):**
   ```cmd
   set AST_CHAIN_PROJECT_ROOT=%CD% && node <SKILL_DIR>/dist/server.cjs
   ```

   **Windows (PowerShell):**
   ```powershell
   $env:AST_CHAIN_PROJECT_ROOT="$PWD"; node <SKILL_DIR>/dist/server.cjs
   ```

   Then open `http://localhost:4837`.

## Notes on latency

- The “latency” displayed by default is **TypeScript compiler time extracted from a trace**.
- TypeScript’s trace output format is not guaranteed stable across versions, so the extractor uses best-effort heuristics.
- For huge repos, traces can be large.

## Optional: runtime module-load latency (Node)

If you want **runtime require/import latency** instead of compiler latency, use the tracer scripts:

- CommonJS require latency:
  ```bash
  AST_CHAIN_ROOT="$PWD" AST_CHAIN_TRACE_OUT=.ast-chain/runtime-trace.json \
    node --require <SKILL_DIR>/dist/tracer/cjs-hook.cjs <your-entry.js>
  ```

- ESM import latency (best-effort eval time via loader injection):
  ```bash
  AST_CHAIN_ROOT="$PWD" AST_CHAIN_TRACE_OUT=.ast-chain/runtime-trace.json \
    node --loader <SKILL_DIR>/dist/tracer/esm-loader.mjs <your-entry.mjs>
  ```

(Integrating runtime traces into the dashboard is straightforward: map absolute paths → graph node ids, then attach `latencyMs` to nodes.)

## Supporting files

- Dashboard UI: `dashboard/index.html`
- Analyzer: `src/analyzer/*`
- TypeScript trace parser: `src/trace/tscTrace.ts`
- Runtime tracers: `src/tracer/*`

## Examples

- `/ast-chain`
- `/ast-chain --with-tsc-trace`
- `/ast-chain --with-tsc-trace --tsconfig packages/api/tsconfig.json`
- `/ast-chain --tsconfig web/tsconfig.app.json` (for projects using tsconfig references)

## Troubleshooting

### "No tsconfig.json found" error
The CLI requires a tsconfig to find TypeScript files. Common fixes:
- **Monorepo/subdirectory**: Pass `--tsconfig web/tsconfig.json` or similar
- **Project references**: If your tsconfig has `"files": []` and `"references"`, point to the actual config (e.g., `tsconfig.app.json` instead of `tsconfig.json`)

### "0 nodes, 0 edges" in dashboard
The tsconfig you specified doesn't include any source files. Check:
- Does the tsconfig have `"include": ["src"]` or similar?
- If using project references, use the referenced config (e.g., `tsconfig.app.json`)

### Dashboard shows no graph / vis.js warning about improvedLayout
This happens with large graphs (300+ nodes). The dashboard auto-switches to force-directed layout for large graphs. If issues persist, the graph is rendering but may need time to stabilize—wait a few seconds.

### Environment variable not working on Windows
Use the correct syntax for your shell:
- **cmd**: `set VAR=value && command`
- **PowerShell**: `$env:VAR="value"; command`
- **Git Bash**: `VAR=value command`

### Common tsconfig patterns

| Project Type | Typical tsconfig path |
|--------------|----------------------|
| Vite + React | `tsconfig.app.json` (not `tsconfig.json`) |
| Next.js | `tsconfig.json` (works directly) |
| Monorepo | `packages/<name>/tsconfig.json` |
| NestJS | `tsconfig.build.json` or `tsconfig.json` |
