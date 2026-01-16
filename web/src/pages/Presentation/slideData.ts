/**
 * Presentation slide content data
 */
import type { Slide } from './types';

export const SLIDES: Slide[] = [
  {
    id: 'title',
    type: 'title',
    content: {
      title: 'Building a Full Game with AI',
      subtitle: 'A Solo Developer Case Study',
      author: 'Blixa Markham a.k.a. DataSci4Fun',
      meta: 'AI Usage & Side Projects • Jan 17, 2026',
    },
  },
  {
    id: 'basics',
    type: 'basics',
    content: {
      section: '1. Basics',
      name: 'Solo Developer',
      role: 'Full-Stack Development + Game Design',
      stack: 'React, TypeScript, Three.js, Python, FastAPI, PostgreSQL, Redis',
      project: 'Roguelike Dungeon Crawler — Browser-based game with 112k+ lines of code',
    },
  },
  {
    id: 'tools',
    type: 'checklist',
    content: {
      section: '2. AI Usage Summary',
      title: 'Tools Used',
      items: [
        { label: 'Claude (Opus 4.5)', checked: true, note: 'Primary — architecture, code, debugging' },
        { label: 'ChatGPT (5.2)', checked: true, note: 'Creative — lore, writing, design' },
        { label: 'Suno v4.5', checked: true, note: 'All 16 music tracks' },
        { label: 'DALL-E 3', checked: true, note: 'Tileset generation' },
      ],
    },
  },
  {
    id: 'access',
    type: 'checklist',
    content: {
      section: '2. AI Usage Summary',
      title: 'Access Methods',
      items: [
        { label: 'Claude Code CLI', checked: true, note: 'Primary development interface' },
        { label: 'Browser Chat', checked: true, note: 'Design discussions, lore writing' },
        { label: 'VS Code Integration', checked: false },
        { label: 'API / Scripts', checked: false },
      ],
    },
  },
  {
    id: 'frequency',
    type: 'highlight',
    content: {
      section: '2. AI Usage Summary',
      title: 'Frequency',
      value: 'Daily',
      subtitle: 'Multiple sessions per day over 2.5 weeks',
      details: [
        'Intensive development sprint (Dec 30 - Jan 16)',
        'Multiple Claude Code sessions daily',
        'Continuous iteration and refinement',
        '76 pull requests merged, 640+ commits',
      ],
    },
  },
  {
    id: 'usecase1',
    type: 'usecase',
    content: {
      section: '3. Top Use Cases',
      number: 1,
      title: 'Three.js 3D Battle System',
      task: 'Build a real-time 3D battle renderer with animated sprites, particle effects, and camera transitions',
      tool: 'Claude Opus 4.5 via Claude Code CLI',
      asked: 'Design and implement a complete Three.js battle system with sprite-based characters, damage numbers, ability effects, and smooth camera movement',
      shipped: 'Full BattleRenderer3D component with procedural animations, eased transitions, and biome-specific lighting',
      fixed: 'Initial sprite scaling was off, camera lerping was too aggressive — refined through 3-4 iterations',
      verified: 'Manual visual testing, gameplay integration testing, performance profiling',
      impact: 'Would have taken weeks to build manually — completed in 2 days with AI assistance',
    },
  },
  {
    id: 'usecase2',
    type: 'usecase',
    content: {
      section: '3. Top Use Cases',
      number: 2,
      title: 'Cinematic Cutscene Engine',
      task: 'Create a full cutscene system with timed panels, particle effects, parallax backgrounds, and phosphor text reveals',
      tool: 'Claude Opus 4.5 via Claude Code CLI',
      asked: 'Build a declarative cutscene engine that can render death/victory cinematics with lore-accurate content',
      shipped: 'Complete CutscenePlayer with 6 layer types, timing system, and procedural sound effects',
      fixed: 'Particle performance issues, timing synchronization bugs — iteratively debugged',
      verified: 'Visual review of all cutscene variants, cross-browser testing',
      impact: 'Added significant production value — feature that would typically require a dedicated designer',
    },
  },
  {
    id: 'usecase3',
    type: 'usecase',
    content: {
      section: '3. Top Use Cases',
      number: 3,
      title: 'Original Lore & World-Building',
      task: 'Create a cohesive fantasy world with deep lore, unique mythology, and interconnected story elements across 8 dungeon floors',
      tool: 'ChatGPT 5.2 via browser chat',
      asked: 'Develop the Skyfall Seed mythology — an eldritch entity that rewrites reality, 8 Wardens guarding aspects of existence, and a world where memories are being erased',
      shipped: '32 lore entries, 8 floor themes with unique aspects (Memory, Circulation, Growth, Legitimacy, Stasis, Cognition, Transformation, Integration), 6 ending variants, boss backstories, and environmental storytelling',
      fixed: 'Initial lore was too generic fantasy — iterated to create the "Field" concept and reality-editing horror theme',
      verified: 'Consistency checks across all lore entries, integration with gameplay mechanics',
      impact: 'Months of creative writing condensed into days — coherent world-building that elevates the entire game',
    },
  },
  {
    id: 'workflow-before',
    type: 'comparison',
    content: {
      section: '4. Workflow Change',
      title: 'Before AI',
      items: [
        'Google + Stack Overflow for every question',
        'Copy-paste snippets, adapt manually',
        'Scaffolding takes days',
        'Limited to familiar patterns',
        'Constant context-switching',
      ],
      sentiment: 'slow',
    },
  },
  {
    id: 'workflow-after',
    type: 'comparison',
    content: {
      section: '4. Workflow Change',
      title: 'After AI',
      items: [
        'Describe intent, get working implementation',
        'AI maintains full project context',
        'Scaffolding in hours, not days',
        'Explore unfamiliar tech confidently',
        'Stay in flow state longer',
      ],
      sentiment: 'fast',
    },
  },
  {
    id: 'workflow-summary',
    type: 'twoColumn',
    content: {
      section: '4. Workflow Change',
      title: 'Summary',
      left: {
        label: 'Biggest Improvement',
        text: 'Velocity without sacrificing quality. One person can ship what used to require a team.',
      },
      right: {
        label: 'Biggest Risk',
        text: 'Over-reliance without understanding. Must review generated code, not just accept it.',
      },
    },
  },
  {
    id: 'sideproject',
    type: 'showcase',
    content: {
      section: '5. Side Project',
      title: 'Roguelike Dungeon Crawler',
      description: 'A complete browser-based roguelike game built entirely with AI assistance',
      stats: [
        { label: 'Lines of Code', value: '112,000+' },
        { label: 'Components', value: '115+' },
        { label: 'Development Time', value: '~2.5 weeks' },
        { label: 'Human Developers', value: '1' },
      ],
      aiHelped: [
        'Core game architecture (BSP dungeon generation, D&D combat system)',
        'Full React frontend with Three.js 3D rendering',
        'FastAPI backend with PostgreSQL, Redis, and WebSockets',
        'D&D dice mechanics with 3D animated dice HUD',
        'Cinematic cutscene engine with procedural SFX',
        '3D asset generation pipeline (TripoSR)',
        'All music and sound effects (Suno v4.5)',
        'Tileset art generation (DALL-E 3)',
        'Lore writing and world-building',
      ],
      lesson: 'AI excels when given clear direction and iterative feedback. The human provides vision and quality control; the AI provides execution speed.',
    },
  },
  {
    id: 'success',
    type: 'story',
    content: {
      section: '6. Wins & Limitations',
      type: 'success',
      title: 'Success Story',
      story: 'Needed to add WCAG accessibility compliance across the entire frontend. Described the issue (low contrast text), and AI systematically identified every problematic color value across 10+ CSS files, calculated proper contrast ratios, and fixed them — all in one session.',
      why: 'AI could hold the full context of what needed to change and apply it consistently everywhere.',
    },
  },
  {
    id: 'limitation',
    type: 'story',
    content: {
      section: '6. Wins & Limitations',
      type: 'warning',
      title: 'Limitation / Failure',
      story: 'Early in development, let AI generate a complex state machine without fully understanding it. Later bugs were hard to debug because I didn\'t own the mental model. Had to slow down and rebuild with understanding.',
      lesson: 'Don\'t let AI outpace your comprehension. You still need to understand what you\'re shipping.',
    },
  },
  {
    id: 'divergence',
    type: 'story',
    content: {
      section: '6. Key Insight',
      type: 'success',
      title: 'The Iterative Divergence Protocol',
      story: 'LLMs are biased toward their training data — ask any question and the first answers will be grounded in what\'s already known. To get truly original output, you must guide the AI step-by-step through logical refinement until it drifts away from conventional knowledge. Only then do you see novel ideas that don\'t exist in the public domain.',
      why: 'The Skyfall Seed lore started as generic fantasy. Through 10+ iterations of "make it weirder," "what if memories are the real target," and "connect this to the gameplay," we arrived at the Field concept — something that feels genuinely original.',
      lesson: 'In a world where everyone has AI access, competitive advantage comes from pushing models beyond their training distribution. First-response AI output is commodity. Iteratively divergent output is differentiation.',
    },
  },
  {
    id: 'displacement',
    type: 'story',
    content: {
      section: '6. Key Insight',
      type: 'success',
      title: 'Contextual Displacement',
      story: 'Deliberately saturating the AI\'s context window weakens its reliance on training data defaults. When attention must spread across rich, novel context, training priors get diluted. The AI\'s drive to be helpful causes it to prioritize your contextual signals over its defaults — creating a "local override" of conventional patterns.',
      why: 'ChatGPT was overloaded with lore fragments, thematic constraints, and "make it weirder" iterations until the Field concept emerged from beyond generic fantasy. Claude was overloaded with gameplay references from different genres and eras — roguelikes, JRPGs, survival horror, classic dungeon crawlers — producing mechanical combinations never shipped together in a production game.',
      lesson: 'Don\'t start fresh conversations unnecessarily. Long, context-rich sessions produce more tailored, original output than short, default-biased exchanges. Context saturation is a feature, not a limitation.',
    },
  },
  {
    id: 'self-improving',
    type: 'story',
    content: {
      section: '6. Key Insight',
      type: 'success',
      title: 'Self-Improving Analysis Loop',
      story: 'AI can bootstrap its own tools to production quality through recursive self-critique. Have AI generate code analysis recommendations, then ask it to analyze its own output for flaws — wrong information, missing context, false positives. It identifies issues, fixes the detection logic, regenerates, and repeats. Each iteration catches progressively subtler issues until quality plateaus.',
      why: 'Built a codebase health scanner that initially produced generic recommendations. Through 4 iterations of self-analysis, it learned to: detect Python Enums vs classes, recognize inheritance patterns, identify base+subclass relationships, count imports for impact assessment, and generate context-aware refactoring techniques. The final tool exceeded what manual development would achieve.',
      lesson: 'Traditional static analysis tools improve slowly through user bug reports. This pattern enables immediate feedback, comprehensive coverage, and rapid iteration — all in one session. The AI is both the tool and its own QA engineer. The ceiling isn\'t the initial implementation; it\'s how many iterations you run.',
    },
  },
  {
    id: 'synthesis-theory',
    type: 'story',
    content: {
      section: '6. Key Insight',
      type: 'success',
      title: 'AI as Synthesis Engine',
      story: 'AI can synthesize entirely new approaches that don\'t exist in its training data — but only when guided by domain expertise. The AI\'s training data provides building blocks; the user\'s expertise provides the architectural blueprint. Neither alone produces novelty. Together, they can create tools and patterns that have never been built before.',
      why: 'Code and programming are rule-based systems. If you can logically explain what you want — breaking down the problem into components that map to concepts the AI understands — it can generate working implementations of genuinely novel ideas. The constraint isn\'t the AI\'s capability; it\'s your ability to articulate the vision clearly enough for logical connections to form.',
      lesson: 'In a world where everyone has AI access, the differentiator is domain expertise + communication skill. First-response AI output is what the training data suggests. Expert-guided AI output is what\'s actually needed but doesn\'t exist yet.',
    },
  },
  {
    id: 'level-editor',
    type: 'usecase',
    content: {
      section: '6. Key Insight',
      number: 4,
      title: 'Zone Layout Designer — A Novel Tool',
      task: 'Build a level editor for a procedurally generated dungeon game',
      tool: 'Claude Opus 4.5 via Claude Code CLI',
      asked: 'Initially asked for a traditional level editor with manual tile/object placement',
      shipped: 'A rule-based Zone Layout Designer that generates Python code for the procedural generation pipeline. Users define placement rules (position strategy, count, rotation, scale) and export them as @register_layout functions.',
      fixed: 'AI defaulted to WYSIWYG editors (training data bias). Corrected by explaining: "These maps are procedurally generated — we need rules, not placements." AI then researched the existing generation system and synthesized a novel approach.',
      verified: 'Compared to existing tools: Houdini-style rules + code generation + zone-awareness = unique combination not found in any existing game dev tool.',
      impact: 'Created a tool that doesn\'t exist in the market — a visual DSL editor for dungeon generation rules. Demonstrates AI can synthesize genuinely new solutions when properly guided.',
    },
  },
  {
    id: 'expertise-requirement',
    type: 'twoColumn',
    content: {
      section: '6. Key Insight',
      title: 'The Expertise Requirement',
      left: {
        label: 'Why Expertise Matters',
        text: 'AI defaults to training data patterns. "Level editor" → manual placement tools. Without domain knowledge to recognize the mismatch, you get the wrong solution built correctly. Expertise enables course-correction.',
      },
      right: {
        label: 'The Collaboration Model',
        text: 'Human provides: vision, domain knowledge, quality judgment, course-correction. AI provides: implementation speed, pattern synthesis, technical breadth. Novel output emerges from the intersection.',
      },
    },
  },
  {
    id: 'recommendation-1',
    type: 'recommendation',
    content: {
      section: '6. Recommendations',
      title: 'Techniques That Work',
      items: [
        {
          tip: 'Apply Iterative Divergence',
          detail: 'Push past first answers: "Make it more unusual," "Invert this assumption," "Connect these unrelated concepts." Each iteration moves further from training defaults.',
        },
        {
          tip: 'Use Contextual Displacement',
          detail: 'Saturate the context with your project\'s patterns and examples. Rich context dilutes training priors and shapes AI responses to your domain.',
        },
        {
          tip: 'Orchestrate multiple AIs by strength',
          detail: 'Claude for architecture/code, ChatGPT for creative writing, Suno for music, DALL-E for visuals. Leverage each model\'s training biases as specializations.',
        },
        {
          tip: 'Use Self-Improving Loops',
          detail: 'Have AI critique its own output, fix the underlying logic, and regenerate. Recursive self-analysis produces tools that exceed manual development quality.',
        },
      ],
    },
  },
  {
    id: 'recommendation-2',
    type: 'recommendation',
    content: {
      section: '6. Recommendations',
      title: 'Process That Works',
      items: [
        {
          tip: 'Maintain creative direction',
          detail: 'AI amplifies your vision, it doesn\'t replace it. You decide what\'s good, what needs iteration, and when to push back. Human = creative director; AI = execution engine.',
        },
        {
          tip: 'Preserve session continuity',
          detail: 'Long sessions build contextual understanding. When starting fresh, front-load context by having AI read key files and prior decisions first.',
        },
      ],
    },
  },
  {
    id: 'summary',
    type: 'bullets',
    content: {
      section: '10. Jan 17 Share-out',
      title: 'Three Takeaways',
      bullets: [
        {
          label: 'What I Did',
          text: 'Built a complete 112k+ line game as a solo developer using 4 AI tools (Claude, ChatGPT, Suno, DALL-E) in 2.5 weeks — proving AI can produce production-quality results.',
        },
        {
          label: 'What I Learned',
          text: 'First-response AI output is commodity — everyone gets the same answers. Competitive advantage comes from the Iterative Divergence Protocol: pushing AI beyond its training distribution through guided refinement until you reach genuinely original territory.',
        },
        {
          label: 'What We Should Try',
          text: 'Give developers access to tools that can see full project context (like Claude Code). Chat-based snippets are 10x less effective than context-aware assistance.',
        },
      ],
    },
  },
  {
    id: 'workflow-claude',
    type: 'showcase',
    content: {
      section: '7. Claude Code Workflow',
      title: 'Session Continuity Architecture',
      description: 'A file-based system that enables instant context restoration across devices and sessions',
      stats: [
        { label: 'Context Restore', value: '<30s' },
        { label: 'Device Switches', value: 'Seamless' },
        { label: 'Session Files', value: '3' },
      ],
      aiHelped: [
        'CLAUDE.md — Project instructions, coding rules, environment setup (AI reads on every session start)',
        'STATE.md — Current progress, what changed, what\'s next, known bugs (updated end of each session)',
        'NEXT_SESSION.md — Handoff notes for complex multi-session work',
        'Plan files — Detailed implementation plans preserved between sessions',
      ],
      lesson: 'When switching devices or starting a new day, Claude reads these files and has full project context in seconds — no manual explanation needed. The files ARE the continuity.',
    },
  },
  {
    id: 'workflow-cicd',
    type: 'showcase',
    content: {
      section: '7. Claude Code Workflow',
      title: 'Integrated CI/CD Skills',
      description: 'Built-in slash commands that automate the development pipeline without leaving the conversation',
      stats: [
        { label: 'Skills Available', value: '5+' },
        { label: 'Manual Steps', value: '0' },
        { label: 'Pipeline Coverage', value: 'Full' },
      ],
      aiHelped: [
        '/ci-healthcheck — Run lint, typecheck, build, tests; verify git cleanliness before pushing',
        '/ci-add-github-actions — Generate CI workflow for the project stack (Node/Python)',
        '/ci-release-gate — Add release gates so tags only happen from clean, passing builds',
        '/project-resync — Sync with remote, resolve conflicts, handle unpushed changes',
        '/game-integrity — Custom skill: validate all game data consistency across floors',
      ],
      lesson: 'CI/CD becomes conversational. "Check if this is ready to push" runs the full validation pipeline. No context switching to terminals or dashboards — everything happens in the AI conversation.',
    },
  },
  {
    id: 'future',
    type: 'story',
    content: {
      section: '9. Implemented: 3D Pipeline',
      type: 'success',
      title: 'AI-Generated 3D Asset Pipeline',
      story: 'Built a complete Docker-based pipeline for automated 3D model generation using TripoSR. Concept art is uploaded via Asset Viewer, queued for processing, and the worker container generates GLB models automatically. 14 3D models already generated and integrated into the game.',
      lesson: 'AI 3D generation is production-ready today. The pipeline includes job queue management, progress monitoring, and seamless integration with the Three.js renderer. Solo developers can now generate custom 3D assets without traditional 3D artists or asset store purchases.',
    },
  },
  {
    id: 'demo',
    type: 'cta',
    content: {
      title: 'See It In Action',
      subtitle: 'Play the game. Read the code. Judge for yourself.',
      links: [
        { label: 'Play the Game', url: '/', internal: true },
        { label: 'View Source', url: 'https://github.com/datasci4fun/roguelike-dungeon-crawler' },
        { label: 'About Page', url: '/about', internal: true },
      ],
    },
  },
];
