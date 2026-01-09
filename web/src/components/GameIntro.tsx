/**
 * GameIntro - Cinematic intro with visual scenes, parallax backgrounds,
 * animated particles, and typewriter text effects.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import './GameIntro.css';

interface GameIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
  onMusicChange?: (trackId: string) => void;
}

// Scene definitions with timing and content
interface Scene {
  id: string;
  duration: number; // milliseconds
  background: 'kingdom' | 'darkness' | 'underground' | 'depths' | 'entrance' | 'title';
  title?: string;
  lines: string[];
  fadeStyle?: 'slow' | 'fast' | 'dramatic';
}

const SCENES: Scene[] = [
  {
    id: 'title',
    duration: 5000,
    background: 'title',
    lines: [],
    fadeStyle: 'slow',
  },
  {
    id: 'kingdom',
    duration: 8000,
    background: 'kingdom',
    title: 'THE KINGDOM OF VALDRIS',
    lines: [
      'In ages past, the kingdom of Valdris stood proud upon the mountain.',
      '',
      'Its towers reached toward the heavens,',
      'its people prospered in the light.',
    ],
    fadeStyle: 'slow',
  },
  {
    id: 'darkness',
    duration: 9000,
    background: 'darkness',
    title: 'THE COMING DARKNESS',
    lines: [
      'Then came the Darkness...',
      '',
      'A shadow that devoured the sun,',
      'twisted the land, and corrupted all it touched.',
      '',
      'The dead rose. The living fled.',
    ],
    fadeStyle: 'dramatic',
  },
  {
    id: 'underground',
    duration: 8000,
    background: 'underground',
    title: 'THE DESCENT',
    lines: [
      'The survivors retreated into the depths below.',
      '',
      'They sealed the entrances with ancient magic,',
      'taking their treasures and their secrets with them.',
      '',
      'There, in the darkness, they waited...',
    ],
    fadeStyle: 'slow',
  },
  {
    id: 'time',
    duration: 6000,
    background: 'depths',
    title: 'CENTURIES PASS',
    lines: [
      'Generations lived and died in the underground halls.',
      '',
      'The world above became legend.',
      'The seals began to weaken.',
      '',
      'And something ancient stirred in the deepest chambers...',
    ],
    fadeStyle: 'dramatic',
  },
  {
    id: 'present',
    duration: 8000,
    background: 'entrance',
    title: 'THE PRESENT DAY',
    lines: [
      'The entrance has been found.',
      '',
      'A gaping maw in the hillside,',
      'breathing cold, stale air from forgotten depths.',
      '',
      'Treasure hunters came first. None returned.',
      'Then mercenaries. Then heroes.',
      '',
      'All swallowed by the dark.',
    ],
    fadeStyle: 'slow',
  },
  {
    id: 'you',
    duration: 10000,
    background: 'entrance',
    title: 'YOUR STORY BEGINS',
    lines: [
      'Now you stand before the ancient gate.',
      '',
      'Gold? Glory? Redemption?',
      'What drives you matters not to the depths.',
      '',
      'Only survival.',
      '',
      'Steel your nerves.',
      'Ready your blade.',
      'Light your torch.',
      '',
      'The dungeon awaits...',
    ],
    fadeStyle: 'dramatic',
  },
];

const TITLE_ART = [
  '  ____                        _ _ _        ',
  ' |  _ \\ ___   __ _ _   _  ___| (_) | _____ ',
  ' | |_) / _ \\ / _` | | | |/ _ \\ | | |/ / _ \\',
  ' |  _ < (_) | (_| | |_| |  __/ | |   <  __/',
  ' |_| \\_\\___/ \\__, |\\__,_|\\___|_|_|_|\\_\\___|',
  '             |___/                         ',
];

// Particle component for atmospheric effects
function Particles({ type }: { type: 'embers' | 'dust' | 'darkness' | 'stars' }) {
  const count = type === 'stars' ? 50 : type === 'embers' ? 30 : 20;

  return (
    <div className={`particles particles-${type}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            '--delay': `${Math.random() * 5}s`,
            '--x': `${Math.random() * 100}%`,
            '--y': `${Math.random() * 100}%`,
            '--duration': `${3 + Math.random() * 4}s`,
            '--size': `${2 + Math.random() * 4}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Pause duration at end of each scene before transitioning (ms)
const SCENE_END_PAUSE = 3000;

export function GameIntro({ onComplete, onSkip, onMusicChange }: GameIntroProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in');
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [introComplete, setIntroComplete] = useState(false);
  const timerRef = useRef<number | null>(null);
  const lineTimerRef = useRef<number | null>(null);

  const currentScene = SCENES[currentSceneIndex];
  const isLastScene = currentSceneIndex === SCENES.length - 1;

  // Trigger intro music on mount
  useEffect(() => {
    onMusicChange?.('intro');
  }, [onMusicChange]);

  // Scene progression
  useEffect(() => {
    // Don't run scene progression if intro is complete (waiting for button click)
    if (introComplete) return;

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);

    // Fade in
    setFadeState('in');
    setVisibleLines(0);

    const fadeInDuration = currentScene.fadeStyle === 'dramatic' ? 1500 : 800;
    const fadeDuration = 800;

    // After fade in, show content
    timerRef.current = window.setTimeout(() => {
      setFadeState('visible');

      // Progressively reveal lines
      if (currentScene.lines.length > 0) {
        let lineIndex = 0;
        const revealNextLine = () => {
          if (lineIndex < currentScene.lines.length) {
            setVisibleLines(lineIndex + 1);
            lineIndex++;
            lineTimerRef.current = window.setTimeout(revealNextLine, 600);
          }
        };
        lineTimerRef.current = window.setTimeout(revealNextLine, 500);
      }

      // After duration + pause, fade out and advance (unless last scene)
      if (!isLastScene) {
        timerRef.current = window.setTimeout(() => {
          setFadeState('out');

          timerRef.current = window.setTimeout(() => {
            setCurrentSceneIndex((i) => i + 1);
          }, fadeDuration);
        }, currentScene.duration + SCENE_END_PAUSE);
      } else {
        // Last scene: after content is shown, wait then show the begin button
        timerRef.current = window.setTimeout(() => {
          setIntroComplete(true);
        }, currentScene.duration + SCENE_END_PAUSE);
      }
    }, fadeInDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    };
  }, [currentSceneIndex, currentScene, isLastScene, introComplete]);

  const handleAdvance = useCallback(() => {
    // If intro is complete, don't allow advancing with space/click
    // User must click the Begin button
    if (introComplete) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);

    if (currentSceneIndex < SCENES.length - 1) {
      setFadeState('out');
      setTimeout(() => {
        setCurrentSceneIndex((i) => i + 1);
      }, 300);
    } else {
      // On last scene, skip to showing the begin button
      setIntroComplete(true);
    }
  }, [currentSceneIndex, introComplete]);

  const handleBeginAdventure = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);

    setFadeState('out');
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
        if (introComplete) {
          handleBeginAdventure();
        } else {
          handleAdvance();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance, handleSkip, handleBeginAdventure, introComplete]);

  // Get particle type based on background
  const getParticleType = () => {
    switch (currentScene.background) {
      case 'kingdom':
      case 'title':
        return 'stars';
      case 'darkness':
        return 'darkness';
      case 'underground':
      case 'depths':
        return 'dust';
      case 'entrance':
        return 'embers';
      default:
        return 'dust';
    }
  };

  return (
    <div
      className={`game-intro scene-${currentScene.background} fade-${fadeState} ${introComplete ? 'intro-complete' : ''}`}
      onClick={introComplete ? undefined : handleAdvance}
    >
      {/* Background layers */}
      <div className="scene-background">
        <div className="bg-layer bg-far" />
        <div className="bg-layer bg-mid" />
        <div className="bg-layer bg-near" />
      </div>

      {/* Particles */}
      <Particles type={getParticleType()} />

      {/* Ambient overlay */}
      <div className="ambient-overlay" />

      {/* Content wrapper - this fades, not the whole component */}
      <div className={`intro-content-wrapper ${fadeState === 'out' ? 'content-fade-out' : ''}`}>
        {/* Content */}
        <div className="intro-content">
          {currentScene.background === 'title' ? (
            <div className="title-screen">
              <pre className="title-art">{TITLE_ART.join('\n')}</pre>
              <div className="title-subtitle">DUNGEON CRAWLER</div>
              <div className="title-tagline">A Tale of Darkness and Treasure</div>
              <div className="title-prompt">Press SPACE to begin...</div>
            </div>
          ) : (
            <div className="narrative-screen">
              {currentScene.title && (
                <h2 className="scene-title">{currentScene.title}</h2>
              )}
              <div className="narrative-text">
                {currentScene.lines.slice(0, visibleLines).map((line, i) => (
                  <p
                    key={i}
                    className={`narrative-line ${line === '' ? 'empty-line' : ''}`}
                    style={{ '--line-index': i } as React.CSSProperties}
                  >
                    {line}
                  </p>
                ))}
              </div>

              {/* Begin Adventure button - shown after last scene completes */}
              {introComplete && (
                <button
                  className="begin-adventure-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBeginAdventure();
                  }}
                >
                  Begin Your Adventure
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="scene-progress">
        {SCENES.map((_, i) => (
          <div
            key={i}
            className={`progress-dot ${i === currentSceneIndex ? 'active' : ''} ${i < currentSceneIndex ? 'complete' : ''}`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="intro-controls">
        {introComplete ? (
          <span className="control-hint">Click the button or press ENTER to continue</span>
        ) : (
          <span className="control-hint">
            {isLastScene
              ? 'The dungeon awaits...'
              : 'Press SPACE to continue'}
          </span>
        )}
        <button
          className="skip-button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
        >
          Skip Intro (ESC)
        </button>
      </div>

      {/* Cinematic bars */}
      <div className="cinematic-bar top" />
      <div className="cinematic-bar bottom" />
    </div>
  );
}
