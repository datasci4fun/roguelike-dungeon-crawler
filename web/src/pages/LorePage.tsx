/**
 * Lore Page - World-building and story content
 *
 * Features:
 * - Lore categories (World, Locations, Characters, Creatures, Artifacts)
 * - Expandable lore entries with rich content
 * - Search functionality
 * - Atmospheric dark fantasy styling
 */

import { useState, useEffect, useCallback } from 'react';
import './LorePage.css';

const API_BASE = 'http://localhost:8000/api/lore';

interface LoreEntry {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  image?: string;
  discovered: boolean;
}

interface LoreCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  entries: LoreEntry[];
}

export function LorePage() {
  const [categories, setCategories] = useState<LoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(LoreEntry & { category_name: string })[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all lore
  const fetchLore = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Search lore
  const searchLore = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLore();
  }, [fetchLore]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLore(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLore]);

  // Get current category
  const currentCategory = categories.find((c) => c.id === selectedCategory);

  // Format content with paragraphs
  const formatContent = (content: string) => {
    return content.split('\n\n').map((paragraph, idx) => (
      <p key={idx}>{paragraph.trim()}</p>
    ));
  };

  if (loading) {
    return (
      <div className="lore-page">
        <div className="lore-loading">
          <div className="loading-spinner" />
          <p>Uncovering ancient secrets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lore-page">
      {/* Header */}
      <header className="lore-header">
        <div className="header-content">
          <h1>The World of Valdris</h1>
          <p className="header-subtitle">Lore & World History</p>
        </div>
        <div className="header-search">
          <input
            type="text"
            placeholder="Search the archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      {/* Search Results */}
      {isSearching && searchQuery && (
        <div className="search-results">
          <div className="search-results-header">
            <h2>Search Results</h2>
            <span className="result-count">{searchResults.length} entries found</span>
            <button
              className="clear-search"
              onClick={() => {
                setSearchQuery('');
                setIsSearching(false);
              }}
            >
              Clear Search
            </button>
          </div>
          {searchResults.length === 0 ? (
            <div className="no-results">
              <p>No lore entries match your search.</p>
            </div>
          ) : (
            <div className="search-results-list">
              {searchResults.map((entry) => (
                <div
                  key={entry.id}
                  className="search-result-item"
                  onClick={() => {
                    setSelectedEntry(entry);
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                >
                  <span className="result-category">{entry.category_name}</span>
                  <h3>{entry.title}</h3>
                  {entry.subtitle && <p className="result-subtitle">{entry.subtitle}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {!isSearching && (
        <div className="lore-content">
          {/* Category Navigation */}
          <nav className="category-nav">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedEntry(null);
                }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.entries.length}</span>
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="content-area">
            {/* Entry List */}
            <div className="entry-list">
              {currentCategory && (
                <>
                  <div className="category-header">
                    <span className="category-icon-large">{currentCategory.icon}</span>
                    <div>
                      <h2>{currentCategory.name}</h2>
                      <p>{currentCategory.description}</p>
                    </div>
                  </div>
                  <div className="entries">
                    {currentCategory.entries.map((entry) => (
                      <button
                        key={entry.id}
                        className={`entry-btn ${selectedEntry?.id === entry.id ? 'active' : ''}`}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <h3>{entry.title}</h3>
                        {entry.subtitle && <p>{entry.subtitle}</p>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Entry Detail */}
            <div className="entry-detail">
              {selectedEntry ? (
                <article className="lore-article">
                  <header className="article-header">
                    <h1>{selectedEntry.title}</h1>
                    {selectedEntry.subtitle && (
                      <p className="article-subtitle">{selectedEntry.subtitle}</p>
                    )}
                  </header>
                  <div className="article-content">
                    {formatContent(selectedEntry.content)}
                  </div>
                  <footer className="article-footer">
                    <span className="article-category">
                      {categories.find((c) => c.id === selectedEntry.category)?.name}
                    </span>
                  </footer>
                </article>
              ) : (
                <div className="no-entry-selected">
                  <div className="placeholder-icon">📜</div>
                  <p>Select an entry to read</p>
                  <p className="placeholder-hint">
                    Choose from the categories on the left to explore the lore of Valdris
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      <div className="lore-decoration top-left" />
      <div className="lore-decoration top-right" />
      <div className="lore-decoration bottom-left" />
      <div className="lore-decoration bottom-right" />
    </div>
  );
}

export default LorePage;
