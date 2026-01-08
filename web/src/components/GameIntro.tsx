/**
 * GameIntro - Title screen and prologue overlay shown before starting the game.
 * Displays a cinematic introduction with the game logo and story pages.
 */
import { useState, useEffect, useCallback } from 'react';
import './GameIntro.css';

interface GameIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
  onMusicChange?: (trackId: string) => void;
}

const TITLE_ART = [
  '  ____                        _ _ _        ',
  ' |  _ \\ ___   __ _ _   _  ___| (_) | _____ ',
  ' | |_) / _ \\ / _` | | | |/ _ \\ | | |/ / _ \\',
  ' |  _ < (_) | (_| | |_| |  __/ | |   <  __/',
  ' |_| \\_\\___/ \\__, |\\__,_|\\___|_|_|_|\\_\\___|',
  '             |___/                         ',
];

const PROLOGUE_PAGES = [
  {
    title: 'PROLOGUE',
    lines: [
      'Long ago, the kingdom of Valdris flourished above these depths.',
      '',
      'When the Darkness came, the people fled underground,',
      'sealing themselves in with their treasures and their dead.',
      '',
      'Centuries passed. The seals weakened.',
      '',
      'Now, something stirs below...',
    ],
  },
  {
    title: 'YOUR JOURNEY BEGINS',
    lines: [
      'You are an adventurer, drawn by rumors of gold and glory.',
      '',
      'The entrance to the ancient dungeons has been rediscovered,',
      'a gaping maw in the hillside that breathes cold, stale air.',
      '',
      'Many have entered. None have returned.',
      '',
      'But you are different. You must be.',
      '',
      'Steel your nerves. Ready your blade.',
      '',
      'The depths await.',
    ],
  },
];

type IntroPhase = 'title' | 'prologue';

export function GameIntro({ onComplete, onSkip, onMusicChange }: GameIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>('title');
  const [prologuePage, setProloguePage] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Trigger intro music on mount
  useEffect(() => {
    onMusicChange?.('intro');
  }, [onMusicChange]);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleAdvance = useCallback(() => {
    if (fadeOut) return; // Prevent double-clicks during transition

    if (phase === 'title') {
      // Transition from title to prologue
      setFadeOut(true);
      setTimeout(() => {
        setPhase('prologue');
        setFadeOut(false);
      }, 300);
    } else if (phase === 'prologue') {
      if (prologuePage < PROLOGUE_PAGES.length - 1) {
        // Next prologue page
        setFadeOut(true);
        setTimeout(() => {
          setProloguePage((p) => p + 1);
          setFadeOut(false);
        }, 300);
      } else {
        // Complete intro
        setFadeOut(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }
  }, [phase, prologuePage, fadeOut, onComplete]);

  const handleSkip = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      if (onSkip) {
        onSkip();
      } else {
        onComplete();
      }
    }, 300);
  }, [onComplete, onSkip]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance, handleSkip]);

  const currentPage = PROLOGUE_PAGES[prologuePage];
  const isLastPage = phase === 'prologue' && prologuePage === PROLOGUE_PAGES.length - 1;

  return (
    <div
      className={`game-intro ${fadeIn ? 'fade-in' : ''} ${fadeOut ? 'fade-out' : ''}`}
      onClick={handleAdvance}
    >
      <div className="intro-content">
        {phase === 'title' && (
          <div className="title-screen">
            <pre className="title-art">{TITLE_ART.join('\n')}</pre>
            <div className="title-subtitle">DUNGEON CRAWLER</div>
            <div className="title-tagline">A Terminal Adventure</div>
          </div>
        )}

        {phase === 'prologue' && (
          <div className="prologue-screen">
            <h2 className="prologue-title">~ {currentPage.title} ~</h2>
            <div className="prologue-text">
              {currentPage.lines.map((line, i) => (
                <p key={i} className={line === '' ? 'empty-line' : ''}>
                  {line}
                </p>
              ))}
            </div>
            <div className="page-indicator">
              Page {prologuePage + 1} of {PROLOGUE_PAGES.length}
            </div>
          </div>
        )}
      </div>

      <div className="intro-controls">
        <span className="control-hint">
          {isLastPage
            ? 'Press SPACE or ENTER to begin your adventure...'
            : 'Press SPACE or ENTER to continue'}
        </span>
        <button className="skip-button" onClick={(e) => { e.stopPropagation(); handleSkip(); }}>
          Skip (ESC)
        </button>
      </div>
    </div>
  );
}
