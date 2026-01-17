/**
 * Slide renderer components for the presentation
 */
import type { Slide } from './types';

export function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.type) {
    case 'title': {
      const { content } = slide;
      return (
        <div className="slide slide-title">
          <h1>{content.title}</h1>
          <p className="subtitle">{content.subtitle}</p>
          <p className="author">{content.author}</p>
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
        <div className={`slide slide-story ${content.type} ${content.diagram ? 'with-diagram' : ''}`}>
          <span className="section-label">{content.section}</span>
          <div className="story-icon">{content.type === 'success' ? '✓' : '⚠'}</div>
          <h2>{content.title}</h2>
          <div className="story-content">
            <div className="story-text-column">
              <p className="story-text">{content.story}</p>
              {content.why && (
                <p className="story-why"><strong>Why it worked:</strong> {content.why}</p>
              )}
              {content.lesson && (
                <p className="story-lesson"><strong>Lesson:</strong> {content.lesson}</p>
              )}
            </div>
            {content.diagram && (
              <div className="story-diagram-column">
                <pre className="story-diagram">{content.diagram}</pre>
                {content.diagramCaption && (
                  <p className="diagram-caption">{content.diagramCaption}</p>
                )}
              </div>
            )}
          </div>
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
