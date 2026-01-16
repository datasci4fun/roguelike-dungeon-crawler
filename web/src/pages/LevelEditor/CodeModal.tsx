/**
 * CodeModal - Modal popup for displaying generated Python code
 */

import { useEffect, useRef } from 'react';

interface CodeModalProps {
  code: string;
  onClose: () => void;
  onCopy: () => void;
}

export function CodeModal({ code, onClose, onCopy }: CodeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  return (
    <div className="code-modal-backdrop" ref={modalRef} onClick={handleBackdropClick}>
      <div className="code-modal">
        <div className="code-modal-header">
          <h2>Generated Python Code</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="code-modal-content">
          <pre><code>{code}</code></pre>
        </div>
        <div className="code-modal-footer">
          <p className="code-modal-help">
            Copy this code and paste it into <code>zone_layouts_early.py</code> or <code>zone_layouts_late.py</code>
          </p>
          <div className="code-modal-actions">
            <button className="secondary-btn" onClick={onClose}>Close</button>
            <button className="primary-btn" onClick={onCopy}>Copy to Clipboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}
