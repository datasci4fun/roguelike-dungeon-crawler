/**
 * MermaidDiagram Component
 *
 * Renders Mermaid diagrams in React using DOM-based rendering.
 * Supports dark theme styling to match the app's aesthetic.
 */

import { useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';

// Track if mermaid has been initialized
let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#00d4ff',
      primaryTextColor: '#fff',
      primaryBorderColor: '#00d4ff',
      lineColor: '#8b8b8b',
      secondaryColor: '#1a1a2e',
      tertiaryColor: '#0f0f1a',
      background: '#0f0f1a',
      mainBkg: '#1a1a2e',
      secondBkg: '#0f0f1a',
      nodeBorder: '#00d4ff',
      clusterBkg: '#1a1a2e',
      clusterBorder: '#00d4ff',
      titleColor: '#fff',
      edgeLabelBackground: '#1a1a2e',
      nodeTextColor: '#fff',
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      nodeSpacing: 50,
      rankSpacing: 50,
      padding: 15,
    },
    securityLevel: 'loose',
  });

  mermaidInitialized = true;
}

interface MermaidDiagramProps {
  chart: string;
  id: string;
}

export function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const renderDiagram = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize mermaid if needed
    initMermaid();

    // Clear previous content
    container.innerHTML = '';

    try {
      // Create a unique element ID
      const elementId = `mermaid-${id}-${Date.now()}`;

      // Render the diagram
      const { svg } = await mermaid.render(elementId, chart.trim());

      // Insert the SVG
      container.innerHTML = svg;
    } catch (err) {
      console.error('Mermaid render error:', err);
      container.innerHTML = `
        <div class="mermaid-error">
          <span class="error-icon">⚠️</span>
          <span>Diagram render error: ${err instanceof Error ? err.message : 'Unknown error'}</span>
          <details>
            <summary>View source</summary>
            <pre class="mermaid-source">${chart.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </details>
        </div>
      `;
    }
  }, [chart, id]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  return (
    <div
      ref={containerRef}
      className="mermaid-rendered"
    >
      <div className="mermaid-loading">
        <div className="mermaid-spinner" />
        <span>Rendering diagram...</span>
      </div>
    </div>
  );
}
