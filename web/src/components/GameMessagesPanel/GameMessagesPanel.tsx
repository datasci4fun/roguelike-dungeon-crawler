/**
 * GameMessagesPanel - MMO-style tabbed message panel for in-game messages
 * Shows combat log, loot pickups, and system notifications in bottom-left of 3D view
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './GameMessagesPanel.css';

type MessageCategory = 'all' | 'combat' | 'loot' | 'system';

interface GameMessagesPanelProps {
  messages: string[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  maxMessages?: number;
}

// Keywords for categorizing messages
const COMBAT_KEYWORDS = [
  'attack', 'hit', 'damage', 'miss', 'defeat', 'kill', 'die', 'dead',
  'strike', 'slash', 'critical', 'block', 'dodge', 'heal', 'health',
  'hp', 'hurt', 'wound', 'fight', 'battle', 'enemy', 'flee', 'escaped'
];

const LOOT_KEYWORDS = [
  'pick up', 'picked up', 'found', 'acquire', 'gold', 'item', 'potion',
  'scroll', 'weapon', 'armor', 'ring', 'amulet', 'drop', 'loot', 'treasure',
  'equip', 'unequip', 'inventory', 'collect'
];

const SYSTEM_KEYWORDS = [
  'level up', 'leveled', 'welcome', 'floor', 'descend', 'ascend', 'stairs',
  'achievement', 'unlock', 'discover', 'secret', 'door', 'trap', 'save',
  'load', 'game', 'turn', 'rest', 'wait', 'search', 'lore', 'journal'
];

function categorizeMessage(msg: string): MessageCategory {
  const lowerMsg = msg.toLowerCase();

  // Check combat keywords first (most common)
  if (COMBAT_KEYWORDS.some(kw => lowerMsg.includes(kw))) {
    return 'combat';
  }

  // Check loot keywords
  if (LOOT_KEYWORDS.some(kw => lowerMsg.includes(kw))) {
    return 'loot';
  }

  // Check system keywords
  if (SYSTEM_KEYWORDS.some(kw => lowerMsg.includes(kw))) {
    return 'system';
  }

  // Default to system for uncategorized
  return 'system';
}

function getMessageColor(category: MessageCategory): string {
  switch (category) {
    case 'combat': return '#ef4444'; // Red
    case 'loot': return '#fbbf24'; // Yellow/Gold
    case 'system': return '#60a5fa'; // Blue
    default: return '#e0e0e0'; // White/Gray
  }
}

interface CategorizedMessage {
  text: string;
  category: MessageCategory;
  index: number;
}

export function GameMessagesPanel({
  messages,
  isCollapsed = false,
  onToggle,
  maxMessages = 50,
}: GameMessagesPanelProps) {
  const [activeTab, setActiveTab] = useState<MessageCategory>('all');
  const [userScrolled, setUserScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Categorize and limit messages
  const categorizedMessages = useMemo((): CategorizedMessage[] => {
    const recent = messages.slice(-maxMessages);
    return recent.map((text, index) => ({
      text,
      category: categorizeMessage(text),
      index,
    }));
  }, [messages, maxMessages]);

  // Filter messages by active tab
  const filteredMessages = useMemo(() => {
    if (activeTab === 'all') {
      return categorizedMessages;
    }
    return categorizedMessages.filter(msg => msg.category === activeTab);
  }, [categorizedMessages, activeTab]);

  // Count messages per category for tab badges
  const categoryCounts = useMemo(() => {
    const counts = { all: 0, combat: 0, loot: 0, system: 0 };
    categorizedMessages.forEach(msg => {
      counts.all++;
      counts[msg.category]++;
    });
    return counts;
  }, [categorizedMessages]);

  // Auto-scroll to bottom when new messages arrive (if not manually scrolled)
  useEffect(() => {
    if (!userScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, userScrolled]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setUserScrolled(!isAtBottom);
  }, []);

  // Scroll to bottom button handler
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserScrolled(false);
  }, []);

  if (isCollapsed) {
    return (
      <div className="game-messages-panel collapsed" onClick={onToggle}>
        <div className="collapsed-indicator">
          <span className="collapsed-icon">📜</span>
          <span className="collapsed-count">{messages.length}</span>
        </div>
      </div>
    );
  }

  const tabs: { id: MessageCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'combat', label: 'Combat' },
    { id: 'loot', label: 'Loot' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="game-messages-panel" role="log" aria-label="Game messages">
      {/* Tab Bar */}
      <div className="messages-tabs" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`messages-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`messages-panel-${tab.id}`}
          >
            {tab.label}
            {categoryCounts[tab.id] > 0 && (
              <span className="tab-count">{categoryCounts[tab.id]}</span>
            )}
          </button>
        ))}
        {onToggle && (
          <button
            className="messages-collapse-btn"
            onClick={onToggle}
            title="Collapse"
            aria-label="Collapse messages panel"
          >
            −
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="messages-container"
        onScroll={handleScroll}
        role="tabpanel"
        id={`messages-panel-${activeTab}`}
        aria-label={`${activeTab} messages`}
      >
        {filteredMessages.length === 0 ? (
          <div className="messages-empty">
            No {activeTab === 'all' ? '' : activeTab + ' '}messages yet
          </div>
        ) : (
          filteredMessages.map((msg, idx) => (
            <div
              key={`${msg.index}-${idx}`}
              className={`message-item ${msg.category}`}
              style={{ color: getMessageColor(msg.category) }}
            >
              <span className="message-text">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom indicator */}
      {userScrolled && (
        <button
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          aria-label="Scroll to latest messages"
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
}
