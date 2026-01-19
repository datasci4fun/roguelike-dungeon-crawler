/**
 * Claude Skills Documentation Page
 *
 * Visual workflow diagrams and documentation for Claude Code skills
 * used in this project. Maps out the complete decision matrices,
 * processes, loops, file operations, and logical paths.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import { MermaidDiagram } from '../components/MermaidDiagram';
import './ClaudeSkills.css';

// Mermaid diagram definitions for the model-generator skill
const DIAGRAMS = {
  masterWorkflow: `
flowchart TB
    subgraph Entry["🚀 ENTRY POINT"]
        A["/model-generator invoked"]
        A --> B{Preconditions Met?}
        B -->|No| B1["❌ Error: Missing markers or directories"]
        B -->|Yes| C["Stage 1: Analyze Repository"]
    end

    subgraph Stage1["📊 STAGE 1: REPOSITORY ANALYSIS"]
        C --> D["analyze_repo.mjs"]
        D --> D1["Read materials.ts"]
        D --> D2["Read index.ts markers"]
        D --> D3["Parse existing models"]
        D1 & D2 & D3 --> D4["Extract version info"]
        D4 --> D5["Write repo_context.json"]
        D5 --> D6["Write result.json"]
    end

    subgraph Stage2["🎯 STAGE 2: DATA FETCH (Conditional)"]
        D6 --> E{Model Type?}
        E -->|Enemy| F["fetch_enemy.mjs"]
        E -->|Player| G["fetch_player.mjs"]
        E -->|Generic| H["Skip to Stage 3"]

        F --> F1["GET /api/bestiary/creature/{id}"]
        F1 --> F2["Write enemy_data.json"]

        G --> G1["GET /api/character-guide"]
        G1 --> G2["Write player_data.json"]

        F2 & G2 --> H
    end

    subgraph Stage3["✨ STAGE 3: MODEL GENERATION"]
        H --> I["Claude creates TypeScript file"]
        I --> I1["Use template: model.ts.tpl"]
        I1 --> I2["Apply design guidelines"]
        I2 --> I3["Write web/src/models/{name}.ts"]
    end

    subgraph Stage4["⚙️ STAGE 4: REGISTRATION & VALIDATION"]
        I3 --> J["run.sh orchestration"]
        J --> J1["register_model.mjs"]
        J1 --> J2["Update index.ts imports"]
        J1 --> J3["Update index.ts exports"]
        J1 --> J4["Update index.ts library"]
        J2 & J3 & J4 --> J5["validate_tsc.mjs"]
        J5 --> K{TypeScript OK?}
        K -->|No| K1["❌ Error: Fix and retry"]
        K1 -.->|User fixes| I
        K -->|Yes| L["✅ Write result.json success"]
    end

    subgraph Stage5["📋 STAGE 5: REPORT"]
        L --> M["Summarize to user"]
        M --> M1["Model ID, name, category"]
        M --> M2["Files changed"]
        M --> M3["Preview instructions"]
    end

    style Entry fill:#1a1a2e,stroke:#00d4ff
    style Stage1 fill:#1a1a2e,stroke:#22c55e
    style Stage2 fill:#1a1a2e,stroke:#eab308
    style Stage3 fill:#1a1a2e,stroke:#a855f7
    style Stage4 fill:#1a1a2e,stroke:#f97316
    style Stage5 fill:#1a1a2e,stroke:#3b82f6
`,

  decisionTreeModelType: `
flowchart TD
    A["User Request"] --> B{Creating Enemy Model?}
    B -->|Yes| C["Run fetch_enemy.mjs --enemy-id ID"]
    B -->|No| D{Creating Player Model?}

    C --> C1["Read appearance from enemy_data.json"]
    C1 --> C2["Create {enemy}.ts with enemyName field"]

    D -->|Yes| E["Run fetch_player.mjs --race R --class C"]
    D -->|No| F["Create generic {model}.ts"]

    E --> E1["Read appearance from player_data.json"]
    E1 --> E2["Create player-{r}-{c}.ts"]

    C2 --> G["Continue to Stage 3"]
    E2 --> G
    F --> G

    style A fill:#00d4ff,color:#000
    style C fill:#ef4444,color:#fff
    style E fill:#22c55e,color:#000
    style F fill:#3b82f6,color:#fff
`,

  decisionTreeVersion: `
flowchart TD
    A["Creating Model"] --> B{First time v1?}
    B -->|Yes| C["No version args needed"]
    C --> C1["run.sh --model-id goblin ..."]
    C1 --> C2["Defaults: v1, active=true"]

    B -->|No| D{New version v2+?}
    D -->|Option A| E["Auto-version recommended"]
    D -->|Option B| F["Manual version"]

    E --> E1["run.sh --auto-version --base-model-id goblin"]
    E1 --> E2["Detects existing version"]
    E2 --> E3["Increments to next version"]
    E3 --> E4["Marks old versions inactive"]

    F --> F1["run.sh --version 2 --is-active true --base-model-id goblin"]

    C2 --> G["Model Registered"]
    E4 --> G
    F1 --> G

    style A fill:#00d4ff,color:#000
    style C fill:#22c55e,color:#000
    style E fill:#a855f7,color:#fff
    style F fill:#eab308,color:#000
`,

  registrationLoop: `
flowchart TD
    subgraph MarkerUpdate["Marker Block Update Loop"]
        A["For each block: imports, exports, library"] --> B["Extract text between markers"]
        B --> C["Split into lines, filter empty"]
        C --> D["Create map: key → line"]
        D --> E["Add new line upsert"]
        E --> F["Sort map by key stable"]
        F --> G["Join back to block"]
        G --> H["Replace section in file"]
        H --> I{More blocks?}
        I -->|Yes| A
        I -->|No| J["Write index.ts"]
    end

    style A fill:#00d4ff,color:#000
    style J fill:#22c55e,color:#000
`,

  autoVersionLoop: `
flowchart TD
    A["--auto-version flag set?"] --> B{Yes}
    A --> C{No}

    B --> D["Load repo_context.json"]
    D --> E["Determine baseId"]
    E --> F["Lookup baseId in versionInfo"]
    F --> G{Found existing?}

    G -->|Yes| H["oldVersion = highestVersion"]
    H --> I["newVersion = old + 1"]
    I --> J["For each existing entry with same baseId"]
    J --> K["If version < new: set isActive = false"]
    K --> L["Return newVersion"]

    G -->|No| M["Set version = 1"]
    M --> L

    C --> N["Use explicit version args"]
    N --> L

    style A fill:#00d4ff,color:#000
    style L fill:#22c55e,color:#000
`,

  fileOperations: `
flowchart LR
    subgraph Reads["📖 READS"]
        R1["config.json"]
        R2["materials.ts"]
        R3["index.ts"]
        R4["*.ts model files"]
        R5["repo_context.json"]
        R6["enemy_data.json"]
        R7["player_data.json"]
    end

    subgraph Writes["✍️ WRITES"]
        W1["repo_context.json"]
        W2["result.json"]
        W3["enemy_data.json"]
        W4["player_data.json"]
        W5["bestiary_summary.json"]
        W6["character_guide_summary.json"]
        W7["index.ts markers"]
        W8["log.txt"]
    end

    subgraph Network["🌐 NETWORK"]
        N1["GET /api/bestiary"]
        N2["GET /api/bestiary/creature/{id}"]
        N3["GET /api/character-guide"]
        N4["GET /api/character-guide/races/{id}"]
        N5["GET /api/character-guide/classes/{id}"]
        N6["GET /api/character-guide/combinations/{r}/{c}"]
    end

    subgraph Spawns["⚡ SPAWNS"]
        S1["tsc --noEmit"]
        S2["npm ci/install"]
    end

    style Reads fill:#22c55e,color:#000
    style Writes fill:#f97316,color:#000
    style Network fill:#3b82f6,color:#fff
    style Spawns fill:#a855f7,color:#fff
`,

  errorHandling: `
flowchart TD
    subgraph Errors["⚠️ ERROR HANDLING PATHS"]
        E1["Missing required args"] --> E1R["Exit 2: Usage message"]
        E2["Enemy not found 404"] --> E2R["Exit 1: Run --list"]
        E3["Model file syntax error"] --> E3R["Fix TypeScript, retry"]
        E4["Marker blocks missing"] --> E4R["Add markers to index.ts first"]
        E5["TypeScript compilation errors"] --> E5R["Parse errors, write to result.json"]
        E6["Network errors"] --> E6R["Propagate to caller"]
        E7["File read failures"] --> E7R["Skip model non-fatal"]
    end

    subgraph Recovery["🔄 RECOVERY LOOPS"]
        R1["User fixes TypeScript"] --> R2["Re-run registration"]
        R2 --> R3["Validate again"]
        R3 --> R4{Pass?}
        R4 -->|No| R1
        R4 -->|Yes| R5["Success"]
    end

    style Errors fill:#ef4444,color:#fff
    style Recovery fill:#22c55e,color:#000
`,

  toolChain: `
flowchart LR
    subgraph Tools["🔧 TOOL CHAIN"]
        direction TB
        T1["run.sh"] --> T2["analyze_repo.mjs"]
        T2 --> T3["fetch_enemy.mjs OR fetch_player.mjs"]
        T3 --> T4["Claude generates model.ts"]
        T4 --> T5["register_model.mjs"]
        T5 --> T6["validate_tsc.mjs"]
    end

    subgraph Outputs["📁 OUTPUT FILES"]
        O1["repo_context.json"]
        O2["enemy_data.json / player_data.json"]
        O3["web/src/models/{name}.ts"]
        O4["web/src/models/index.ts"]
        O5["result.json"]
    end

    T2 --> O1
    T3 --> O2
    T4 --> O3
    T5 --> O4
    T6 --> O5

    style Tools fill:#1a1a2e,stroke:#00d4ff
    style Outputs fill:#1a1a2e,stroke:#22c55e
`,
};

// Skill metadata
const SKILL_INFO = {
  name: 'model-generator',
  version: '2.0',
  description: 'Generate procedural Three.js 3D models via TypeScript, then deterministically register them in web/src/models/index.ts and validate compilation using bundled tools.',
  location: '.claude/skills/model-generator/',
  tools: [
    { name: 'run.sh', purpose: 'Main orchestration script' },
    { name: 'analyze_repo.mjs', purpose: 'Extract materials, models, versions from codebase' },
    { name: 'fetch_enemy.mjs', purpose: 'Fetch canonical enemy data from API' },
    { name: 'fetch_player.mjs', purpose: 'Fetch canonical player data from API' },
    { name: 'register_model.mjs', purpose: 'Update index.ts with imports/exports/library' },
    { name: 'validate_tsc.mjs', purpose: 'Run TypeScript compiler for validation' },
  ],
  stages: [
    { num: 1, name: 'Repository Analysis', color: '#22c55e' },
    { num: 2, name: 'Data Fetch (Conditional)', color: '#eab308' },
    { num: 3, name: 'Model Generation', color: '#a855f7' },
    { num: 4, name: 'Registration & Validation', color: '#f97316' },
    { num: 5, name: 'Report Results', color: '#3b82f6' },
  ],
};

type TabType = 'overview' | 'workflow' | 'decisions' | 'loops' | 'files' | 'errors';

export function ClaudeSkills() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedDiagram, setExpandedDiagram] = useState<string | null>(null);

  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  const setActiveTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  const [showCode, setShowCode] = useState<Record<string, boolean>>({});

  const toggleShowCode = (id: string) => {
    setShowCode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMermaidDiagram = (id: string, code: string, title: string) => {
    const isExpanded = expandedDiagram === id;
    const isShowingCode = showCode[id] || false;

    return (
      <div className={`diagram-container ${isExpanded ? 'expanded' : ''}`} key={id}>
        <div className="diagram-header">
          <h3 className="diagram-title">{title}</h3>
          <div className="diagram-controls">
            <button
              className={`code-toggle-btn ${isShowingCode ? 'active' : ''}`}
              onClick={() => toggleShowCode(id)}
              title={isShowingCode ? 'Show diagram' : 'Show code'}
            >
              {isShowingCode ? '📊 Diagram' : '</> Code'}
            </button>
            <button
              className="expand-btn"
              onClick={() => setExpandedDiagram(isExpanded ? null : id)}
            >
              {isExpanded ? '⊖ Collapse' : '⊕ Expand'}
            </button>
          </div>
        </div>
        <div className="diagram-content">
          {isShowingCode ? (
            <>
              <pre className="mermaid-code">{code.trim()}</pre>
              <div className="diagram-note">
                Copy this Mermaid code to use in other tools or documentation
              </div>
            </>
          ) : (
            <div className="diagram-render-area">
              <MermaidDiagram chart={code} id={id} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 15, speed: 'slow', opacity: 0.15 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="skills-page">
        {/* Header */}
        <section className="skills-hero">
          <PhosphorHeader
            title="CLAUDE SKILLS"
            subtitle="Workflow documentation and decision matrices"
            style="dramatic"
            delay={100}
          />
          <p className="hero-tagline">
            Visual documentation of Claude Code skills used in this project.
            Explore the complete workflow diagrams, decision trees, and logical paths.
          </p>
        </section>

        {/* Skill Selector */}
        <div className="skill-selector">
          <div className="skill-card active">
            <div className="skill-icon">🎨</div>
            <div className="skill-info">
              <h3>{SKILL_INFO.name}</h3>
              <p>{SKILL_INFO.description}</p>
            </div>
            <div className="skill-version">v{SKILL_INFO.version}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="skills-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
            onClick={() => setActiveTab('workflow')}
          >
            Master Workflow
          </button>
          <button
            className={`tab-btn ${activeTab === 'decisions' ? 'active' : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            Decision Trees
          </button>
          <button
            className={`tab-btn ${activeTab === 'loops' ? 'active' : ''}`}
            onClick={() => setActiveTab('loops')}
          >
            Loops
          </button>
          <button
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            File Operations
          </button>
          <button
            className={`tab-btn ${activeTab === 'errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            Error Handling
          </button>
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Stage Pipeline */}
              <section className="stages-section">
                <h2>Execution Stages</h2>
                <div className="stages-pipeline">
                  {SKILL_INFO.stages.map((stage, idx) => (
                    <div key={stage.num} className="stage-item">
                      <div
                        className="stage-number"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.num}
                      </div>
                      <div className="stage-name">{stage.name}</div>
                      {idx < SKILL_INFO.stages.length - 1 && (
                        <div className="stage-arrow">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Tools Grid */}
              <section className="tools-section">
                <h2>Tools & Scripts</h2>
                <div className="tools-grid">
                  {SKILL_INFO.tools.map((tool) => (
                    <div key={tool.name} className="tool-card">
                      <code className="tool-name">{tool.name}</code>
                      <p className="tool-purpose">{tool.purpose}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Reference */}
              <section className="quick-ref-section">
                <h2>Quick Reference</h2>
                <div className="quick-ref-grid">
                  <div className="ref-card">
                    <h4>Fresh Model (v1)</h4>
                    <pre className="ref-code">{`# 1. Fetch enemy data (if enemy model)
node fetch_enemy.mjs --enemy-id goblin

# 2. Create model file
# User writes web/src/models/goblin.ts

# 3. Register
run.sh --model-id goblin \\
  --model-file web/src/models/goblin.ts \\
  --factory createGoblin \\
  --meta GOBLIN_META`}</pre>
                  </div>
                  <div className="ref-card">
                    <h4>New Version (v2+)</h4>
                    <pre className="ref-code">{`# 1. Create new version file
# User writes web/src/models/goblinV2.ts

# 2. Register with auto-version
run.sh --model-id goblin-v2 \\
  --model-file web/src/models/goblinV2.ts \\
  --factory createGoblinV2 \\
  --meta GOBLIN_V2_META \\
  --auto-version \\
  --base-model-id goblin`}</pre>
                  </div>
                </div>
              </section>

              {/* Tool Chain Diagram */}
              {renderMermaidDiagram('toolchain', DIAGRAMS.toolChain, 'Tool Chain Overview')}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="workflow-tab">
              <div className="workflow-intro">
                <p>
                  The master workflow shows the complete execution path from skill invocation
                  through all 5 stages to final reporting. Each stage is color-coded and shows
                  the key operations, decision points, and data flow.
                </p>
              </div>
              {renderMermaidDiagram('master', DIAGRAMS.masterWorkflow, 'Complete Execution Flow')}

              <div className="workflow-stages">
                <h2>Stage Breakdown</h2>

                <div className="stage-detail">
                  <div className="stage-badge" style={{ backgroundColor: '#22c55e' }}>1</div>
                  <div className="stage-content">
                    <h3>Repository Analysis</h3>
                    <p>Scans the codebase to extract material presets, existing models, and version information.</p>
                    <ul>
                      <li>Reads <code>materials.ts</code> for 28 material presets</li>
                      <li>Parses <code>index.ts</code> marker blocks</li>
                      <li>Extracts model metadata and version tracking</li>
                      <li>Outputs <code>repo_context.json</code></li>
                    </ul>
                  </div>
                </div>

                <div className="stage-detail">
                  <div className="stage-badge" style={{ backgroundColor: '#eab308' }}>2</div>
                  <div className="stage-content">
                    <h3>Data Fetch (Conditional)</h3>
                    <p>Fetches canonical data from the API based on model type.</p>
                    <ul>
                      <li>Enemy models: GET <code>/api/bestiary/creature/{'{id}'}</code></li>
                      <li>Player models: GET <code>/api/character-guide</code> endpoints</li>
                      <li>Generic models: Skip this stage</li>
                    </ul>
                  </div>
                </div>

                <div className="stage-detail">
                  <div className="stage-badge" style={{ backgroundColor: '#a855f7' }}>3</div>
                  <div className="stage-content">
                    <h3>Model Generation</h3>
                    <p>Claude creates the TypeScript model file using design guidelines.</p>
                    <ul>
                      <li>Uses template: <code>model.ts.tpl</code></li>
                      <li>Prefer BoxGeometry over complex primitives</li>
                      <li>Performance budgets: Simple &lt;500, Medium &lt;1500, Detailed &lt;3000 triangles</li>
                      <li>Enemy models must include <code>enemyName</code> field</li>
                    </ul>
                  </div>
                </div>

                <div className="stage-detail">
                  <div className="stage-badge" style={{ backgroundColor: '#f97316' }}>4</div>
                  <div className="stage-content">
                    <h3>Registration & Validation</h3>
                    <p>Deterministically updates index.ts and validates TypeScript compilation.</p>
                    <ul>
                      <li>Updates imports, exports, and library blocks</li>
                      <li>Handles version auto-detection and old version archival</li>
                      <li>Runs <code>tsc --noEmit</code> for validation</li>
                      <li>Loops until compilation passes</li>
                    </ul>
                  </div>
                </div>

                <div className="stage-detail">
                  <div className="stage-badge" style={{ backgroundColor: '#3b82f6' }}>5</div>
                  <div className="stage-content">
                    <h3>Report Results</h3>
                    <p>Summarizes the outcome to the user.</p>
                    <ul>
                      <li>Model ID, name, and category</li>
                      <li>Files created/changed</li>
                      <li>Version information</li>
                      <li>Preview instructions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'decisions' && (
            <div className="decisions-tab">
              <div className="decisions-intro">
                <p>
                  Decision trees show the branching logic at key points in the workflow.
                  These determine which paths are taken based on model type, versioning needs, and error states.
                </p>
              </div>

              {renderMermaidDiagram('modeltype', DIAGRAMS.decisionTreeModelType, 'Decision Tree: Model Type Selection')}

              <div className="decision-explanation">
                <h3>Model Type Selection</h3>
                <p>
                  The first major decision point determines what kind of model is being created.
                  This affects which data fetch tool is used and what fields are required in the output.
                </p>
                <table className="decision-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Data Source</th>
                      <th>Required Field</th>
                      <th>File Pattern</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Enemy</td>
                      <td><code>fetch_enemy.mjs</code></td>
                      <td><code>enemyName</code></td>
                      <td><code>{'{enemy}'}.ts</code></td>
                    </tr>
                    <tr>
                      <td>Player</td>
                      <td><code>fetch_player.mjs</code></td>
                      <td>Race + Class colors</td>
                      <td><code>player-{'{race}'}-{'{class}'}.ts</code></td>
                    </tr>
                    <tr>
                      <td>Generic</td>
                      <td>None</td>
                      <td>—</td>
                      <td><code>{'{model}'}.ts</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {renderMermaidDiagram('version', DIAGRAMS.decisionTreeVersion, 'Decision Tree: Version Handling')}

              <div className="decision-explanation">
                <h3>Version Handling</h3>
                <p>
                  The version decision tree determines how model versions are managed.
                  Auto-version is recommended as it automatically detects existing versions
                  and archives old ones.
                </p>
                <div className="version-comparison">
                  <div className="version-option">
                    <h4>Auto-version (Recommended)</h4>
                    <ul>
                      <li>Detects existing model versions</li>
                      <li>Automatically increments version number</li>
                      <li>Marks old versions as inactive</li>
                      <li>Prevents version conflicts</li>
                    </ul>
                  </div>
                  <div className="version-option">
                    <h4>Manual Version</h4>
                    <ul>
                      <li>Full control over version numbers</li>
                      <li>Must manage active/inactive states</li>
                      <li>Risk of version conflicts</li>
                      <li>Use for special cases only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loops' && (
            <div className="loops-tab">
              <div className="loops-intro">
                <p>
                  Loops represent iterative processes within the workflow. Understanding these
                  helps predict behavior when processing multiple items or recovering from errors.
                </p>
              </div>

              {renderMermaidDiagram('regloop', DIAGRAMS.registrationLoop, 'Registration Loop: Marker Block Updates')}

              <div className="loop-explanation">
                <h3>Marker Block Update Loop</h3>
                <p>
                  This loop processes each marker block (imports, exports, library) in index.ts.
                  It uses an upsert pattern with stable sorting to ensure deterministic output.
                </p>
                <div className="loop-steps">
                  <div className="loop-step">
                    <span className="step-num">1</span>
                    <span className="step-text">Extract text between markers</span>
                  </div>
                  <div className="loop-step">
                    <span className="step-num">2</span>
                    <span className="step-text">Split into lines, filter empty</span>
                  </div>
                  <div className="loop-step">
                    <span className="step-num">3</span>
                    <span className="step-text">Create map: key → line (dedupe)</span>
                  </div>
                  <div className="loop-step">
                    <span className="step-num">4</span>
                    <span className="step-text">Upsert new line</span>
                  </div>
                  <div className="loop-step">
                    <span className="step-num">5</span>
                    <span className="step-text">Sort by key (stable)</span>
                  </div>
                  <div className="loop-step">
                    <span className="step-num">6</span>
                    <span className="step-text">Join and replace section</span>
                  </div>
                </div>
              </div>

              {renderMermaidDiagram('autoversion', DIAGRAMS.autoVersionLoop, 'Auto-Version Detection Loop')}

              <div className="loop-explanation">
                <h3>Auto-Version Detection</h3>
                <p>
                  When auto-version is enabled, this logic determines the next version number
                  and handles archival of previous versions.
                </p>
                <table className="loop-table">
                  <thead>
                    <tr>
                      <th>Condition</th>
                      <th>Action</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>No existing model</td>
                      <td>Set version = 1</td>
                      <td>New v1 model, active</td>
                    </tr>
                    <tr>
                      <td>Existing v1 found</td>
                      <td>Increment to v2, archive v1</td>
                      <td>New v2 active, v1 inactive</td>
                    </tr>
                    <tr>
                      <td>Existing v1, v2 found</td>
                      <td>Increment to v3, archive v1, v2</td>
                      <td>New v3 active, others inactive</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="files-tab">
              <div className="files-intro">
                <p>
                  Complete mapping of all file operations performed by the skill,
                  including reads, writes, network calls, and process spawns.
                </p>
              </div>

              {renderMermaidDiagram('fileops', DIAGRAMS.fileOperations, 'File Operations Overview')}

              <div className="file-tables">
                <section className="file-section">
                  <h3>📖 Read Operations</h3>
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Purpose</th>
                        <th>Tool</th>
                        <th>Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><code>config.json</code></td><td>Paths configuration</td><td>all</td><td>1-5</td></tr>
                      <tr><td><code>materials.ts</code></td><td>Material preset extraction</td><td>analyze_repo</td><td>1</td></tr>
                      <tr><td><code>index.ts</code></td><td>Model registry, markers</td><td>analyze_repo, register_model</td><td>1, 4</td></tr>
                      <tr><td><code>*.ts model files</code></td><td>Extract enemyName fields</td><td>analyze_repo</td><td>1</td></tr>
                      <tr><td><code>repo_context.json</code></td><td>Version auto-detection</td><td>register_model</td><td>4</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="file-section">
                  <h3>✍️ Write Operations</h3>
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Content</th>
                        <th>Tool</th>
                        <th>Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><code>repo_context.json</code></td><td>Materials, models, versions</td><td>analyze_repo</td><td>1</td></tr>
                      <tr><td><code>result.json</code></td><td>Status, errors, metadata</td><td>all tools</td><td>1-4</td></tr>
                      <tr><td><code>enemy_data.json</code></td><td>Canonical enemy data</td><td>fetch_enemy</td><td>2</td></tr>
                      <tr><td><code>player_data.json</code></td><td>Canonical player data</td><td>fetch_player</td><td>2</td></tr>
                      <tr><td><code>index.ts</code></td><td>Updated markers</td><td>register_model</td><td>4</td></tr>
                      <tr><td><code>log.txt</code></td><td>All command output</td><td>run.sh</td><td>4</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="file-section">
                  <h3>🌐 Network Calls</h3>
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Method</th>
                        <th>Stage</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><code>/api/bestiary</code></td><td>GET</td><td>2</td><td>List all enemies</td></tr>
                      <tr><td><code>/api/bestiary/creature/{'{id}'}</code></td><td>GET</td><td>2</td><td>Fetch specific enemy</td></tr>
                      <tr><td><code>/api/character-guide</code></td><td>GET</td><td>2</td><td>List races/classes</td></tr>
                      <tr><td><code>/api/character-guide/races/{'{id}'}</code></td><td>GET</td><td>2</td><td>Fetch race data</td></tr>
                      <tr><td><code>/api/character-guide/classes/{'{id}'}</code></td><td>GET</td><td>2</td><td>Fetch class data</td></tr>
                      <tr><td><code>/api/character-guide/combinations/{'{r}'}/{'{c}'}</code></td><td>GET</td><td>2</td><td>Fetch combination</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="file-section">
                  <h3>⚡ Process Spawns</h3>
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>Process</th>
                        <th>Arguments</th>
                        <th>Stage</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><code>tsc</code></td><td>--noEmit --pretty false</td><td>4</td><td>TypeScript validation</td></tr>
                      <tr><td><code>npm</code></td><td>ci --silent</td><td>4</td><td>Install tool dependencies</td></tr>
                    </tbody>
                  </table>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="errors-tab">
              <div className="errors-intro">
                <p>
                  Error handling paths and recovery mechanisms. Understanding these helps
                  diagnose issues and know what to fix when things go wrong.
                </p>
              </div>

              {renderMermaidDiagram('errorhandling', DIAGRAMS.errorHandling, 'Error Handling & Recovery Paths')}

              <div className="error-catalog">
                <h3>Error Catalog</h3>

                <div className="error-card error-critical">
                  <div className="error-header">
                    <span className="error-code">Exit 2</span>
                    <span className="error-title">Missing Required Arguments</span>
                  </div>
                  <div className="error-body">
                    <p><strong>Cause:</strong> run.sh called without required --model-id, --model-file, --factory, or --meta</p>
                    <p><strong>Recovery:</strong> Add the missing arguments and retry</p>
                    <pre className="error-example">Usage: run.sh --model-id &lt;id&gt; --model-file &lt;path&gt; --factory &lt;fn&gt; --meta &lt;META&gt;</pre>
                  </div>
                </div>

                <div className="error-card error-high">
                  <div className="error-header">
                    <span className="error-code">Exit 1</span>
                    <span className="error-title">Enemy Not Found</span>
                  </div>
                  <div className="error-body">
                    <p><strong>Cause:</strong> fetch_enemy.mjs called with non-existent enemy ID</p>
                    <p><strong>Recovery:</strong> Run with --list to see available enemies</p>
                    <pre className="error-example">node fetch_enemy.mjs --list</pre>
                  </div>
                </div>

                <div className="error-card error-high">
                  <div className="error-header">
                    <span className="error-code">TS Error</span>
                    <span className="error-title">TypeScript Compilation Failed</span>
                  </div>
                  <div className="error-body">
                    <p><strong>Cause:</strong> Model file has syntax errors or type mismatches</p>
                    <p><strong>Recovery:</strong> Fix the TypeScript errors and re-run registration</p>
                    <pre className="error-example">web/src/models/goblin.ts(42,15): TS2345: Argument of type 'string' not assignable...</pre>
                  </div>
                </div>

                <div className="error-card error-medium">
                  <div className="error-header">
                    <span className="error-code">Marker Error</span>
                    <span className="error-title">Missing Marker Blocks</span>
                  </div>
                  <div className="error-body">
                    <p><strong>Cause:</strong> index.ts missing required marker comments</p>
                    <p><strong>Recovery:</strong> Add the three marker blocks to index.ts</p>
                    <pre className="error-example">{`// @model-generator:imports:start
// @model-generator:imports:end
// @model-generator:exports:start
// @model-generator:exports:end
// @model-generator:library:start
// @model-generator:library:end`}</pre>
                  </div>
                </div>

                <div className="error-card error-low">
                  <div className="error-header">
                    <span className="error-code">Warning</span>
                    <span className="error-title">File Read Failure</span>
                  </div>
                  <div className="error-body">
                    <p><strong>Cause:</strong> Model file couldn't be read during analysis</p>
                    <p><strong>Recovery:</strong> Non-fatal, model is skipped. Check file permissions.</p>
                  </div>
                </div>
              </div>

              <div className="safety-section">
                <h3>Safety Guardrails</h3>
                <ul className="safety-list">
                  <li><strong>Marker validation:</strong> Won't edit index.ts if markers are missing</li>
                  <li><strong>Deduplication:</strong> Upsert by key prevents duplicate imports/exports</li>
                  <li><strong>Stable sorting:</strong> Deterministic output prevents spurious diffs</li>
                  <li><strong>No force writes:</strong> Only modifies content between markers</li>
                  <li><strong>TypeScript validation:</strong> Compilation errors caught before commit</li>
                  <li><strong>Graceful API failures:</strong> 404s handled, non-fatal file read failures</li>
                  <li><strong>Version safety:</strong> --auto-version prevents conflicts</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="skills-legend">
          <h4 className="legend-title">Diagram Legend</h4>
          <div className="legend-content">
            <div className="legend-group">
              <h5>Stage Colors</h5>
              <div className="legend-items">
                {SKILL_INFO.stages.map((stage) => (
                  <div key={stage.num} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: stage.color }} />
                    <span className="legend-label">Stage {stage.num}: {stage.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="legend-group">
              <h5>Node Types</h5>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-shape shape-rect" />
                  <span className="legend-label">Process / Action</span>
                </div>
                <div className="legend-item">
                  <div className="legend-shape shape-diamond" />
                  <span className="legend-label">Decision Point</span>
                </div>
                <div className="legend-item">
                  <div className="legend-shape shape-stadium" />
                  <span className="legend-label">Terminal State</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AtmosphericPage>
  );
}
