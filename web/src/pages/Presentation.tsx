/**
 * Presentation Page - AI Usage Case Study
 *
 * A presentation-format page answering the AI Usage & Side Projects
 * questionnaire, designed for the Jan 17 share-out.
 */

import { useState, useEffect } from 'react';
import { AtmosphericPage } from '../components/AtmosphericPage';
import './Presentation.css';

// Type definitions for slide content
interface TitleContent {
  title: string;
  subtitle: string;
  meta: string;
}

interface BasicsContent {
  section: string;
  name: string;
  role: string;
  stack: string;
  project: string;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
  note?: string;
}

interface ChecklistContent {
  section: string;
  title: string;
  items: ChecklistItem[];
}

interface HighlightContent {
  section: string;
  title: string;
  value: string;
  subtitle: string;
  details: string[];
}

interface UsecaseContent {
  section: string;
  number: number;
  title: string;
  task: string;
  tool: string;
  asked: string;
  shipped: string;
  fixed: string;
  verified: string;
  impact: string;
}

interface ComparisonContent {
  section: string;
  title: string;
  items: string[];
  sentiment: 'slow' | 'fast';
}

interface TwoColumnContent {
  section: string;
  title: string;
  left: { label: string; text: string };
  right: { label: string; text: string };
}

interface ShowcaseStat {
  label: string;
  value: string;
}

interface ShowcaseContent {
  section: string;
  title: string;
  description: string;
  stats: ShowcaseStat[];
  aiHelped: string[];
  lesson: string;
}

interface StoryContent {
  section: string;
  type: 'success' | 'warning';
  title: string;
  story: string;
  why?: string;
  lesson?: string;
}

interface RecommendationItem {
  tip: string;
  detail: string;
}

interface RecommendationContent {
  section: string;
  title: string;
  items: RecommendationItem[];
}

interface BulletItem {
  label: string;
  text: string;
}

interface BulletsContent {
  section: string;
  title: string;
  bullets: BulletItem[];
}

interface CTALink {
  label: string;
  url: string;
  internal?: boolean;
}

interface CTAContent {
  title: string;
  subtitle: string;
  links: CTALink[];
}

type Slide =
  | { id: string; type: 'title'; content: TitleContent }
  | { id: string; type: 'basics'; content: BasicsContent }
  | { id: string; type: 'checklist'; content: ChecklistContent }
  | { id: string; type: 'highlight'; content: HighlightContent }
  | { id: string; type: 'usecase'; content: UsecaseContent }
  | { id: string; type: 'comparison'; content: ComparisonContent }
  | { id: string; type: 'twoColumn'; content: TwoColumnContent }
  | { id: string; type: 'showcase'; content: ShowcaseContent }
  | { id: string; type: 'story'; content: StoryContent }
  | { id: string; type: 'recommendation'; content: RecommendationContent }
  | { id: string; type: 'bullets'; content: BulletsContent }
  | { id: string; type: 'cta'; content: CTAContent };

// Slide data
const SLIDES: Slide[] = [
  {
    id: 'title',
    type: 'title',
    content: {
      title: 'Building a Full Game with AI',
      subtitle: 'A Solo Developer Case Study',
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
      stack: 'React, TypeScript, Three.js, Python, FastAPI, SQLite',
      project: 'Roguelike Dungeon Crawler — Browser-based game with 50k+ lines of code',
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
      subtitle: 'Multiple sessions per day over two weeks',
      details: [
        'Intensive development sprint (Dec 30 - Jan 12)',
        'Multiple Claude Code sessions daily',
        'Continuous iteration and refinement',
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
        { label: 'Lines of Code', value: '50,000+' },
        { label: 'Components', value: '80+' },
        { label: 'Development Time', value: '~2 weeks' },
        { label: 'Human Developers', value: '1' },
      ],
      aiHelped: [
        'Core game architecture (BSP dungeon generation, combat system)',
        'Full React frontend with Three.js 3D rendering',
        'FastAPI backend with JWT auth and WebSockets',
        'Cinematic cutscene engine with procedural SFX',
        'All 16 music tracks (Suno v4.5)',
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
    id: 'recommendation',
    type: 'recommendation',
    content: {
      section: '6. Recommendations',
      title: 'What Works',
      items: [
        {
          tip: 'Apply Iterative Divergence',
          detail: 'Push past first answers: "Make it more unusual," "Invert this assumption," "Connect these unrelated concepts." Each iteration moves further from training defaults toward originality.',
        },
        {
          tip: 'Use Contextual Displacement',
          detail: 'Saturate the context with your project\'s patterns, terminology, and examples. Rich context dilutes training priors and creates AI responses shaped by your domain, not generic defaults.',
        },
        {
          tip: 'Let AI see your codebase',
          detail: 'Tools like Claude Code that can read your files produce dramatically better results than copy-pasting snippets into chat.',
        },
      ],
    },
  },
  {
    id: 'summary',
    type: 'bullets',
    content: {
      section: '7. Jan 17 Share-out',
      title: 'Three Takeaways',
      bullets: [
        {
          label: 'What I Did',
          text: 'Built a complete 50k+ line game as a solo developer using 4 AI tools (Claude, ChatGPT, Suno, DALL-E) in just 2 weeks — proving AI can produce production-quality results.',
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
    id: 'future',
    type: 'story',
    content: {
      section: '8. Future Research',
      type: 'success',
      title: 'AI-Generated 3D Asset Pipeline',
      story: 'Current research is exploring a CLI-based workflow for automated 3D model generation. The goal: seed the game with actual 3D models instead of 2D sprites or unicode character representations on geometric shapes. This would create a fully automated asset pipeline from text prompt to in-game model.',
      why: 'The game currently uses Three.js with procedurally-generated geometry and 2D sprite overlays. A working 3D generation pipeline would eliminate the last major bottleneck in solo AI-assisted game development — the need for traditional 3D artists or asset store purchases.',
      lesson: 'As AI model generation matures (Meshy, Tripo, Rodin), integrating these tools into a CLI workflow could enable fully AI-generated games with production-quality 3D assets — no human artists required.',
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

export function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = SLIDES[currentSlide];

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 10, speed: 'slow', opacity: 0.1 }}
      crt={false}
    >
      <div className="presentation">
        {/* Progress bar */}
        <div className="presentation-progress">
          <div
            className="progress-fill"
            style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
          />
        </div>

        {/* Slide content */}
        <div className="slide-container">
          <SlideRenderer slide={slide} />
        </div>

        {/* Navigation */}
        <div className="presentation-nav">
          <button
            className="nav-btn"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            ← Previous
          </button>
          <div className="slide-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            className="nav-btn"
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
          >
            Next →
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="keyboard-hint">
          Use ← → arrow keys to navigate
        </div>
      </div>

      {/* Keyboard navigation */}
      <KeyboardNav
        onNext={nextSlide}
        onPrev={prevSlide}
      />
    </AtmosphericPage>
  );
}

// Keyboard navigation component
function KeyboardNav({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev]);

  return null;
}

// Slide renderer using discriminated union narrowing
function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.type) {
    case 'title': {
      const { content } = slide;
      return (
        <div className="slide slide-title">
          <h1>{content.title}</h1>
          <p className="subtitle">{content.subtitle}</p>
          <span className="meta">{content.meta}</span>
        </div>
      );
    }

    case 'basics': {
      const { content } = slide;
      return (
        <div className="slide slide-basics">
          <span className="section-label">{content.section}</span>
          <div className="basics-grid">
            <div className="basic-item">
              <span className="label">Role</span>
              <span className="value">{content.role}</span>
            </div>
            <div className="basic-item">
              <span className="label">Stack</span>
              <span className="value">{content.stack}</span>
            </div>
            <div className="basic-item full-width">
              <span className="label">Project</span>
              <span className="value highlight">{content.project}</span>
            </div>
          </div>
        </div>
      );
    }

    case 'checklist': {
      const { content } = slide;
      return (
        <div className="slide slide-checklist">
          <span className="section-label">{content.section}</span>
          <h2>{content.title}</h2>
          <div className="checklist">
            {content.items.map((item, i) => (
              <div key={i} className={`check-item ${item.checked ? 'checked' : ''}`}>
                <span className="checkbox">{item.checked ? '✓' : '○'}</span>
                <span className="check-label">{item.label}</span>
                {item.note && <span className="check-note">{item.note}</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'highlight': {
      const { content } = slide;
      return (
        <div className="slide slide-highlight">
          <span className="section-label">{content.section}</span>
          <h2>{content.title}</h2>
          <div className="highlight-value">{content.value}</div>
          <p className="highlight-subtitle">{content.subtitle}</p>
          <ul className="highlight-details">
            {content.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      );
    }

    case 'usecase': {
      const { content } = slide;
      return (
        <div className="slide slide-usecase">
          <span className="section-label">{content.section}</span>
          <div className="usecase-header">
            <span className="usecase-number">#{content.number}</span>
            <h2>{content.title}</h2>
          </div>
          <div className="usecase-grid">
            <div className="usecase-item">
              <span className="label">Task</span>
              <p>{content.task}</p>
            </div>
            <div className="usecase-item">
              <span className="label">Tool</span>
              <p>{content.tool}</p>
            </div>
            <div className="usecase-item">
              <span className="label">What I Asked</span>
              <p>{content.asked}</p>
            </div>
            <div className="usecase-item">
              <span className="label">What Shipped</span>
              <p>{content.shipped}</p>
            </div>
            <div className="usecase-item">
              <span className="label">What I Fixed</span>
              <p>{content.fixed}</p>
            </div>
            <div className="usecase-item">
              <span className="label">Impact</span>
              <p className="impact">{content.impact}</p>
            </div>
          </div>
        </div>
      );
    }

    case 'comparison': {
      const { content } = slide;
      return (
        <div className={`slide slide-comparison ${content.sentiment}`}>
          <span className="section-label">{content.section}</span>
          <h2>{content.title}</h2>
          <ul className="comparison-list">
            {content.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }

    case 'twoColumn': {
      const { content } = slide;
      return (
        <div className="slide slide-two-column">
          <span className="section-label">{content.section}</span>
          <h2>{content.title}</h2>
          <div className="two-columns">
            <div className="column improvement">
              <h3>{content.left.label}</h3>
              <p>{content.left.text}</p>
            </div>
            <div className="column risk">
              <h3>{content.right.label}</h3>
              <p>{content.right.text}</p>
            </div>
          </div>
        </div>
      );
    }

    case 'showcase': {
      const { content } = slide;
      return (
        <div className="slide slide-showcase">
          <span className="section-label">{content.section}</span>
          <h2>{content.title}</h2>
          <p className="showcase-desc">{content.description}</p>
          <div className="showcase-stats">
            {content.stats.map((stat, i) => (
              <div key={i} className="stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="showcase-helped">
            <h3>What AI Helped With</h3>
            <ul>
              {content.aiHelped.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="showcase-lesson">
            <strong>Key Lesson:</strong> {content.lesson}
          </div>
        </div>
      );
    }

    case 'story': {
      const { content } = slide;
      return (
        <div className={`slide slide-story ${content.type}`}>
          <span className="section-label">{content.section}</span>
          <div className="story-icon">{content.type === 'success' ? '✓' : '⚠'}</div>
          <h2>{content.title}</h2>
          <p className="story-text">{content.story}</p>
          {content.why && (
            <p className="story-why"><strong>Why it worked:</strong> {content.why}</p>
          )}
          {content.lesson && (
            <p className="story-lesson"><strong>Lesson:</strong> {content.lesson}</p>
          )}
        </div>
      );
    }

    case 'recommendation': {
      const { content } = slide;
      return (
        <div className="slide slide-recommendation">
          <span className="section-label">{content.section}</span>
          <h2>{content.title}</h2>
          <div className="recommendations">
            {content.items.map((item, i) => (
              <div key={i} className="rec-item">
                <h3>{item.tip}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'bullets': {
      const { content } = slide;
      return (
        <div className="slide slide-bullets">
          <span className="section-label">{content.section}</span>
          <h2>{content.title}</h2>
          <div className="bullet-list">
            {content.bullets.map((b, i) => (
              <div key={i} className="bullet-item">
                <span className="bullet-label">{b.label}</span>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'cta': {
      const { content } = slide;
      return (
        <div className="slide slide-cta">
          <h2>{content.title}</h2>
          <p className="cta-subtitle">{content.subtitle}</p>
          <div className="cta-links">
            {content.links.map((link, i) => (
              link.internal ? (
                <a key={i} href={link.url} className="cta-link">
                  {link.label}
                </a>
              ) : (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-link"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>
        </div>
      );
    }

    default:
      return <div className="slide">Unknown slide type</div>;
  }
}
