/**
 * BookPresentation - Animated book opening presentation for lore books
 */
import { useState, useEffect, useCallback } from 'react';
import type { LoreEntry } from '../types';
import { PhosphorParagraph } from '../utils/phosphorText';

interface BookPresentationProps {
  entry: LoreEntry;
}

// Number of paragraphs per page
const PARAGRAPHS_PER_PAGE = 3;

function paginateContent(content: string[]): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < content.length; i += PARAGRAPHS_PER_PAGE) {
    pages.push(content.slice(i, i + PARAGRAPHS_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[]];
}

export function BookPresentation({ entry }: BookPresentationProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const pages = paginateContent(entry.content);
  const totalPages = pages.length;

  useEffect(() => {
    // Reset animation state when entry changes
    setIsOpened(false);
    setShowContent(false);
    setCurrentPage(0);

    // Start open animation
    const openTimer = setTimeout(() => {
      setIsOpened(true);
    }, 100);

    // Show content after book opens
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 600);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(contentTimer);
    };
  }, [entry.id]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(0, p - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage]);

  return (
    <div className={`book-presentation ${isOpened ? 'opened' : ''}`}>
      <div className="book-spine" />

      <div className="book-pages">
        <div className="page page-left">
          <div className="page-decoration">
            <div className="corner-ornament top-left" />
            <div className="corner-ornament top-right" />
          </div>
        </div>

        <div className="page page-right">
          <h3 className="book-title">{entry.title}</h3>

          <div className="page-content">
            {showContent && pages[currentPage]?.map((paragraph, idx) => (
              <PhosphorParagraph
                key={`${currentPage}-${idx}`}
                text={paragraph}
                className="book-paragraph"
                delay={idx * 80}
              />
            ))}
          </div>

          <div className="page-footer">
            <span className="page-number">
              {currentPage + 1} / {totalPages}
            </span>
          </div>

          <div className="page-decoration">
            <div className="corner-ornament bottom-left" />
            <div className="corner-ornament bottom-right" />
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="book-navigation">
          <button
            className="page-nav-btn prev"
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            &lt;
          </button>
          <button
            className="page-nav-btn next"
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
