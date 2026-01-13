/**
 * Presentation Page - AI Usage Case Study
 *
 * A presentation-format page answering the AI Usage & Side Projects
 * questionnaire, designed for the Jan 17 share-out.
 *
 * Delegates to:
 * - Presentation/types.ts: Type definitions
 * - Presentation/slideData.ts: Slide content data
 * - Presentation/SlideRenderer.tsx: Slide rendering components
 */

import { useState, useEffect } from 'react';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { SLIDES } from './Presentation/slideData';
import { SlideRenderer } from './Presentation/SlideRenderer';
import './Presentation.css';

export function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exportMode, setExportMode] = useState(false);

  // Add class to body to hide footer
  useEffect(() => {
    document.body.classList.add('presentation-page');
    return () => {
      document.body.classList.remove('presentation-page');
    };
  }, []);

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

  const handleExport = () => {
    setExportMode(true);
    document.body.classList.add('export-mode');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    setExportMode(false);
    document.body.classList.remove('export-mode');
  };

  const slide = SLIDES[currentSlide];

  // Export mode - show all slides for printing
  if (exportMode) {
    return (
      <AtmosphericPage
        backgroundType="underground"
        particles={{ type: 'dust', count: 5, speed: 'slow', opacity: 0.05 }}
        crt={false}
      >
        <div className="presentation export-mode">
          <div className="export-controls">
            <h3>Export Preview — {SLIDES.length} slides</h3>
            <div className="export-controls-buttons">
              <button className="back-btn" onClick={handleBack}>
                ← Back to Presentation
              </button>
              <button className="print-btn" onClick={handlePrint}>
                Print / Save as PDF
              </button>
            </div>
          </div>
          <div className="slide-container">
            <div className="export-slides">
              {SLIDES.map((s, index) => (
                <div
                  key={s.id}
                  className={`export-slide-wrapper ${s.type === 'title' ? 'title-page' : ''}`}
                >
                  <div className="export-header">
                    <span className="export-header-title">Building a Full Game with AI</span>
                    <span className="export-header-author">Blixa Markham</span>
                  </div>
                  <div className="export-slide-content">
                    <SlideRenderer slide={s} />
                  </div>
                  <div className="export-footer">
                    <span className="export-footer-event">AI Usage & Side Projects • Jan 17, 2026</span>
                    <span className="export-footer-page">Page {index + 1} of {SLIDES.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AtmosphericPage>
    );
  }

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 10, speed: 'slow', opacity: 0.1 }}
      crt={false}
    >
      <div className="presentation">
        {/* Export button */}
        <button className="export-btn" onClick={handleExport}>
          Export / Print
        </button>

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
