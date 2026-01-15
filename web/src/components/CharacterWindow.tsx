/**
 * CharacterWindow - Modal overlay for character information
 *
 * Displays detailed character stats, abilities, passives, and inventory
 * in a styled window overlay on the 3D viewer.
 * Features a tabbed interface with keyboard shortcuts.
 */
import { useEffect, useCallback, useState } from 'react';
import type { Player, EquipmentState, EquippedItem, EquipmentSlot } from '../types';
import './CharacterWindow.css';

interface InventoryItem {
  name: string;
  type: string;
  rarity: string;
}

interface LoreEntry {
  id: string;
  title: string;
  category: string;
  item_type: string;
}

interface LoreJournal {
  entries: LoreEntry[];
  discovered_count: number;
  total_count: number;
}

interface CharacterWindowProps {
  player: Player;
  onClose: () => void;
  // Optional inventory props - if provided, inventory tab is enabled
  inventory?: {
    items: InventoryItem[];
    selected_index: number;
  };
  onInventoryNavigate?: (direction: 'up' | 'down') => void;
  onInventorySelect?: (index: number) => void;
  onInventoryUse?: () => void;
  onInventoryDrop?: () => void;
  onInventoryRead?: () => void;
  // Equipment props
  equipment?: EquipmentState;
  onUnequip?: (slot: EquipmentSlot) => void;
  // Lore journal props
  loreJournal?: LoreJournal;
  onOpenLoreCodex?: () => void;
  // Initial tab to open (for 'I' key shortcut)
  initialTab?: TabId;
}

type TabId = 'stats' | 'skills' | 'inventory' | 'equipment' | 'journal';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  shortcut?: string; // Letter shortcut like 'I' for inventory
}

const TABS: Tab[] = [
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'inventory', label: 'Inventory', icon: '🎒', shortcut: 'I' },
  { id: 'equipment', label: 'Gear', icon: '🗡' },
  { id: 'journal', label: 'Journal', icon: '📜' },
];

// Get icon for item type
function getItemIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'weapon': return '⚔';
    case 'armor':
    case 'shield': return '🛡';
    case 'potion':
    case 'consumable': return '🧪';
    case 'scroll': return '📜';
    case 'key': return '🔑';
    case 'ring': return '💍';
    case 'amulet':
    case 'necklace': return '💫';
    case 'food': return '🍖';
    case 'treasure':
    case 'gold': return '💰';
    case 'book':
    case 'tome': return '📖';
    default: return '📦';
  }
}

// Get CSS class for rarity
function getRarityClass(rarity: string): string {
  switch (rarity?.toUpperCase()) {
    case 'UNCOMMON': return 'rarity-uncommon';
    case 'RARE': return 'rarity-rare';
    case 'EPIC': return 'rarity-epic';
    case 'LEGENDARY': return 'rarity-legendary';
    default: return 'rarity-common';
  }
}

// Generate a description based on item type
function getItemDescription(item: InventoryItem): string {
  const type = item.type.toLowerCase();
  const rarity = item.rarity?.toUpperCase() || 'COMMON';

  const rarityPrefix: Record<string, string> = {
    'COMMON': '',
    'UNCOMMON': 'A well-crafted ',
    'RARE': 'A finely made ',
    'EPIC': 'An exceptional ',
    'LEGENDARY': 'A legendary ',
  };

  const prefix = rarityPrefix[rarity] || '';

  switch (type) {
    case 'weapon':
      return `${prefix}weapon that can be equipped to increase your attack power.`;
    case 'armor':
      return `${prefix}piece of armor that provides additional defense.`;
    case 'shield':
      return `${prefix}shield that can block incoming attacks.`;
    case 'potion':
    case 'consumable':
      return `${prefix}consumable item. Use it to gain its effects.`;
    case 'scroll':
      return `${prefix}magical scroll. Read it to learn its contents or use its power.`;
    case 'key':
      return `${prefix}key that may unlock doors or chests in the dungeon.`;
    case 'ring':
      return `${prefix}ring that grants magical properties when worn.`;
    case 'amulet':
    case 'necklace':
      return `${prefix}magical amulet with mystical properties.`;
    case 'food':
      return `${prefix}food item that can restore health when consumed.`;
    case 'treasure':
    case 'gold':
      return `Valuable treasure. Adds to your gold count.`;
    case 'book':
    case 'tome':
      return `${prefix}tome of knowledge. Read to gain wisdom.`;
    default:
      return `${prefix}item of unknown purpose. Perhaps it has hidden uses.`;
  }
}

// Equipment slot configuration
const EQUIPMENT_SLOTS: { slot: EquipmentSlot; label: string; icon: string }[] = [
  { slot: 'weapon', label: 'Weapon', icon: '⚔' },
  { slot: 'off_hand', label: 'Off-Hand', icon: '🛡' },
  { slot: 'armor', label: 'Armor', icon: '🎽' },
  { slot: 'ring', label: 'Ring', icon: '💍' },
  { slot: 'amulet', label: 'Amulet', icon: '📿' },
];

// Get stat description for equipped item
function getEquipmentStats(item: EquippedItem): string[] {
  const stats: string[] = [];
  if (item.attack_bonus) stats.push(`+${item.attack_bonus} Attack`);
  if (item.defense_bonus) stats.push(`+${item.defense_bonus} Defense`);
  if (item.block_chance) stats.push(`${Math.round(item.block_chance * 100)}% Block`);
  if (item.damage) stats.push(`${item.damage} Damage`);
  if (item.range) stats.push(`Range: ${item.range}`);
  if (item.stat_bonuses) {
    for (const [stat, value] of Object.entries(item.stat_bonuses)) {
      stats.push(`+${value} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`);
    }
  }
  if (item.effect && item.effect_value) {
    const effectName = item.effect.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    stats.push(`+${item.effect_value} ${effectName}`);
  }
  return stats;
}

export function CharacterWindow({
  player,
  onClose,
  inventory,
  onInventoryNavigate,
  onInventorySelect,
  onInventoryUse,
  onInventoryDrop,
  onInventoryRead,
  equipment,
  onUnequip,
  loreJournal,
  onOpenLoreCodex,
  initialTab = 'stats',
}: CharacterWindowProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Close on Escape or C
    if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      onClose();
      return;
    }

    // 'I' key switches to inventory tab
    if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      setActiveTab('inventory');
      return;
    }

    // Tab navigation with number keys (1-5)
    if (e.key >= '1' && e.key <= '5') {
      const tabIndex = parseInt(e.key) - 1;
      if (TABS[tabIndex]) {
        setActiveTab(TABS[tabIndex].id);
      }
      return;
    }

    // Inventory-specific controls when on inventory tab
    if (activeTab === 'inventory' && inventory) {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          onInventoryNavigate?.('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          onInventoryNavigate?.('down');
          break;
        case 'e':
        case 'E':
        case 'Enter':
          e.preventDefault();
          onInventoryUse?.();
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          onInventoryDrop?.();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onInventoryRead?.();
          break;
      }
    }
  }, [onClose, activeTab, inventory, onInventoryNavigate, onInventoryUse, onInventoryDrop, onInventoryRead]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle click outside to close
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Health bar color
  const getHealthColor = () => {
    const ratio = player.health / player.max_health;
    if (ratio > 0.6) return 'var(--battle-player)';
    if (ratio > 0.3) return '#fbbf24';
    return '#ef4444';
  };

  const healthPercent = (player.health / player.max_health) * 100;
  const xpPercent = player.xp_to_level > 0 ? (player.xp / player.xp_to_level) * 100 : 0;

  // Selected inventory item
  const selectedItem = inventory?.items[inventory.selected_index];

  return (
    <div className="character-window-overlay" onClick={handleOverlayClick}>
      <div className="character-window">
        {/* Header with close button */}
        <div className="cw-header">
          <h2 className="cw-title">Character</h2>
          <button className="cw-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className="cw-tabs">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              className={`cw-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={`${tab.label} [${index + 1}]${tab.shortcut ? ` or [${tab.shortcut}]` : ''}`}
            >
              <span className="cw-tab-icon">{tab.icon}</span>
              <span className="cw-tab-label">{tab.label}</span>
              <span className="cw-tab-key">{tab.shortcut || (index + 1)}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="cw-content">
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="cw-tab-content">
              {/* Identity Section */}
              <div className="cw-section cw-identity">
                <div className="cw-identity-row">
                  {player.race && (
                    <div className="cw-badge cw-race">
                      <span className="cw-badge-label">Race</span>
                      <span className="cw-badge-value">{player.race.name}</span>
                    </div>
                  )}
                  {player.class && (
                    <div className="cw-badge cw-class">
                      <span className="cw-badge-label">Class</span>
                      <span className="cw-badge-value">{player.class.name}</span>
                    </div>
                  )}
                </div>
                {player.race?.trait_name && (
                  <div className="cw-trait">
                    <span className="cw-trait-name">{player.race.trait_name}</span>
                    <span className="cw-trait-desc">{player.race.trait_description}</span>
                  </div>
                )}
                {player.class?.description && (
                  <div className="cw-class-desc">{player.class.description}</div>
                )}
              </div>

              {/* Stats Section */}
              <div className="cw-section cw-stats">
                <h3 className="cw-section-title">Vitals</h3>

                {/* Health Bar */}
                <div className="cw-stat-row cw-health-row">
                  <span className="cw-stat-label">HP</span>
                  <div className="cw-bar-container">
                    <div
                      className="cw-bar-fill cw-health-fill"
                      style={{ width: `${healthPercent}%`, backgroundColor: getHealthColor() }}
                    />
                    <span className="cw-bar-text">{player.health} / {player.max_health}</span>
                  </div>
                </div>

                {/* XP Bar */}
                <div className="cw-stat-row cw-xp-row">
                  <span className="cw-stat-label">XP</span>
                  <div className="cw-bar-container">
                    <div
                      className="cw-bar-fill cw-xp-fill"
                      style={{ width: `${xpPercent}%` }}
                    />
                    <span className="cw-bar-text">{player.xp} / {player.xp_to_level}</span>
                  </div>
                </div>

                {/* Combat Stats */}
                <div className="cw-combat-stats">
                  <div className="cw-stat">
                    <span className="cw-stat-icon">⚔</span>
                    <span className="cw-stat-label">ATK</span>
                    <span className="cw-stat-value">{player.attack}</span>
                  </div>
                  <div className="cw-stat">
                    <span className="cw-stat-icon">🛡</span>
                    <span className="cw-stat-label">DEF</span>
                    <span className="cw-stat-value">{player.defense}</span>
                  </div>
                  <div className="cw-stat">
                    <span className="cw-stat-icon">★</span>
                    <span className="cw-stat-label">LVL</span>
                    <span className="cw-stat-value">{player.level}</span>
                  </div>
                  <div className="cw-stat">
                    <span className="cw-stat-icon">💀</span>
                    <span className="cw-stat-label">KILLS</span>
                    <span className="cw-stat-value">{player.kills}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="cw-tab-content">
              {/* Abilities Section */}
              {player.abilities && player.abilities.length > 0 ? (
                <div className="cw-section cw-abilities">
                  <h3 className="cw-section-title">Active Abilities</h3>
                  <div className="cw-ability-list">
                    {player.abilities.map((ability) => (
                      <div
                        key={ability.id}
                        className={`cw-ability ${ability.is_ready ? 'ready' : 'on-cooldown'}`}
                      >
                        <div className="cw-ability-header">
                          <span className={`cw-ability-status ${ability.is_ready ? 'ready' : 'cooldown'}`}>
                            {ability.is_ready ? '●' : `${ability.cooldown_remaining}`}
                          </span>
                          <span className="cw-ability-name">{ability.name}</span>
                        </div>
                        <p className="cw-ability-desc">{ability.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="cw-section">
                  <p className="cw-empty-message">No active abilities learned yet.</p>
                </div>
              )}

              {/* Passives Section */}
              {player.passives && player.passives.length > 0 ? (
                <div className="cw-section cw-passives">
                  <h3 className="cw-section-title">Passive Effects</h3>
                  <div className="cw-passive-list">
                    {player.passives.map((passive) => (
                      <div key={passive.id} className="cw-passive">
                        <div className="cw-passive-header">
                          <span className="cw-passive-icon">◆</span>
                          <span className="cw-passive-name">{passive.name}</span>
                        </div>
                        <p className="cw-passive-desc">{passive.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="cw-section">
                  <p className="cw-empty-message">No passive effects active.</p>
                </div>
              )}
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="cw-tab-content cw-inventory-tab">
              <div className="cw-inventory-layout">
                {/* Item List */}
                <div className="cw-inv-list-panel">
                  <div className="cw-inv-list-header">
                    <span className="cw-inv-list-title">Items</span>
                    <span className="cw-inv-capacity">
                      {inventory?.items.length || 0} / 10
                    </span>
                  </div>
                  <div className="cw-inv-list">
                    {!inventory || inventory.items.length === 0 ? (
                      <div className="cw-inv-empty">
                        <span className="cw-inv-empty-icon">🎒</span>
                        <p>Your bag is empty</p>
                        <p className="cw-inv-empty-hint">Find items while exploring</p>
                      </div>
                    ) : (
                      inventory.items.map((item, index) => (
                        <div
                          key={index}
                          className={`cw-inv-item ${index === inventory.selected_index ? 'selected' : ''} ${getRarityClass(item.rarity)}`}
                          onClick={() => onInventorySelect?.(index)}
                        >
                          <span className="cw-inv-item-icon">{getItemIcon(item.type)}</span>
                          <div className="cw-inv-item-info">
                            <span className="cw-inv-item-name">{item.name}</span>
                            <span className="cw-inv-item-type">{item.type}</span>
                          </div>
                          <span className={`cw-inv-item-rarity ${getRarityClass(item.rarity)}`}>
                            {item.rarity?.[0] || 'C'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Detail Panel */}
                <div className="cw-inv-detail-panel">
                  {selectedItem ? (
                    <>
                      <div className="cw-inv-detail-header">
                        <span className={`cw-inv-detail-icon ${getRarityClass(selectedItem.rarity)}`}>
                          {getItemIcon(selectedItem.type)}
                        </span>
                        <div className="cw-inv-detail-title">
                          <h3 className={`cw-inv-detail-name ${getRarityClass(selectedItem.rarity)}`}>
                            {selectedItem.name}
                          </h3>
                          <span className="cw-inv-detail-type">{selectedItem.type}</span>
                        </div>
                      </div>

                      <div className="cw-inv-detail-rarity">
                        <span className={`cw-inv-rarity-badge ${getRarityClass(selectedItem.rarity)}`}>
                          {selectedItem.rarity || 'Common'}
                        </span>
                      </div>

                      <div className="cw-inv-detail-desc">
                        <p>{getItemDescription(selectedItem)}</p>
                      </div>

                      <div className="cw-inv-actions">
                        <button className="cw-inv-action cw-inv-use" onClick={onInventoryUse}>
                          <kbd>E</kbd> Use / Equip
                        </button>
                        <button className="cw-inv-action cw-inv-drop" onClick={onInventoryDrop}>
                          <kbd>D</kbd> Drop
                        </button>
                        {selectedItem.type.toLowerCase() === 'scroll' && (
                          <button className="cw-inv-action cw-inv-read" onClick={onInventoryRead}>
                            <kbd>R</kbd> Read
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="cw-inv-detail-empty">
                      <span>←</span>
                      <p>Select an item to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div className="cw-tab-content cw-equipment-tab">
              <div className="cw-equipment-layout">
                {/* Equipment Slots */}
                <div className="cw-equip-slots">
                  {EQUIPMENT_SLOTS.map(({ slot, label, icon }) => {
                    const item = equipment?.[slot];
                    return (
                      <div
                        key={slot}
                        className={`cw-equip-slot ${item ? 'equipped' : 'empty'} ${item ? getRarityClass(item.rarity) : ''}`}
                      >
                        <div className="cw-equip-slot-header">
                          <span className="cw-equip-slot-icon">{icon}</span>
                          <span className="cw-equip-slot-label">{label}</span>
                        </div>
                        {item ? (
                          <div className="cw-equip-slot-content">
                            <span className={`cw-equip-item-name ${getRarityClass(item.rarity)}`}>
                              {item.name}
                            </span>
                            <div className="cw-equip-item-stats">
                              {getEquipmentStats(item).map((stat, i) => (
                                <span key={i} className="cw-equip-stat">{stat}</span>
                              ))}
                            </div>
                            {onUnequip && (
                              <button
                                className="cw-equip-unequip-btn"
                                onClick={() => onUnequip(slot)}
                                title="Unequip item"
                              >
                                Unequip
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="cw-equip-slot-empty">
                            <span className="cw-equip-empty-text">Empty</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stats Summary */}
                <div className="cw-equip-summary">
                  <h3 className="cw-section-title">Total Bonuses</h3>
                  <div className="cw-equip-totals">
                    <div className="cw-equip-total">
                      <span className="cw-equip-total-icon">⚔</span>
                      <span className="cw-equip-total-label">Attack</span>
                      <span className="cw-equip-total-value">
                        {player.attack}
                        {equipment?.weapon?.attack_bonus && (
                          <span className="cw-equip-bonus"> (+{equipment.weapon.attack_bonus})</span>
                        )}
                      </span>
                    </div>
                    <div className="cw-equip-total">
                      <span className="cw-equip-total-icon">🛡</span>
                      <span className="cw-equip-total-label">Defense</span>
                      <span className="cw-equip-total-value">
                        {player.defense}
                        {(equipment?.armor?.defense_bonus || equipment?.off_hand?.defense_bonus) && (
                          <span className="cw-equip-bonus">
                            {' '}(+{(equipment?.armor?.defense_bonus || 0) + (equipment?.off_hand?.defense_bonus || 0)})
                          </span>
                        )}
                      </span>
                    </div>
                    {equipment?.off_hand?.block_chance && (
                      <div className="cw-equip-total">
                        <span className="cw-equip-total-icon">🔰</span>
                        <span className="cw-equip-total-label">Block</span>
                        <span className="cw-equip-total-value">
                          {Math.round(equipment.off_hand.block_chance * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="cw-equip-hint">
                    Use items from your inventory to equip them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Journal Tab - Lore Summary */}
          {activeTab === 'journal' && (
            <div className="cw-tab-content cw-journal-tab">
              <div className="cw-section">
                <h3 className="cw-section-title">Lore Codex</h3>

                {loreJournal ? (
                  <>
                    {/* Progress */}
                    <div className="cw-journal-progress">
                      <div className="cw-journal-progress-bar">
                        <div
                          className="cw-journal-progress-fill"
                          style={{ width: `${(loreJournal.discovered_count / loreJournal.total_count) * 100}%` }}
                        />
                      </div>
                      <span className="cw-journal-progress-text">
                        {loreJournal.discovered_count} / {loreJournal.total_count} Discovered
                      </span>
                    </div>

                    {/* Category Breakdown */}
                    <div className="cw-journal-categories">
                      {['history', 'characters', 'creatures', 'locations', 'artifacts'].map(category => {
                        const count = loreJournal.entries.filter(e => e.category === category).length;
                        const icons: Record<string, string> = {
                          history: '📜',
                          characters: '👤',
                          creatures: '👹',
                          locations: '🏰',
                          artifacts: '✨',
                        };
                        return (
                          <div key={category} className={`cw-journal-category ${count > 0 ? 'has-entries' : ''}`}>
                            <span className="cw-journal-cat-icon">{icons[category]}</span>
                            <span className="cw-journal-cat-name">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                            <span className="cw-journal-cat-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recent Discoveries */}
                    {loreJournal.entries.length > 0 && (
                      <div className="cw-journal-recent">
                        <h4 className="cw-journal-recent-title">Recent Discoveries</h4>
                        <div className="cw-journal-recent-list">
                          {loreJournal.entries.slice(-5).reverse().map(entry => (
                            <div key={entry.id} className="cw-journal-recent-item">
                              <span className="cw-journal-entry-icon">
                                {entry.item_type === 'scroll' ? '?' : entry.item_type === 'book' ? '+' : '•'}
                              </span>
                              <span className="cw-journal-entry-title">{entry.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Open Full Codex Button */}
                    <button
                      className="cw-journal-open-codex"
                      onClick={() => {
                        onClose();
                        onOpenLoreCodex?.();
                      }}
                    >
                      <span className="cw-journal-codex-icon">📖</span>
                      Open Full Lore Codex
                      <kbd>J</kbd>
                    </button>
                  </>
                ) : (
                  <div className="cw-placeholder">
                    <span className="cw-placeholder-icon">📜</span>
                    <p className="cw-placeholder-text">No lore discovered yet</p>
                    <p className="cw-placeholder-hint">Explore the dungeon to find scrolls and books.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="cw-footer">
          <span className="cw-hint">
            {activeTab === 'inventory' ? (
              <>
                <kbd>↑</kbd><kbd>↓</kbd> navigate • <kbd>E</kbd> use • <kbd>D</kbd> drop • <kbd>C</kbd> or <kbd>ESC</kbd> close
              </>
            ) : (
              <>
                <kbd>1</kbd>-<kbd>5</kbd> switch tabs • <kbd>I</kbd> inventory • <kbd>C</kbd> or <kbd>ESC</kbd> close
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
