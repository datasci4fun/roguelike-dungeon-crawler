/**
 * Item Compendium Page - Complete item database
 *
 * Features:
 * - Item categories (Weapons, Armor, Shields, Accessories, Consumables, Keys)
 * - Detailed stat displays
 * - Rarity tiers with colors
 * - Search and filter functionality
 * - Where to find items
 */

import { useState, useEffect, useCallback } from 'react';
import './ItemCompendium.css';

const API_BASE = 'http://localhost:8000/api/items';

interface ItemEntry {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  effect: string;
  rarity: string;
  symbol: string;
  stats: Record<string, number | boolean | string>;
  found_in: string;
  lore?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22d3ee',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

const RARITY_ORDER = ['legendary', 'rare', 'uncommon', 'common'];

export function ItemCompendium() {
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all items
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchItems, fetchCategories]);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !item.name.toLowerCase().includes(query) &&
        !item.description.toLowerCase().includes(query) &&
        !item.effect.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  // Sort items by rarity (legendary first)
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aIndex = RARITY_ORDER.indexOf(a.rarity);
    const bIndex = RARITY_ORDER.indexOf(b.rarity);
    return aIndex - bIndex;
  });

  // Render rarity badge
  const renderRarity = (rarity: string) => {
    return (
      <span
        className={`rarity-badge rarity-${rarity}`}
        style={{ color: RARITY_COLORS[rarity] }}
      >
        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
      </span>
    );
  };

  // Format stats for display
  const formatStats = (stats: Record<string, number | boolean | string>) => {
    const entries = Object.entries(stats);
    return entries.map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (typeof value === 'boolean') {
        return value ? label : null;
      }
      return `${label}: ${value}`;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="item-compendium-page">
        <div className="compendium-loading">
          <div className="loading-spinner" />
          <p>Cataloging treasures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="item-compendium-page">
      {/* Header */}
      <header className="compendium-header">
        <div className="header-content">
          <h1>Item Compendium</h1>
          <p className="header-subtitle">Treasures of Valdris</p>
        </div>
        <div className="header-search">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            style={{
              '--cat-color': cat.color,
            } as React.CSSProperties}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="compendium-content">
        {/* Item List */}
        <div className="item-list">
          {sortedItems.length === 0 ? (
            <div className="no-items">
              <p>No items found</p>
            </div>
          ) : (
            sortedItems.map((item) => (
              <button
                key={item.id}
                className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''} rarity-border-${item.rarity}`}
                onClick={() => setSelectedItem(item)}
                style={{
                  '--item-color': RARITY_COLORS[item.rarity],
                } as React.CSSProperties}
              >
                <div className="item-card-header">
                  <span className="item-symbol" style={{ color: RARITY_COLORS[item.rarity] }}>
                    {item.symbol}
                  </span>
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    {renderRarity(item.rarity)}
                  </div>
                </div>
                <div className="item-card-effect">
                  <span className="effect-text">{item.effect}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Item Detail */}
        <div className="item-detail">
          {selectedItem ? (
            <article className="item-article">
              {/* Header */}
              <header className="article-header">
                <div className="header-top">
                  <span
                    className="category-badge"
                    style={{ background: categories.find(c => c.id === selectedItem.category)?.color }}
                  >
                    {categories.find((c) => c.id === selectedItem.category)?.name}
                    {selectedItem.subcategory && ` (${selectedItem.subcategory})`}
                  </span>
                  {renderRarity(selectedItem.rarity)}
                </div>
                <div className="header-main">
                  <span
                    className="item-symbol-large"
                    style={{ color: RARITY_COLORS[selectedItem.rarity] }}
                  >
                    {selectedItem.symbol}
                  </span>
                  <div>
                    <h1>{selectedItem.name}</h1>
                    <p className="item-effect-large">{selectedItem.effect}</p>
                  </div>
                </div>
              </header>

              {/* Description */}
              <section className="description-section">
                <h2>Description</h2>
                <p>{selectedItem.description}</p>
              </section>

              {/* Stats */}
              <section className="stats-section">
                <h2>Stats</h2>
                <div className="stats-grid">
                  {formatStats(selectedItem.stats).map((stat, idx) => (
                    <div key={idx} className="stat-item">
                      {stat}
                    </div>
                  ))}
                </div>
              </section>

              {/* Found In */}
              <section className="found-section">
                <h2>Where to Find</h2>
                <p className="found-text">{selectedItem.found_in}</p>
              </section>

              {/* Lore */}
              {selectedItem.lore && (
                <section className="lore-section">
                  <h2>Lore</h2>
                  <blockquote className="lore-text">{selectedItem.lore}</blockquote>
                </section>
              )}
            </article>
          ) : (
            <div className="no-item-selected">
              <div className="placeholder-icon">📦</div>
              <p>Select an item to view details</p>
              <p className="placeholder-hint">
                Choose from the list on the left to learn about the treasures of Valdris
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemCompendium;
