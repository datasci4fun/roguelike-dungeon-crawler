/**
 * HelpWindow - Modal help window with organized keybindings and game instructions
 * Matches CharacterWindow styling with tabbed sections
 */
import { useEffect, useCallback, useState } from 'react';
import './HelpWindow.css';

interface HelpWindowProps {
  onClose: () => void;
}

type TabId = 'movement' | 'actions' | 'screens' | 'combat' | 'tips';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

interface KeyBinding {
  keys: string[];
  description: string;
}

interface HelpSection {
  title: string;
  bindings: KeyBinding[];
}

const TABS: Tab[] = [
  { id: 'movement', label: 'Movement', icon: '🚶' },
  { id: 'actions', label: 'Actions', icon: '⚡' },
  { id: 'screens', label: 'Screens', icon: '📋' },
  { id: 'combat', label: 'Combat', icon: '⚔' },
  { id: 'tips', label: 'Tips', icon: '💡' },
];

const HELP_CONTENT: Record<TabId, HelpSection[]> = {
  movement: [
    {
      title: 'Basic Movement',
      bindings: [
        { keys: ['W', '↑'], description: 'Move forward' },
        { keys: ['S', '↓'], description: 'Move backward' },
        { keys: ['A', '←'], description: 'Strafe left' },
        { keys: ['D', '→'], description: 'Strafe right' },
      ],
    },
    {
      title: 'Turning',
      bindings: [
        { keys: ['Q'], description: 'Turn left (90°)' },
        { keys: ['E'], description: 'Turn right (90°)' },
      ],
    },
    {
      title: 'Camera',
      bindings: [
        { keys: ['V'], description: 'Toggle camera perspective' },
      ],
    },
  ],
  actions: [
    {
      title: 'Exploration',
      bindings: [
        { keys: ['>'], description: 'Descend stairs' },
        { keys: ['<'], description: 'Ascend stairs' },
        { keys: ['F', 'X'], description: 'Search for secrets' },
        { keys: ['Space'], description: 'Wait one turn' },
        { keys: ['G'], description: 'Pick up item' },
      ],
    },
    {
      title: 'Items',
      bindings: [
        { keys: ['1-3'], description: 'Use quick slot item' },
        { keys: ['U'], description: 'Use selected item' },
        { keys: ['R'], description: 'Read selected scroll/book' },
      ],
    },
  ],
  screens: [
    {
      title: 'Windows',
      bindings: [
        { keys: ['I'], description: 'Open inventory' },
        { keys: ['C'], description: 'Open character sheet' },
        { keys: ['J'], description: 'Open lore codex' },
        { keys: ['?'], description: 'Open this help window' },
        { keys: ['Esc'], description: 'Close current window' },
      ],
    },
    {
      title: 'Navigation',
      bindings: [
        { keys: ['Tab'], description: 'Switch tabs' },
        { keys: ['↑', '↓'], description: 'Navigate lists' },
        { keys: ['Enter'], description: 'Confirm selection' },
      ],
    },
  ],
  combat: [
    {
      title: 'Battle Controls',
      bindings: [
        { keys: ['Click'], description: 'Select target tile' },
        { keys: ['1-4'], description: 'Use ability' },
        { keys: ['Space'], description: 'End turn / Skip' },
        { keys: ['R'], description: 'Attempt to flee' },
      ],
    },
    {
      title: 'Targeting',
      bindings: [
        { keys: ['Tab'], description: 'Cycle targets' },
        { keys: ['Enter'], description: 'Confirm action' },
        { keys: ['Esc'], description: 'Cancel action' },
      ],
    },
  ],
  tips: [
    {
      title: 'Survival Tips',
      bindings: [
        { keys: ['💡'], description: 'Search rooms thoroughly - secrets hide valuable loot' },
        { keys: ['💡'], description: 'Watch your HP - retreat when low' },
        { keys: ['💡'], description: 'Read scrolls and books for lore bonuses' },
        { keys: ['💡'], description: 'Different enemies have different resistances' },
      ],
    },
    {
      title: 'Combat Tips',
      bindings: [
        { keys: ['💡'], description: 'Use terrain to your advantage in battles' },
        { keys: ['💡'], description: 'Save powerful abilities for tough enemies' },
        { keys: ['💡'], description: 'Fleeing has a chance to fail - plan ahead' },
        { keys: ['💡'], description: 'Elite enemies drop better loot' },
      ],
    },
    {
      title: 'Progression',
      bindings: [
        { keys: ['💡'], description: 'Each floor gets progressively harder' },
        { keys: ['💡'], description: 'Boss fights occur every few floors' },
        { keys: ['💡'], description: 'Artifacts provide powerful passive bonuses' },
        { keys: ['💡'], description: 'Feats unlock at certain levels' },
      ],
    },
  ],
};

export function HelpWindow({ onClose }: HelpWindowProps) {
  const [activeTab, setActiveTab] = useState<TabId>('movement');

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = TABS.findIndex(t => t.id === activeTab);
        const nextIndex = (currentIndex + 1) % TABS.length;
        setActiveTab(TABS[nextIndex].id);
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const currentIndex = TABS.findIndex(t => t.id === activeTab);
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[prevIndex].id);
      }
    },
    [onClose, activeTab]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const sections = HELP_CONTENT[activeTab];

  return (
    <div className="help-window-overlay" onClick={onClose}>
      <div className="help-window" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="hw-header">
          <h2 className="hw-title">Help & Controls</h2>
          <button className="hw-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="hw-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`hw-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="hw-content" role="tabpanel">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="hw-section">
              <h3 className="hw-section-title">{section.title}</h3>
              <div className="hw-bindings">
                {section.bindings.map((binding, bIdx) => (
                  <div key={bIdx} className="hw-binding">
                    <div className="binding-keys">
                      {binding.keys.map((key, kIdx) => (
                        <span key={kIdx}>
                          {key === '💡' ? (
                            <span className="tip-icon">{key}</span>
                          ) : (
                            <kbd className="key">{key}</kbd>
                          )}
                          {kIdx < binding.keys.length - 1 && (
                            <span className="key-separator">/</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="binding-description">{binding.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="hw-footer">
          <span className="hw-hint">
            Press <kbd>Tab</kbd> to switch tabs • <kbd>?</kbd> or <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
