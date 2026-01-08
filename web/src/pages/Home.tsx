import { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudioManager } from '../hooks';
import './Home.css';

const TITLE_ART = [
  '  ____                        _ _ _        ',
  ' |  _ \\ ___   __ _ _   _  ___| (_) | _____ ',
  ' | |_) / _ \\ / _` | | | |/ _ \\ | | |/ / _ \\',
  ' |  _ < (_) | (_| | |_| |  __/ | |   <  __/',
  ' |_| \\_\\___/ \\__, |\\__,_|\\___|_|_|_|\\_\\___|',
  '             |___/                         ',
];

const DUNGEON_SCENE = [
  '    ╔════════════════════════════════════╗',
  '    ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓▓▓▓▓░..........░▓▓▓▓▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓░░░░░....@.....░░░░▓▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓░........g......╬..░▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓░░░░░..........░░░░▓▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓▓▓▓▓░....>.....░▓▓▓▓▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓  ║',
  '    ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║',
  '    ╚════════════════════════════════════╝',
];

const LORE_QUOTES = [
  { text: "Many have entered. None have returned.", author: "Village Elder" },
  { text: "The deeper you go, the darker it gets.", author: "Last Words of a Scout" },
  { text: "Something ancient stirs below...", author: "Forbidden Tome" },
  { text: "Gold and glory await the brave. Death awaits the rest.", author: "Dungeon Inscription" },
];

const CLASSES = [
  { name: 'Warrior', symbol: '⚔', desc: 'Master of steel and shield' },
  { name: 'Mage', symbol: '✧', desc: 'Wielder of arcane forces' },
  { name: 'Rogue', symbol: '◆', desc: 'Shadow and blade as one' },
  { name: 'Cleric', symbol: '✚', desc: 'Divine light in darkness' },
];

const RACES = [
  { name: 'Human', trait: 'Adaptable' },
  { name: 'Elf', trait: 'Swift' },
  { name: 'Dwarf', trait: 'Resilient' },
  { name: 'Orc', trait: 'Fierce' },
];

export function Home() {
  const { isAuthenticated } = useAuth();
  const { crossfadeTo, isUnlocked, unlockAudio } = useAudioManager();
  const [titleVisible, setTitleVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  // Unlock audio on first interaction
  const handleInteraction = useCallback(() => {
    if (!isUnlocked) {
      unlockAudio();
    }
  }, [isUnlocked, unlockAudio]);

  // Play menu music once unlocked
  useEffect(() => {
    if (isUnlocked) {
      crossfadeTo('menu');
    }
  }, [isUnlocked, crossfadeTo]);

  // Animate title on mount
  useEffect(() => {
    const timer = setTimeout(() => setTitleVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Rotate lore quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % LORE_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const quote = LORE_QUOTES[currentQuote];

  return (
    <div className="home" onClick={handleInteraction}>
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="fog-layer" />
        <div className="vignette" />
      </div>

      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <div className="hero-content">
          <div className={`title-container ${titleVisible ? 'visible' : ''}`}>
            <pre className="ascii-title">{TITLE_ART.join('\n')}</pre>
            <div className="title-subtitle">DUNGEON CRAWLER</div>
          </div>

          <p className="tagline">
            A terminal roguelike where every death is permanent<br />
            and every victory is earned.
          </p>

          {!isUnlocked && (
            <p className="audio-hint">Click anywhere to awaken the dungeon</p>
          )}

          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/character-creation" className="cta-button primary">
                <span className="cta-icon">▶</span>
                <span className="cta-text">Enter the Dungeon</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="cta-button primary">
                  <span className="cta-icon">✦</span>
                  <span className="cta-text">Begin Your Legend</span>
                </Link>
                <Link to="/login" className="cta-button secondary">
                  <span className="cta-text">Continue Journey</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <span>Descend</span>
          <div className="scroll-arrow">▼</div>
        </div>
      </section>

      {/* ===== THE LEGEND (Lore Teaser) ===== */}
      <section className="legend-section">
        <div className="section-header">
          <span className="header-line" />
          <h2>The Legend</h2>
          <span className="header-line" />
        </div>

        <div className="legend-content">
          <div className="legend-text">
            <p>
              Beneath the ruins of Valdris lies a dungeon older than memory itself.
              Once a thriving kingdom, it fell to a darkness that rose from below.
            </p>
            <p>
              Now, adventurers seek its depths — drawn by whispers of treasure,
              power, and secrets best left buried. Eight floors separate the surface
              from the heart of darkness. Each deeper than the last.
              Each more deadly.
            </p>
            <p className="legend-warning">
              Will you be the one to reach the bottom?<br/>
              Or will you become another ghost in the dark?
            </p>
          </div>

          <div className="dungeon-preview">
            <pre className="dungeon-art">{DUNGEON_SCENE.join('\n')}</pre>
            <div className="preview-legend">
              <span><b>@</b> You</span>
              <span><b>g</b> Enemy</span>
              <span><b>{'>'}</b> Stairs</span>
              <span><b>╬</b> Treasure</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROTATING QUOTE ===== */}
      <section className="quote-section">
        <blockquote className="lore-quote" key={currentQuote}>
          <p>"{quote.text}"</p>
          <cite>— {quote.author}</cite>
        </blockquote>
      </section>

      {/* ===== CHOOSE YOUR PATH ===== */}
      <section className="classes-section">
        <div className="section-header">
          <span className="header-line" />
          <h2>Choose Your Path</h2>
          <span className="header-line" />
        </div>

        <div className="classes-grid">
          {CLASSES.map((cls) => (
            <div key={cls.name} className="class-card">
              <div className="class-symbol">{cls.symbol}</div>
              <h3 className="class-name">{cls.name}</h3>
              <p className="class-desc">{cls.desc}</p>
            </div>
          ))}
        </div>

        <div className="races-row">
          {RACES.map((race) => (
            <div key={race.name} className="race-tag">
              <span className="race-name">{race.name}</span>
              <span className="race-trait">{race.trait}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== THE DESCENT ===== */}
      <section className="descent-section">
        <div className="section-header">
          <span className="header-line" />
          <h2>The Descent</h2>
          <span className="header-line" />
        </div>

        <div className="descent-visual">
          <div className="depth-line" />
          <div className="depth-markers">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
              <div key={level} className="depth-marker">
                <div className="marker-dot" />
                <div className="marker-info">
                  <span className="marker-level">Floor {level}</span>
                  <span className="marker-mystery">
                    {level === 1 && "Where all journeys begin..."}
                    {level === 2 && "The cold seeps into your bones..."}
                    {level === 3 && "Nature reclaims what was lost..."}
                    {level === 4 && "Heat rises from below..."}
                    {level === 5 && "The dead do not rest here..."}
                    {level === 6 && "Something writhes in the darkness..."}
                    {level === 7 && "Ancient knowledge, terrible cost..."}
                    {level === 8 && "???"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="descent-warning">
            <span className="warning-icon">☠</span>
            <span>Permadeath awaits the unprepared</span>
          </div>
        </div>
      </section>

      {/* ===== WHAT AWAITS ===== */}
      <section className="features-section">
        <div className="section-header">
          <span className="header-line" />
          <h2>What Awaits</h2>
          <span className="header-line" />
        </div>

        <div className="features-list">
          <div className="feature-item">
            <span className="feature-bullet">◈</span>
            <span>Procedurally generated dungeons — no two runs alike</span>
          </div>
          <div className="feature-item">
            <span className="feature-bullet">◈</span>
            <span>Tactical turn-based combat with positioning and abilities</span>
          </div>
          <div className="feature-item">
            <span className="feature-bullet">◈</span>
            <span>Unique biomes with distinct enemies and atmosphere</span>
          </div>
          <div className="feature-item">
            <span className="feature-bullet">◈</span>
            <span>Powerful bosses guarding each floor's descent</span>
          </div>
          <div className="feature-item">
            <span className="feature-bullet">◈</span>
            <span>Loot, equipment, and character progression</span>
          </div>
          <div className="feature-item">
            <span className="feature-bullet">◈</span>
            <span>Global leaderboards and ghost replays</span>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="final-cta">
        <div className="cta-content">
          <p className="cta-question">Ready to descend?</p>
          {isAuthenticated ? (
            <Link to="/character-creation" className="cta-button primary large">
              <span className="cta-icon">⚔</span>
              <span className="cta-text">Begin Your Descent</span>
            </Link>
          ) : (
            <Link to="/register" className="cta-button primary large">
              <span className="cta-icon">✦</span>
              <span className="cta-text">Create Your Legend</span>
            </Link>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <div className="footer-art">═══════════════════════════════════════</div>
        <p>A terminal roguelike experience</p>
        <p className="footer-version">v5.0</p>
      </footer>
    </div>
  );
}
