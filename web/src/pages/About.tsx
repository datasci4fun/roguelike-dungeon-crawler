/**
 * About Page - Technical showcase and AI attribution
 *
 * Demonstrates that quality software can be built entirely with AI assistance,
 * challenging the notion of "AI slop" by showcasing the depth and polish
 * of this project.
 */

import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import './About.css';

// Technical stack information
const TECH_STACK = {
  frontend: [
    { name: 'React 18', desc: 'Component-based UI with hooks', icon: '⚛️' },
    { name: 'TypeScript', desc: 'Type-safe development', icon: '📘' },
    { name: 'Three.js', desc: '3D rendering for battles and exploration', icon: '🎮' },
    { name: 'Vite', desc: 'Fast build tooling and HMR', icon: '⚡' },
    { name: 'React Router', desc: 'Client-side navigation', icon: '🧭' },
    { name: 'Web Audio API', desc: 'Dynamic soundtrack system', icon: '🎵' },
  ],
  backend: [
    { name: 'Python 3.11', desc: 'Server runtime', icon: '🐍' },
    { name: 'FastAPI', desc: 'Async REST API framework', icon: '🚀' },
    { name: 'PostgreSQL', desc: 'Primary database', icon: '🗄️' },
    { name: 'Redis', desc: 'Caching layer', icon: '⚡' },
    { name: 'SQLAlchemy', desc: 'ORM and migrations', icon: '🔗' },
    { name: 'JWT + WebSockets', desc: 'Auth and real-time', icon: '🔐' },
  ],
  gameEngine: [
    { name: 'BSP Algorithm', desc: 'Procedural dungeon generation', icon: '🗺️' },
    { name: 'D&D Combat', desc: 'd20 rolls, AC, saving throws', icon: '🎲' },
    { name: 'A* Pathfinding', desc: 'Enemy AI navigation', icon: '🧠' },
    { name: 'Tactical Battles', desc: 'Instanced arena combat', icon: '⚔️' },
    { name: 'State Machine', desc: 'Game flow management', icon: '🔄' },
    { name: 'Entity System', desc: 'Flexible game objects', icon: '📦' },
  ],
};

// AI models/tools used
const AI_MODELS = [
  {
    name: 'Claude Opus 4.5',
    company: 'Anthropic',
    role: 'Primary Development',
    contributions: [
      'Core game architecture and systems',
      'D&D-style combat with dice mechanics',
      'React component design and implementation',
      'Three.js 3D rendering pipeline',
      'FastAPI backend with PostgreSQL/Redis',
      '3D asset generation pipeline (TripoSR)',
      'Zone Layout Designer (rule-based level editor)',
      'Cutscene engine and cinematic system',
      'Bug fixes and optimization',
    ],
    color: '#d4a574',
  },
  {
    name: 'ChatGPT 5.2',
    company: 'OpenAI',
    role: 'Creative & Design',
    contributions: [
      'Lore writing and world-building',
      'Achievement descriptions',
      'UI/UX design consultation',
      'Game balance suggestions',
      'ASCII art generation',
    ],
    color: '#74d4a5',
  },
  {
    name: 'Suno v4.5',
    company: 'Suno AI',
    role: 'Music Generation',
    contributions: [
      'All 16 soundtrack tracks',
      'Biome-specific ambient music',
      'Boss battle themes',
      'Victory and death cinematics',
      'Menu and exploration themes',
    ],
    color: '#a574d4',
  },
  {
    name: 'DALL-E 3',
    company: 'OpenAI',
    role: 'Visual Assets',
    contributions: [
      'Dungeon tileset generation',
      'Environment textures',
      'Biome-specific visual themes',
    ],
    color: '#d47474',
  },
];

// Project statistics
const PROJECT_STATS = [
  { label: 'Lines of Code', value: '118,000+', icon: '📝' },
  { label: 'React Components', value: '55+', icon: '🧩' },
  { label: 'Python Modules', value: '216+', icon: '🐍' },
  { label: 'Merged PRs', value: '80', icon: '🔀' },
  { label: 'Dungeon Floors', value: '8', icon: '🏰' },
  { label: 'Unique Enemies', value: '28', icon: '👹' },
  { label: 'Achievements', value: '36', icon: '🏆' },
  { label: 'Lore Entries', value: '32', icon: '📜' },
  { label: 'Audio Files', value: '50+', icon: '🎼' },
  { label: 'Ending Variants', value: '6', icon: '🎭' },
];

// What makes this different from "AI slop"
const QUALITY_MARKERS = [
  {
    title: 'Architectural Coherence',
    desc: 'Not random code snippets stitched together. A unified codebase with consistent patterns, proper separation of concerns, and scalable architecture.',
  },
  {
    title: 'Deep Systems Integration',
    desc: 'Combat, inventory, progression, audio, visuals—all systems communicate properly. No orphaned features or dead code paths.',
  },
  {
    title: 'Production Polish',
    desc: 'WCAG accessibility compliance, responsive design, error handling, loading states, and edge case coverage throughout.',
  },
  {
    title: 'Original Creative Vision',
    desc: 'The Skyfall Seed lore, the Field concept, the eight aspects—coherent world-building that enhances gameplay, not generic fantasy filler.',
  },
  {
    title: 'Iterative Refinement',
    desc: 'Hundreds of development sessions with continuous improvement. Features were designed, tested, critiqued, and polished.',
  },
  {
    title: 'Technical Depth',
    desc: 'Custom Three.js renderers, procedural audio, BSP dungeon generation, cinematic cutscene engine—not surface-level implementations.',
  },
];

export function About() {
  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 15, speed: 'slow', opacity: 0.12 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="about-page">
        {/* Hero Section */}
        <section className="about-hero">
          <PhosphorHeader
            title="BUILT BY AI"
            subtitle="A demonstration of what's possible"
            style="dramatic"
            delay={100}
          />
          <p className="hero-statement">
            Every line of code. Every pixel of art. Every word of lore.
            <br />
            <span className="emphasis">100% AI-generated.</span>
          </p>
          <p className="hero-challenge">
            This project exists to challenge the assumption that AI-generated content
            is inherently low-quality "slop." When guided by clear vision and iterative
            refinement, AI can produce software that rivals hand-crafted work.
          </p>
        </section>

        {/* Solo Developer Section */}
        <section className="about-section solo-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            One Human, Four AIs
            <span className="title-decoration">═══</span>
          </h2>
          <div className="solo-content">
            <div className="solo-statement">
              <span className="solo-number">1</span>
              <div className="solo-text">
                <h3>Solo Developer</h3>
                <p>
                  One person. No team. No contractors. Just a single human with a vision,
                  directing four AI tools to build something that would typically require
                  a full development studio—in just 2.5 weeks.
                </p>
              </div>
            </div>
            <p className="solo-implication">
              This is the future of software development: individual creators with AI partners,
              shipping products that punch far above their weight class.
            </p>
          </div>
        </section>

        {/* AI Models Section */}
        <section className="about-section ai-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            The AI Partners
            <span className="title-decoration">═══</span>
          </h2>
          <p className="section-intro">
            Four AI tools, guided by one human, built this game from the ground up.
          </p>
          <div className="ai-models">
            {AI_MODELS.map((model) => (
              <div
                key={model.name}
                className="ai-card"
                style={{ '--accent-color': model.color } as React.CSSProperties}
              >
                <div className="ai-header">
                  <h3 className="ai-name">{model.name}</h3>
                  <span className="ai-company">{model.company}</span>
                </div>
                <span className="ai-role">{model.role}</span>
                <ul className="ai-contributions">
                  {model.contributions.map((contrib, i) => (
                    <li key={i}>{contrib}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Project Stats */}
        <section className="about-section stats-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            By The Numbers
            <span className="title-decoration">═══</span>
          </h2>
          <div className="stats-grid">
            {PROJECT_STATS.map((stat) => (
              <div key={stat.label} className="stat-card">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quality Markers */}
        <section className="about-section quality-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Not "AI Slop"
            <span className="title-decoration">═══</span>
          </h2>
          <p className="section-intro">
            What separates thoughtful AI-assisted development from low-effort generation?
          </p>
          <div className="quality-grid">
            {QUALITY_MARKERS.map((marker, i) => (
              <div key={i} className="quality-card">
                <h3 className="quality-title">{marker.title}</h3>
                <p className="quality-desc">{marker.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="about-section tech-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Technical Stack
            <span className="title-decoration">═══</span>
          </h2>
          <div className="tech-columns">
            <div className="tech-column">
              <h3 className="tech-category">Frontend</h3>
              <div className="tech-list">
                {TECH_STACK.frontend.map((tech) => (
                  <div key={tech.name} className="tech-item">
                    <span className="tech-icon">{tech.icon}</span>
                    <div className="tech-info">
                      <span className="tech-name">{tech.name}</span>
                      <span className="tech-desc">{tech.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="tech-column">
              <h3 className="tech-category">Backend</h3>
              <div className="tech-list">
                {TECH_STACK.backend.map((tech) => (
                  <div key={tech.name} className="tech-item">
                    <span className="tech-icon">{tech.icon}</span>
                    <div className="tech-info">
                      <span className="tech-name">{tech.name}</span>
                      <span className="tech-desc">{tech.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="tech-column">
              <h3 className="tech-category">Game Engine</h3>
              <div className="tech-list">
                {TECH_STACK.gameEngine.map((tech) => (
                  <div key={tech.name} className="tech-item">
                    <span className="tech-icon">{tech.icon}</span>
                    <div className="tech-info">
                      <span className="tech-name">{tech.name}</span>
                      <span className="tech-desc">{tech.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="about-section philosophy-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            The Philosophy
            <span className="title-decoration">═══</span>
          </h2>
          <div className="philosophy-content">
            <blockquote className="philosophy-quote">
              "AI doesn't replace craftsmanship—it amplifies it. One person with the right
              AI tools can build what used to require entire teams. The difference between
              AI slop and AI excellence is the same as always: vision, iteration, and
              the refusal to ship something you're not proud of."
            </blockquote>
            <div className="philosophy-points">
              <div className="philosophy-point">
                <h4>Human Direction</h4>
                <p>
                  One developer decided what to build and why. The AIs executed
                  the vision, but the vision came from a human who understands
                  what makes games fun.
                </p>
              </div>
              <div className="philosophy-point">
                <h4>Iterative Quality</h4>
                <p>
                  Nothing shipped on first generation. Features were critiqued,
                  refined, and sometimes completely rewritten until they met
                  the quality bar.
                </p>
              </div>
              <div className="philosophy-point">
                <h4>Coherent Whole</h4>
                <p>
                  The goal was never "generate content"—it was "build a game
                  worth playing." Every system serves the whole.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="about-section cta-section">
          <div className="cta-box">
            <h3>See For Yourself</h3>
            <p>
              Don't take our word for it. Play the game. Read the code.
              Judge the quality on its own merits.
            </p>
            <div className="cta-links">
              <a
                href="https://github.com/datasci4fun/roguelike-dungeon-crawler"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-link"
              >
                <span className="link-icon">📂</span>
                <span>View Source Code</span>
              </a>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-link"
              >
                <span className="link-icon">🤖</span>
                <span>Try Claude</span>
              </a>
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-link"
              >
                <span className="link-icon">💬</span>
                <span>Try ChatGPT</span>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="about-footer">
          <div className="footer-line">═══════════════════════════════════════</div>
          <p>
            Built with AI. Refined with care. Shipped with pride.
          </p>
          <p className="footer-models">
            Claude Opus 4.5 + ChatGPT 5.2 + Suno v4.5 + DALL-E 3
          </p>
        </footer>
      </div>
    </AtmosphericPage>
  );
}
