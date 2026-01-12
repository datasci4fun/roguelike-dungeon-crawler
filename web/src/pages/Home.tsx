/**
 * Home Page - Landing page with Skyfall Seed lore
 *
 * Features:
 * - Atmospheric background with particles and CRT
 * - Phosphor text reveal for title
 * - Lore-accurate content from LORE_COMPENDIUM.md
 * - Floor descent visualization
 */

import { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudioManager } from '../hooks';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import {
  LORE_QUOTES,
  FLOOR_DESCRIPTIONS,
  HERO_TAGLINE,
  HERO_SUBTITLE,
  FIELD_SECTION,
  FEATURES_LIST,
  CLASS_LORE,
} from '../data/loreSkyfall';
import './Home.css';

const TITLE_ART = [
  '  ____                        _ _ _        ',
  ' |  _ \\ ___   __ _ _   _  ___| (_) | _____ ',
  ' | |_) / _ \\ / _` | | | |/ _ \\ | | |/ / _ \\',
  ' |  _ < (_) | (_| | |_| |  __/ | |   <  __/',
  ' |_| \\_\\___/ \\__, |\\__,_|\\___|_|_|_|\\_\\___|',
  '             |___/                         ',
];

const CLASSES = [
  { name: 'Warrior', symbol: '⚔', lore: CLASS_LORE.WARRIOR },
  { name: 'Mage', symbol: '✧', lore: CLASS_LORE.MAGE },
  { name: 'Rogue', symbol: '◆', lore: CLASS_LORE.ROGUE },
  { name: 'Cleric', symbol: '✚', lore: CLASS_LORE.CLERIC },
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
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const quote = LORE_QUOTES[currentQuote];

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'mist', count: 20, speed: 'slow', opacity: 0.25 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="home" onClick={handleInteraction}>
        {/* ===== HERO SECTION ===== */}
        <section className="hero">
          <div className="hero-content">
            <div className={`title-container ${titleVisible ? 'visible' : ''}`}>
              <pre className="ascii-title">{TITLE_ART.join('\n')}</pre>
              <PhosphorHeader
                title={HERO_SUBTITLE}
                style="dramatic"
                delay={800}
              />
            </div>

            <p className="tagline">{HERO_TAGLINE}</p>

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
                    <span className="cta-text">Resume Descent</span>
                  </Link>
                </>
              )}
              <Link to="/features" className="cta-button secondary">
                <span className="cta-text">Discover the Game</span>
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator">
            <span>Descend</span>
            <div className="scroll-arrow">▼</div>
          </div>
        </section>

        {/* ===== THE FIELD (Lore Teaser) ===== */}
        <section className="legend-section">
          <div className="section-header">
            <span className="header-line" />
            <h2>{FIELD_SECTION.title}</h2>
            <span className="header-line" />
          </div>

          <div className="legend-content">
            <div className="legend-visual">
              <div className="field-orb" />
              <div className="orb-rings" />
            </div>
            <div className="legend-text">
              {FIELD_SECTION.paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              <p className="legend-warning">{FIELD_SECTION.warning}</p>
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
                <p className="class-lore">{cls.lore}</p>
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
              {FLOOR_DESCRIPTIONS.map((floor) => (
                <div key={floor.floor} className="depth-marker">
                  <div className="marker-dot" />
                  <div className="marker-info">
                    <span className="marker-level">
                      Floor {floor.floor}: {floor.name}
                    </span>
                    <span className="marker-aspect">{floor.aspect}</span>
                    <span className="marker-mystery">{floor.hint}</span>
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
            {FEATURES_LIST.map((feature, i) => (
              <div key={i} className="feature-item">
                <span className="feature-bullet">◈</span>
                <span>{feature}</span>
              </div>
            ))}
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
          <p>A browser-based roguelike adventure</p>
          <p className="footer-version">v6.3</p>
        </footer>
      </div>
    </AtmosphericPage>
  );
}
